import { CART_STORAGE_KEY, type CartLine, type CartState } from "./types";

const listeners = new Set<() => void>();
const EMPTY_CART: CartState = { items: [] };

let cachedRaw: string | null | undefined;
let cachedCart: CartState = EMPTY_CART;

export function subscribeCart(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", listener);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", listener);
    }
  };
}

function emitCartChange(): void {
  cachedRaw = undefined;
  for (const listener of listeners) {
    listener();
  }
}

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.slug === "string" &&
    row.slug.length > 0 &&
    typeof row.quantity === "number" &&
    Number.isInteger(row.quantity) &&
    row.quantity > 0
  );
}

export function emptyCart(): CartState {
  return { items: [] };
}

export function parseCart(raw: unknown): CartState {
  if (!raw || typeof raw !== "object") return emptyCart();
  const items = (raw as { items?: unknown }).items;
  if (!Array.isArray(items)) return emptyCart();
  return { items: items.filter(isCartLine) };
}

export function readCartFromStorage(): CartState {
  if (typeof window === "undefined") return emptyCart();
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return emptyCart();
    return parseCart(JSON.parse(raw) as unknown);
  } catch {
    return emptyCart();
  }
}

export function writeCartToStorage(cart: CartState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  emitCartChange();
}

export function addToCart(slug: string, quantity = 1): CartState {
  const cart = readCartFromStorage();
  const existing = cart.items.find((item) => item.slug === slug);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ slug, quantity });
  }
  writeCartToStorage(cart);
  return cart;
}

/** Stable snapshot for useSyncExternalStore (same reference unless storage changed). */
export function getCartSnapshot(): CartState {
  if (typeof window === "undefined") return EMPTY_CART;
  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (raw === cachedRaw) return cachedCart;
  cachedRaw = raw;
  if (!raw) {
    cachedCart = EMPTY_CART;
    return cachedCart;
  }
  try {
    cachedCart = parseCart(JSON.parse(raw) as unknown);
  } catch {
    cachedCart = EMPTY_CART;
  }
  return cachedCart;
}

export function getCartServerSnapshot(): CartState {
  return EMPTY_CART;
}
