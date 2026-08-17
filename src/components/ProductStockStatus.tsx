"use client";

import { useInventoryInStock } from "@/lib/inventory/useAvailability";

export function ProductStockStatus({ slug, fallback }: { slug: string; fallback: boolean }) {
  const inStock = useInventoryInStock(slug, fallback);
  return (
    <span className={`flex items-center gap-1.5 px-1 ${inStock ? "text-muted" : "text-accent"}`}>
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-ink/60" : "bg-accent"}`} />
      {inStock ? "In stock" : "Out of stock"}
    </span>
  );
}
