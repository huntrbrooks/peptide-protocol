import { describe, expect, it } from "vitest";
import {
  collectIssues,
  hasErrors,
  validateDoseVsVial,
  validateDrawVsSyringe,
  validatePositive,
  validateSubUnitDraw,
} from "./validation";

describe("validation", () => {
  it("flags zero/negative inputs", () => {
    expect(validatePositive("waterMl", 1)).toBeNull();
    expect(validatePositive("waterMl", 0)?.code).toBe("zero_or_negative");
    expect(validatePositive("waterMl", -2)?.code).toBe("zero_or_negative");
  });

  it("flags draw exceeding syringe capacity", () => {
    expect(validateDrawVsSyringe(0.4, 0.5)).toBeNull();
    const issue = validateDrawVsSyringe(0.6, 0.5);
    expect(issue?.code).toBe("draw_exceeds_syringe");
    expect(issue?.severity).toBe("error");
  });

  it("flags dose greater than vial contents", () => {
    expect(validateDoseVsVial(250, 10)).toBeNull();
    expect(validateDoseVsVial(15_000, 10)?.code).toBe("dose_exceeds_vial");
  });

  it("warns on sub-1-unit draws", () => {
    expect(validateSubUnitDraw(1)).toBeNull();
    const issue = validateSubUnitDraw(0.4);
    expect(issue?.code).toBe("sub_unit_draw");
    expect(issue?.severity).toBe("warning");
  });

  it("collects and detects errors", () => {
    const issues = collectIssues(
      validatePositive("a", 0),
      validateSubUnitDraw(0.5),
      null,
    );
    expect(issues).toHaveLength(2);
    expect(hasErrors(issues)).toBe(true);
    expect(hasErrors([validateSubUnitDraw(0.5)!])).toBe(false);
  });
});
