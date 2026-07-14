export type AnswerValue = string | string[];

export type Answers = Record<string, AnswerValue>;

export type QuestionOption = {
  id: string;
  label: string;
  description?: string;
};

export type QuestionDef = {
  id: string;
  section: string;
  prompt: string;
  description?: string;
  type: "single" | "multi";
  options: QuestionOption[];
  maxSelect?: number;
  /** Include this question when the predicate returns true (default: always). */
  showIf?: (answers: Answers) => boolean;
};

const has = (answers: Answers, key: string, value: string): boolean => {
  const v = answers[key];
  if (Array.isArray(v)) return v.includes(value);
  return v === value;
};

/** Accumulated research focus areas (supports more than two). */
export function getResearchInterests(answers: Answers): string[] {
  const raw = answers.research_interests;
  if (Array.isArray(raw)) {
    return raw.filter((id) => typeof id === "string");
  }
  return [];
}

export function hasInterest(answers: Answers, goalId: string): boolean {
  return getResearchInterests(answers).includes(goalId);
}

export const GOAL_OPTIONS: QuestionOption[] = [
  {
    id: "recovery",
    label: "Tissue recovery & injury models",
    description: "Tendon, muscle, joint, soft-tissue research focus",
  },
  {
    id: "fat_loss",
    label: "Metabolic / fat-loss research",
    description: "Appetite, body composition, insulin sensitivity pathways",
  },
  {
    id: "muscle_gh",
    label: "Growth hormone / lean-mass axis",
    description: "GHRH and secretagogue pathway research",
  },
  {
    id: "cognition",
    label: "Cognition & neurological research",
    description: "Focus, memory, neurotrophic models",
  },
  {
    id: "sleep",
    label: "Sleep & recovery quality",
    description: "Sleep architecture and circadian-related models",
  },
  {
    id: "skin_aging",
    label: "Skin, collagen & cellular ageing",
    description: "ECM, copper-peptide, and ageing-pathway research",
  },
  {
    id: "libido",
    label: "Melanocortin / libido research",
    description: "Desire, erectile, and pigmentation pathway interest",
  },
  {
    id: "gut",
    label: "Gut barrier & GI models",
    description: "Mucosal protection and GI recovery research",
  },
];

/**
 * Ordered question bank. The engine shows the first unanswered question
 * whose showIf (if any) passes — this is the adaptive branching mechanism.
 */
export const stackFinderQuestions: QuestionDef[] = [
  {
    id: "ack",
    section: "Before you begin",
    prompt: "This tool is for research and educational exploration only. Do you understand?",
    description:
      "Recommendations are not medical advice, dosing guidance, or an invitation for personal use. Catalogue materials are for laboratory research only and are not for human consumption.",
    type: "single",
    options: [
      {
        id: "accept",
        label: "I understand — continue",
        description: "Research / educational framing only",
      },
    ],
  },
  {
    id: "interest_select",
    section: "Goals",
    prompt: "What research interest do you want to explore?",
    description:
      "You can add as many focus areas as you need. After each one we’ll ask if you have another.",
    type: "single",
    options: GOAL_OPTIONS,
    showIf: (a) => getResearchInterests(a).length < GOAL_OPTIONS.length,
  },

  // —— Goal branches (shown for every selected interest) ——
  {
    id: "recovery_tissue",
    section: "Recovery focus",
    prompt: "Which tissue or model is the main focus?",
    type: "single",
    showIf: (a) => hasInterest(a, "recovery"),
    options: [
      { id: "tendon_ligament", label: "Tendon / ligament" },
      { id: "muscle", label: "Muscle strain / soft tissue" },
      { id: "joint", label: "Joint / connective tissue" },
      { id: "gut_overlap", label: "Gut-linked recovery" },
      { id: "general_soft_tissue", label: "General soft-tissue healing models" },
      { id: "post_procedure_model", label: "Post-procedure / wound models" },
    ],
  },
  {
    id: "recovery_timeline",
    section: "Recovery focus",
    prompt: "How would you describe the timeline of the research model?",
    type: "single",
    showIf: (a) => hasInterest(a, "recovery"),
    options: [
      { id: "acute_recent", label: "Acute / recent onset" },
      { id: "subacute", label: "Subacute (weeks)" },
      { id: "chronic_stubborn", label: "Chronic / stubborn" },
    ],
  },
  {
    id: "fat_loss_focus",
    section: "Metabolic focus",
    prompt: "Which metabolic research angle matters most?",
    type: "single",
    showIf: (a) => hasInterest(a, "fat_loss"),
    options: [
      { id: "appetite_weight", label: "Appetite & overall weight pathways" },
      { id: "visceral_central", label: "Central / visceral adiposity" },
      { id: "insulin_sensitivity", label: "Insulin sensitivity / glucose handling" },
      { id: "recomposition", label: "Recomposition (fat ↓ / lean ↑ models)" },
    ],
  },
  {
    id: "fat_loss_context",
    section: "Metabolic focus",
    prompt: "What is the current context for metabolic research?",
    type: "single",
    showIf: (a) => hasInterest(a, "fat_loss"),
    options: [
      {
        id: "already_on_incretin",
        label: "Already studying / using an incretin agonist clinically elsewhere",
      },
      { id: "never_tried_metabolic", label: "New to metabolic peptide research" },
      { id: "lab_assay_focus", label: "Primarily lab / assay development focus" },
    ],
  },
  {
    id: "gh_focus",
    section: "GH-axis focus",
    prompt: "What is the main GH-axis research priority?",
    type: "single",
    showIf: (a) => hasInterest(a, "muscle_gh"),
    options: [
      { id: "lean_mass", label: "Lean-mass / body-composition models" },
      { id: "recovery_between_sessions", label: "Training recovery between sessions" },
      { id: "sleep_gh_pulse", label: "Sleep-linked GH pulse research" },
      { id: "body_comp_age", label: "Age-related GH decline models" },
    ],
  },
  {
    id: "gh_style",
    section: "GH-axis focus",
    prompt: "Preferred GH release profile for the research design?",
    type: "single",
    showIf: (a) => hasInterest(a, "muscle_gh"),
    options: [
      {
        id: "prefer_pulsatile",
        label: "Pulsatile / short-acting (e.g. Mod GRF + secretagogue style)",
      },
      {
        id: "prefer_sustained",
        label: "More sustained elevation (e.g. DAC-style analogues)",
      },
      { id: "unsure", label: "Not sure — recommend based on goals" },
    ],
  },
  {
    id: "cognition_focus",
    section: "Cognitive focus",
    prompt: "Which cognitive / neurological angle is primary?",
    type: "single",
    showIf: (a) => hasInterest(a, "cognition"),
    options: [
      { id: "focus_attention", label: "Focus & attention" },
      { id: "memory_learning", label: "Memory & learning" },
      { id: "stress_resilience", label: "Stress resilience" },
      { id: "neuroprotection_model", label: "Neuroprotection models" },
    ],
  },
  {
    id: "sleep_issue",
    section: "Sleep focus",
    prompt: "What sleep problem is the research model targeting?",
    type: "single",
    showIf: (a) => hasInterest(a, "sleep"),
    options: [
      { id: "latency", label: "Difficulty falling asleep" },
      { id: "fragmented", label: "Fragmented / interrupted sleep" },
      { id: "non_restorative", label: "Non-restorative sleep" },
      { id: "stress_linked", label: "Stress-linked sleep disruption" },
      { id: "circadian", label: "Circadian / rhythm disruption" },
    ],
  },
  {
    id: "skin_focus",
    section: "Skin & ageing focus",
    prompt: "Which skin / ageing research angle is primary?",
    type: "single",
    showIf: (a) => hasInterest(a, "skin_aging"),
    options: [
      { id: "collagen_wrinkles", label: "Collagen / wrinkle / photoageing models" },
      { id: "hair_scalp", label: "Hair / scalp models" },
      { id: "wound_scar_model", label: "Wound / scar remodelling" },
      { id: "cellular_ageing", label: "Cellular ageing / telomere-pineal models" },
    ],
  },
  {
    id: "libido_focus",
    section: "Melanocortin focus",
    prompt: "Which melanocortin research angle is primary?",
    type: "single",
    showIf: (a) => hasInterest(a, "libido"),
    options: [
      { id: "desire", label: "Sexual desire pathways" },
      { id: "erectile_model", label: "Erectile function models" },
      {
        id: "pigmentation_also_interested",
        label: "Also interested in pigmentation pathways",
      },
      {
        id: "melanocortin_research_only",
        label: "Pure receptor / pathway research (no cosmetic intent)",
      },
    ],
  },
  {
    id: "gut_focus",
    section: "Gut focus",
    prompt: "Which gut research angle is primary?",
    type: "single",
    showIf: (a) => hasInterest(a, "gut"),
    options: [
      { id: "mucosal_barrier", label: "Mucosal barrier protection" },
      { id: "post_irritation_model", label: "Post-irritation / healing models" },
      {
        id: "paired_with_injury_recovery",
        label: "Paired with systemic soft-tissue recovery",
      },
    ],
  },

  // —— Loop until user says no more interests ——
  {
    id: "more_interests",
    section: "Goals",
    prompt: "Do you have any other areas of interest?",
    description:
      "Say yes to add another research focus. Only choose no when you’ve covered every area you want to explore.",
    type: "single",
    showIf: (a) => {
      const interests = getResearchInterests(a);
      return interests.length > 0 && interests.length < GOAL_OPTIONS.length;
    },
    options: [
      {
        id: "yes",
        label: "Yes — add another focus area",
        description: "We’ll ask which area next, then deepen that path",
      },
      {
        id: "no",
        label: "No — I’m done adding focus areas",
        description: "Continue to profile and preference questions",
      },
    ],
  },

  // —— Shared trunk resumes ——
  {
    id: "age_range",
    section: "Profile",
    prompt: "Age range?",
    type: "single",
    options: [
      { id: "18_29", label: "18–29" },
      { id: "30_39", label: "30–39" },
      { id: "40_49", label: "40–49" },
      { id: "50_59", label: "50–59" },
      { id: "60_plus", label: "60+" },
    ],
  },
  {
    id: "biological_sex",
    section: "Profile",
    prompt: "Biological sex?",
    description: "Used only for pathway-relevant educational context (e.g. endocrine notes).",
    type: "single",
    options: [
      { id: "female", label: "Female" },
      { id: "male", label: "Male" },
      { id: "prefer_not", label: "Prefer not to say" },
    ],
  },
  {
    id: "lifestyle",
    section: "Lifestyle",
    prompt: "Typical activity / training level?",
    type: "single",
    options: [
      { id: "sedentary", label: "Mostly sedentary" },
      { id: "lightly_active", label: "Lightly active" },
      { id: "train_regularly", label: "Train regularly" },
      { id: "high_performance", label: "High-performance / high volume" },
    ],
  },
  {
    id: "sleep_quality",
    section: "Lifestyle",
    prompt: "How is sleep quality lately?",
    type: "single",
    showIf: (a) => !hasInterest(a, "sleep"),
    options: [
      { id: "poor", label: "Poor" },
      { id: "fair", label: "Fair" },
      { id: "good", label: "Good" },
      { id: "excellent", label: "Excellent" },
    ],
  },
  {
    id: "health_flags",
    section: "Health screen",
    prompt: "Select any that apply (research caution screening).",
    description:
      "These answers do not diagnose anything. They help the tool surface cautions or withhold certain educational suggestions.",
    type: "multi",
    maxSelect: 8,
    options: [
      { id: "none", label: "None of these" },
      {
        id: "pregnancy",
        label: "Pregnant, trying to conceive, or breastfeeding",
      },
      {
        id: "cancer_history",
        label: "Active cancer or significant cancer history",
      },
      {
        id: "thyroid_men2",
        label: "Personal/family medullary thyroid cancer or MEN2",
      },
      { id: "cardiovascular", label: "Significant cardiovascular disease" },
      { id: "diabetes_t2", label: "Type 2 diabetes or prediabetes" },
      {
        id: "psychiatric",
        label: "Significant psychiatric condition or seizure history",
      },
      {
        id: "melanoma_nevi",
        label: "Melanoma history or many atypical moles",
      },
      { id: "other_chronic", label: "Other significant chronic condition" },
    ],
  },
  {
    id: "medications",
    section: "Health screen",
    prompt: "Any relevant medication categories?",
    type: "multi",
    maxSelect: 6,
    showIf: (a) => {
      const flags = a.health_flags;
      const flagHit =
        Array.isArray(flags) &&
        flags.some((f) =>
          ["diabetes_t2", "thyroid_men2", "psychiatric", "cardiovascular"].includes(f),
        );
      const goalHit =
        hasInterest(a, "fat_loss") || hasInterest(a, "muscle_gh");
      return flagHit || goalHit;
    },
    options: [
      { id: "none", label: "None of these" },
      {
        id: "insulin_secretagogue",
        label: "Insulin or sulfonylurea / insulin secretagogue",
      },
      { id: "glp1_current", label: "Currently on a GLP-1 / dual agonist medication" },
      { id: "thyroid_meds", label: "Thyroid medication" },
      { id: "ssri_snri", label: "SSRI / SNRI or other psychiatric medication" },
      { id: "blood_thinners", label: "Blood thinners / anticoagulants" },
      { id: "other_rx", label: "Other prescription medications" },
    ],
  },
  {
    id: "experience",
    section: "Preferences",
    prompt: "Prior familiarity with research peptides?",
    type: "single",
    options: [
      { id: "none", label: "New to the topic" },
      { id: "researched_only", label: "Read literature / forums only" },
      { id: "prior_research_use", label: "Some prior research-material experience" },
      { id: "advanced", label: "Advanced / designing multi-compound protocols" },
    ],
  },
  {
    id: "delivery_pref",
    section: "Preferences",
    prompt: "Administration preference for research materials?",
    description:
      "Most catalogue items are lyophilised powders intended for laboratory reconstitution. This preference shapes educational suggestions only.",
    type: "single",
    options: [
      { id: "injectable_ok", label: "Injectable research formats are fine" },
      {
        id: "prefer_non_injectable",
        label: "Prefer discussing non-injectable options where possible",
      },
      { id: "no_preference", label: "No preference" },
    ],
  },
  {
    id: "risk_tolerance",
    section: "Preferences",
    prompt: "How exploratory should the educational stack be?",
    type: "single",
    options: [
      {
        id: "conservative",
        label: "Conservative — fewer compounds, stronger evidence emphasis",
      },
      {
        id: "balanced",
        label: "Balanced — practical research stack with clear synergies",
      },
      {
        id: "exploratory",
        label: "Exploratory — broader stack ideas with explicit caveats",
      },
    ],
  },
];

export const CATALOGUE_PEPTIDES = [
  {
    slug: "bpc-157-10mg",
    name: "BPC-157",
    goals: ["recovery", "gut"],
  },
  {
    slug: "tb-500-10mg",
    name: "TB-500",
    goals: ["recovery"],
  },
  {
    slug: "cjc-1295-dac-5mg",
    name: "CJC-1295 with DAC",
    goals: ["muscle_gh"],
  },
  {
    slug: "cjc-1295-no-dac-10mg",
    name: "CJC-1295 without DAC",
    goals: ["muscle_gh"],
  },
  {
    slug: "ipamorelin-10mg",
    name: "Ipamorelin",
    goals: ["muscle_gh"],
  },
  {
    slug: "sermorelin-10mg",
    name: "Sermorelin",
    goals: ["muscle_gh"],
  },
  {
    slug: "tesamorelin-10mg",
    name: "Tesamorelin",
    goals: ["muscle_gh", "fat_loss"],
  },
  {
    slug: "tirzepatide-10mg",
    name: "Tirzepatide",
    goals: ["fat_loss"],
  },
  {
    slug: "retatrutide-10mg",
    name: "Retatrutide",
    goals: ["fat_loss"],
  },
  {
    slug: "mots-c-10mg",
    name: "MOTS-c",
    goals: ["fat_loss", "muscle_gh"],
  },
  {
    slug: "semax-11mg",
    name: "Semax",
    goals: ["cognition"],
  },
  {
    slug: "dsip-5mg",
    name: "DSIP",
    goals: ["sleep"],
  },
  {
    slug: "epitalon-10mg",
    name: "Epitalon",
    goals: ["skin_aging", "sleep"],
  },
  {
    slug: "ghk-cu-100mg",
    name: "GHK-Cu",
    goals: ["skin_aging", "recovery"],
  },
  {
    slug: "melanotan-ii-10mg",
    name: "Melanotan II",
    goals: ["libido"],
  },
  {
    slug: "hcg-5000iu",
    name: "HCG",
    goals: ["muscle_gh"],
  },
  {
    slug: "bacteriostatic-water-10ml",
    name: "Bacteriostatic Water",
    goals: ["recovery", "fat_loss", "muscle_gh", "cognition", "sleep", "skin_aging", "libido", "gut"],
  },
] as const;

export function isHardStop(answers: Answers): boolean {
  return has(answers, "health_flags", "pregnancy");
}

export function cautionFlags(answers: Answers): string[] {
  const flags: string[] = [];
  const health = answers.health_flags;
  if (!Array.isArray(health)) return flags;
  for (const id of health) {
    if (id === "none") continue;
    flags.push(id);
  }
  const meds = answers.medications;
  if (Array.isArray(meds)) {
    for (const id of meds) {
      if (id === "none") continue;
      flags.push(`med:${id}`);
    }
  }
  return flags;
}

export function labelForAnswer(questionId: string, value: string): string {
  const q = stackFinderQuestions.find((item) => item.id === questionId);
  const opt = q?.options.find((o) => o.id === value);
  return opt?.label ?? value;
}

export function formatAnswersForPrompt(answers: Answers): string {
  const lines: string[] = [];
  const interests = getResearchInterests(answers);
  if (interests.length > 0) {
    lines.push(
      `- research_interests: ${interests
        .map((id) => GOAL_OPTIONS.find((o) => o.id === id)?.label ?? id)
        .join("; ")}`,
    );
  }
  for (const q of stackFinderQuestions) {
    if (q.id === "interest_select" || q.id === "more_interests") {
      // Covered by research_interests / loop; still include more_interests outcome
      if (q.id === "more_interests" && answers.more_interests !== undefined) {
        lines.push(
          `- more_interests: ${labelForAnswer("more_interests", String(answers.more_interests))}`,
        );
      }
      continue;
    }
    const raw = answers[q.id];
    if (raw === undefined) continue;
    if (Array.isArray(raw)) {
      lines.push(
        `- ${q.id}: ${raw.map((v) => labelForAnswer(q.id, v)).join("; ")}`,
      );
    } else {
      lines.push(`- ${q.id}: ${labelForAnswer(q.id, raw)}`);
    }
  }
  return lines.join("\n");
}
