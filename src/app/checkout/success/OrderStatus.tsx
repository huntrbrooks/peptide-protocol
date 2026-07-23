"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { formatPrice } from "@/content/products";

function looksLikeConvexId(value: string): boolean {
  // Convex document IDs are opaque alphanumeric strings (typically ~32 chars).
  return /^[a-z0-9]+$/i.test(value) && value.length >= 16;
}

export function OrderStatus({ orderId }: { orderId: string | null }) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <p className="mt-6 text-sm text-muted" role="alert">
        Orders backend is not configured. Run{" "}
        <code className="text-ink">npx convex dev</code> and set{" "}
        <code className="text-ink">NEXT_PUBLIC_CONVEX_URL</code>.
      </p>
    );
  }

  return <OrderStatusLive orderId={orderId} />;
}

function OrderStatusLive({ orderId }: { orderId: string | null }) {
  const validId =
    orderId && looksLikeConvexId(orderId)
      ? (orderId as Id<"orders">)
      : null;

  const order = useQuery(
    api.orders.get,
    validId ? { orderId: validId } : "skip",
  );

  if (!orderId) {
    return (
      <p className="mt-6 text-sm text-muted">
        No order reference was provided.{" "}
        <Link href="/shop" className="text-accent underline">
          Return to catalogue
        </Link>
        .
      </p>
    );
  }

  if (!validId) {
    return (
      <p className="mt-6 text-sm text-muted" role="alert">
        Invalid order id.
      </p>
    );
  }

  if (order === undefined) {
    return <p className="mt-6 text-sm text-muted">Loading order status…</p>;
  }

  if (order === null) {
    return (
      <p className="mt-6 text-sm text-muted" role="alert">
        Order not found.
      </p>
    );
  }

  const statusLabel =
    order.status === "paid"
      ? "Paid"
      : order.status === "pending"
        ? "Pending confirmation"
        : order.status === "failed"
          ? "Failed"
          : order.status;

  return (
    <div className="mt-8 border border-line bg-paper p-6">
      <dl className="grid gap-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Order</dt>
          <dd className="font-mono text-xs text-ink">{order._id}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Status</dt>
          <dd className="text-ink">{statusLabel}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Email</dt>
          <dd className="text-ink">{order.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Total (AUD)</dt>
          <dd className="text-ink">{formatPrice(order.subtotalAud)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Settlement</dt>
          <dd className="uppercase text-ink">{order.currencyCrypto}</dd>
        </div>
      </dl>

      <ul className="mt-6 space-y-2 border-t border-line pt-4 text-sm text-muted">
        {order.lines.map((line) => (
          <li
            key={`${line.name}-${line.quantity}`}
            className="flex justify-between gap-4"
          >
            <span>
              {line.name} × {line.quantity}
            </span>
            <span className="text-ink">{formatPrice(line.lineTotalAud)}</span>
          </li>
        ))}
      </ul>

      {order.status === "pending" ? (
        <p className="mt-4 text-xs text-muted">
          Payment return does not confirm funds. Waiting for the MoonPay webhook
          to mark this order paid…
        </p>
      ) : null}

      {order.status === "paid" ? (
        <p className="mt-4 text-xs text-muted">
          Confirmed via MoonPay webhook
          {order.paidAt
            ? ` at ${new Date(order.paidAt).toLocaleString("en-AU")}`
            : ""}
          .
        </p>
      ) : null}
    </div>
  );
}
