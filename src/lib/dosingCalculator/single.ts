import { mgToMcg, mlToUnits } from "./units";
import type { ValidationIssue } from "./types";
import {
  collectIssues,
  validateDoseVsVial,
  validateDrawVsSyringe,
  validatePositive,
  validateSubUnitDraw,
} from "./validation";

export type SinglePeptideInput = {
  vialMg: number;
  waterMl: number;
  doseMcg: number;
  /** Syringe capacity in mL (U-100 scale). Default 1.0. */
  syringeCapacityMl?: number;
};

export type SinglePeptideResult = {
  concentrationMcgPerMl: number;
  drawMl: number;
  syringeUnits: number;
  aliquotsPerVial: number;
  issues: ValidationIssue[];
};

/**
 * Forward reconstitution math for a single peptide vial.
 *
 * concentration_mcg_per_mL = (vial_mg × 1000) / water_mL
 * draw_mL = dose_mcg / concentration_mcg_per_mL
 * syringe_units = draw_mL × 100
 * aliquots_per_vial = (vial_mg × 1000) / dose_mcg
 */
export function calculateSinglePeptide(
  input: SinglePeptideInput,
): SinglePeptideResult {
  const syringeCapacityMl = input.syringeCapacityMl ?? 1;

  const inputIssues = collectIssues(
    validatePositive("vialMg", input.vialMg),
    validatePositive("waterMl", input.waterMl),
    validatePositive("doseMcg", input.doseMcg),
    validatePositive("syringeCapacityMl", syringeCapacityMl),
    validateDoseVsVial(input.doseMcg, input.vialMg),
  );

  if (inputIssues.some((i) => i.severity === "error")) {
    return {
      concentrationMcgPerMl: Number.NaN,
      drawMl: Number.NaN,
      syringeUnits: Number.NaN,
      aliquotsPerVial: Number.NaN,
      issues: inputIssues,
    };
  }

  const concentrationMcgPerMl = mgToMcg(input.vialMg) / input.waterMl;
  const drawMl = input.doseMcg / concentrationMcgPerMl;
  const syringeUnits = mlToUnits(drawMl);
  const aliquotsPerVial = mgToMcg(input.vialMg) / input.doseMcg;

  const issues = collectIssues(
    ...inputIssues,
    validateDrawVsSyringe(drawMl, syringeCapacityMl),
    validateSubUnitDraw(syringeUnits),
  );

  return {
    concentrationMcgPerMl,
    drawMl,
    syringeUnits,
    aliquotsPerVial,
    issues,
  };
}
