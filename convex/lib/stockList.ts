export const VIALS_PER_KIT = 10;

export type StockEntry = {
  slug: string;
  stockCode: string;
  onHand: number;
  lowStockThreshold: number;
};

/** Physical vial counts from the 18 Aug 2026 warehouse list. */
export const PHYSICAL_STOCK: StockEntry[] = [
  { slug: "bacteriostatic-water-10ml", stockCode: "BAC10", onHand: 30, lowStockThreshold: 5 },
  { slug: "glow-up-80mg", stockCode: "KLOW80", onHand: 30, lowStockThreshold: 5 },
  { slug: "bpc-157-10mg", stockCode: "BC10", onHand: 50, lowStockThreshold: 5 },
  { slug: "ipamorelin-10mg", stockCode: "IP10", onHand: 40, lowStockThreshold: 5 },
  { slug: "cjc-1295-no-dac-10mg", stockCode: "CP10", onHand: 20, lowStockThreshold: 3 },
  { slug: "tb-500-10mg", stockCode: "BT10", onHand: 30, lowStockThreshold: 5 },
  { slug: "pt-141-10mg", stockCode: "P41", onHand: 50, lowStockThreshold: 5 },
  { slug: "ghk-cu-50mg", stockCode: "CU50", onHand: 50, lowStockThreshold: 5 },
  { slug: "retatrutide-20mg", stockCode: "RT20", onHand: 50, lowStockThreshold: 5 },
  { slug: "retatrutide-60mg", stockCode: "RT60", onHand: 10, lowStockThreshold: 2 },
];

/** Kit SKUs share the parent vial pool. onHand is the kit equivalent (vials / 10). */
export const KIT_STOCK: StockEntry[] = [
  { slug: "bpc-157-10mg-kit-10", stockCode: "BC10-KIT10", onHand: 5, lowStockThreshold: 1 },
  { slug: "ipamorelin-10mg-kit-10", stockCode: "IP10-KIT10", onHand: 4, lowStockThreshold: 1 },
  { slug: "cjc-1295-no-dac-10mg-kit-10", stockCode: "CP10-KIT10", onHand: 2, lowStockThreshold: 1 },
  { slug: "tb-500-10mg-kit-10", stockCode: "BT10-KIT10", onHand: 3, lowStockThreshold: 1 },
  { slug: "pt-141-10mg-kit-10", stockCode: "P41-KIT10", onHand: 5, lowStockThreshold: 1 },
  { slug: "ghk-cu-50mg-kit-10", stockCode: "CU50-KIT10", onHand: 5, lowStockThreshold: 1 },
  { slug: "retatrutide-20mg-kit-10", stockCode: "RT20-KIT10", onHand: 5, lowStockThreshold: 1 },
  { slug: "retatrutide-60mg-kit-10", stockCode: "RT60-KIT10", onHand: 1, lowStockThreshold: 1 },
];

export const OPENING_STOCK: StockEntry[] = [...PHYSICAL_STOCK, ...KIT_STOCK];

export const KIT_PARENT: Record<string, string> = {
  "bpc-157-10mg-kit-10": "bpc-157-10mg",
  "ipamorelin-10mg-kit-10": "ipamorelin-10mg",
  "cjc-1295-no-dac-10mg-kit-10": "cjc-1295-no-dac-10mg",
  "tb-500-10mg-kit-10": "tb-500-10mg",
  "pt-141-10mg-kit-10": "pt-141-10mg",
  "ghk-cu-50mg-kit-10": "ghk-cu-50mg",
  "retatrutide-20mg-kit-10": "retatrutide-20mg",
  "retatrutide-60mg-kit-10": "retatrutide-60mg",
};

export function inventoryDemand(
  slug: string,
  quantity: number,
): { slug: string; quantity: number } {
  const parent = KIT_PARENT[slug];
  if (parent) {
    return { slug: parent, quantity: quantity * VIALS_PER_KIT };
  }
  return { slug, quantity };
}

export function expandInventoryLines(
  lines: Array<{ slug: string; quantity: number }>,
): Array<{ slug: string; quantity: number }> {
  const demand = new Map<string, number>();
  for (const line of lines) {
    const resolved = inventoryDemand(line.slug, line.quantity);
    demand.set(resolved.slug, (demand.get(resolved.slug) ?? 0) + resolved.quantity);
  }
  return [...demand.entries()].map(([slug, quantity]) => ({ slug, quantity }));
}

export function availableForSlug(
  slug: string,
  parentAvailable: number,
): number {
  if (KIT_PARENT[slug]) {
    return Math.floor(Math.max(0, parentAvailable) / VIALS_PER_KIT);
  }
  return Math.max(0, parentAvailable);
}
