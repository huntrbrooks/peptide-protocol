"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function ProductStockStatus({ slug, fallback }: { slug: string; fallback: boolean }) {
  const inventory = useQuery(
    api.inventory.availability,
    process.env.NEXT_PUBLIC_CONVEX_URL ? { slugs: [slug] } : "skip",
  );
  const inStock = inventory === undefined
    ? fallback
    : inventory[0]
      ? inventory[0].available > 0
      : fallback;
  return (
    <span className={`flex items-center gap-1.5 px-1 ${inStock ? "text-muted" : "text-accent"}`}>
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-ink/60" : "bg-accent"}`} />
      {inStock ? "In stock" : "Out of stock"}
    </span>
  );
}
