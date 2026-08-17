import { describe, expect, it } from "vitest";
import {
  applyMemberDiscount,
  isValidMemberEmail,
  normalizeMemberCode,
} from "./discount";

describe("applyMemberDiscount", () => {
  it("applies 15 percent to the nearest cent", () => {
    expect(applyMemberDiscount(199, 15)).toEqual({
      discountAud: 29.85,
      subtotalAud: 169.15,
    });
  });

  it("applies 10 percent to the nearest cent", () => {
    expect(applyMemberDiscount(80, 10)).toEqual({
      discountAud: 8,
      subtotalAud: 72,
    });
  });

  it("leaves the total unchanged at 0 percent", () => {
    expect(applyMemberDiscount(50, 0)).toEqual({
      discountAud: 0,
      subtotalAud: 50,
    });
  });
});

describe("member identity helpers", () => {
  it("accepts a normal email and rejects empty values", () => {
    expect(isValidMemberEmail("Lab@TheProtocolAU.com")).toBe(true);
    expect(isValidMemberEmail("nope")).toBe(false);
  });

  it("normalises codes", () => {
    expect(normalizeMemberCode(" protocol-ab12cd ")).toBe("PROTOCOL-AB12CD");
  });
});
