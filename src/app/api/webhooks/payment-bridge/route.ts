import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { updateMoonPayOrder } from "@/lib/orders/convex";

export const runtime = "nodejs";

type BridgeWebhookBody = {
  orderId?: unknown;
  status?: unknown;
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
    (body.moonpayId !== undefined && typeof body.moonpayId !== "string")
  ) {
    return NextResponse.json({ ok: false, error: "Invalid webhook body" }, {
      status: 400,
    });
  }

  try {
    const orderId = await updateMoonPayOrder({
      orderId: body.orderId,
      status: body.status,
      moonpayTransactionId: body.moonpayId,
    });
    if (!orderId) {
      return NextResponse.json({ ok: false, error: "Order not found" }, {
        status: 404,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[payment bridge] Convex update failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
