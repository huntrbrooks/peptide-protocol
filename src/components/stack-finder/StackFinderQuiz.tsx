"use client";

import { useMemo, useState } from "react";
import type { Answers } from "@/content/stackFinder";
import {
  getCurrentQuestion,
  getProgress,
  getVisibleQuestions,
  isComplete,
  normalizeMultiSelect,
  optionsForQuestion,
} from "@/lib/stackFinder/engine";
import type {
  StackRecommendation,
  StackRecommendationResponse,
} from "@/lib/stackFinder/types";
import { StackResults } from "./StackResults";

type Phase = "quiz" | "loading" | "results" | "error";

type HardStopResult = {
  hardStop: true;
  title: string;
  message: string;
  disclaimer: string;
};

function rebuildCommittedState(
  answersWithCommit: Answers,
  committedId: string,
): { answers: Answers; history: string[] } {
  const visible = getVisibleQuestions(answersWithCommit);
  const commitIdx = visible.findIndex((q) => q.id === committedId);
  const prefix = commitIdx >= 0 ? visible.slice(0, commitIdx + 1) : visible;

  const nextAnswers: Answers = {};
  const nextHistory: string[] = [];
  for (const q of prefix) {
    if (answersWithCommit[q.id] !== undefined) {
      nextAnswers[q.id] = answersWithCommit[q.id];
      nextHistory.push(q.id);
    }
  }
  return { answers: nextAnswers, history: nextHistory };
}

export function StackFinderQuiz() {
  const [answers, setAnswers] = useState<Answers>({});
  const [history, setHistory] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("quiz");
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<StackRecommendation | null>(
    null,
  );
  const [hardStop, setHardStop] = useState<HardStopResult | null>(null);

  const question = useMemo(
    () => getCurrentQuestion(answers, history),
    [answers, history],
  );
  const progress = useMemo(
    () => getProgress(answers, history),
    [answers, history],
  );
  const options = useMemo(
    () => (question ? optionsForQuestion(question, answers) : []),
    [question, answers],
  );

  function restart() {
    setAnswers({});
    setHistory([]);
    setPhase("quiz");
    setError(null);
    setRecommendation(null);
    setHardStop(null);
  }

  function goBack() {
    const prevId = history[history.length - 1];
    if (!prevId) return;
    const without: Answers = { ...answers };
    delete without[prevId];
    // Also drop any answers after prev in the previous path
    const visibleBefore = getVisibleQuestions(without);
    const prevIdx = visibleBefore.findIndex((q) => q.id === prevId);
    // prev was removed from answers; keep only history up to prior questions
    const keepHistory = history.slice(0, -1);
    const nextAnswers: Answers = {};
    for (const id of keepHistory) {
      if (without[id] !== undefined) nextAnswers[id] = without[id];
    }
    // Clear orphaned branch answers not in keepHistory
    void prevIdx;
    setAnswers(nextAnswers);
    setHistory(keepHistory);
    setPhase("quiz");
    setError(null);
  }

  function commitAnswer(questionId: string, value: string | string[]) {
    const merged: Answers = { ...answers, [questionId]: value };
    const rebuilt = rebuildCommittedState(merged, questionId);
    setAnswers(rebuilt.answers);
    setHistory(rebuilt.history);

    if (isComplete(rebuilt.answers, rebuilt.history)) {
      void requestRecommendation(rebuilt.answers);
    }
  }

  function selectSingle(optionId: string) {
    if (!question) return;
    commitAnswer(question.id, optionId);
  }

  function toggleMulti(optionId: string) {
    if (!question || question.type !== "multi") return;
    const current = answers[question.id];
    const next = normalizeMultiSelect(
      Array.isArray(current) ? current : undefined,
      optionId,
      question.maxSelect,
    );
    setAnswers((prev) => ({ ...prev, [question.id]: next }));
  }

  function continueMulti() {
    if (!question || question.type !== "multi") return;
    const value = answers[question.id];
    if (!Array.isArray(value) || value.length === 0) return;
    commitAnswer(question.id, value);
  }

  async function requestRecommendation(payload: Answers) {
    setPhase("loading");
    setError(null);
    setHardStop(null);
    setRecommendation(null);

    try {
      const res = await fetch("/api/stack-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });
      const data = (await res.json()) as StackRecommendationResponse;

      if (!data.ok) {
        setError(data.error);
        setPhase("error");
        return;
      }

      if ("hardStop" in data && data.hardStop) {
        setHardStop({
          hardStop: true,
          title: data.title,
          message: data.message,
          disclaimer: data.disclaimer,
        });
        setPhase("results");
        return;
      }

      if ("recommendation" in data && data.recommendation) {
        setRecommendation(data.recommendation);
        setPhase("results");
        return;
      }

      setError("Unexpected response from recommendation service.");
      setPhase("error");
    } catch {
      setError(
        "Network error while generating your educational stack. Check your connection and try again.",
      );
      setPhase("error");
    }
  }

  if (phase === "loading") {
    return (
      <div className="animate-fade border border-line bg-paper/80 px-6 py-16 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-line border-t-accent" />
        <p className="mt-6 font-display text-2xl text-ink">Building your research stack…</p>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          Matching your answers to catalogue pathways and caution rules. This usually takes a few
          seconds.
        </p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="animate-rise border border-line bg-paper/80 px-6 py-10">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Something went wrong</p>
        <h2 className="mt-2 font-display text-3xl text-ink">Couldn’t generate a stack</h2>
        <p className="mt-4 text-sm text-muted">{error}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void requestRecommendation(answers)}
            className="btn-primary rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={restart}
            className="rounded-sm border border-line px-5 py-3 text-sm text-ink transition hover:border-accent"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  if (phase === "results" && hardStop) {
    return <StackResults {...hardStop} onRestart={restart} />;
  }

  if (phase === "results" && recommendation) {
    return (
      <StackResults
        recommendation={recommendation}
        onRestart={restart}
        onRetry={() => void requestRecommendation(answers)}
      />
    );
  }

  if (!question) {
    return (
      <div className="border border-line bg-paper/80 px-6 py-10">
        <p className="text-sm text-muted">Preparing next question…</p>
      </div>
    );
  }

  const multiValue = Array.isArray(answers[question.id])
    ? (answers[question.id] as string[])
    : [];

  return (
    <div className="animate-rise border border-line bg-paper/80">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.16em] text-muted">
          <span>{question.section}</span>
          <span>
            {progress.current} / {progress.total}
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden bg-mist">
          <div
            className="h-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${Math.max(progress.percent, 4)}%` }}
          />
        </div>
      </div>

      <div className="px-5 py-8 sm:px-6 sm:py-10">
        <h2 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">
          {question.prompt}
        </h2>
        {question.description ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            {question.description}
          </p>
        ) : null}

        <div className="mt-8 grid gap-3">
          {options.map((option) => {
            const selected =
              question.type === "multi"
                ? multiValue.includes(option.id)
                : answers[question.id] === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  question.type === "multi"
                    ? toggleMulti(option.id)
                    : selectSingle(option.id)
                }
                className={`group border px-4 py-4 text-left transition ${
                  selected
                    ? "border-accent bg-sand/70"
                    : "border-line bg-mist/20 hover:border-accent/60 hover:bg-mist/40"
                }`}
              >
                <span className="block text-sm font-medium text-ink sm:text-base">
                  {option.label}
                </span>
                {option.description ? (
                  <span className="mt-1 block text-sm text-muted">{option.description}</span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={history.length === 0}
            className="rounded-sm border border-line px-4 py-2.5 text-sm text-ink transition enabled:hover:border-accent enabled:hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>

          {question.type === "multi" ? (
            <button
              type="button"
              onClick={continueMulti}
              disabled={multiValue.length === 0}
              className="btn-primary rounded-sm bg-ink px-5 py-2.5 text-sm text-paper hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
