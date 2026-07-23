"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/content/types";
import { formatPrice } from "@/content/products";
import { addToCart } from "@/lib/cart/storage";

export function AddToCartButton({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={() => {
          addToCart(product.slug, 1);
          setAdded(true);
          window.setTimeout(() => setAdded(false), 2500);
        }}
        className="btn-primary rounded-sm bg-ink px-6 py-3 text-sm text-paper hover:bg-accent"
      >
        {added ? "Added to cart" : `Add to cart · ${formatPrice(product.priceAud)}`}
      </button>
      <a
        href={`mailto:support@peptideprotocolau.io?subject=${encodeURIComponent(
          `COA request: ${product.name}`,
        )}`}
        className="rounded-sm border border-line px-6 py-3 text-center text-sm text-ink transition hover:border-accent hover:text-accent"
      >
        Request COA
      </a>
      {added ? (
        <p className="text-sm text-muted">
          Saved locally.{" "}
          <Link href="/checkout" className="text-accent underline">
            Continue to checkout
          </Link>{" "}
          (MoonPay staged) or email support for an enquiry.
        </p>
      ) : null}
    </div>
  );
}
