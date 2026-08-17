"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const publishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function PaymentForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const returnUrl = `${window.location.origin}/checkout/success?orderId=${encodeURIComponent(orderId)}`;
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });
    if (result.error) {
      setError(result.error.message ?? "Payment could not be confirmed.");
      setSubmitting(false);
      return;
    }
    window.location.assign(returnUrl);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
      <PaymentElement options={{ layout: "accordion" }} />
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="btn-primary rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Confirming payment…" : "Pay securely"}
      </button>
    </form>
  );
}

export function StripePaymentForm({
  clientSecret,
  orderId,
}: {
  clientSecret: string;
  orderId: string;
}) {
  if (!stripePromise) {
    return (
      <p className="mt-5 text-sm text-red-700" role="alert">
        Card checkout is not configured. Set
        {" "}
        <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>.
      </p>
    );
  }
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#20201f",
            borderRadius: "2px",
          },
        },
      }}
    >
      <PaymentForm orderId={orderId} />
    </Elements>
  );
}
