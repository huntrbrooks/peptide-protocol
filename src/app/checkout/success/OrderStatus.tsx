"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useSyncExternalStore } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { formatPrice } from "@/content/products";

function looksLikeConvexId(value: string): boolean {
  // Convex document IDs are opaque alphanumeric strings (typically ~32 chars).
  return /^[a-z0-9]+$/i.test(value) && value.length >= 16;
}

export function OrderStatus({
  orderId,
  statusToken,
}: {
  orderId: string | null;
  statusToken: string | null;
}) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <p className="mt-6 text-sm text-muted" role="alert">
        Orders backend is not configured. Run{" "}
        <code className="text-ink">npx convex dev</code> and set{" "}
        <code className="text-ink">NEXT_PUBLIC_CONVEX_URL</code>.
      </p>
    );
  }

  return <OrderStatusLive orderId={orderId} initialStatusToken={statusToken} />;
}

function OrderStatusLive({
  orderId,
  initialStatusToken,
}: {
  orderId: string | null;
  initialStatusToken: string | null;
}) {
  const statusToken = useSyncExternalStore(
    () => () => undefined,
    () =>
      initialStatusToken ??
      (orderId
        ? window.sessionStorage.getItem(`order-status:${orderId}`)
        : null),
    () => initialStatusToken,
  );
  const validId =
    orderId && looksLikeConvexId(orderId)
      ? (orderId as Id<"orders">)
      : null;

  const order = useQuery(
    api.orders.get,
    validId
      ? { orderId: validId, statusToken: statusToken ?? undefined }
      : "skip",
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
        : order.status === "pending_verification"
          ? "Pending transaction verification"
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
        {order.discountAud && order.discountAud > 0 ? (
          <>
            {order.subtotalBeforeDiscountAud ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Subtotal (AUD)</dt>
                <dd className="text-ink">
                  {formatPrice(order.subtotalBeforeDiscountAud)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-muted">
                Member rate
                {order.discountPercent ? ` · ${order.discountPercent}%` : ""}
              </dt>
              <dd className="text-ink">−{formatPrice(order.discountAud)}</dd>
            </div>
          </>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Total (AUD)</dt>
          <dd className="text-ink">{formatPrice(order.subtotalAud)}</dd>
        </div>
        {order.paymentMethod ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Payment method</dt>
            <dd className="capitalize text-ink">{order.paymentMethod}</dd>
          </div>
        ) : null}
        {order.cryptoCurrency ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Settlement</dt>
            <dd className="uppercase text-ink">{order.cryptoCurrency}</dd>
          </div>
        ) : null}
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
          Payment has not been confirmed yet. This page updates automatically
          after MoonPay, Stripe, or the selected network confirms funds.
        </p>
      ) : null}

      {order.status === "pending_verification" ? (
        <p className="mt-4 text-xs text-muted">
          Your TXID was received and is waiting for confirmations or staff
          review.
          {order.cryptoVerificationNote
            ? ` ${order.cryptoVerificationNote}`
            : ""}
        </p>
      ) : null}

      {order.status === "paid" ? (
        <p className="mt-4 text-xs text-muted">
          Payment confirmed
          {order.paidAt
            ? ` at ${new Date(order.paidAt).toLocaleString("en-AU")}`
            : ""}
          .
        </p>
      ) : null}
    </div>
  );
}
