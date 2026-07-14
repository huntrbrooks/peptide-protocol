import type { Category } from "./types";

export const categories: Category[] = [
  {
    slug: "metabolic",
    name: "Metabolic research",
    metaTitle: "Metabolic Research Peptides Australia | Peptide Protocol",
    metaDescription:
      "Shop Tirzepatide and Retatrutide research peptides in Australia. Documented purity, research use only. Browse Metabolic research at Peptide Protocol.",
    headline: "Metabolic research compounds",
    intro: [
      "This category groups dual and multi-agonist research peptides used in controlled laboratory studies of metabolic signalling pathways.",
      "Materials are supplied as lyophilised powders for research inventory only. They are not medicines, supplements, or consumer products.",
    ],
    productSlugs: ["tirzepatide-10mg", "retatrutide-10mg"],
    image: "/images/categories/metabolic.jpg",
  },
  {
    slug: "growth-hormone",
    name: "Growth hormone pathway research",
    metaTitle: "Growth Hormone Pathway Research Peptides | Peptide Protocol",
    metaDescription:
      "Shop CJC-1295, Ipamorelin, Sermorelin, and Tesamorelin research peptides in Australia. Research use only.",
    headline: "Growth hormone pathway research",
    intro: [
      "GHRH analogues and related secretagogue materials for assay development and pathway investigation under laboratory controls.",
      "Each listing includes specifications, storage guidance, and access to batch documentation where available.",
    ],
    productSlugs: [
      "cjc-1295-dac-5mg",
      "cjc-1295-no-dac-10mg",
      "ipamorelin-10mg",
      "sermorelin-10mg",
      "tesamorelin-10mg",
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
      "Short-chain research peptides commonly referenced in regenerative and injury-model laboratory literature.",
      "Supplied strictly for controlled research applications with clear research-only terms.",
    ],
    productSlugs: ["bpc-157-10mg", "tb-500-10mg"],
    image: "/images/categories/tissue-recovery.jpg",
  },
  {
    slug: "cognitive-neurological",
    name: "Cognitive & neurological research",
    metaTitle: "Cognitive & Neurological Research Peptides | Peptide Protocol",
    metaDescription:
      "Shop Semax, DSIP, and Epitalon research peptides in Australia. Documented purity. Research use only.",
    headline: "Cognitive and neurological research",
    intro: [
      "Compounds studied in neurobiology, cognitive pathway, and sleep-related research settings.",
      "All products in this category are for laboratory and in vitro use only.",
    ],
    productSlugs: ["semax-11mg", "dsip-5mg", "epitalon-10mg"],
    image: "/images/categories/cognitive-neurological.jpg",
  },
  {
    slug: "cellular-mitochondrial",
    name: "Cellular & mitochondrial research",
    metaTitle: "Cellular & Mitochondrial Research Peptides | Peptide Protocol",
    metaDescription:
      "Shop MOTS-c and GHK-Cu research peptides in Australia. COA access, research use only.",
    headline: "Cellular and mitochondrial research",
    intro: [
      "Mitochondrial-derived and copper-binding peptides for cellular pathway investigation in controlled laboratory environments.",
      "Batch documentation supports intake and inventory workflows.",
    ],
    productSlugs: ["mots-c-10mg", "ghk-cu-100mg"],
    image: "/images/categories/cellular-mitochondrial.jpg",
  },
  {
    slug: "other-compounds",
    name: "Other research compounds",
    metaTitle: "Other Research Compounds Australia | Peptide Protocol",
    metaDescription:
      "Shop HCG and Melanotan II research materials in Australia. Research use only. Not for consumer or cosmetic use.",
    headline: "Other research compounds",
    intro: [
      "Additional research materials maintained in the Peptide Protocol catalogue for specialised laboratory protocols.",
      "Listings in this category remain research-only. They are not offered for cosmetic, tanning, or therapeutic use.",
    ],
    productSlugs: ["hcg-5000iu", "melanotan-ii-10mg"],
    image: "/images/categories/other-compounds.jpg",
  },
  {
    slug: "research-solvents",
    name: "Research solvents & reagents",
    metaTitle: "Research Solvents & Reagents Australia | Peptide Protocol",
    metaDescription:
      "Buy bacteriostatic water 10mL for research reconstitution in Australia. Sterile research solvent. Research use only.",
    headline: "Research solvents and reagents",
    intro: [
      "Solvents and reagents for reconstitution protocols under trained laboratory procedures.",
      "Bacteriostatic water is supplied as a research reagent, not a clinical or consumer preparation.",
    ],
    productSlugs: ["bacteriostatic-water-10ml"],
    image: "/images/categories/research-solvents.jpg",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
