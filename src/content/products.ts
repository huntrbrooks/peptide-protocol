import type { Product } from "./types";

const RESEARCH_NOTICE =
  "For laboratory research purposes only. Not for human consumption. Not a medicine, supplement, or cosmetic. Intended for controlled laboratory and in vitro use only.";

const PRODUCT_DISCLAIMER =
  "This product and its description are intended solely for laboratory and controlled research use. Nothing on this page is medical advice, dosing guidance, or an invitation for personal use. Not for human consumption.";

const commonFaqs = (name: string): Product["faqs"] => [
  {
    question: "Is this lab tested?",
    answer:
      "Listed batches are assessed for purity and identity, with Certificates of Analysis available on request for verified lots.",
  },
  {
    question: "How fast is Australian delivery?",
    answer:
      "Express Australia Post typically runs 1 to 3 business days after dispatch, depending on destination.",
  },
  {
    question: "Is outer packaging discreet?",
    answer:
      "Yes. Outer cartons use plain labelling without product descriptors.",
  },
  {
    question: `What is ${name} supplied for?`,
    answer:
      "Research inventory only. It is not for human or veterinary use, therapeutic procedures, or consumer applications.",
  },
];

const sharedQualitySignals = [
  "≥99% purity target with COA support",
  "Third-party laboratory verification on listed batches",
  "Tamper-evident packing checks before dispatch",
  "Clear product labelling for research inventory control",
];

const sharedStorage = [
  "Store dry at 2–8°C unless your batch documentation states otherwise.",
  "Protect from moisture, light, and repeated temperature cycling.",
  "Reconstitute only under trained laboratory procedures using suitable sterile solvents.",
  "Follow your organisation’s SOPs for labelling, use, and disposal.",
];

/** Derive a 10-vial kit listing from a single-vial product. */
function kitFromSingle(
  single: Product,
  opts: { slug: string; priceAud: number; image: string },
): Product {
  const strengthLabel = single.strength;
  return {
    ...single,
    slug: opts.slug,
    name: `${single.shortName} (${strengthLabel}) — 10 Vial Kit`,
    priceAud: opts.priceAud,
    shortLabel: `10 × ${strengthLabel} vials | Research grade | Lyophilised powder`,
    metaTitle: `${single.shortName} ${strengthLabel} 10-Vial Kit Australia | Peptide Protocol`,
    metaDescription: `Buy ${single.shortName} ${strengthLabel} 10-vial research kit in Australia. Ten lyophilised vials, specs, COA access. Research use only.`,
    headline: `${single.shortName} 10-vial kit for laboratory inventory`,
    body: [
      `This kit supplies ten vials of ${single.shortName} (${strengthLabel}) lyophilised research material — the same specification as the single-vial listing, packed for multi-unit laboratory inventory.`,
      "Each vial is prepared for research inventory use, with purity assessed by RP-HPLC and Certificates of Analysis available for verified lots.",
    ],
    specs: [
      ...single.specs.filter((row) => row.label !== "Net content"),
      { label: "Pack size", value: "10 vials" },
      { label: "Net content", value: `${strengthLabel} per vial (10 vials)` },
    ],
    included: [
      `10 × ${single.shortName}, ${strengthLabel} lyophilised vials`,
      "Protective inner packing",
      "Access to batch-specific COA where available",
      "Australia Post tracking after dispatch",
    ],
    faqs: commonFaqs(`${single.shortName} 10-vial kit`),
    featured: false,
    promoLabel: undefined,
    image: opts.image,
  };
}

// Cap colours (warehouse): BC10 dark blue · IP10 red · CP10 yellow · BT10 red ·
// P41 red · CU50 dark blue · RT20 pink · RT60 red

const singles: Product[] = [
  {
    slug: "bpc-157-10mg",
    name: "BPC-157 (10mg)",
    shortName: "BPC-157",
    strength: "10mg",
    priceAud: 69.99,
    stockCode: "BC10",
    categorySlugs: ["tissue-recovery"],
    shortLabel: "Pentadecapeptide | Research grade | Lyophilised powder",
    metaTitle: "BPC-157 10mg Research Peptide Australia | Peptide Protocol",
    metaDescription:
      "Buy BPC-157 10mg lyophilised research peptide in Australia. Specs, storage notes, and COA access. Research use only.",
    headline: "BPC-157 for controlled tissue and recovery research models",
    body: [
      "BPC-157 is a synthetic 15-amino-acid peptide sequence derived from a portion of body protection compound research literature. Peptide Protocol supplies this material as a lyophilised powder for in vitro and other controlled laboratory applications.",
      "Each batch is prepared for research inventory use, with purity assessed by RP-HPLC and a Certificate of Analysis available for verified lots.",
    ],
    researchNotice: RESEARCH_NOTICE,
    whatItsFor: {
      intro:
        "BPC-157 is studied and sought for tissue-protection and recovery pathways. Research interest and commonly discussed applications include:",
      uses: [
        "Tendon, ligament, and soft-tissue injury models (healing, angiogenesis, and extracellular-matrix signalling)",
        "Muscle strain and sports-medicine recovery research",
        "Gut lining and gastrointestinal mucosal protection studies",
        "Wound healing and vascular regeneration pathway work",
        "Inflammation and nitric-oxide pathway modulation research",
        "Joint, connective-tissue, and chronic pain model exploration",
        "Neuroprotective and central-nervous-system injury models in preclinical literature",
      ],
    },
    specs: [
      { label: "Stock code", value: "BC10" },
      { label: "Cap colour", value: "Dark blue" },
      { label: "Synonyms", value: "Body Protection Compound-157, Bepecin (research literature)" },
      { label: "CAS number", value: "137525-51-0" },
      { label: "Chemical formula", value: "C62H98N16O22" },
      { label: "Molecular weight", value: "Approx. 1419.5 g/mol" },
      { label: "Peptide length", value: "15 amino acids" },
      { label: "Form", value: "White to off-white lyophilised powder" },
      { label: "Purity", value: "≥99.0% (COA validated)" },
      { label: "Solubility", value: "Soluble in sterile research solvents as per lab protocol" },
      { label: "Quality checks", value: "RP-HPLC identity/purity assessment; third-party verification where listed" },
      { label: "Net content", value: "10mg per vial" },
    ],
    storage: sharedStorage,
    included: [
      "1 × BPC-157, 10mg lyophilised vial",
      "Protective inner packing",
      "Access to batch-specific COA where available",
      "Australia Post tracking after dispatch",
    ],
    qualitySignals: sharedQualitySignals,
    faqs: commonFaqs("BPC-157"),
    disclaimer: PRODUCT_DISCLAIMER,
    image: "/images/products/bpc-157.jpg",
    featured: true,
  },
  {
    slug: "ipamorelin-10mg",
    name: "Ipamorelin (10mg)",
    shortName: "Ipamorelin",
    strength: "10mg",
    priceAud: 60.0,
    stockCode: "IP10",
    categorySlugs: ["growth-hormone"],
    shortLabel: "Ghrelin mimetic pentapeptide | Research grade | Lyophilised powder",
    metaTitle: "Ipamorelin 10mg Research Peptide Australia | Peptide Protocol",
    metaDescription:
      "Buy Ipamorelin 10mg lyophilised research peptide in Australia. Specs, storage notes, and COA access. Research use only.",
    headline: "Ipamorelin for growth hormone secretagogue research",
    body: [
      "Ipamorelin is a synthetic pentapeptide studied as a selective growth hormone secretagogue in laboratory literature. Peptide Protocol supplies Ipamorelin as a lyophilised powder for in vitro and other controlled research applications.",
      "Each verified lot includes access to purity documentation so research teams can maintain complete inventory records.",
    ],
    researchNotice: RESEARCH_NOTICE,
    whatItsFor: {
      intro:
        "Ipamorelin is a selective ghrelin-mimetic GH secretagogue. Research interest and commonly discussed applications include:",
      uses: [
        "Selective growth-hormone release with minimal cortisol / ACTH spillover in PK/PD studies",
        "Body-composition, recovery, and lean-mass related GH-axis research",
        "Stacked secretagogue protocols with GHRH analogues (e.g. CJC-1295 / Mod GRF)",
        "Sleep-associated GH pulse and overnight recovery models",
        "Appetite and ghrelin-receptor signalling research",
        "Postoperative ileus and GI-motility investigation (discontinued Phase II program)",
        "Anti-ageing and metabolic endocrine pathway exploration",
      ],
    },
    specs: [
      { label: "Stock code", value: "IP10" },
      { label: "Cap colour", value: "Red" },
      { label: "Synonyms", value: "NNC 26-0161 (literature reference)" },
      { label: "CAS number", value: "170851-70-4" },
      { label: "Chemical formula", value: "C38H49N9O5" },
      { label: "Molecular weight", value: "Approx. 711.9 g/mol" },
      { label: "Peptide length", value: "5 amino acids" },
      { label: "Form", value: "White to off-white lyophilised powder" },
      { label: "Purity", value: "≥99.0% (COA validated)" },
      { label: "Solubility", value: "Soluble in sterile research solvents as per lab protocol" },
      { label: "Quality checks", value: "RP-HPLC identity/purity assessment; third-party verification where listed" },
      { label: "Net content", value: "10mg per vial" },
    ],
    storage: sharedStorage,
    included: [
      "1 × Ipamorelin, 10mg lyophilised vial",
      "Protective inner packing",
      "Access to batch-specific COA where available",
      "Australia Post tracking after dispatch",
    ],
    qualitySignals: sharedQualitySignals,
    faqs: commonFaqs("Ipamorelin"),
    disclaimer: PRODUCT_DISCLAIMER,
    image: "/images/products/ipamorelin.jpg",
    featured: true,
  },
  {
    slug: "cjc-1295-no-dac-10mg",
    name: "CJC-1295 without DAC (10mg)",
    shortName: "CJC-1295 No DAC",
    strength: "10mg",
    priceAud: 99.99,
    stockCode: "CP10",
    categorySlugs: ["growth-hormone"],
    shortLabel: "Modified GRF (1-29) | Research grade | Lyophilised powder",
    metaTitle: "CJC-1295 No DAC 10mg Research Peptide Australia | Peptide Protocol",
    metaDescription:
      "Buy CJC-1295 without DAC (Mod GRF 1-29) 10mg lyophilised research peptide in Australia. Specs, storage notes, and COA access. Research use only.",
    headline: "CJC-1295 without DAC for controlled laboratory research",
    body: [
      "CJC-1295 without DAC, also called Modified GRF (1-29), is a synthetic 29-amino-acid analogue of growth hormone-releasing hormone (GHRH). Peptide Protocol supplies this material as a lyophilised powder for in vitro and other controlled research applications.",
      "Each batch is prepared for research inventory use, with purity assessed by RP-HPLC and a Certificate of Analysis available for verified lots.",
    ],
    researchNotice: RESEARCH_NOTICE,
    whatItsFor: {
      intro:
        "CJC-1295 without DAC (Modified GRF 1-29) is a short-acting GHRH analogue. Common research and interest areas include:",
      uses: [
        "Pulsatile growth-hormone release studies that preserve natural GH pulse patterns",
        "Short-half-life GHRH receptor activation models (~30-minute activity window)",
        "Stacked GH-secretagogue research with ghrelin mimetics such as Ipamorelin",
        "Body-composition, recovery, and performance-related GH-axis work",
        "Sleep-associated GH pulse and IGF-1 response investigation",
        "Head-to-head comparison with long-acting DAC-modified CJC-1295",
      ],
    },
    specs: [
      { label: "Stock code", value: "CP10" },
      { label: "Cap colour", value: "Yellow" },
      { label: "Synonyms", value: "Mod GRF (1-29), tetrasubstituted GRF (1-29)" },
      { label: "CAS number", value: "863288-34-0" },
      { label: "Chemical formula", value: "C152H252N44O42" },
      { label: "Molecular weight", value: "Approx. 3367.9 g/mol" },
      { label: "Peptide length", value: "29 amino acids" },
      { label: "Form", value: "White to off-white lyophilised powder" },
      { label: "Purity", value: "≥99.0% (COA validated)" },
      { label: "Solubility", value: "Soluble in sterile research solvents as per lab protocol" },
      { label: "Quality checks", value: "RP-HPLC identity/purity assessment; third-party verification where listed" },
      { label: "Net content", value: "10mg per vial" },
    ],
    storage: [
      ...sharedStorage,
      "Do not use outside a controlled research setting.",
    ],
    included: [
      "1 × CJC-1295 without DAC, 10mg lyophilised vial",
      "Protective inner packing",
      "Access to batch-specific COA where available",
      "Australia Post tracking after dispatch",
    ],
    qualitySignals: sharedQualitySignals,
    faqs: commonFaqs("CJC-1295 without DAC"),
    disclaimer: PRODUCT_DISCLAIMER,
    image: "/images/products/cjc-1295-no-dac.jpg",
    featured: true,
  },
  {
    slug: "tb-500-10mg",
    name: "TB-500 (10mg)",
    shortName: "TB-500",
    strength: "10mg",
    priceAud: 118.95,
    stockCode: "BT10",
    categorySlugs: ["tissue-recovery"],
    shortLabel: "Thymosin Beta-4 fragment research material | Lyophilised powder",
    metaTitle: "TB-500 10mg Research Peptide Australia | Peptide Protocol",
    metaDescription:
      "Buy TB-500 10mg lyophilised research peptide in Australia. Specs, storage notes, and COA access. Research use only.",
    headline: "TB-500 for tissue and cytoskeletal research models",
    body: [
      "TB-500 refers to research material related to the active region of thymosin beta-4, studied in cytoskeletal organisation and tissue-model laboratory work. Peptide Protocol supplies TB-500 as a lyophilised powder for controlled research use.",
      "Confirm exact sequence and molecular details on your batch Certificate of Analysis before incorporating the material into protocols.",
    ],
    researchNotice: RESEARCH_NOTICE,
    whatItsFor: {
      intro:
        "TB-500 refers to research material related to the active region of thymosin beta-4. It is studied and sought for:",
      uses: [
        "Tissue repair, wound healing, and cell-migration research",
        "Actin cytoskeleton organisation and cellular motility models",
        "Muscle, tendon, and soft-tissue recovery pathway work",
        "Cardiac repair and angiogenesis-related preclinical studies",
        "Inflammation modulation and regenerative-biology research",
        "Combined tissue-recovery protocols alongside BPC-157 in laboratory literature",
        "Flexibility, fibrosis, and scar-remodelling exploratory models",
      ],
    },
    specs: [
      { label: "Stock code", value: "BT10" },
      { label: "Cap colour", value: "Red" },
      { label: "Synonyms", value: "Thymosin Beta-4 fragment research material, TB500" },
      { label: "CAS number", value: "As per batch COA (thymosin β4 family references vary)" },
      { label: "Molecular weight", value: "As per batch COA" },
      { label: "Form", value: "White to off-white lyophilised powder" },
      { label: "Purity", value: "≥99.0% (COA validated)" },
      { label: "Solubility", value: "Soluble in sterile research solvents as per lab protocol" },
      { label: "Quality checks", value: "RP-HPLC identity/purity assessment; third-party verification where listed" },
      { label: "Net content", value: "10mg per vial" },
    ],
    storage: sharedStorage,
    included: [
      "1 × TB-500, 10mg lyophilised vial",
      "Protective inner packing",
      "Access to batch-specific COA where available",
      "Australia Post tracking after dispatch",
    ],
    qualitySignals: sharedQualitySignals,
    faqs: commonFaqs("TB-500"),
    disclaimer: PRODUCT_DISCLAIMER,
    image: "/images/products/tb-500.jpg",
    featured: true,
  },
  {
    slug: "pt-141-10mg",
    name: "PT-141 (10mg)",
    shortName: "PT-141",
    strength: "10mg",
    priceAud: 89.95,
    stockCode: "P41",
    categorySlugs: ["other-compounds"],
    shortLabel: "Bremelanotide / melanocortin agonist | Research grade | Lyophilised powder",
    metaTitle: "PT-141 10mg Research Peptide Australia | Peptide Protocol",
    metaDescription:
      "Buy PT-141 (bremelanotide) 10mg lyophilised research peptide in Australia. Specs, storage notes, and COA access. Research use only.",
    headline: "PT-141 for melanocortin pathway research",
    body: [
      "PT-141 (bremelanotide) is a synthetic cyclic heptapeptide melanocortin receptor agonist studied in sexual-function and related CNS pathway literature. Peptide Protocol supplies PT-141 as a lyophilised powder for controlled laboratory research.",
      "This catalogue listing is for research inventory only. It is not offered as a medicine, consumer, or cosmetic product.",
    ],
    researchNotice: RESEARCH_NOTICE,
    whatItsFor: {
      intro:
        "PT-141 is a melanocortin receptor agonist (notably MC3R / MC4R pathways). Laboratory and literature interest has focused on:",
      uses: [
        "Female hypoactive sexual desire disorder pathway research (approved clinical brand lineage: Vyleesi in some markets)",
        "Male erectile function and sexual-desire models via melanocortin CNS signalling",
        "Comparative melanocortin work alongside related analogues (e.g. Melanotan II lineage)",
        "Appetite and energy-balance exploratory models via central melanocortin receptors",
        "Receptor pharmacology and PK/PD characterisation in research settings",
      ],
    },
    specs: [
      { label: "Stock code", value: "P41" },
      { label: "Cap colour", value: "Red" },
      { label: "Synonyms", value: "Bremelanotide, PT141" },
      { label: "CAS number", value: "189691-06-3 (confirm on batch COA)" },
      { label: "Chemical formula", value: "C50H68N14O10 (typical literature value)" },
      { label: "Molecular weight", value: "Approx. 1025.2 g/mol (as per batch COA)" },
      { label: "Form", value: "White to off-white lyophilised powder" },
      { label: "Purity", value: "≥99.0% (COA validated)" },
      { label: "Solubility", value: "Soluble in sterile research solvents as per lab protocol" },
      { label: "Quality checks", value: "RP-HPLC identity/purity assessment; third-party verification where listed" },
      { label: "Net content", value: "10mg per vial" },
    ],
    storage: sharedStorage,
    included: [
      "1 × PT-141, 10mg lyophilised vial",
      "Protective inner packing",
      "Access to batch-specific COA where available",
      "Australia Post tracking after dispatch",
    ],
    qualitySignals: sharedQualitySignals,
    faqs: commonFaqs("PT-141"),
    disclaimer: PRODUCT_DISCLAIMER,
    image: "/images/products/pt-141.jpg",
  },
  {
    slug: "ghk-cu-50mg",
    name: "GHK-Cu (50mg)",
    shortName: "GHK-Cu",
    strength: "50mg",
    priceAud: 64.95,
    stockCode: "CU50",
    categorySlugs: ["cellular-mitochondrial"],
    shortLabel: "Copper tripeptide complex | Research grade | Lyophilised powder",
    metaTitle: "GHK-Cu 50mg Research Peptide Australia | Peptide Protocol",
    metaDescription:
      "Buy GHK-Cu 50mg lyophilised research peptide in Australia. Specs, storage notes, and COA access. Research use only.",
    headline: "GHK-Cu for cellular signalling and copper-peptide research",
    body: [
      "GHK-Cu is the copper(II) complex of the tripeptide glycyl-L-histidyl-L-lysine, studied in cellular signalling, extracellular matrix, and related laboratory models. Peptide Protocol supplies GHK-Cu as a lyophilised research material.",
      "Purity and identity documentation are available for verified lots so laboratory intake remains auditable.",
    ],
    researchNotice: RESEARCH_NOTICE,
    whatItsFor: {
      intro:
        "GHK-Cu is an endogenous copper–tripeptide complex. It is studied and sought for skin, tissue, and cellular-repair pathways, including:",
      uses: [
        "Skin remodelling, collagen synthesis, and wrinkle / photoageing cosmetic research",
        "Wound healing and tissue-repair signalling studies",
        "Hair follicle and hair-density related research",
        "Extracellular-matrix gene expression and anti-inflammatory pathway work",
        "Copper delivery and antioxidant / anti-glycation cellular models",
        "Scar quality, dermal regeneration, and cosmetic formulation research",
      ],
    },
    specs: [
      { label: "Stock code", value: "CU50" },
      { label: "Cap colour", value: "Dark blue" },
      { label: "Synonyms", value: "Copper tripeptide-1, GHK copper complex" },
      { label: "CAS number", value: "89030-95-5 (confirm on batch COA)" },
      { label: "Chemical formula", value: "C14H24CuN6O4 (typical complex notation)" },
      { label: "Molecular weight", value: "Approx. 403.9 g/mol (as per batch COA)" },
      { label: "Peptide length", value: "3 amino acids (complexed with Cu2+)" },
      { label: "Form", value: "Blue to blue-green lyophilised powder (typical)" },
      { label: "Purity", value: "≥99.0% (COA validated)" },
      { label: "Solubility", value: "Soluble in sterile research solvents as per lab protocol" },
      { label: "Quality checks", value: "RP-HPLC / identity assessment as listed on COA" },
      { label: "Net content", value: "50mg per vial" },
    ],
    storage: sharedStorage,
    included: [
      "1 × GHK-Cu, 50mg lyophilised vial",
      "Protective inner packing",
      "Access to batch-specific COA where available",
      "Australia Post tracking after dispatch",
    ],
    qualitySignals: sharedQualitySignals,
    faqs: commonFaqs("GHK-Cu"),
    disclaimer: PRODUCT_DISCLAIMER,
    image: "/images/products/ghk-cu-50mg.jpg",
    featured: true,
  },
  {
    slug: "retatrutide-20mg",
    name: "Retatrutide (20mg)",
    shortName: "Retatrutide",
    strength: "20mg",
    priceAud: 199.99,
    stockCode: "RT20",
    categorySlugs: ["metabolic"],
    shortLabel: "Triple agonist research peptide | Research grade | Lyophilised powder",
    metaTitle: "Retatrutide 20mg Research Peptide Australia | Peptide Protocol",
    metaDescription:
      "Buy Retatrutide 20mg lyophilised research peptide in Australia. Specs, storage notes, and COA access. Research use only.",
    headline: "Retatrutide for multi-agonist metabolic research models",
    body: [
      "Retatrutide is a synthetic peptide studied as a multi-agonist research compound in metabolic pathway literature. Peptide Protocol supplies Retatrutide as a lyophilised powder strictly for laboratory and in vitro research.",
      "Identity and purity are documented on Certificates of Analysis for verified lots. Confirm exact molecular parameters on your batch COA before protocol use.",
    ],
    researchNotice: RESEARCH_NOTICE,
    whatItsFor: {
      intro:
        "Retatrutide is an investigational triple agonist (GLP-1 / GIP / glucagon). Clinical and research interest focuses on:",
      uses: [
        "Obesity and chronic weight-management clinical development",
        "Type 2 diabetes and glycemic-control research",
        "Metabolic dysfunction–associated steatotic liver disease (MASLD / MASH) trials",
        "Appetite regulation, energy expenditure, and body-composition studies",
        "Cardiometabolic risk-factor improvement research",
        "Head-to-head comparison with dual agonists such as tirzepatide in metabolic literature",
      ],
    },
    specs: [
      { label: "Stock code", value: "RT20" },
      { label: "Cap colour", value: "Pink" },
      { label: "Synonyms", value: "LY3437943 (literature reference)" },
      { label: "CAS number", value: "2381089-83-2 (confirm on batch COA)" },
      { label: "Molecular weight", value: "Approx. 4731 g/mol (as per batch COA)" },
      { label: "Form", value: "White to off-white lyophilised powder" },
      { label: "Purity", value: "≥99.0% (COA validated)" },
      { label: "Solubility", value: "Soluble in sterile research solvents as per lab protocol" },
      { label: "Quality checks", value: "RP-HPLC identity/purity assessment; third-party verification where listed" },
      { label: "Net content", value: "20mg per vial" },
    ],
    storage: sharedStorage,
    included: [
      "1 × Retatrutide, 20mg lyophilised vial",
      "Protective inner packing",
      "Access to batch-specific COA where available",
      "Australia Post tracking after dispatch",
    ],
    qualitySignals: sharedQualitySignals,
    faqs: commonFaqs("Retatrutide"),
    disclaimer: PRODUCT_DISCLAIMER,
    image: "/images/products/retatrutide-20mg.jpg",
    featured: true,
  },
  {
    slug: "retatrutide-60mg",
    name: "Retatrutide (60mg)",
    shortName: "Retatrutide",
    strength: "60mg",
    priceAud: 479.95,
    stockCode: "RT60",
    categorySlugs: ["metabolic"],
    shortLabel: "Triple agonist research peptide | Research grade | Lyophilised powder",
    metaTitle: "Retatrutide 60mg Research Peptide Australia | Peptide Protocol",
    metaDescription:
      "Buy Retatrutide 60mg lyophilised research peptide in Australia. Specs, storage notes, and COA access. Research use only.",
    headline: "Retatrutide 60mg for multi-agonist metabolic research",
    body: [
      "Retatrutide is a synthetic peptide studied as a multi-agonist research compound in metabolic pathway literature. Peptide Protocol supplies this higher-content 60mg vial as a lyophilised powder strictly for laboratory and in vitro research.",
      "Identity and purity are documented on Certificates of Analysis for verified lots. Confirm exact molecular parameters on your batch COA before protocol use.",
    ],
    researchNotice: RESEARCH_NOTICE,
    whatItsFor: {
      intro:
        "Retatrutide is an investigational triple agonist (GLP-1 / GIP / glucagon). Clinical and research interest focuses on:",
      uses: [
        "Obesity and chronic weight-management clinical development",
        "Type 2 diabetes and glycemic-control research",
        "Metabolic dysfunction–associated steatotic liver disease (MASLD / MASH) trials",
        "Appetite regulation, energy expenditure, and body-composition studies",
        "Cardiometabolic risk-factor improvement research",
        "Head-to-head comparison with dual agonists such as tirzepatide in metabolic literature",
      ],
    },
    specs: [
      { label: "Stock code", value: "RT60" },
      { label: "Cap colour", value: "Red" },
      { label: "Synonyms", value: "LY3437943 (literature reference)" },
      { label: "CAS number", value: "2381089-83-2 (confirm on batch COA)" },
      { label: "Molecular weight", value: "Approx. 4731 g/mol (as per batch COA)" },
      { label: "Form", value: "White to off-white lyophilised powder" },
      { label: "Purity", value: "≥99.0% (COA validated)" },
      { label: "Solubility", value: "Soluble in sterile research solvents as per lab protocol" },
      { label: "Quality checks", value: "RP-HPLC identity/purity assessment; third-party verification where listed" },
      { label: "Net content", value: "60mg per vial" },
    ],
    storage: sharedStorage,
    included: [
      "1 × Retatrutide, 60mg lyophilised vial",
      "Protective inner packing",
      "Access to batch-specific COA where available",
      "Australia Post tracking after dispatch",
    ],
    qualitySignals: sharedQualitySignals,
    faqs: commonFaqs("Retatrutide"),
    disclaimer: PRODUCT_DISCLAIMER,
    image: "/images/products/retatrutide-60mg.jpg",
  },
];

const kitDefs: {
  singleSlug: string;
  slug: string;
  priceAud: number;
  image: string;
}[] = [
  {
    singleSlug: "bpc-157-10mg",
    slug: "bpc-157-10mg-kit-10",
    priceAud: 594.95,
    image: "/images/products/bpc-157-kit.jpg",
  },
  {
    singleSlug: "ipamorelin-10mg",
    slug: "ipamorelin-10mg-kit-10",
    priceAud: 509.95,
    image: "/images/products/ipamorelin-kit.jpg",
  },
  {
    singleSlug: "cjc-1295-no-dac-10mg",
    slug: "cjc-1295-no-dac-10mg-kit-10",
    priceAud: 849.95,
    image: "/images/products/cjc-1295-no-dac-kit.jpg",
  },
  {
    singleSlug: "tb-500-10mg",
    slug: "tb-500-10mg-kit-10",
    priceAud: 1010.95,
    image: "/images/products/tb-500-kit.jpg",
  },
  {
    singleSlug: "pt-141-10mg",
    slug: "pt-141-10mg-kit-10",
    priceAud: 764.95,
    image: "/images/products/pt-141-kit.jpg",
  },
  {
    singleSlug: "ghk-cu-50mg",
    slug: "ghk-cu-50mg-kit-10",
    priceAud: 551.95,
    image: "/images/products/ghk-cu-50mg-kit.jpg",
  },
  {
    singleSlug: "retatrutide-20mg",
    slug: "retatrutide-20mg-kit-10",
    priceAud: 1699.95,
    image: "/images/products/retatrutide-20mg-kit.jpg",
  },
  {
    singleSlug: "retatrutide-60mg",
    slug: "retatrutide-60mg-kit-10",
    priceAud: 4079.95,
    image: "/images/products/retatrutide-60mg-kit.jpg",
  },
];

const kits: Product[] = kitDefs.map((def) => {
  const single = singles.find((p) => p.slug === def.singleSlug);
  if (!single) {
    throw new Error(`Missing single product for kit: ${def.singleSlug}`);
  }
  return kitFromSingle(single, {
    slug: def.slug,
    priceAud: def.priceAud,
    image: def.image,
  });
});

export const products: Product[] = [...singles, ...kits];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((p) => p.categorySlugs.includes(categorySlug));
}

export function formatPrice(aud: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(aud);
}
