export type SpecRow = {
  label: string;
  value: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type WhatItsFor = {
  intro: string;
  uses: string[];
};

export type Product = {
  slug: string;
  name: string;
  shortName: string;
  strength: string;
  priceAud: number;
  compareAtAud?: number;
  /** Internal warehouse / inventory code (e.g. BC10, CP10). */
  stockCode?: string;
  categorySlugs: string[];
  shortLabel: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  body: string[];
  researchNotice: string;
  whatItsFor: WhatItsFor;
  specs: SpecRow[];
  storage: string[];
  included: string[];
  qualitySignals: string[];
  faqs: FaqItem[];
  disclaimer: string;
  image: string;
  featured?: boolean;
  promoLabel?: string;
};

export type Category = {
  slug: string;
  name: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  intro: string[];
  productSlugs: string[];
  image: string;
};

export type PageContent = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  body: string[];
  sections?: {
    title: string;
    body: string[];
    bullets?: string[];
  }[];
  faqs?: FaqItem[];
};
