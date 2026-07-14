import type { Metadata } from "next";
import Link from "next/link";
import { StackFinderQuiz } from "@/components/stack-finder/StackFinderQuiz";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: { absolute: "Find Your Ideal Peptide Stack | Peptide Protocol" },
  description:
    "Adaptive research questionnaire that suggests an educational peptide stack from the Peptide Protocol catalogue. Research and educational use only — not medical advice.",
};

export default function StackFinderPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          Research questionnaire
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-ink sm:text-5xl">
          Find your ideal peptide stack
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
          Answer a short adaptive set of questions about research goals, lifestyle context, and
          caution flags. We’ll return an educational stack suggestion grounded in our catalogue —
          with reasoning, synergies, and clear research-only framing.
        </p>
      </header>

      <div className="mt-6 border border-accent/25 bg-sand/50 px-4 py-3 text-sm text-ink">
        <strong className="font-medium">Research & educational purposes only.</strong>{" "}
        {site.researchDisclaimer} This tool does not provide medical advice, dosing, or treatment
        recommendations. See the{" "}
        <Link href="/disclaimer" className="text-accent underline underline-offset-2">
          Research Use Disclaimer
        </Link>
        .
      </div>

      <div className="mt-10">
        <StackFinderQuiz />
      </div>
    </div>
  );
}
