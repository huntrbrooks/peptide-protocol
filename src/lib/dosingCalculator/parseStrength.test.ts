import { describe, expect, it } from "vitest";
import { parseStrength } from "./parseStrength";

describe("parseStrength", () => {
  it("parses common product.strength mg strings", () => {
    expect(parseStrength("10mg")).toBe(10);
    expect(parseStrength("10 mg")).toBe(10);
    expect(parseStrength("20MG")).toBe(20);
    expect(parseStrength("2.5mg")).toBe(2.5);
  });

  it("parses mcg into mg", () => {
    expect(parseStrength("500mcg")).toBe(0.5);
    expect(parseStrength("250 mcg")).toBe(0.25);
  });

  it("returns null for unusable values", () => {
    expect(parseStrength("")).toBeNull();
    expect(parseStrength("   ")).toBeNull();
    expect(parseStrength("vial")).toBeNull();
    expect(parseStrength("0mg")).toBeNull();
    expect(parseStrength("-5mg")).toBeNull();
  });

  it("takes the first mass token in compound labels", () => {
    expect(parseStrength("10mg lyophilized")).toBe(10);
  });
});
