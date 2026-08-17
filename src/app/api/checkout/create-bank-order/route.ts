import { NextResponse } from "next/server";
import { resolveCheckoutTotals } from "@/lib/orders/checkout";
import { createConvexOrder } from "@/lib/orders/convex";
import { createOrderProofToken } from "@/lib/payments/order-proof";
import { getSettlementOptions } from "@/lib/payments/settlement";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const checkout = await resolveCheckoutTotals(await request.json());
    const orderId = await createConvexOrder({
      ...checkout,
      paymentMethod: "bank",
    });
    return NextResponse.json({
      ok: true,
      orderId,
      amountAud: checkout.subtotalAud,
      bank: getSettlementOptions().bank,
      proofToken: createOrderProofToken(String(orderId), "bank"),
    });
  } catch (error) {
    console.error("[checkout] create bank order failed", error);
    const message =
      error instanceof Error ? error.message : "Unable to create bank order.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
