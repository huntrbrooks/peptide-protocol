import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function getStripe(): Stripe {
  const apiKey =
    process.env.STRIPE_API_KEY?.trim() ||
    process.env.STRIPE_SECRET_KEY?.trim();
  if (!apiKey) {
    throw new Error("STRIPE_API_KEY is not configured.");
  }
  stripeClient ??= new Stripe(apiKey);
  return stripeClient;
}
