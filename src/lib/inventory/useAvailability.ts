"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function useInventoryInStock(slug: string, fallback: boolean): boolean {
  const rows = useQuery(
    api.inventory.listAvailability,
    process.env.NEXT_PUBLIC_CONVEX_URL ? { slugs: [slug] } : "skip",
  );
  if (rows === undefined) return fallback;
  return (rows[0]?.available ?? 0) > 0;
}
