import { NextResponse } from "next/server";
import { resolveCheckoutTotals } from "@/lib/orders/checkout";
import { mapCheckoutError } from "@/lib/orders/checkoutErrors";
import { createConvexOrder } from "@/lib/orders/convex";
import { createOrderProofToken } from "@/lib/payments/order-proof";
import { getSettlementOptions } from "@/lib/payments/settlement";
import { enforceRouteRateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await enforceRouteRateLimit(request, "checkout", 10, 10 * 60_000);
    const checkout = await resolveCheckoutTotals(await request.json());
    const { orderId, statusToken } = await createConvexOrder({
      ...checkout,
      paymentMethod: "bank",
    });
    return NextResponse.json({
      ok: true,
      orderId,
      statusToken,
      amountAud: checkout.subtotalAud,
      bank: getSettlementOptions().bank,
      proofToken: createOrderProofToken(String(orderId), "bank"),
    });
  } catch (error) {
    console.error("[checkout] create bank order failed", error);
    const mapped = mapCheckoutError(
      error,
      "Unable to create bank order. Please try again.",
    );
    return NextResponse.json(
      { ok: false, error: mapped.error },
      { status: mapped.status },
    );
  }
}
