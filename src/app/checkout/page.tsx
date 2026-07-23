import type { Metadata } from "next";
import { site } from "@/content/site";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Staged MoonPay checkout for Peptide Protocol research materials. Research use only.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">
        Peptide Protocol
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight text-ink sm:text-5xl">
        Checkout
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
        MoonPay on-ramp checkout (staged). Apple Pay / Google Pay buy crypto that
        settles to the merchant wallet. {site.researchDisclaimer}
      </p>
      <CheckoutForm />
    </div>
  );
}
