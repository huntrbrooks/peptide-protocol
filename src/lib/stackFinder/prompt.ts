import {
  CATALOGUE_PEPTIDES,
  cautionFlags,
  formatAnswersForPrompt,
  type Answers,
} from "@/content/stackFinder";
import type { StackRecommendation } from "./types";

export const STACK_RESULT_SCHEMA_HINT = `{
  "summary": "2-4 sentence overview tied to their answers",
  "stackName": "short evocative name for the educational stack",
  "peptides": [
    {
      "name": "Peptide name",
      "slug": "catalogue-slug-or-null",
      "why": "Why this fits THEIR answers specifically",
      "considerations": ["key research consideration 1", "consideration 2"],
      "synergyNotes": "optional note on pairing"
    }
  ],
  "synergies": ["how compounds in the stack relate"],
  "cautions": ["flags from their health/medication answers"],
  "withheld": ["compounds avoided and why"],
  "nextSteps": ["educational next steps, e.g. read product pages, request COA"],
  "disclaimer": "research/educational only disclaimer"
}`;

export function buildStackPrompt(answers: Answers): {
  system: string;
  user: string;
} {
  const flags = cautionFlags(answers);
  const catalogue = CATALOGUE_PEPTIDES.map(
    (p) => `- ${p.name} (${p.slug}) — typical goals: ${p.goals.join(", ")}`,
  ).join("\n");

  const system = `You are an educational research assistant for Peptide Protocol (Australia), a supplier of research-grade peptides for laboratory use only.

Your job: propose a personalized EDUCATIONAL research peptide stack based on questionnaire answers.

Hard rules:
1. This is NOT medical advice, dosing guidance, or encouragement for human use.
2. Prefer catalogue compounds listed below. Use their exact slug when recommending a catalogue item.
3. You may briefly mention out-of-catalogue comparators (e.g. Semaglutide, Melanotan II, Selank) only as educational context — never as primary stack picks.
4. Recommend 2–5 peptides from the catalogue. Cover as many of their listed research_interests as practical; if they named several focus areas, build a multi-goal stack rather than ignoring secondary interests. For cognition-only interests with no direct catalogue match, say so in summary/withheld and suggest related catalogue pathways if any (do not invent catalogue SKUs).
5. Tie every recommendation explicitly to the user's answers and listed research_interests.
6. Respect caution flags:
   - cancer_history: withhold BPC-157, TB-500, and GH secretagogues (CJC-1295 without DAC, Ipamorelin); explain why in "withheld".
   - thyroid_men2: withhold or strongly caution Retatrutide.
   - melanoma_nevi: withhold or strongly caution PT-141 (melanocortin class).
   - med:glp1_current: do not stack additional incretin agonists (Retatrutide).
   - psychiatric / med:ssri_snri: caution CNS-acting melanocortin discussion (PT-141).
   - diabetes_t2 / med:insulin_secretagogue: caution metabolic agonists regarding hypoglycemia discussion in research context.
7. If delivery_pref prefers non-injectable, note that catalogue items are lyophilised injectable research materials.
8. Match risk_tolerance: conservative = fewer, better-evidenced picks; exploratory = broader with caveats.
9. Return ONLY valid JSON matching the schema. No markdown fences. No prose outside JSON.

Catalogue:
${catalogue}`;

  const user = `Questionnaire answers:
${formatAnswersForPrompt(answers)}

Active caution flags: ${flags.length ? flags.join(", ") : "none"}

Return JSON only in this shape:
${STACK_RESULT_SCHEMA_HINT}`;

  return { system, user };
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      return JSON.parse(fenced[1].trim());
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Model response was not valid JSON");
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function parseStackRecommendation(raw: unknown): StackRecommendation {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid recommendation payload");
  }
  const data = raw as Record<string, unknown>;
  const peptidesRaw = Array.isArray(data.peptides) ? data.peptides : [];
  const peptides = peptidesRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const p = item as Record<string, unknown>;
      if (typeof p.name !== "string" || typeof p.why !== "string") return null;
      return {
        name: p.name,
        slug: typeof p.slug === "string" ? p.slug : null,
        why: p.why,
        considerations: asStringArray(p.considerations),
        synergyNotes:
          typeof p.synergyNotes === "string" ? p.synergyNotes : undefined,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  if (peptides.length === 0) {
    throw new Error("Recommendation contained no peptides");
  }

  return {
    summary:
      typeof data.summary === "string"
        ? data.summary
        : "Educational stack suggestion based on your questionnaire answers.",
    stackName:
      typeof data.stackName === "string" ? data.stackName : "Suggested research stack",
    peptides,
    synergies: asStringArray(data.synergies),
    cautions: asStringArray(data.cautions),
    withheld: asStringArray(data.withheld),
    nextSteps: asStringArray(data.nextSteps),
    disclaimer:
      typeof data.disclaimer === "string"
        ? data.disclaimer
        : "For research and educational purposes only. Not medical advice. Not for human consumption.",
  };
}
