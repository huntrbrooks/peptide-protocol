import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatus } from "./OrderStatus";

export const metadata: Metadata = {
  title: "Order status",
  description: "MoonPay checkout return status for Peptide Protocol.",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ orderId?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const orderId = params.orderId?.trim() || null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">
        Peptide Protocol
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight text-ink sm:text-5xl">
        Order status
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted">
        Thanks for completing the MoonPay flow. Final payment status comes from
        the webhook, not this page alone.
      </p>

      <OrderStatus orderId={orderId} />

      <p className="mt-8 text-sm text-muted">
        <Link href="/shop" className="text-accent underline">
          Back to catalogue
        </Link>
        {" · "}
        <Link href="/contact" className="text-accent underline">
          Contact support
        </Link>
      </p>
    </div>
  );
}
