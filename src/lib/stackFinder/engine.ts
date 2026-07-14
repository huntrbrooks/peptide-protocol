import {
  type Answers,
  type QuestionDef,
  stackFinderQuestions,
} from "@/content/stackFinder";

export function getVisibleQuestions(answers: Answers): QuestionDef[] {
  return stackFinderQuestions.filter((q) => {
    if (!q.showIf) return true;
    return q.showIf(answers);
  });
}

/** Current question = first visible question not yet committed in history. */
export function getCurrentQuestion(
  answers: Answers,
  history: string[],
): QuestionDef | null {
  const visible = getVisibleQuestions(answers);
  return visible.find((q) => !history.includes(q.id)) ?? null;
}

export function getProgress(
  answers: Answers,
  history: string[],
): {
  current: number;
  total: number;
  percent: number;
} {
  const visible = getVisibleQuestions(answers);
  const committed = visible.filter((q) => history.includes(q.id)).length;
  const total = Math.max(visible.length, 1);
  const current = Math.min(committed + 1, total);
  return {
    current,
    total,
    percent: Math.round((committed / total) * 100),
  };
}

export function isComplete(answers: Answers, history: string[]): boolean {
  return (
    getCurrentQuestion(answers, history) === null &&
    getVisibleQuestions(answers).length > 0
  );
}

/** Drop answers/history entries that are no longer on the active path. */
export function pruneToPath(
  answers: Answers,
  history: string[],
  upToQuestionId?: string,
): { answers: Answers; history: string[] } {
  const visible = getVisibleQuestions(answers);
  const visibleIds = visible.map((q) => q.id);
  let keepIds = visibleIds;

  if (upToQuestionId) {
    const idx = visibleIds.indexOf(upToQuestionId);
    if (idx >= 0) {
      keepIds = visibleIds.slice(0, idx + 1);
    }
  }

  const keepSet = new Set(keepIds);
  const nextAnswers: Answers = {};
  for (const id of keepIds) {
    if (answers[id] !== undefined) {
      nextAnswers[id] = answers[id];
    }
  }

  const nextHistory = history.filter((id) => keepSet.has(id));
  return { answers: nextAnswers, history: nextHistory };
}

/** Options for secondary_goal exclude the primary goal. */
export function optionsForQuestion(
  question: QuestionDef,
  answers: Answers,
): QuestionDef["options"] {
  if (question.id !== "secondary_goal") return question.options;
  const primary = answers.primary_goal;
  if (typeof primary !== "string") return question.options;
  return question.options.filter((o) => o.id === "none" || o.id !== primary);
}

export function normalizeMultiSelect(
  previous: string[] | undefined,
  optionId: string,
  maxSelect = 8,
): string[] {
  const current = previous ? [...previous] : [];

  if (optionId === "none") {
    return ["none"];
  }

  const withoutNone = current.filter((id) => id !== "none");
  if (withoutNone.includes(optionId)) {
    return withoutNone.filter((id) => id !== optionId);
  }

  if (withoutNone.length >= maxSelect) {
    return withoutNone;
  }

  return [...withoutNone, optionId];
}
