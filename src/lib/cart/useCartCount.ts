"use client";

import { useSyncExternalStore } from "react";
import {
  getCartServerSnapshot,
  getCartSnapshot,
  subscribeCart,
} from "./storage";

/** Live item count from the localStorage cart (0 on the server). */
export function useCartCount(): number {
  const cart = useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    getCartServerSnapshot,
  );
  return cart.items.reduce((total, line) => total + line.quantity, 0);
}
