"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import { formatPrice, getProductBySlug } from "@/content/products";
import { site } from "@/content/site";
import {
  getCartServerSnapshot,
  getCartSnapshot,
  subscribeCart,
} from "@/lib/cart/storage";
import type { CartLine } from "@/lib/cart/types";

type LineView = {
  slug: string;
  name: string;
  quantity: number;
  unitPriceAud: number;
  lineTotalAud: number;
};

function buildLines(items: CartLine[]): LineView[] {
  const lines: LineView[] = [];
  for (const item of items) {
    const product = getProductBySlug(item.slug);
    if (!product) continue;
    lines.push({
      slug: product.slug,
      name: product.name,
      quantity: item.quantity,
      unitPriceAud: product.priceAud,
      lineTotalAud:
        Math.round(product.priceAud * item.quantity * 100) / 100,
    });
  }
  return lines;
}

export function CheckoutForm() {
  const cart = useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    getCartServerSnapshot,
  );
  const lines = useMemo(() => buildLines(cart.items), [cart.items]);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [researchAck, setResearchAck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotalAud, 0);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (lines.length === 0) {
      setError("Your cart is empty. Add research materials from the catalogue.");
      return;
    }
    if (!researchAck) {
      setError("You must acknowledge research-use terms before payment.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          researchAck: true,
          shipping: {
            fullName,
            line1,
            line2: line2 || undefined,
            city,
            state,
            postcode,
            country: "AU",
          },
          items: lines.map((line) => ({
            slug: line.slug,
            quantity: line.quantity,
          })),
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        paymentUrl?: string;
      };

      if (!response.ok || !data.ok || !data.paymentUrl) {
        setError(
          data.error ??
            "Could not start MoonPay checkout. Credentials may still be pending.",
        );
        return;
      }

      window.location.href = data.paymentUrl;
    } catch {
      setError("Network error starting checkout. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]"
    >
      <div className="grid gap-4 border border-line bg-paper p-6">
        <h2 className="font-display text-2xl text-ink">Shipping & contact</h2>

        <label className="grid gap-2 text-sm">
          <span className="text-ink">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
            autoComplete="email"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-ink">Full name</span>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
            autoComplete="name"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-ink">Address line 1</span>
          <input
            required
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
            autoComplete="address-line1"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-ink">Address line 2 (optional)</span>
          <input
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
            autoComplete="address-line2"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-2 text-sm sm:col-span-1">
            <span className="text-ink">City</span>
            <input
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
              autoComplete="address-level2"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-ink">State</span>
            <input
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
              autoComplete="address-level1"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-ink">Postcode</span>
            <input
              required
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
              autoComplete="postal-code"
            />
          </label>
        </div>

        <label className="mt-2 flex items-start gap-3 text-sm text-muted">
          <input
            type="checkbox"
            required
            checked={researchAck}
            onChange={(e) => setResearchAck(e.target.checked)}
            className="mt-1"
          />
          <span>
            I acknowledge these materials are for laboratory research use only,
            not for human consumption, and I have read the{" "}
            <Link href="/disclaimer" className="text-accent underline">
              research disclaimer
            </Link>
            .
          </span>
        </label>

        {error ? (
          <p className="text-sm text-accent" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || lines.length === 0}
          className="btn-primary mt-2 justify-self-start rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent disabled:opacity-50"
        >
          {submitting
            ? "Starting MoonPay…"
            : "Pay with Apple Pay / Google Pay (crypto)"}
        </button>

        <p className="text-xs text-muted">
          You will be redirected to MoonPay to complete payment. Crypto settles
          to the merchant wallet; order status updates via webhook (not the
          return URL alone). Staging: credentials and wallet must be configured
          before live use. Email {site.email} for enquiry-based purchases.
        </p>
      </div>

      <aside className="border border-line bg-paper p-6">
        <h2 className="font-display text-2xl text-ink">Order summary</h2>
        {lines.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Cart is empty.{" "}
            <Link href="/shop" className="text-accent underline">
              Browse the catalogue
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm text-muted">
            {lines.map((line) => (
              <li
                key={line.slug}
                className="flex items-start justify-between gap-4 border-b border-line/70 pb-3"
              >
                <span>
                  {line.name}
                  <span className="block text-xs">Qty {line.quantity}</span>
                </span>
                <span className="shrink-0 text-ink">
                  {formatPrice(line.lineTotalAud)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex justify-between text-sm text-ink">
          <span>Subtotal (AUD)</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <p className="mt-3 text-xs text-muted">
          Settlement currency is configured server-side (default USDC). MoonPay
          converts AUD at widget rates.
        </p>
      </aside>
    </form>
  );
}
