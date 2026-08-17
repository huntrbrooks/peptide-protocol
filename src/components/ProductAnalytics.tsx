"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";

export function ProductAnalytics(props: {
  slug: string;
  name: string;
  priceAud: number;
  purityLabel?: string;
  inStock: boolean;
}) {
  useEffect(() => {
    track("view_item", {
      currency: "AUD",
      value: props.priceAud,
      purity_label: props.purityLabel,
      in_stock: props.inStock,
      items: [{ item_id: props.slug, item_name: props.name, price: props.priceAud }],
    });
  }, [props.inStock, props.name, props.priceAud, props.purityLabel, props.slug]);
  return null;
}
