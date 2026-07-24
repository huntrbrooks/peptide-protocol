import { mgToMcg, mlToUnits } from "./units";
import type { ValidationIssue } from "./types";
import {
  collectIssues,
  validateDoseVsVial,
  validateDrawVsSyringe,
  validatePositive,
  validateSubUnitDraw,
} from "./validation";

export type BlendComponent = {
  id: string;
  label?: string;
  massMg: number;
};

export type BlendInput = {
  waterMl: number;
  components: BlendComponent[];
  /** Component whose dose drives the shared draw volume. */
  anchorComponentId: string;
  anchorDoseMcg: number;
  /** Syringe capacity in mL (U-100 scale). Default 1.0. */
  syringeCapacityMl?: number;
};

export type BlendComponentResult = {
  id: string;
  label?: string;
  massMg: number;
  concentrationMcgPerMl: number;
  deliveredMcg: number;
  isAnchor: boolean;
};

export type BlendResult = {
  drawMl: number;
  syringeUnits: number;
  components: BlendComponentResult[];
  issues: ValidationIssue[];
};

/**
 * Blend reconstitution with shared water and one draw volume.
 *
 * For each component: conc_i = (mass_i_mg × 1000) / water_mL
 * Anchor dose → draw_mL → other components delivered in the same volume.
 */
export function calculateBlend(input: BlendInput): BlendResult {
  const syringeCapacityMl = input.syringeCapacityMl ?? 1;
  const issues: ValidationIssue[] = collectIssues(
    validatePositive("waterMl", input.waterMl),
    validatePositive("anchorDoseMcg", input.anchorDoseMcg),
    validatePositive("syringeCapacityMl", syringeCapacityMl),
  );

  if (!input.components.length) {
    issues.push({
      code: "empty_components",
      severity: "error",
      field: "components",
      message: "At least one blend component is required",
    });
  }

  for (const component of input.components) {
    const field = `components[${component.id}].massMg`;
    const issue = validatePositive(field, component.massMg);
    if (issue) issues.push(issue);
  }

  const anchor = input.components.find((c) => c.id === input.anchorComponentId);
  if (!anchor) {
    issues.push({
      code: "missing_anchor",
      severity: "error",
      field: "anchorComponentId",
      message: "Anchor component was not found in the blend",
    });
  } else {
    const doseIssue = validateDoseVsVial(input.anchorDoseMcg, anchor.massMg);
    if (doseIssue) issues.push(doseIssue);
  }

  if (issues.some((i) => i.severity === "error") || !anchor) {
    return {
      drawMl: Number.NaN,
      syringeUnits: Number.NaN,
      components: [],
      issues,
    };
  }

  const componentResults: BlendComponentResult[] = input.components.map(
    (component) => {
      const concentrationMcgPerMl = mgToMcg(component.massMg) / input.waterMl;
      return {
        id: component.id,
        label: component.label,
        massMg: component.massMg,
        concentrationMcgPerMl,
        deliveredMcg: 0,
        isAnchor: component.id === input.anchorComponentId,
      };
    },
  );

  const anchorResult = componentResults.find((c) => c.isAnchor);
  if (!anchorResult || anchorResult.concentrationMcgPerMl <= 0) {
    issues.push({
      code: "zero_or_negative",
      severity: "error",
      field: "anchorComponentId",
      message: "Anchor concentration must be positive",
    });
    return {
      drawMl: Number.NaN,
      syringeUnits: Number.NaN,
      components: componentResults,
      issues,
    };
  }

  const drawMl = input.anchorDoseMcg / anchorResult.concentrationMcgPerMl;
  const syringeUnits = mlToUnits(drawMl);

  for (const component of componentResults) {
    component.deliveredMcg = component.concentrationMcgPerMl * drawMl;
  }

  issues.push(
    ...collectIssues(
      validateDrawVsSyringe(drawMl, syringeCapacityMl),
      validateSubUnitDraw(syringeUnits),
    ),
  );

  return {
    drawMl,
    syringeUnits,
    components: componentResults,
    issues,
  };
}
