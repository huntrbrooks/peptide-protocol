import { NextResponse } from "next/server";
import { markConvexOrderFromWebhook } from "@/lib/orders/convex";
import {
  getMoonPayConfig,
  isPaidWebhookEvent,
  verifyMoonPayWebhookSignature,
  type MoonPayWebhookPayload,
} from "@/lib/payments/moonpay";

export const runtime = "nodejs";

/**
 * MoonPay webhook — source of truth for paid status.
 * Verifies MoonPay signature here, then updates Convex via a secret-gated mutation.
 * Never mark an order paid from the browser return URL alone.
 *
 * Register in MoonPay dashboard:
 *   {NEXT_PUBLIC_SITE_URL}/api/webhooks/moonpay
 */
export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const config = getMoonPayConfig();

  if (!config) {
    console.error("[moonpay webhook] Missing MoonPay env configuration");
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  if (!config.webhookSecret) {
    console.error(
      "[moonpay webhook] MOONPAY_WEBHOOK_SECRET is not set — rejecting.",
    );
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const signatureHeader = request.headers.get("Moonpay-Signature-V2");
  if (
    !verifyMoonPayWebhookSignature(
      rawBody,
      signatureHeader,
      config.webhookSecret,
    )
  ) {
    console.warn("[moonpay webhook] Invalid signature");
    return NextResponse.json({ ok: false, error: "Invalid signature" }, {
      status: 401,
    });
  }

  let payload: MoonPayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as MoonPayWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, {
      status: 400,
    });
  }

  const orderId = payload.data?.externalTransactionId;
  if (!orderId || typeof orderId !== "string") {
    // Acknowledge unrelated events so MoonPay does not retry forever.
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    if (isPaidWebhookEvent(payload)) {
      const result = await markConvexOrderFromWebhook({
        orderId,
        status: "paid",
        moonpayTransactionId: payload.data?.id,
      });
      if (!result) {
        console.warn("[moonpay webhook] Unknown order", orderId);
        return NextResponse.json({ ok: true, ignored: true });
      }
      return NextResponse.json({ ok: true });
    }

    const status = payload.data?.status;
    if (status === "failed") {
      const result = await markConvexOrderFromWebhook({
        orderId,
        status: "failed",
        moonpayTransactionId: payload.data?.id,
      });
      if (!result) {
        console.warn("[moonpay webhook] Unknown order", orderId);
        return NextResponse.json({ ok: true, ignored: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[moonpay webhook] Convex update failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
