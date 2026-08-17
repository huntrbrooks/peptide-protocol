import type { Metadata } from "next";
import { site } from "@/content/site";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Secure checkout",
  description:
    "Secure MoonPay, card, and self-custody crypto checkout for The Protocol research materials. Research use only.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">
        The Protocol
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight text-ink sm:text-5xl">
        Secure checkout
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
        Pay securely through MoonPay on Fresh&apos;n Up, or choose direct
        crypto or Stripe as an alternate. {site.researchDisclaimer}
      </p>
      <CheckoutForm
        bankEnabled={process.env.NEXT_PUBLIC_BANK_TRANSFER_ENABLED === "true"}
      />
    </div>
  );
}
