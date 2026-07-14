import {
  GOAL_OPTIONS,
  getResearchInterests,
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
  // Approximate remaining room for more interests so the bar doesn’t jump oddly mid-loop
  const interestSlotsLeft = Math.max(
    0,
    GOAL_OPTIONS.length - getResearchInterests(answers).length,
  );
  const loopBonus =
    answers.more_interests === "no" || interestSlotsLeft === 0 ? 0 : 1;
  const total = Math.max(visible.length + loopBonus, 1);
  const current = Math.min(committed + 1, total);
  return {
    current,
    total,
    percent: Math.round((committed / total) * 100),
  };
}

export function isComplete(answers: Answers, history: string[]): boolean {
  if (getCurrentQuestion(answers, history) !== null) return false;
  if (getVisibleQuestions(answers).length === 0) return false;
  const interests = getResearchInterests(answers);
  const doneAdding =
    answers.more_interests === "no" || interests.length >= GOAL_OPTIONS.length;
  return doneAdding && interests.length > 0;
}

/**
 * Rebuild answers/history after committing a question.
 * Preserves prior interest-branch answers when adding another focus area.
 */
export function rebuildCommittedState(
  answersWithCommit: Answers,
  committedId: string,
  previousHistory: string[],
): { answers: Answers; history: string[] } {
  const visible = getVisibleQuestions(answersWithCommit);
  const visibleIds = new Set(visible.map((q) => q.id));

  const nextAnswers: Answers = {};
  if (answersWithCommit.research_interests !== undefined) {
    nextAnswers.research_interests = answersWithCommit.research_interests;
  }

  const keepIds = new Set<string>();
  for (const id of previousHistory) {
    if (visibleIds.has(id)) keepIds.add(id);
  }
  keepIds.add(committedId);

  // Retain answers for still-visible questions that were already committed
  // (needed when re-picking interest_select after “add another”).
  for (const q of visible) {
    if (
      previousHistory.includes(q.id) &&
      q.id !== "more_interests" &&
      answersWithCommit[q.id] !== undefined
    ) {
      keepIds.add(q.id);
    }
  }

  for (const id of keepIds) {
    if (answersWithCommit[id] !== undefined) {
      nextAnswers[id] = answersWithCommit[id];
    }
  }

  const nextHistory = visible
    .map((q) => q.id)
    .filter((id) => keepIds.has(id) && nextAnswers[id] !== undefined);

  return { answers: nextAnswers, history: nextHistory };
}

/** interest_select options exclude already-chosen focus areas. */
export function optionsForQuestion(
  question: QuestionDef,
  answers: Answers,
): QuestionDef["options"] {
  if (question.id !== "interest_select") return question.options;
  const taken = new Set(getResearchInterests(answers));
  return question.options.filter((o) => !taken.has(o.id));
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

/** Labels for the selected research interests (for UI chips). */
export function interestLabels(answers: Answers): string[] {
  const interests = getResearchInterests(answers);
  return interests.map((id) => {
    const opt = GOAL_OPTIONS.find((o) => o.id === id);
    return opt?.label ?? id;
  });
}
