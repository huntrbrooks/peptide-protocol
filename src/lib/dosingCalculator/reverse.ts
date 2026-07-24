import { mgToMcg, mlToUnits, unitsToMl } from "./units";
import type { ValidationIssue } from "./types";
import {
  collectIssues,
  validateDoseVsVial,
  validateDrawVsSyringe,
  validatePositive,
  validateSubUnitDraw,
} from "./validation";

export type ReverseBacInput = {
  vialMg: number;
  doseMcg: number;
  /** Desired U-100 syringe units for the dose. */
  targetUnits: number;
  /** Optional syringe capacity check (mL). */
  syringeCapacityMl?: number;
};

export type ReverseBacResult = {
  waterMl: number;
  concentrationMcgPerMl: number;
  drawMl: number;
  syringeUnits: number;
  issues: ValidationIssue[];
};

/**
 * Solve for BAC water volume given vial mass, dose, and target syringe units.
 *
 * water_mL = (vial_mg × 1000 × target_units) / (dose_mcg × 100)
 */
export function calculateReverseBac(input: ReverseBacInput): ReverseBacResult {
  const syringeCapacityMl = input.syringeCapacityMl;

  const inputIssues = collectIssues(
    validatePositive("vialMg", input.vialMg),
    validatePositive("doseMcg", input.doseMcg),
    validatePositive("targetUnits", input.targetUnits),
    syringeCapacityMl !== undefined
      ? validatePositive("syringeCapacityMl", syringeCapacityMl)
      : null,
    validateDoseVsVial(input.doseMcg, input.vialMg),
  );

  if (inputIssues.some((i) => i.severity === "error")) {
    return {
      waterMl: Number.NaN,
      concentrationMcgPerMl: Number.NaN,
      drawMl: Number.NaN,
      syringeUnits: Number.NaN,
      issues: inputIssues,
    };
  }

  const waterMl =
    (mgToMcg(input.vialMg) * input.targetUnits) / (input.doseMcg * 100);
  const concentrationMcgPerMl = mgToMcg(input.vialMg) / waterMl;
  const drawMl = unitsToMl(input.targetUnits);
  const syringeUnits = mlToUnits(drawMl);

  const issues = collectIssues(
    ...inputIssues,
    syringeCapacityMl !== undefined
      ? validateDrawVsSyringe(drawMl, syringeCapacityMl)
      : null,
    validateSubUnitDraw(syringeUnits),
  );

  return {
    waterMl,
    concentrationMcgPerMl,
    drawMl,
    syringeUnits,
    issues,
  };
}
