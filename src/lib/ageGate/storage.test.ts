import { describe, expect, it } from "vitest";
import {
  AGE_GATE_COOKIE_NAME,
  buildAgeGateCookie,
  hasAgeGateCookie,
  isAgeGateExemptPath,
} from "./storage";

describe("isAgeGateExemptPath", () => {
  it("allows the legal pages so terms can be read before entering", () => {
    expect(isAgeGateExemptPath("/terms")).toBe(true);
    expect(isAgeGateExemptPath("/disclaimer")).toBe(true);
    expect(isAgeGateExemptPath("/privacy")).toBe(true);
  });

  it("blocks the storefront and catalogue", () => {
    expect(isAgeGateExemptPath("/")).toBe(false);
    expect(isAgeGateExemptPath("/shop")).toBe(false);
    expect(isAgeGateExemptPath("/products/retatrutide-20mg")).toBe(false);
  });
});

describe("age gate cookie", () => {
  it("builds and recognises the verified cookie", () => {
    const cookie = buildAgeGateCookie();
    expect(cookie.startsWith(`${AGE_GATE_COOKIE_NAME}=1`)).toBe(true);
    expect(hasAgeGateCookie(cookie)).toBe(true);
    expect(hasAgeGateCookie("other=1; pp_age_ok=1")).toBe(true);
    expect(hasAgeGateCookie("pp_age_ok=0")).toBe(false);
    expect(hasAgeGateCookie("")).toBe(false);
  });
});
