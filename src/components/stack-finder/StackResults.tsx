"use client";

import Link from "next/link";
import type { StackRecommendation } from "@/lib/stackFinder/types";

type Props =
  | {
      hardStop: true;
      title: string;
      message: string;
      disclaimer: string;
      onRestart: () => void;
    }
  | {
      hardStop?: false;
      recommendation: StackRecommendation;
      onRestart: () => void;
      onRetry?: () => void;
    };

export function StackResults(props: Props) {
  if (props.hardStop) {
    return (
      <div className="animate-rise space-y-6">
        <div className="border border-accent/30 bg-sand/50 px-5 py-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Safety boundary
          </p>
          <h2 className="mt-2 font-display text-3xl text-ink">{props.title}</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">{props.message}</p>
        </div>
        <DisclaimerBox text={props.disclaimer} />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={props.onRestart}
            className="btn-primary rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent"
          >
            Start over
          </button>
          <Link
            href="/shop"
            className="rounded-sm border border-line px-5 py-3 text-sm text-ink transition hover:border-accent hover:text-accent"
          >
            Browse catalogue
          </Link>
        </div>
      </div>
    );
  }

  const { recommendation } = props;

  return (
    <div className="animate-rise space-y-10">
      <DisclaimerBox text={recommendation.disclaimer} prominent />

      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          Educational research stack
        </p>
        <h2 className="mt-2 font-display text-3xl tracking-tight text-ink sm:text-4xl">
          {recommendation.stackName}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
          {recommendation.summary}
        </p>
      </header>

      <section className="space-y-4">
        <h3 className="font-display text-2xl text-ink">Suggested compounds</h3>
        <div className="grid gap-4">
          {recommendation.peptides.map((peptide) => (
            <article
              key={`${peptide.name}-${peptide.slug ?? "x"}`}
              className="border border-line bg-paper/80 p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h4 className="font-display text-xl text-ink">{peptide.name}</h4>
                {peptide.slug ? (
                  <Link
                    href={`/products/${peptide.slug}`}
                    className="text-sm text-accent underline-offset-2 hover:underline"
                  >
                    View product
                  </Link>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{peptide.why}</p>
              {peptide.considerations.length > 0 ? (
                <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-ink/80">
                  {peptide.considerations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {peptide.synergyNotes ? (
                <p className="mt-4 border-t border-line pt-3 text-sm text-muted">
                  <span className="font-medium text-ink">Synergy: </span>
                  {peptide.synergyNotes}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {recommendation.synergies.length > 0 ? (
        <section>
          <h3 className="font-display text-2xl text-ink">Stack synergies</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted">
            {recommendation.synergies.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {recommendation.cautions.length > 0 ? (
        <section className="border border-accent/25 bg-sand/40 px-5 py-5">
          <h3 className="font-display text-2xl text-ink">Cautions from your answers</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink/85">
            {recommendation.cautions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {recommendation.withheld.length > 0 ? (
        <section>
          <h3 className="font-display text-2xl text-ink">Intentionally withheld</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted">
            {recommendation.withheld.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {recommendation.nextSteps.length > 0 ? (
        <section>
          <h3 className="font-display text-2xl text-ink">Suggested next steps</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted">
            {recommendation.nextSteps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-line pt-8">
        <button
          type="button"
          onClick={props.onRestart}
          className="btn-primary rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent"
        >
          Retake questionnaire
        </button>
        {props.onRetry ? (
          <button
            type="button"
            onClick={props.onRetry}
            className="rounded-sm border border-line px-5 py-3 text-sm text-ink transition hover:border-accent hover:text-accent"
          >
            Regenerate
          </button>
        ) : null}
        <Link
          href="/shop"
          className="rounded-sm border border-line px-5 py-3 text-sm text-ink transition hover:border-accent hover:text-accent"
        >
          Browse catalogue
        </Link>
      </div>
    </div>
  );
}

function DisclaimerBox({
  text,
  prominent = false,
}: {
  text: string;
  prominent?: boolean;
}) {
  return (
    <div
      className={
        prominent
          ? "border-2 border-accent/40 bg-sand/70 px-5 py-4"
          : "border border-line bg-mist/40 px-5 py-4"
      }
    >
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
        Research & educational disclaimer
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink">{text}</p>
      <p className="mt-2 text-sm text-muted">
        Not medical advice. Not for human consumption. See the{" "}
        <Link href="/disclaimer" className="text-accent underline underline-offset-2">
          Research Use Disclaimer
        </Link>
        .
      </p>
    </div>
  );
}
