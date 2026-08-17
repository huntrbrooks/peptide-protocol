import { NextResponse } from "next/server";
import { parseCheckoutDetails } from "@/lib/orders/checkout";
import { createConvexOrder } from "@/lib/orders/convex";
import { createPaymentBridgeToken } from "@/lib/payments/payment-bridge";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!process.env.PAYMENT_BRIDGE_SECRET?.trim()) {
      throw new Error("PAYMENT_BRIDGE_SECRET is not configured.");
    }

    const checkout = parseCheckoutDetails(await request.json());
    const amountAudCents = Math.round(checkout.subtotalAud * 100);
    const orderId = await createConvexOrder({
      ...checkout,
      paymentMethod: "moonpay",
    });
    const token = createPaymentBridgeToken({
      orderId,
      amountAudCents,
      email: checkout.email,
      lines: checkout.lines,
    });
    const freshnupPaymentUrl = (
      process.env.FRESHNUP_PAYMENT_URL ?? "https://www.freshnup.global/pay"
    ).trim();
    const payUrl = new URL(freshnupPaymentUrl);
    payUrl.searchParams.set("orderId", orderId);
    payUrl.searchParams.set("token", token);

    return NextResponse.json({ ok: true, orderId, payUrl: payUrl.toString() });
  } catch (error) {
    console.error("[checkout] Freshnup session creation failed", error);
    const message =
      error instanceof Error ? error.message : "Unable to start payment.";
    const isInputError =
      message.includes("required") ||
      message.includes("invalid") ||
      message.includes("incomplete") ||
      message.includes("Unknown product") ||
      message.includes("greater than zero");
    return NextResponse.json(
      {
        ok: false,
        error: isInputError
          ? message
          : "Unable to start secure payment. Please try again.",
      },
      { status: isInputError ? 400 : 500 },
    );
  }
}
