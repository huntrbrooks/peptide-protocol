/**
 * Parse product.strength strings like "10mg", "10 mg", "500mcg" into vial mg.
 * Returns null when no usable mass is found.
 */
export function parseStrength(strength: string): number | null {
  if (typeof strength !== "string") return null;
  const trimmed = strength.trim();
  if (!trimmed) return null;

  // Prefer mcg before mg so "500mcg" is not misread via a trailing "mg" substring.
  const mcgMatch = trimmed.match(/(?<![\w.-])(\d+(?:\.\d+)?)\s*mcg\b/i);
  if (mcgMatch?.[1]) {
    const mcg = Number(mcgMatch[1]);
    if (!Number.isFinite(mcg) || mcg <= 0) return null;
    return mcg / 1000;
  }

  const mgMatch = trimmed.match(/(?<![\w.-])(\d+(?:\.\d+)?)\s*mg\b/i);
  if (mgMatch?.[1]) {
    const mg = Number(mgMatch[1]);
    if (!Number.isFinite(mg) || mg <= 0) return null;
    return mg;
  }

  return null;
}
