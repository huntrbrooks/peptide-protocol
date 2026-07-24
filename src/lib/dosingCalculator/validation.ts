import { mgToMcg } from "./units";
import type { ValidationIssue } from "./types";

export function validatePositive(
  field: string,
  value: number,
): ValidationIssue | null {
  if (!Number.isFinite(value) || value <= 0) {
    return {
      code: "zero_or_negative",
      severity: "error",
      field,
      message: `${field} must be a positive number`,
    };
  }
  return null;
}

export function validateDrawVsSyringe(
  drawMl: number,
  syringeCapacityMl: number,
): ValidationIssue | null {
  if (
    !Number.isFinite(drawMl) ||
    !Number.isFinite(syringeCapacityMl) ||
    syringeCapacityMl <= 0
  ) {
    return null;
  }
  if (drawMl > syringeCapacityMl) {
    return {
      code: "draw_exceeds_syringe",
      severity: "error",
      field: "drawMl",
      message: `Draw volume (${drawMl} mL) exceeds syringe capacity (${syringeCapacityMl} mL)`,
    };
  }
  return null;
}

export function validateDoseVsVial(
  doseMcg: number,
  vialMg: number,
): ValidationIssue | null {
  if (!Number.isFinite(doseMcg) || !Number.isFinite(vialMg) || vialMg <= 0) {
    return null;
  }
  const vialMcg = mgToMcg(vialMg);
  if (doseMcg > vialMcg) {
    return {
      code: "dose_exceeds_vial",
      severity: "error",
      field: "doseMcg",
      message: `Dose (${doseMcg} mcg) exceeds vial contents (${vialMcg} mcg)`,
    };
  }
  return null;
}

/** Warn when draw is below 1 U-100 unit (hard to measure accurately). */
export function validateSubUnitDraw(units: number): ValidationIssue | null {
  if (!Number.isFinite(units) || units <= 0) return null;
  if (units < 1) {
    return {
      code: "sub_unit_draw",
      severity: "warning",
      field: "syringeUnits",
      message: "Draw is under 1 syringe unit and may be hard to measure",
    };
  }
  return null;
}

export function collectIssues(
  ...candidates: Array<ValidationIssue | null | undefined>
): ValidationIssue[] {
  return candidates.filter((issue): issue is ValidationIssue => issue != null);
}

export function hasErrors(issues: ValidationIssue[]): boolean {
  return issues.some((issue) => issue.severity === "error");
}
