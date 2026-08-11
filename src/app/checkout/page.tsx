import type { Metadata } from "next";
import { site } from "@/content/site";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Order via WhatsApp",
  description:
    "Temporary WhatsApp ordering for The Protocol research materials while online checkout is staged. Research use only.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">
        The Protocol
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight text-ink sm:text-5xl">
        Order
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
        Temporary path: confirm your order on WhatsApp Business while online
        payment is unavailable. {site.researchDisclaimer}
      </p>
      <CheckoutForm />
    </div>
  );
}
