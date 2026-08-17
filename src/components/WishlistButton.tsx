"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { track } from "@/lib/analytics/track";
import {
  readWishlist,
  setWishlistItem,
  subscribeWishlist,
} from "@/lib/wishlist/storage";

type WishlistButtonProps = {
  productSlug: string;
  productName: string;
  priceAud: number;
  className?: string;
};

export function WishlistButton({
  productSlug,
  productName,
  priceAud,
  className = "",
}: WishlistButtonProps) {
  const { isAuthenticated } = useConvexAuth();
  const serverSlugs = useQuery(
    api.wishlists.list,
    isAuthenticated ? {} : "skip",
  );
  const add = useMutation(api.wishlists.add);
  const remove = useMutation(api.wishlists.remove);
  const [localSlugs, setLocalSlugs] = useState<string[]>([]);
  const [syncFailed, setSyncFailed] = useState(false);

  useEffect(() => {
    const sync = () => setLocalSlugs(readWishlist());
    sync();
    return subscribeWishlist(sync);
  }, []);

  const saved =
    localSlugs.includes(productSlug) || serverSlugs?.includes(productSlug) === true;

  return (
    <button
      type="button"
      aria-label={saved ? `Remove ${productName} from saved items` : `Save ${productName}`}
      aria-pressed={saved}
      title={syncFailed ? "Saved on this device; account sync is temporarily unavailable" : undefined}
      className={`inline-flex h-10 w-10 items-center justify-center border border-line bg-paper text-ink transition hover:border-accent hover:text-accent ${className}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const nextSaved = !saved;
        setWishlistItem(productSlug, nextSaved);
        track(nextSaved ? "add_to_wishlist" : "remove_from_wishlist", {
          currency: "AUD",
          value: priceAud,
          items: [{
            item_id: productSlug,
            item_name: productName,
            price: priceAud,
            quantity: 1,
          }],
        });
        if (isAuthenticated) {
          const request = nextSaved
            ? add({ productSlug })
            : remove({ productSlug });
          setSyncFailed(false);
          void request.catch(() => setSyncFailed(true));
        }
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
      </svg>
    </button>
  );
}
