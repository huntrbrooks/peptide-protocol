import type { Category } from "./types";

export const categories: Category[] = [
  {
    slug: "metabolic",
    name: "Metabolic research",
    metaTitle: "Metabolic Research Peptides Australia | Peptide Protocol",
    metaDescription:
      "Shop Retatrutide research peptides in Australia. Documented purity, research use only. Browse Metabolic research at Peptide Protocol.",
    headline: "Metabolic research compounds",
    intro: [
      "Multi-agonist materials for metabolic signalling studies.",
      "Lyophilised powders for research inventory only — not medicines, supplements, or consumer products.",
    ],
    productSlugs: [
      "retatrutide-20mg",
      "retatrutide-60mg",
      "retatrutide-20mg-kit-10",
      "retatrutide-60mg-kit-10",
    ],
    image: "/images/categories/metabolic.jpg",
  },
  {
    slug: "growth-hormone",
    name: "Growth hormone pathway research",
    metaTitle: "Growth Hormone Pathway Research Peptides | Peptide Protocol",
    metaDescription:
      "Shop CJC-1295 without DAC and Ipamorelin research peptides in Australia. Research use only.",
    headline: "Growth hormone pathway research",
    intro: [
      "GHRH analogues and secretagogues for pathway assays.",
      "Each listing includes specifications, storage guidance, and batch docs where available.",
    ],
    productSlugs: [
      "cjc-1295-no-dac-10mg",
      "ipamorelin-10mg",
      "cjc-1295-no-dac-10mg-kit-10",
      "ipamorelin-10mg-kit-10",
    ],
    image: "/images/categories/growth-hormone.jpg",
  },
  {
    slug: "tissue-recovery",
    name: "Tissue & recovery research",
    metaTitle: "Tissue & Recovery Research Peptides Australia | Peptide Protocol",
    metaDescription:
      "Shop BPC-157 and TB-500 research peptides in Australia. Specs, COA access, research use only.",
    headline: "Tissue and recovery research",
    intro: [
      "Short-chain peptides used in regenerative research models.",
      "Supplied for controlled research applications with clear research-only terms.",
    ],
    productSlugs: [
      "bpc-157-10mg",
      "tb-500-10mg",
      "bpc-157-10mg-kit-10",
      "tb-500-10mg-kit-10",
    ],
    image: "/images/categories/tissue-recovery.jpg",
  },
  {
    slug: "cellular-mitochondrial",
    name: "Cellular & mitochondrial research",
    metaTitle: "Cellular & Mitochondrial Research Peptides | Peptide Protocol",
    metaDescription:
      "Shop GHK-Cu research peptides in Australia. COA access, research use only.",
    headline: "Cellular and mitochondrial research",
    intro: [
      "Copper-binding peptides for cellular and tissue-model work.",
      "Batch documentation supports intake and inventory workflows.",
    ],
    productSlugs: ["ghk-cu-50mg", "ghk-cu-50mg-kit-10"],
    image: "/images/categories/cellular-mitochondrial.jpg",
  },
  {
    slug: "other-compounds",
    name: "Other research compounds",
    metaTitle: "Other Research Compounds Australia | Peptide Protocol",
    metaDescription:
      "Shop PT-141 research materials in Australia. Research use only. Not for consumer or cosmetic use.",
    headline: "Other research compounds",
    intro: [
      "Specialised catalogue materials for lab protocols.",
      "Research-only listings — not for cosmetic, tanning, or therapeutic use.",
    ],
    productSlugs: ["pt-141-10mg", "pt-141-10mg-kit-10"],
    image: "/images/categories/other-compounds.jpg",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
