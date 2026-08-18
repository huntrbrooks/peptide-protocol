import { NextResponse } from "next/server";
import { resolveCheckoutTotals } from "@/lib/orders/checkout";
import { mapCheckoutError } from "@/lib/orders/checkoutErrors";
import { createConvexOrder } from "@/lib/orders/convex";
import { createPaymentBridgeToken } from "@/lib/payments/payment-bridge";
import { enforceRouteRateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await enforceRouteRateLimit(request, "checkout", 10, 10 * 60_000);
    if (!process.env.PAYMENT_BRIDGE_SECRET?.trim()) {
      throw new Error("PAYMENT_BRIDGE_SECRET is not configured.");
    }

    const body = (await request.json()) as Record<string, unknown>;
    if (body.paymentMethod !== "stripe") {
      return NextResponse.json(
        { ok: false, error: "Select the Stripe payment option." },
        { status: 400 },
      );
    }
    const checkout = await resolveCheckoutTotals(body);
    const amountAudCents = Math.round(checkout.subtotalAud * 100);
    const { orderId, statusToken } = await createConvexOrder({
      ...checkout,
      paymentMethod: "stripe",
    });
    const token = createPaymentBridgeToken({
      orderId,
      amountAudCents,
      email: checkout.email,
      lines: checkout.lines,
      paymentMethod: "stripe",
    });
    const freshnupPaymentUrl = (
      process.env.FRESHNUP_PAYMENT_URL ?? "https://www.freshnup.global/pay"
    ).trim();
    const payUrl = new URL(freshnupPaymentUrl);
    payUrl.searchParams.set("orderId", orderId);
    payUrl.searchParams.set("token", token);
    payUrl.searchParams.set("paymentMethod", "stripe");

    return NextResponse.json({
      ok: true,
      orderId,
      statusToken,
      payUrl: payUrl.toString(),
    });
  } catch (error) {
    console.error("[checkout] Freshnup session creation failed", error);
    const mapped = mapCheckoutError(
      error,
      "Unable to start secure payment. Please try again.",
    );
    return NextResponse.json(
      { ok: false, error: mapped.error },
      { status: mapped.status },
    );
  }
}
