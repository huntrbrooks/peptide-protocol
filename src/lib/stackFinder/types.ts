export type RecommendedPeptide = {
  name: string;
  slug: string | null;
  why: string;
  considerations: string[];
  synergyNotes?: string;
};

export type StackRecommendation = {
  summary: string;
  stackName: string;
  peptides: RecommendedPeptide[];
  synergies: string[];
  cautions: string[];
  withheld: string[];
  nextSteps: string[];
  disclaimer: string;
};

export type StackRecommendationResponse =
  | { ok: true; recommendation: StackRecommendation; hardStop?: false }
  | {
      ok: true;
      hardStop: true;
      title: string;
      message: string;
      disclaimer: string;
    }
  | { ok: false; error: string };
