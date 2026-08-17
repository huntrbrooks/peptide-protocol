import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MEMBER_CAPTURE_DISMISS_MS,
  getMemberCaptureServerSnapshot,
  getMemberCaptureSnapshot,
  isMemberCaptureDismissed,
  isMemberCaptureExemptPath,
  persistMemberCaptureDismissed,
  persistMemberCaptureRecord,
  readMemberCaptureRecord,
} from "./storage";

const memory = new Map<string, string>();

afterEach(() => {
  memory.clear();
  vi.unstubAllGlobals();
});

function stubWindowStorage() {
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      clear: () => memory.clear(),
    },
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });
}

describe("member capture storage", () => {
  it("hides the popup on legal and checkout paths", () => {
    expect(isMemberCaptureExemptPath("/privacy")).toBe(true);
    expect(isMemberCaptureExemptPath("/checkout/success")).toBe(true);
    expect(isMemberCaptureExemptPath("/shop")).toBe(false);
  });

  it("persists a captured email and code", () => {
    stubWindowStorage();
    persistMemberCaptureRecord({
      email: "lab@theprotocolau.com",
      code: "PROTOCOL-AB12CD",
    });
    expect(readMemberCaptureRecord()).toEqual({
      email: "lab@theprotocolau.com",
      code: "PROTOCOL-AB12CD",
    });
  });

  it("returns stable snapshots while storage is unchanged", () => {
    stubWindowStorage();

    expect(getMemberCaptureSnapshot()).toBe(getMemberCaptureSnapshot());
    expect(getMemberCaptureServerSnapshot()).toBe(
      getMemberCaptureServerSnapshot(),
    );
  });

  it("treats dismiss as active for seven days", () => {
    stubWindowStorage();
    const now = 1_700_000_000_000;
    persistMemberCaptureDismissed(now);
    expect(isMemberCaptureDismissed(now + 60_000)).toBe(true);
    expect(
      isMemberCaptureDismissed(now + MEMBER_CAPTURE_DISMISS_MS + 1),
    ).toBe(false);
  });
});
