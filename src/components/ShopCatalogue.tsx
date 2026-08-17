"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { Product } from "@/content/types";
import { ProductCard } from "@/components/ProductCard";
import { track } from "@/lib/analytics/track";

export function ShopCatalogue({ products }: { products: Product[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredTerm = useDeferredValue(searchTerm);
  const normalizedTerm = deferredTerm.trim().toLowerCase();
  const results = useMemo(() => {
    if (!normalizedTerm) return products;
    return products.filter((product) =>
      [
        product.name,
        product.shortName,
        product.strength,
        product.shortLabel,
        ...product.categorySlugs,
      ].some((value) => value.toLowerCase().includes(normalizedTerm))
    );
  }, [normalizedTerm, products]);

  useEffect(() => {
    if (!normalizedTerm) return;
    const timeout = window.setTimeout(() => {
      track("search", {
        search_term: deferredTerm.trim(),
        results_count: results.length,
      });
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [deferredTerm, normalizedTerm, results.length]);

  return (
    <>
      <div className="mt-8 max-w-xl">
        <label htmlFor="catalogue-search" className="text-xs uppercase tracking-[0.14em] text-muted">
          Search catalogue
        </label>
        <div className="relative mt-2">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            id="catalogue-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by product, strength, or category"
            className="w-full border border-line bg-paper py-3 pl-10 pr-4 text-sm text-ink outline-none transition focus:border-accent"
          />
        </div>
        {normalizedTerm ? (
          <p className="mt-2 text-sm text-muted">
            {results.length} {results.length === 1 ? "result" : "results"}
          </p>
        ) : null}
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
      {normalizedTerm && results.length === 0 ? (
        <p className="mt-8 border border-line bg-paper p-5 text-sm text-muted">
          No catalogue items match that search.
        </p>
      ) : null}
    </>
  );
}
