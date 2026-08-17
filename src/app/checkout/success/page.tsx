import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatus } from "./OrderStatus";

export const metadata: Metadata = {
  title: "Order status",
  description: "Payment and order status for The Protocol.",
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
        The Protocol
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight text-ink sm:text-5xl">
        Order status
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted">
        Your order has been recorded. Final status comes from Stripe or network
        verification, not the browser return alone.
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
