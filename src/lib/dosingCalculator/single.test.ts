import { describe, expect, it } from "vitest";
import { calculateSinglePeptide } from "./single";

describe("calculateSinglePeptide", () => {
  it("matches forward reconstitution formulas", () => {
    // 10 mg in 2 mL → 5000 mcg/mL; 250 mcg dose → 0.05 mL = 5 units; 40 aliquots
    const result = calculateSinglePeptide({
      vialMg: 10,
      waterMl: 2,
      doseMcg: 250,
    });

    expect(result.concentrationMcgPerMl).toBe(5000);
    expect(result.drawMl).toBe(0.05);
    expect(result.syringeUnits).toBe(5);
    expect(result.aliquotsPerVial).toBe(40);
    expect(result.issues).toHaveLength(0);
  });

  it("returns errors for invalid inputs", () => {
    const result = calculateSinglePeptide({
      vialMg: 0,
      waterMl: 2,
      doseMcg: 250,
    });
    expect(Number.isNaN(result.drawMl)).toBe(true);
    expect(result.issues.some((i) => i.code === "zero_or_negative")).toBe(true);
  });

  it("flags draw beyond syringe capacity", () => {
    const result = calculateSinglePeptide({
      vialMg: 10,
      waterMl: 1,
      doseMcg: 6000,
      syringeCapacityMl: 0.5,
    });
    // conc = 10000 mcg/mL; draw = 0.6 mL > 0.5
    expect(result.drawMl).toBe(0.6);
    expect(result.issues.some((i) => i.code === "draw_exceeds_syringe")).toBe(
      true,
    );
  });

  it("warns on sub-unit draws", () => {
    const result = calculateSinglePeptide({
      vialMg: 10,
      waterMl: 2,
      doseMcg: 25,
    });
    // draw = 0.005 mL = 0.5 units
    expect(result.syringeUnits).toBe(0.5);
    expect(result.issues.some((i) => i.code === "sub_unit_draw")).toBe(true);
  });
});
