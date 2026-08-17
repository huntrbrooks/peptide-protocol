import { NextResponse } from "next/server";
import { parseCheckoutDetails } from "@/lib/orders/checkout";
import {
  attachStripeIntent,
  createConvexOrder,
} from "@/lib/orders/convex";
import { getStripe } from "@/lib/payments/stripe";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const checkout = parseCheckoutDetails(await request.json());
    const orderId = await createConvexOrder({
      ...checkout,
      paymentMethod: "stripe",
    });
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(checkout.subtotalAud * 100),
      currency: "aud",
      receipt_email: checkout.email,
      description: `The Protocol order ${orderId}`,
      metadata: { orderId },
    });
    if (!paymentIntent.client_secret) {
      throw new Error("Stripe did not return a client secret.");
    }
    await attachStripeIntent({
      orderId,
      paymentIntentId: paymentIntent.id,
      paymentStatus: paymentIntent.status,
    });

    return NextResponse.json({
      ok: true,
      orderId,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("[checkout] create PaymentIntent failed", error);
    const message =
      error instanceof Error ? error.message : "Unable to start card payment.";
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
          : "Unable to start card payment. Please try again.",
      },
      { status: isInputError ? 400 : 500 },
    );
  }
}
