/** Milligrams ↔ micrograms and U-100 insulin syringe conversions. */

export const MCG_PER_MG = 1000;

/** U-100: 100 units = 1 mL → 1 unit = 0.01 mL */
export const U100_UNITS_PER_ML = 100;
export const ML_PER_U100_UNIT = 0.01;

export function mgToMcg(mg: number): number {
  return mg * MCG_PER_MG;
}

export function mcgToMg(mcg: number): number {
  return mcg / MCG_PER_MG;
}

/** Convert draw volume (mL) to U-100 syringe units. */
export function mlToUnits(ml: number): number {
  return ml * U100_UNITS_PER_ML;
}

/** Convert U-100 syringe units to volume (mL). */
export function unitsToMl(units: number): number {
  return units * ML_PER_U100_UNIT;
}
