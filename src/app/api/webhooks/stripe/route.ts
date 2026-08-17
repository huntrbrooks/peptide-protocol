import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { updateStripeOrder } from "@/lib/orders/convex";
import { sendOrderPaidEmails } from "@/lib/orders/paid-email";
import { getStripe } from "@/lib/payments/stripe";

export const runtime = "nodejs";

const HANDLED_EVENTS = new Set([
  "payment_intent.succeeded",
  "payment_intent.processing",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
]);

export async function POST(request: Request): Promise<NextResponse> {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!signature || !webhookSecret) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret,
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const updated = await updateStripeOrder({
      orderId,
      paymentIntentId: paymentIntent.id,
      paymentStatus: paymentIntent.status,
      paid: event.type === "payment_intent.succeeded",
      failed:
        event.type === "payment_intent.payment_failed" ||
        event.type === "payment_intent.canceled",
    });
    if (updated && event.type === "payment_intent.succeeded") {
      await sendOrderPaidEmails(String(updated));
    }
    return NextResponse.json({ ok: true, ignored: !updated });
  } catch (error) {
    console.error("[stripe webhook] order update failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
