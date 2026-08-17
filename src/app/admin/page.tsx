"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { products } from "@/content/products";
import { formatPrice } from "@/content/products";

function dayStartSydney(): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return Date.parse(`${parts}T00:00:00+10:00`);
}

export default function AdminPage() {
  const overview = useQuery(api.admin.overview, { dayStart: dayStartSydney() });
  const queue = useQuery(api.admin.pendingProofs);
  const fulfillment = useQuery(api.admin.fulfillmentQueue);
  const reviewProof = useMutation(api.admin.reviewProof);
  const markPacked = useMutation(api.admin.markPacked);
  const markShipped = useMutation(api.admin.markShipped);
  const seedInventory = useMutation(api.inventory.seed);

  const metrics = overview
    ? [
        ["Today’s net GMV", formatPrice(overview.netGmv)],
        ["Orders", String(overview.orders)],
        ["Net AOV", formatPrice(overview.netAov)],
        ["Member attach", `${overview.memberAttachPercent.toFixed(1)}%`],
        ["Pending proofs", String(overview.pendingProofs)],
        ["Low stock", String(overview.lowStock)],
        ["Email failures", String(overview.emailFailures)],
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Back of house</p>
          <h1 className="mt-2 font-display text-4xl text-ink">Operations overview</h1>
        </div>
        <button
          type="button"
          className="border border-line px-4 py-2 text-sm text-ink hover:border-accent"
          onClick={() => void seedInventory({
            products: products.map((product) => ({
              slug: product.slug,
              stockCode: product.stockCode ?? product.slug,
              onHand: 10,
              lowStockThreshold: 3,
            })),
          })}
        >
          Seed missing inventory
        </button>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value]) => (
          <article key={label} className="border border-line bg-paper p-5">
            <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-2 font-display text-2xl text-ink">{value}</p>
          </article>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Payment proofs awaiting review</h2>
        {queue?.length ? (
          <div className="mt-5 overflow-x-auto border border-line">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-mist/40 text-muted">
                <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Rail</th><th className="p-3">Value</th><th className="p-3">Actions</th></tr>
              </thead>
              <tbody>
                {queue.map((order) => (
                  <tr key={order._id} className="border-t border-line">
                    <td className="p-3 font-mono text-xs">{order._id}</td>
                    <td className="p-3">{order.email}</td>
                    <td className="p-3 capitalize">{order.paymentMethod}</td>
                    <td className="p-3">{formatPrice(order.subtotalAud)}</td>
                    <td className="p-3">
                      <div className="flex gap-3">
                        <button className="text-ink underline" onClick={() => void reviewProof({ orderId: order._id, decision: "approve" })}>Approve</button>
                        <button className="text-red-700 underline" onClick={() => void reviewProof({ orderId: order._id, decision: "reject" })}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">No proofs are waiting for review.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Fulfillment queue</h2>
        <div className="mt-5 grid gap-3">
          {fulfillment?.map((order) => (
            <article key={order._id} className="flex flex-wrap items-center justify-between gap-4 border border-line bg-paper p-4 text-sm">
              <div>
                <p className="font-mono text-xs text-ink">{order._id}</p>
                <p className="mt-1 text-muted">{order.email} · {formatPrice(order.subtotalAud)} · <span className="capitalize">{order.status}</span></p>
              </div>
              {order.status === "paid" ? (
                <button className="text-accent underline" onClick={() => void markPacked({ orderId: order._id })}>
                  Mark packed
                </button>
              ) : (
                <button
                  className="text-accent underline"
                  onClick={() => {
                    const trackingNumber = window.prompt("Tracking number");
                    if (trackingNumber?.trim()) {
                      void markShipped({ orderId: order._id, trackingNumber });
                    }
                  }}
                >
                  Mark shipped
                </button>
              )}
            </article>
          ))}
          {fulfillment?.length === 0 ? <p className="text-sm text-muted">No paid or packed orders.</p> : null}
        </div>
      </section>
    </div>
  );
}
