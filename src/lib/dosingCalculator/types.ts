export type ValidationSeverity = "error" | "warning";

export type ValidationCode =
  | "zero_or_negative"
  | "draw_exceeds_syringe"
  | "dose_exceeds_vial"
  | "sub_unit_draw"
  | "missing_anchor"
  | "empty_components";

export type ValidationIssue = {
  code: ValidationCode;
  message: string;
  severity: ValidationSeverity;
  field?: string;
};
