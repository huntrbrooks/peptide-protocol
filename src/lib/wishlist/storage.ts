"use client";

export const WISHLIST_STORAGE_KEY = "protocol:wishlist:v1";
export const WISHLIST_EVENT = "protocol:wishlist-changed";

export function readWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(WISHLIST_STORAGE_KEY) ?? "[]",
    );
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter(
      (item): item is string => typeof item === "string" && item.length > 0,
    ))];
  } catch {
    return [];
  }
}

function writeWishlist(slugs: string[]): void {
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(slugs));
  window.dispatchEvent(new Event(WISHLIST_EVENT));
}

export function setWishlistItem(productSlug: string, saved: boolean): void {
  const current = new Set(readWishlist());
  if (saved) current.add(productSlug);
  else current.delete(productSlug);
  writeWishlist([...current]);
}

export function subscribeWishlist(callback: () => void): () => void {
  window.addEventListener(WISHLIST_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(WISHLIST_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function wishlistServerSnapshot(): string[] {
  return [];
}
