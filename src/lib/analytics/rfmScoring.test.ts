import { describe, expect, it } from "vitest";
import { scoreRfm } from "../../../convex/lib/rfmScoring";

const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.UTC(2026, 7, 18);

describe("scoreRfm", () => {
  it("classifies frequent, valuable, recent members as Champions", () => {
    expect(scoreRfm({
      orderCount: 7,
      ltvAud: 1800,
      lastPaidAt: now - 14 * DAY_MS,
      now,
    })).toMatchObject({
      recency: 5,
      frequency: 4,
      monetary: 4,
      segment: "Champions",
      churned180: false,
    });
  });

  it("distinguishes new, at-risk, and lost members", () => {
    expect(scoreRfm({ orderCount: 0, ltvAud: 0, now }).segment).toBe("New");
    expect(scoreRfm({
      orderCount: 2,
      ltvAud: 300,
      lastPaidAt: now - 120 * DAY_MS,
      now,
    }).segment).toBe("At Risk");
    expect(scoreRfm({
      orderCount: 4,
      ltvAud: 900,
      lastPaidAt: now - 181 * DAY_MS,
      now,
    })).toMatchObject({ segment: "Lost", churned180: true });
  });
});
