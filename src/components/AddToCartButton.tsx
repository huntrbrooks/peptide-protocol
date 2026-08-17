"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/content/types";
import { formatPrice } from "@/content/products";
import { site } from "@/content/site";
import { addToCart } from "@/lib/cart/storage";
import { track } from "@/lib/analytics/track";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AddToCartButton({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  const inventory = useQuery(
    api.inventory.availability,
    process.env.NEXT_PUBLIC_CONVEX_URL ? { slugs: [product.slug] } : "skip",
  );
  const inStock = inventory === undefined
    ? (product.inStock ?? true)
    : inventory[0]
      ? inventory[0].available > 0
      : (product.inStock ?? true);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        disabled={!inStock}
        onClick={() => {
          addToCart(product.slug, 1);
          track("add_to_cart", {
            currency: "AUD",
            value: product.priceAud,
            items: [{ item_id: product.slug, item_name: product.name, price: product.priceAud, quantity: 1 }],
          });
          setAdded(true);
        }}
        className="btn-primary rounded-sm bg-ink px-6 py-3 text-sm text-paper hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        {!inStock ? "Out of stock" : added ? "Added to cart" : `Add to cart · ${formatPrice(product.priceAud)}`}
      </button>
      <a
        href={`mailto:${site.email}?subject=${encodeURIComponent(
          `COA request: ${product.name}`,
        )}`}
        className="rounded-sm border border-line px-6 py-3 text-center text-sm text-ink transition hover:border-accent hover:text-accent"
        onClick={() => track("generate_lead", { lead_source: "coa", item_id: product.slug })}
      >
        Request COA
      </a>
      {added ? (
        <p className="text-sm text-muted">
          Added —{" "}
          <Link href="/checkout" className="text-accent underline">
            continue to checkout
          </Link>
        </p>
      ) : null}
    </div>
  );
}
