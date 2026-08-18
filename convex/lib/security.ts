import type { MutationCtx } from "../_generated/server";

export function constantTimeEqual(actual: string, expected: string): boolean {
  const length = Math.max(actual.length, expected.length);
  let difference = actual.length ^ expected.length;
  for (let index = 0; index < length; index += 1) {
    difference |=
      (actual.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0);
  }
  return difference === 0;
}

export function requireOrdersSecret(secret: string): void {
  const expected = process.env.ORDERS_WEBHOOK_SECRET?.trim();
  if (!expected || !constantTimeEqual(secret, expected)) {
    throw new Error("Unauthorized");
  }
}

export async function enforceRateLimit(
  ctx: MutationCtx,
  key: string,
  limit: number,
  windowMs: number,
): Promise<void> {
  const now = Date.now();
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();

  if (!existing || now >= existing.windowStartedAt + windowMs) {
    if (existing) {
      await ctx.db.patch("rateLimits", existing._id, {
        count: 1,
        windowStartedAt: now,
      });
    } else {
      await ctx.db.insert("rateLimits", {
        key,
        count: 1,
        windowStartedAt: now,
      });
    }
    return;
  }

  if (existing.count >= limit) {
    throw new Error("Too many requests. Please try again shortly.");
  }
  await ctx.db.patch("rateLimits", existing._id, {
    count: existing.count + 1,
  });
}
