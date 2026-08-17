export type RfmSegment = "Champions" | "Loyal" | "New" | "At Risk" | "Lost";

const DAY_MS = 24 * 60 * 60 * 1000;

function recencyScore(days: number): number {
  if (days <= 30) return 5;
  if (days <= 60) return 4;
  if (days <= 90) return 3;
  if (days <= 180) return 2;
  return 1;
}

function frequencyScore(orders: number): number {
  if (orders >= 10) return 5;
  if (orders >= 6) return 4;
  if (orders >= 3) return 3;
  if (orders >= 2) return 2;
  return 1;
}

function monetaryScore(value: number): number {
  if (value >= 2500) return 5;
  if (value >= 1200) return 4;
  if (value >= 500) return 3;
  if (value >= 200) return 2;
  return 1;
}

function segmentFor(
  orderCount: number,
  recency: number,
  frequency: number,
  monetary: number,
): RfmSegment {
  if (orderCount === 0) return "New";
  if (recency === 1) return "Lost";
  if (recency === 2) return "At Risk";
  if (recency >= 4 && frequency >= 4 && monetary >= 3) return "Champions";
  if (recency >= 3 && (frequency >= 3 || monetary >= 3)) return "Loyal";
  if (orderCount === 1 && recency >= 3) return "New";
  return recency >= 3 ? "Loyal" : "At Risk";
}

export function scoreRfm(input: {
  orderCount: number;
  ltvAud: number;
  lastPaidAt?: number;
  now: number;
}): {
  recency: number;
  frequency: number;
  monetary: number;
  segment: RfmSegment;
  churned180: boolean;
} {
  const recency = input.lastPaidAt === undefined
    ? 1
    : recencyScore(Math.max(0, (input.now - input.lastPaidAt) / DAY_MS));
  const frequency = frequencyScore(input.orderCount);
  const monetary = monetaryScore(input.ltvAud);
  return {
    recency,
    frequency,
    monetary,
    segment: segmentFor(input.orderCount, recency, frequency, monetary),
    churned180:
      input.lastPaidAt !== undefined &&
      input.now - input.lastPaidAt > 180 * DAY_MS,
  };
}
