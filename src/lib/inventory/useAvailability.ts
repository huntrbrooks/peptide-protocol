"use client";

import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";

export function useInventoryInStock(slug: string, fallback: boolean): boolean {
  const availability = useMutation(api.inventory.availability);
  const [inStock, setInStock] = useState(
    process.env.NEXT_PUBLIC_CONVEX_URL ? false : fallback,
  );

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) return;
    let active = true;
    void availability({ slugs: [slug] })
      .then((rows) => {
        if (active) setInStock((rows[0]?.available ?? 0) > 0);
      })
      .catch(() => {
        if (active) setInStock(false);
      });
    return () => {
      active = false;
    };
  }, [availability, slug]);

  return inStock;
}
