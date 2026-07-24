import { describe, expect, it } from "vitest";
import { calculateReverseBac } from "./reverse";
import { calculateSinglePeptide } from "./single";

describe("calculateReverseBac", () => {
  it("solves water_mL from vial, dose, and target units", () => {
    // water = (10 × 1000 × 10) / (250 × 100) = 4 mL
    const result = calculateReverseBac({
      vialMg: 10,
      doseMcg: 250,
      targetUnits: 10,
    });

    expect(result.waterMl).toBe(4);
    expect(result.drawMl).toBe(0.1);
    expect(result.syringeUnits).toBe(10);
    expect(result.concentrationMcgPerMl).toBe(2500);
    expect(result.issues).toHaveLength(0);
  });

  it("round-trips with single-peptide forward math", () => {
    const reverse = calculateReverseBac({
      vialMg: 20,
      doseMcg: 500,
      targetUnits: 20,
    });
    const forward = calculateSinglePeptide({
      vialMg: 20,
      waterMl: reverse.waterMl,
      doseMcg: 500,
    });

    expect(forward.syringeUnits).toBeCloseTo(20);
    expect(forward.drawMl).toBeCloseTo(reverse.drawMl);
  });

  it("rejects non-positive inputs", () => {
    const result = calculateReverseBac({
      vialMg: 10,
      doseMcg: 0,
      targetUnits: 10,
    });
    expect(Number.isNaN(result.waterMl)).toBe(true);
    expect(result.issues.some((i) => i.code === "zero_or_negative")).toBe(true);
  });
});
