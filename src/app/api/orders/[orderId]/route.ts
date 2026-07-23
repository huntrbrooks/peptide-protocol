import { NextResponse } from "next/server";
import { getConvexOrder } from "@/lib/orders/convex";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

/**
 * Public order status fallback for the success page.
 * Prefer the Convex reactive query on the client; this remains as a REST fallback.
 * Returns a minimal projection — no shipping address dump.
 */
export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { orderId } = await context.params;
  if (!orderId || orderId.length < 8) {
    return NextResponse.json({ ok: false, error: "Invalid order id" }, {
      status: 400,
    });
  }

  try {
    const order = await getConvexOrder(orderId);
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, {
        status: 404,
      });
    }

    return NextResponse.json({
      ok: true,
      order: {
        id: order._id,
        status: order.status,
        email: order.email,
        subtotalAud: order.subtotalAud,
        currencyCrypto: order.currencyCrypto,
        lines: order.lines,
        paidAt: order.paidAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error("[orders] get failed", error);
    return NextResponse.json({ ok: false, error: "Order not found" }, {
      status: 404,
    });
  }
}
