"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { products } from "@/content/products";
import { ProductCard } from "@/components/ProductCard";
import { readWishlist, subscribeWishlist } from "@/lib/wishlist/storage";

export function AccountWishlist() {
  const serverSlugs = useQuery(api.wishlists.list);
  const add = useMutation(api.wishlists.add);
  const [localSlugs, setLocalSlugs] = useState<string[]>([]);
  const [localLoaded, setLocalLoaded] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const mergedOnce = useRef(false);

  useEffect(() => {
    const sync = () => {
      setLocalSlugs(readWishlist());
      setLocalLoaded(true);
    };
    sync();
    return subscribeWishlist(sync);
  }, []);

  useEffect(() => {
    if (!localLoaded || serverSlugs === undefined || mergedOnce.current) return;
    mergedOnce.current = true;
    const serverSet = new Set(serverSlugs);
    const missing = localSlugs.filter((slug) => !serverSet.has(slug));
    if (missing.length > 0) {
      void Promise.all(missing.map(async (productSlug) => await add({ productSlug })))
        .catch(() => setSyncFailed(true));
    }
  }, [add, localLoaded, localSlugs, serverSlugs]);

  const savedProducts = useMemo(() => {
    const slugs = new Set([...localSlugs, ...(serverSlugs ?? [])]);
    return products.filter((product) => slugs.has(product.slug));
  }, [localSlugs, serverSlugs]);

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl text-ink">Saved items</h2>
      {syncFailed ? (
        <p className="mt-3 text-sm text-muted">
          Some saved items are only stored on this device right now.
        </p>
      ) : null}
      {savedProducts.length > 0 ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {savedProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">No saved catalogue items yet.</p>
      )}
    </section>
  );
}
