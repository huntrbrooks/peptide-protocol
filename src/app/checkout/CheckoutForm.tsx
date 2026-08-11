"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { formatPrice, getProductBySlug } from "@/content/products";
import { site } from "@/content/site";
import {
  getCartServerSnapshot,
  getCartSnapshot,
  subscribeCart,
} from "@/lib/cart/storage";
import type { CartLine } from "@/lib/cart/types";
import {
  WHATSAPP_ORDER,
  whatsappOrderUrl,
} from "@/lib/orders/whatsapp";

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

/**
 * Temporary WhatsApp order UI (online card/crypto checkout staged).
 * MoonPay session API remains at /api/checkout/session — not linked here.
 */
export function CheckoutForm() {
  const cart = useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    getCartServerSnapshot,
  );
  const lines = useMemo(() => buildLines(cart.items), [cart.items]);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotalAud, 0);
  const chatHref = whatsappOrderUrl(
    lines.map((line) => ({ name: line.name, quantity: line.quantity })),
  );

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="grid gap-5 border border-line bg-paper p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Temporary ordering
          </p>
          <h2 className="mt-2 font-display text-2xl text-ink">
            Order via WhatsApp
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Online checkout is temporarily paused. Message{" "}
            {WHATSAPP_ORDER.businessName} on WhatsApp Business to confirm stock,
            total in AUD, and shipping. {site.researchDisclaimer}
          </p>
        </div>

        <a
          href={chatHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary justify-self-start rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent"
        >
          Chat on WhatsApp
        </a>

        <p className="text-sm text-muted">
          Or scan the QR on desktop. Number:{" "}
          <span className="text-ink">{WHATSAPP_ORDER.displayNumber}</span>
        </p>

        <div className="justify-self-start border border-line bg-paper p-3">
          <Image
            src={WHATSAPP_ORDER.qrImageSrc}
            alt={`WhatsApp QR code for ${WHATSAPP_ORDER.businessName} orders`}
            width={236}
            height={512}
            className="h-auto w-44 sm:w-52"
            priority
          />
        </div>

        <p className="text-xs text-muted">
          Prefer email? Write to{" "}
          <a
            href={`mailto:${site.email}`}
            className="text-accent underline"
          >
            {site.email}
          </a>
          . Card/crypto checkout will return here when payment is live.
        </p>
      </div>

      <aside className="border border-line bg-paper p-6">
        <h2 className="font-display text-2xl text-ink">Order summary</h2>
        {lines.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Cart is empty.{" "}
            <Link href="/shop" className="text-accent underline">
              Browse the catalogue
            </Link>{" "}
            first, or open WhatsApp to ask about availability.
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
          <span>Catalogue subtotal (AUD)</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <p className="mt-3 text-xs text-muted">
          Final total and shipping confirmed in WhatsApp before payment.
        </p>
      </aside>
    </div>
  );
}
