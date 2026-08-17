"use client";

import { useQuery_experimental } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function useInventoryInStock(slug: string, fallback: boolean): boolean {
  const result = useQuery_experimental({
    query: api.inventory.availability,
    args: process.env.NEXT_PUBLIC_CONVEX_URL ? { slugs: [slug] } : "skip",
  });

  if (result.status !== "success") {
    return fallback;
  }

  const row = result.data[0];
  return row ? row.available > 0 : fallback;
}
