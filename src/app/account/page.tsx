"use client";

import { useConvexAuth, useMutation, usePaginatedQuery, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { formatPrice } from "@/content/products";
import { addToCart } from "@/lib/cart/storage";
import { AccountWishlist } from "@/components/AccountWishlist";

const inputClass =
  "w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent";

export default function AccountPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const account = useQuery(
    api.members.getMyAccount,
    isAuthenticated ? {} : "skip",
  );
  const {
    results: orders,
    status: ordersStatus,
    loadMore,
  } = usePaginatedQuery(
    api.members.listMyOrders,
    isAuthenticated ? {} : "skip",
    { initialNumItems: 10 },
  );
  const updateConsent = useMutation(api.members.updateMarketingConsent);
  const saveAddress = useMutation(api.members.saveAddress);
  const deleteAddress = useMutation(api.members.deleteAddress);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (isLoading) {
    return <main className="mx-auto max-w-5xl px-4 py-16 text-muted">Loading account…</main>;
  }
  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Member account</p>
        <h1 className="mt-3 font-display text-4xl text-ink">Log in from the Account menu</h1>
        <p className="mt-4 text-muted">Use the Account control in the header, then return here.</p>
      </main>
    );
  }
  if (account === undefined) {
    return <main className="mx-auto max-w-5xl px-4 py-16 text-muted">Loading account…</main>;
  }
  if (account === null) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-display text-4xl text-ink">Member record unavailable</h1>
        <p className="mt-4 text-muted">This login is not attached to a Protocol membership. Contact support for help.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Member account</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-ink">Your Protocol</h1>
          <p className="mt-2 text-sm text-muted">{account.email}</p>
        </div>
        <div className="border border-line bg-paper px-5 py-4 text-sm">
          <p className="text-muted">Current member rate</p>
          <p className="mt-1 text-lg text-ink"><strong>{account.code}</strong> · {account.percent}% off</p>
        </div>
      </div>

      <section className="mt-10 border border-line bg-paper p-5">
        <h2 className="font-display text-2xl text-ink">Marketing preferences</h2>
        <label className="mt-4 flex items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-1"
            checked={account.marketingConsent === "opted_in"}
            onChange={(event) => {
              setMessage(null);
              void updateConsent({ optedIn: event.target.checked }).catch(() => {
                setMessage("Unable to update marketing preferences. Please try again.");
              });
            }}
          />
          Receive member updates and relevant research-use product emails.
        </label>
      </section>

      <AccountWishlist />

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Order history</h2>
        <div className="mt-5 grid gap-4">
          {orders.map((order) => (
            <article key={order._id} className="border border-line bg-paper p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted">{order._id}</p>
                  <p className="mt-1 text-sm capitalize text-ink">{order.status} · {order.paymentMethod}</p>
                  <p className="mt-1 text-xs text-muted">{new Date(order.createdAt).toLocaleDateString("en-AU")}</p>
                </div>
                <p className="font-display text-xl text-ink">{formatPrice(order.subtotalAud)}</p>
              </div>
              <ul className="mt-4 grid gap-1 text-sm text-muted">
                {order.lines.map((line) => (
                  <li key={line.slug}>{line.quantity} × {line.name}</li>
                ))}
              </ul>
              {order.trackingNumber ? <p className="mt-3 text-sm text-ink">Tracking: {order.trackingNumber}</p> : null}
              <button
                type="button"
                className="mt-4 text-sm text-accent underline"
                onClick={() => {
                  for (const line of order.lines) addToCart(line.slug, line.quantity);
                  setMessage("Items added to cart.");
                }}
              >
                Reorder
              </button>
            </article>
          ))}
          {orders.length === 0 && ordersStatus !== "LoadingFirstPage" ? (
            <p className="text-sm text-muted">No orders yet.</p>
          ) : null}
          {ordersStatus === "CanLoadMore" ? (
            <button
              type="button"
              className="border border-line px-4 py-2 text-sm text-ink hover:border-accent"
              onClick={() => loadMore(10)}
            >
              Load more orders
            </button>
          ) : null}
        </div>
        {message ? (
          <p className="mt-4 text-sm text-ink">{message} <Link href="/checkout" className="text-accent underline">Open cart</Link></p>
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Saved addresses</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {account.addresses.map((address) => (
            <article key={address._id} className="border border-line bg-paper p-4 text-sm">
              <p className="font-medium text-ink">{address.label}</p>
              <p className="mt-2 text-muted">
                {address.fullName}<br />{address.line1}<br />
                {address.line2 ? <>{address.line2}<br /></> : null}
                {address.city} {address.state} {address.postcode}<br />{address.country}
              </p>
              <button
                className="mt-3 text-red-700 underline"
                onClick={() => {
                  setMessage(null);
                  void deleteAddress({ addressId: address._id }).catch(() => {
                    setMessage("Unable to delete this address. Please try again.");
                  });
                }}
              >
                Delete
              </button>
            </article>
          ))}
        </div>
        <form
          className="mt-5 grid gap-3 border border-line bg-paper p-5 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const formElement = event.currentTarget;
            const form = new FormData(formElement);
            setSaving(true);
            void saveAddress({
              label: String(form.get("label") ?? ""),
              fullName: String(form.get("fullName") ?? ""),
              line1: String(form.get("line1") ?? ""),
              line2: String(form.get("line2") ?? "") || undefined,
              city: String(form.get("city") ?? ""),
              state: String(form.get("state") ?? ""),
              postcode: String(form.get("postcode") ?? ""),
              country: String(form.get("country") ?? "AU"),
            })
              .then(() => {
                formElement.reset();
                setMessage("Address saved.");
              })
              .catch(() => setMessage("Unable to save this address. Check the fields and try again."))
              .finally(() => setSaving(false));
          }}
        >
          <input className={inputClass} name="label" placeholder="Label (Home)" required />
          <input className={inputClass} name="fullName" placeholder="Full name" required />
          <input className={inputClass} name="line1" placeholder="Address line 1" required />
          <input className={inputClass} name="line2" placeholder="Address line 2" />
          <input className={inputClass} name="city" placeholder="City" required />
          <input className={inputClass} name="state" placeholder="State" required />
          <input className={inputClass} name="postcode" placeholder="Postcode" required />
          <input className={inputClass} name="country" defaultValue="AU" placeholder="Country" required />
          <button disabled={saving} className="bg-ink px-4 py-2 text-sm text-paper disabled:opacity-50 sm:col-span-2">
            {saving ? "Saving…" : "Save address"}
          </button>
        </form>
      </section>
    </main>
  );
}
