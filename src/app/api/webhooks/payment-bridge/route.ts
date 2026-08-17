import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { updateOrderFromPaymentBridge } from "@/lib/orders/convex";
import { sendOrderPaidEmails } from "@/lib/orders/paid-email";

export const runtime = "nodejs";

type BridgeWebhookBody = {
  orderId?: unknown;
  status?: unknown;
  paymentMethod?: unknown;
  transactionId?: unknown;
  moonpayId?: unknown;
};

function secretsMatch(actual: string | null, expected: string): boolean {
  if (!actual) return false;
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  const expectedSecret = process.env.PAYMENT_BRIDGE_SECRET?.trim();
  if (!expectedSecret) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const providedSecret = request.headers.get("x-payment-bridge-secret");
  if (!secretsMatch(providedSecret, expectedSecret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, {
      status: 401,
    });
  }

  let body: BridgeWebhookBody;
  try {
    body = (await request.json()) as BridgeWebhookBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, {
      status: 400,
    });
  }
  if (
    typeof body.orderId !== "string" ||
    (body.status !== "paid" && body.status !== "failed") ||
    (body.paymentMethod !== undefined &&
      body.paymentMethod !== "stripe" &&
      body.paymentMethod !== "moonpay") ||
    (body.transactionId !== undefined && typeof body.transactionId !== "string") ||
    (body.moonpayId !== undefined && typeof body.moonpayId !== "string")
  ) {
    return NextResponse.json({ ok: false, error: "Invalid webhook body" }, {
      status: 400,
    });
  }

  try {
    const paymentMethod =
      body.paymentMethod === "stripe" ? "stripe" : "moonpay";
    const orderId = await updateOrderFromPaymentBridge({
      orderId: body.orderId,
      status: body.status,
      paymentMethod,
      transactionId:
        typeof body.transactionId === "string"
          ? body.transactionId
          : typeof body.moonpayId === "string"
            ? body.moonpayId
            : undefined,
    });
    if (!orderId) {
      return NextResponse.json({ ok: false, error: "Order not found" }, {
        status: 404,
      });
    }
    if (body.status === "paid") {
      await sendOrderPaidEmails(String(orderId));
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[payment bridge] Convex update failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
