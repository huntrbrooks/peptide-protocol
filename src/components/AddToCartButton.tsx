"use client";

import { useState } from "react";
import type { Product } from "@/content/types";
import { formatPrice } from "@/content/products";

export function AddToCartButton({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={() => {
          setAdded(true);
          window.setTimeout(() => setAdded(false), 2500);
        }}
        className="rounded-sm bg-ink px-6 py-3 text-sm text-paper transition hover:bg-accent"
      >
        {added ? "Added to enquiry list" : `Add to cart · ${formatPrice(product.priceAud)}`}
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
          Cart is a launch placeholder. Email support to complete a purchase enquiry.
        </p>
      ) : null}
    </div>
  );
}
