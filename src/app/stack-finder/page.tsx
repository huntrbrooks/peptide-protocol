import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { site } from "@/content/site";
import { publicPageMetadata } from "@/lib/seo/metadata";

const StackFinderQuiz = dynamic(
  () =>
    import("@/components/stack-finder/StackFinderQuiz").then(
      (mod) => mod.StackFinderQuiz,
    ),
  {
    loading: () => (
      <div className="border border-line bg-paper p-6 text-sm text-muted">
        Loading Stack Finder…
      </div>
    ),
  },
);

export const metadata: Metadata = publicPageMetadata({
  title: "Find Your Ideal Peptide Stack | The Protocol",
  description:
    "Adaptive research questionnaire that suggests an educational peptide stack from the The Protocol catalogue. Research and educational use only — not medical advice.",
  path: "/stack-finder",
});

export default function StackFinderPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          Research questionnaire
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-ink sm:text-5xl">
          Find a research stack
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
          Short adaptive questions on research goals and caution flags. Returns an educational
          catalogue suggestion — not medical advice.
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
