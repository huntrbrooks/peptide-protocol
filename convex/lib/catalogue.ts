export type CatalogueItem = {
  name: string;
  priceAud: number;
};

export const catalogue = {
  "bacteriostatic-water-10ml": { name: "BAC Water (10mL)", priceAud: 30 },
  "glow-up-80mg": { name: "Glow Up — KLOW80 (80mg)", priceAud: 175 },
  "bpc-157-10mg": { name: "BPC-157 (10mg)", priceAud: 70 },
  "ipamorelin-10mg": { name: "Ipamorelin (10mg)", priceAud: 75 },
  "cjc-1295-no-dac-10mg": {
    name: "CJC-1295 without DAC (10mg)",
    priceAud: 90,
  },
  "tb-500-10mg": { name: "TB-500 (10mg)", priceAud: 70 },
  "pt-141-10mg": { name: "PT-141 (10mg)", priceAud: 70 },
  "ghk-cu-50mg": { name: "GHK-Cu (50mg)", priceAud: 70 },
  "retatrutide-20mg": { name: "Retatrutide (20mg)", priceAud: 155 },
  "retatrutide-60mg": { name: "Retatrutide (60mg)", priceAud: 350 },
  "bpc-157-10mg-kit-10": {
    name: "BPC-157 (10mg) — 10 Vial Kit",
    priceAud: 594.95,
  },
  "ipamorelin-10mg-kit-10": {
    name: "Ipamorelin (10mg) — 10 Vial Kit",
    priceAud: 637.45,
  },
  "cjc-1295-no-dac-10mg-kit-10": {
    name: "CJC-1295 No DAC (10mg) — 10 Vial Kit",
    priceAud: 764.95,
  },
  "tb-500-10mg-kit-10": {
    name: "TB-500 (10mg) — 10 Vial Kit",
    priceAud: 594.95,
  },
  "pt-141-10mg-kit-10": {
    name: "PT-141 (10mg) — 10 Vial Kit",
    priceAud: 594.95,
  },
  "ghk-cu-50mg-kit-10": {
    name: "GHK-Cu (50mg) — 10 Vial Kit",
    priceAud: 594.95,
  },
  "retatrutide-20mg-kit-10": {
    name: "Retatrutide (20mg) — 10 Vial Kit",
    priceAud: 1317.45,
  },
  "retatrutide-60mg-kit-10": {
    name: "Retatrutide (60mg) — 10 Vial Kit",
    priceAud: 2974.95,
  },
} satisfies Record<string, CatalogueItem>;

export function getCatalogueItem(slug: string): CatalogueItem | undefined {
  return catalogue[slug as keyof typeof catalogue];
}
