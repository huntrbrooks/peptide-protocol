/**
 * Copy and educational examples for the research dosing calculator.
 * Lab-math framing only — not protocols, medical advice, or personal-use guidance.
 */

export const dosingCalculatorMeta = {
  /** SEO / document title — includes "Dosing calculator" */
  metaTitle: "Dosing calculator | Research Peptide Lab Math Australia",
  metaDescription:
    "Research lab-math calculator for lyophilised peptide vial dilution examples, concentration, and U-100 syringe units. Educational reference only — not medical or personal-use guidance. Peptide Protocol Australia.",
  /** Visible chrome label (nav, eyebrow) */
  chromeLabel: "Research calculator",
  /** H1 / primary page title for SEO alignment */
  headline: "Dosing calculator",
  eyebrow: "Research calculator",
  intro:
    "Educational lab-math for concentration, draw volume, and U-100 syringe units from vial mass and solvent volume. Research handling reference only — not medical advice, dosing protocols, or personal-use guidance.",
};

export const dosingCalculatorDisclaimer = {
  sticky:
    "Research & educational lab-math only. Outputs are arithmetic helpers for laboratory stock preparation — not medical advice, treatment recommendations, or an invitation for human or veterinary use. All Peptide Protocol materials are for laboratory and in vitro research only.",
  acknowledgementLabel:
    "I understand this tool is for research lab-math and educational reference only. It is not medical advice, dosing guidance, or personal-use instructions.",
  acknowledgementHint: "Required before using the calculator",
  disclaimerLinkLabel: "Research Use Disclaimer",
  disclaimerHref: "/disclaimer",
  labHandlingLinkLabel: "Lab handling overview",
  labHandlingHref: "/lab-handling",
};

export type DilutionExampleRow = {
  waterMl: number;
  /** Concentration in mcg per mL */
  concentrationMcgPerMl: number;
  /** Example aliquot mass in mcg */
  exampleAliquotMcg: number;
  /** Draw volume in mL for the example aliquot */
  drawMl: number;
  /** U-100 syringe units for the example aliquot */
  syringeUnits: number;
};

export type VialSizeDilutionExample = {
  vialMg: 10 | 20 | 50 | 60;
  title: string;
  framing: string;
  rows: DilutionExampleRow[];
};

/**
 * Generic vial-size dilution examples (by mass only — not peptide-named).
 * Educational concentration arithmetic; not research protocols.
 */
export const vialSizeDilutionExamples: VialSizeDilutionExample[] = [
  {
    vialMg: 10,
    title: "10 mg vial",
    framing:
      "Illustrative concentration arithmetic when a 10 mg lyophilised vial is reconstituted with common solvent volumes. Educational lab-math only — not a protocol.",
    rows: [
      {
        waterMl: 1,
        concentrationMcgPerMl: 10_000,
        exampleAliquotMcg: 250,
        drawMl: 0.025,
        syringeUnits: 2.5,
      },
      {
        waterMl: 2,
        concentrationMcgPerMl: 5_000,
        exampleAliquotMcg: 250,
        drawMl: 0.05,
        syringeUnits: 5,
      },
      {
        waterMl: 3,
        concentrationMcgPerMl: 3_333.33,
        exampleAliquotMcg: 250,
        drawMl: 0.075,
        syringeUnits: 7.5,
      },
    ],
  },
  {
    vialMg: 20,
    title: "20 mg vial",
    framing:
      "Illustrative concentration arithmetic for a 20 mg lyophilised vial. Solvent volume and target aliquot mass determine draw volume on a U-100 scale.",
    rows: [
      {
        waterMl: 1,
        concentrationMcgPerMl: 20_000,
        exampleAliquotMcg: 500,
        drawMl: 0.025,
        syringeUnits: 2.5,
      },
      {
        waterMl: 2,
        concentrationMcgPerMl: 10_000,
        exampleAliquotMcg: 500,
        drawMl: 0.05,
        syringeUnits: 5,
      },
      {
        waterMl: 3,
        concentrationMcgPerMl: 6_666.67,
        exampleAliquotMcg: 500,
        drawMl: 0.075,
        syringeUnits: 7.5,
      },
    ],
  },
  {
    vialMg: 50,
    title: "50 mg vial",
    framing:
      "Illustrative concentration arithmetic for a 50 mg lyophilised vial. Values are educational examples for stock-solution maths, not handling instructions.",
    rows: [
      {
        waterMl: 1,
        concentrationMcgPerMl: 50_000,
        exampleAliquotMcg: 1_000,
        drawMl: 0.02,
        syringeUnits: 2,
      },
      {
        waterMl: 2,
        concentrationMcgPerMl: 25_000,
        exampleAliquotMcg: 1_000,
        drawMl: 0.04,
        syringeUnits: 4,
      },
      {
        waterMl: 3,
        concentrationMcgPerMl: 16_666.67,
        exampleAliquotMcg: 1_000,
        drawMl: 0.06,
        syringeUnits: 6,
      },
    ],
  },
  {
    vialMg: 60,
    title: "60 mg vial",
    framing:
      "Illustrative concentration arithmetic for a 60 mg lyophilised vial. Adjust solvent volume in the calculator to match your laboratory worksheet.",
    rows: [
      {
        waterMl: 1,
        concentrationMcgPerMl: 60_000,
        exampleAliquotMcg: 1_000,
        drawMl: 0.0167,
        syringeUnits: 1.67,
      },
      {
        waterMl: 2,
        concentrationMcgPerMl: 30_000,
        exampleAliquotMcg: 1_000,
        drawMl: 0.0333,
        syringeUnits: 3.33,
      },
      {
        waterMl: 3,
        concentrationMcgPerMl: 20_000,
        exampleAliquotMcg: 1_000,
        drawMl: 0.05,
        syringeUnits: 5,
      },
    ],
  },
];

export const dilutionExamplesSection = {
  title: "Common lab dilution examples",
  intro:
    "Generic examples keyed by vial mass only (10, 20, 50, and 60 mg). These illustrate concentration and U-100 unit arithmetic for laboratory worksheets — not protocols, schedules, or personal-use guidance.",
};

export type GlossaryEntry = {
  term: string;
  definition: string;
};

export const dosingCalculatorGlossary: GlossaryEntry[] = [
  {
    term: "mg (milligram)",
    definition:
      "One thousandth of a gram. Catalogue vial strengths are typically listed in mg of lyophilised peptide mass.",
  },
  {
    term: "mcg (microgram)",
    definition:
      "One thousandth of a milligram (1 mg = 1,000 mcg). Aliquot and concentration maths in this tool use mcg for finer resolution.",
  },
  {
    term: "Syringe units (U-100)",
    definition:
      "On a U-100 insulin-style syringe, 100 units equal 1 mL. Draw volume in mL × 100 ≈ syringe units marked on the barrel.",
  },
  {
    term: "IU (international unit)",
    definition:
      "Activity-based units used for some biologics. Not used for current Peptide Protocol catalogue strengths — this calculator works in mass (mg/mcg) and volume (mL/units) only.",
  },
];

export type CalculatorModeId = "calculate" | "find-bac" | "blend";

export type ModeHelp = {
  id: CalculatorModeId;
  label: string;
  help: string;
};

export const dosingCalculatorModes: ModeHelp[] = [
  {
    id: "calculate",
    label: "Calculate",
    help: "Enter vial mass, solvent (BAC or sterile water) volume, and a target aliquot mass. Returns concentration, draw volume in mL, and U-100 syringe units — forward lab-math from known reconstitution volume.",
  },
  {
    id: "find-bac",
    label: "Find BAC volume",
    help: "Work backwards: choose vial mass, a target aliquot in mcg, and desired syringe units. Returns the solvent volume that yields that unit mark for the target mass. Educational reverse arithmetic only.",
  },
  {
    id: "blend",
    label: "Blend",
    help: "Model two or more lyophilised masses sharing one solvent volume. Set an anchor aliquot for one component; the same draw volume delivers proportional masses of the others. Presets are editable starting points — not protocols.",
  },
];

export type BlendPresetComponent = {
  id: string;
  label: string;
  massMg: number;
};

export type BlendPreset = {
  id: string;
  label: string;
  description: string;
  components: BlendPresetComponent[];
};

export const blendPresets: BlendPreset[] = [
  {
    id: "cjc-ipamorelin",
    label: "CJC-1295 No DAC + Ipamorelin",
    description:
      "Catalogue-aligned starting masses of 10 mg + 10 mg in a shared solvent volume. Edit masses as needed for your worksheet.",
    components: [
      { id: "cjc-1295-no-dac", label: "CJC-1295 No DAC", massMg: 10 },
      { id: "ipamorelin", label: "Ipamorelin", massMg: 10 },
    ],
  },
  {
    id: "bpc-tb500",
    label: "BPC-157 + TB-500",
    description:
      "Catalogue-aligned starting masses of 10 mg + 10 mg in a shared solvent volume. Edit masses as needed for your worksheet.",
    components: [
      { id: "bpc-157", label: "BPC-157", massMg: 10 },
      { id: "tb-500", label: "TB-500", massMg: 10 },
    ],
  },
];

export const blendCustomNote = {
  title: "Custom blend",
  body: "Add two or three components with your own masses. There are no commercial multi-peptide blend SKUs in the catalogue — custom entry covers non-preset combinations for worksheet maths only.",
};

export const dosingCalculatorLinks = {
  openFull: { href: "/dosing-calculator", label: "Open full calculator" },
  productPrefillQueryKey: "product",
};
