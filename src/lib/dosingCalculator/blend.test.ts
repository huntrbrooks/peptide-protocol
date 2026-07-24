import { describe, expect, it } from "vitest";
import { calculateBlend } from "./blend";

describe("calculateBlend", () => {
  it("shares water, derives draw from anchor, delivers other components", () => {
    // 10 mg + 10 mg in 2 mL → each 5000 mcg/mL
    // Anchor 250 mcg → draw 0.05 mL = 5 units → other also 250 mcg
    const result = calculateBlend({
      waterMl: 2,
      anchorComponentId: "cjc",
      anchorDoseMcg: 250,
      components: [
        { id: "cjc", label: "CJC-1295", massMg: 10 },
        { id: "ipa", label: "Ipamorelin", massMg: 10 },
      ],
    });

    expect(result.drawMl).toBe(0.05);
    expect(result.syringeUnits).toBe(5);
    expect(result.components).toHaveLength(2);

    const cjc = result.components.find((c) => c.id === "cjc");
    const ipa = result.components.find((c) => c.id === "ipa");
    expect(cjc?.isAnchor).toBe(true);
    expect(ipa?.isAnchor).toBe(false);
    expect(cjc?.concentrationMcgPerMl).toBe(5000);
    expect(ipa?.concentrationMcgPerMl).toBe(5000);
    expect(cjc?.deliveredMcg).toBe(250);
    expect(ipa?.deliveredMcg).toBe(250);
    expect(result.issues).toHaveLength(0);
  });

  it("scales delivered amounts by component mass", () => {
    // 10 mg + 5 mg in 1 mL → 10000 and 5000 mcg/mL
    // Anchor 100 mcg of A → draw 0.01 mL → B delivers 50 mcg
    const result = calculateBlend({
      waterMl: 1,
      anchorComponentId: "a",
      anchorDoseMcg: 100,
      components: [
        { id: "a", massMg: 10 },
        { id: "b", massMg: 5 },
      ],
    });

    expect(result.drawMl).toBe(0.01);
    expect(result.syringeUnits).toBe(1);
    expect(result.components.find((c) => c.id === "b")?.deliveredMcg).toBe(50);
  });

  it("errors when anchor is missing or components empty", () => {
    const missing = calculateBlend({
      waterMl: 2,
      anchorComponentId: "missing",
      anchorDoseMcg: 100,
      components: [{ id: "a", massMg: 10 }],
    });
    expect(missing.issues.some((i) => i.code === "missing_anchor")).toBe(true);

    const empty = calculateBlend({
      waterMl: 2,
      anchorComponentId: "a",
      anchorDoseMcg: 100,
      components: [],
    });
    expect(empty.issues.some((i) => i.code === "empty_components")).toBe(true);
  });
});
