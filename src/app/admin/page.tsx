"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
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

type RfmSegment = "Champions" | "Loyal" | "New" | "At Risk" | "Lost";

export default function AdminPage() {
  const [period] = useState(() => {
    const now = Date.now();
    return { now, start: now - 30 * 24 * 60 * 60 * 1000 };
  });
  const overview = useQuery(api.admin.overview, { dayStart: dayStartSydney() });
  const dashboard = useQuery(api.admin.dashboard, {
    periodStart: period.start,
    now: period.now,
  });
  const staff = useQuery(api.staff.me);
  const queue = useQuery(api.admin.pendingProofs);
  const fulfillment = useQuery(api.admin.fulfillmentQueue);
  const reviewProof = useMutation(api.admin.reviewProof);
  const markPacked = useMutation(api.admin.markPacked);
  const markShipped = useMutation(api.admin.markShipped);
  const markDelivered = useMutation(api.admin.markDelivered);
  const recordRefund = useMutation(api.admin.recordRefund);
  const seedInventory = useMutation(api.inventory.seed);
  const [rfmSegment, setRfmSegment] = useState<RfmSegment | "All">("All");
  const memberDirectory = useQuery(
    api.admin.memberDirectory,
    rfmSegment === "All" ? {} : { segment: rfmSegment },
  );
  const dailyStats = useQuery(api.dailyStats.recent, { limit: 7 });

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
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Customer health</p>
        <h2 className="mt-2 font-display text-2xl text-ink">RFM segments</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {memberDirectory?.counts.map((group) => (
            <button
              key={group.segment}
              type="button"
              onClick={() => setRfmSegment(group.segment)}
              className={`border p-4 text-left transition ${
                rfmSegment === group.segment
                  ? "border-accent bg-sand/50"
                  : "border-line bg-paper hover:border-accent"
              }`}
            >
              <span className="text-xs uppercase tracking-wide text-muted">{group.segment}</span>
              <span className="mt-2 block font-display text-2xl text-ink">{group.count}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-muted">
            Showing {rfmSegment === "All" ? "recent members" : rfmSegment}
          </p>
          {rfmSegment !== "All" ? (
            <button className="text-sm text-accent underline" onClick={() => setRfmSegment("All")}>
              Clear filter
            </button>
          ) : null}
        </div>
        <div className="mt-3 overflow-x-auto border border-line">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-mist/40 text-muted">
              <tr>
                <th className="p-3">Member</th>
                <th className="p-3">Segment</th>
                <th className="p-3">R / F / M</th>
                <th className="p-3">Orders</th>
                <th className="p-3">LTV</th>
                <th className="p-3">Last paid</th>
              </tr>
            </thead>
            <tbody>
              {memberDirectory?.members.map((member) => (
                <tr key={member._id} className="border-t border-line">
                  <td className="p-3">
                    <p className="text-ink">{member.email}</p>
                    <p className="font-mono text-xs text-muted">{member.code}</p>
                  </td>
                  <td className="p-3">{member.segment ?? "Unscored"}</td>
                  <td className="p-3">
                    {member.recencyScore ?? "–"} / {member.frequencyScore ?? "–"} / {member.monetaryScore ?? "–"}
                  </td>
                  <td className="p-3">{member.orderCount}</td>
                  <td className="p-3">{formatPrice(member.ltvAud)}</td>
                  <td className="p-3">
                    {member.lastPaidAt
                      ? new Date(member.lastPaidAt).toLocaleDateString("en-AU")
                      : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">First-party warehouse</p>
        <h2 className="mt-2 font-display text-2xl text-ink">Daily snapshots</h2>
        <div className="mt-5 overflow-x-auto border border-line">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-mist/40 text-muted">
              <tr>
                <th className="p-3">Date (UTC)</th>
                <th className="p-3">Gross</th>
                <th className="p-3">Net</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Member attach</th>
              </tr>
            </thead>
            <tbody>
              {dailyStats?.map((snapshot) => (
                <tr key={snapshot._id} className="border-t border-line">
                  <td className="p-3">{snapshot.dateKey}</td>
                  <td className="p-3">{formatPrice(snapshot.grossGmvAud)}</td>
                  <td className="p-3">{formatPrice(snapshot.netGmvAud)}</td>
                  <td className="p-3">{snapshot.orderCount}</td>
                  <td className="p-3">{snapshot.memberAttachPercent.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {dailyStats?.length === 0 ? (
          <p className="mt-3 text-sm text-muted">The first snapshot will appear after the nightly job.</p>
        ) : null}
      </section>

      <section className="mt-10">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Last 30 days</p>
          <h2 className="mt-2 font-display text-2xl text-ink">Sales and membership</h2>
        </div>
        {dashboard ? (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Gross GMV", formatPrice(dashboard.grossGmv)],
                ["Net GMV after refunds", formatPrice(dashboard.netGmv)],
                ["Discount liability", formatPrice(dashboard.discountLiability)],
                ["Refunds", formatPrice(dashboard.refundsAud)],
                ["New members", String(dashboard.newMembers)],
                ["Password attach", `${dashboard.passwordAttachPercent.toFixed(1)}%`],
                ["Member orders", String(dashboard.memberOrders)],
                ["Guest orders", String(dashboard.guestOrders)],
                ["Delivered", String(dashboard.deliveredOrders)],
                ["Refunded", String(dashboard.refundedOrders)],
              ].map(([label, value]) => (
                <article key={label} className="border border-line bg-paper p-5">
                  <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
                  <p className="mt-2 font-display text-2xl text-ink">{value}</p>
                </article>
              ))}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <article className="border border-line bg-paper p-5">
                <h3 className="font-display text-xl text-ink">Payment rail mix</h3>
                <div className="mt-3 grid gap-2 text-sm">
                  {dashboard.railMix.map((rail) => (
                    <p key={rail.label} className="flex justify-between gap-4 capitalize text-muted">
                      <span>{rail.label} · {rail.orders} orders</span>
                      <span className="text-ink">{formatPrice(rail.netAud)}</span>
                    </p>
                  ))}
                </div>
              </article>
              <article className="border border-line bg-paper p-5">
                <h3 className="font-display text-xl text-ink">Member-rate mix</h3>
                <div className="mt-3 grid gap-2 text-sm">
                  {dashboard.rateMix.map((rate) => (
                    <p key={rate.label} className="flex justify-between gap-4 text-muted">
                      <span>{rate.label}</span><span className="text-ink">{rate.orders}</span>
                    </p>
                  ))}
                </div>
              </article>
            </div>
          </>
        ) : null}
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
              <div className="flex gap-3">
              {order.status === "paid" ? (
                <button className="text-accent underline" onClick={() => void markPacked({ orderId: order._id })}>
                  Mark packed
                </button>
              ) : order.status === "packed" ? (
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
              ) : order.status === "shipped" ? (
                <button className="text-accent underline" onClick={() => void markDelivered({ orderId: order._id })}>
                  Mark delivered
                </button>
              ) : null}
              {staff?.role === "owner" ? (
                <button
                  className="text-red-700 underline"
                  onClick={() => {
                    const value = window.prompt(`Refund amount in AUD (max ${order.subtotalAud.toFixed(2)})`);
                    if (!value) return;
                    const refundAud = Number(value);
                    if (Number.isFinite(refundAud) && refundAud > 0) {
                      const note = window.prompt("Refund note (optional)") ?? undefined;
                      void recordRefund({ orderId: order._id, refundAud, note });
                    }
                  }}
                >
                  Record refund
                </button>
              ) : null}
              </div>
            </article>
          ))}
          {fulfillment?.length === 0 ? <p className="text-sm text-muted">No fulfillment orders.</p> : null}
        </div>
      </section>
    </div>
  );
}
