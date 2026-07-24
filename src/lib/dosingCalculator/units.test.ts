import { describe, expect, it } from "vitest";
import {
  MCG_PER_MG,
  ML_PER_U100_UNIT,
  U100_UNITS_PER_ML,
  mcgToMg,
  mgToMcg,
  mlToUnits,
  unitsToMl,
} from "./units";

describe("units", () => {
  it("converts mg ↔ mcg", () => {
    expect(mgToMcg(10)).toBe(10_000);
    expect(mcgToMg(500)).toBe(0.5);
    expect(MCG_PER_MG).toBe(1000);
  });

  it("uses U-100: 1 unit = 0.01 mL", () => {
    expect(ML_PER_U100_UNIT).toBe(0.01);
    expect(U100_UNITS_PER_ML).toBe(100);
    expect(mlToUnits(0.1)).toBe(10);
    expect(unitsToMl(25)).toBe(0.25);
    expect(mlToUnits(unitsToMl(17))).toBe(17);
  });
});
