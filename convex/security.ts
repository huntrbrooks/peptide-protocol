import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { enforceRateLimit, requireOrdersSecret } from "./lib/security";

export const consumeRateLimit = mutation({
  args: {
    key: v.string(),
    limit: v.number(),
    windowMs: v.number(),
    paymentSecret: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireOrdersSecret(args.paymentSecret);
    if (
      !args.key ||
      !Number.isInteger(args.limit) ||
      args.limit < 1 ||
      args.limit > 1_000 ||
      !Number.isInteger(args.windowMs) ||
      args.windowMs < 1_000 ||
      args.windowMs > 24 * 60 * 60_000
    ) {
      throw new Error("Invalid rate limit");
    }
    await enforceRateLimit(ctx, args.key, args.limit, args.windowMs);
    return null;
  },
});
