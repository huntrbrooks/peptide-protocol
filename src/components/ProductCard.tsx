"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/content/types";
import { formatPrice } from "@/content/products";
import { track } from "@/lib/analytics/track";
import { useInventoryInStock } from "@/lib/inventory/useAvailability";
import { WishlistButton } from "@/components/WishlistButton";

export function ProductCard({ product }: { product: Product }) {
  const inStock = useInventoryInStock(product.slug, product.inStock ?? true);

  return (
    <article className="card-lift group relative flex flex-col overflow-hidden border border-line bg-paper">
      <Link
        href={`/products/${product.slug}`}
        onClick={() =>
          track("select_item", {
            item_list_id: "catalogue",
            items: [{ item_id: product.slug, item_name: product.name, price: product.priceAud }],
          })
        }
        className="flex flex-1 flex-col"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-mist">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 360px"
          />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          {product.strength}
        </p>
        <h3 className="font-display text-lg leading-snug text-ink">
          {product.shortName}
        </h3>
        {product.purityLabel || product.formLabel ? (
          <div className="flex flex-wrap gap-1.5">
            {product.purityLabel ? (
              <span className="border border-line bg-mist/40 px-2 py-0.5 text-xs text-ink">
                {product.purityLabel}
              </span>
            ) : null}
            {product.formLabel ? (
              <span className="border border-line bg-mist/40 px-2 py-0.5 text-xs text-muted">
                {product.formLabel}
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <div>
            <p className="text-base font-medium text-ink">
              {formatPrice(product.priceAud)}
            </p>
            <p
              className={`mt-1 flex items-center gap-1.5 text-xs ${
                inStock ? "text-muted" : "text-accent"
              }`}
            >
              <span
                aria-hidden
                className={`h-1.5 w-1.5 rounded-full ${
                  inStock ? "bg-ink/60" : "bg-accent"
                }`}
              />
              {inStock ? "In stock" : "Out of stock"}
            </p>
          </div>
          <span className="text-sm text-accent transition md:opacity-0 md:group-hover:opacity-100">
            View
          </span>
        </div>
        </div>
      </Link>
      <WishlistButton
        productSlug={product.slug}
        productName={product.name}
        priceAud={product.priceAud}
        className="absolute right-3 top-3 z-10 bg-paper/95"
      />
    </article>
  );
}
