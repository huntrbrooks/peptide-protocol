import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { requireStaff } from "./lib/staff";

const rfmCountsValidator = v.object({
  champions: v.number(),
  loyal: v.number(),
  new: v.number(),
  atRisk: v.number(),
  lost: v.number(),
});

const dailyStatsValidator = v.object({
  _id: v.id("dailyStats"),
  dateKey: v.string(),
  periodStart: v.number(),
  periodEnd: v.number(),
  grossGmvAud: v.number(),
  netGmvAud: v.number(),
  orderCount: v.number(),
  memberOrderCount: v.number(),
  memberAttachPercent: v.number(),
  rfmCounts: rfmCountsValidator,
  createdAt: v.number(),
});

export const createNightlySnapshot = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const currentDayStart = new Date(now);
    currentDayStart.setUTCHours(0, 0, 0, 0);
    const periodEnd = currentDayStart.getTime();
    const periodStart = periodEnd - 24 * 60 * 60 * 1000;
    const dateKey = new Date(periodStart).toISOString().slice(0, 10);

    const [orders, champions, loyal, newMembers, atRisk, lost] = await Promise.all([
      ctx.db
        .query("orders")
        .withIndex("by_paid_at", (q) =>
          q.gte("paidAt", periodStart).lt("paidAt", periodEnd)
        )
        .collect(),
      ctx.db
        .query("rfmSegmentStats")
        .withIndex("by_segment", (q) => q.eq("segment", "Champions"))
        .unique(),
      ctx.db
        .query("rfmSegmentStats")
        .withIndex("by_segment", (q) => q.eq("segment", "Loyal"))
        .unique(),
      ctx.db
        .query("rfmSegmentStats")
        .withIndex("by_segment", (q) => q.eq("segment", "New"))
        .unique(),
      ctx.db
        .query("rfmSegmentStats")
        .withIndex("by_segment", (q) => q.eq("segment", "At Risk"))
        .unique(),
      ctx.db
        .query("rfmSegmentStats")
        .withIndex("by_segment", (q) => q.eq("segment", "Lost"))
        .unique(),
    ]);
    const grossGmvAud = orders.reduce(
      (sum, order) => sum + (order.subtotalBeforeDiscountAud ?? order.subtotalAud),
      0,
    );
    const netGmvAud = orders.reduce(
      (sum, order) => sum + order.subtotalAud - (order.refundAud ?? 0),
      0,
    );
    const memberOrderCount = orders.filter((order) => order.memberId !== undefined).length;
    const snapshot = {
      dateKey,
      periodStart,
      periodEnd,
      grossGmvAud,
      netGmvAud,
      orderCount: orders.length,
      memberOrderCount,
      memberAttachPercent: orders.length ? (memberOrderCount / orders.length) * 100 : 0,
      rfmCounts: {
        champions: champions?.count ?? 0,
        loyal: loyal?.count ?? 0,
        new: newMembers?.count ?? 0,
        atRisk: atRisk?.count ?? 0,
        lost: lost?.count ?? 0,
      },
      createdAt: now,
    };
    const existing = await ctx.db
      .query("dailyStats")
      .withIndex("by_date_key", (q) => q.eq("dateKey", dateKey))
      .unique();
    if (existing) {
      await ctx.db.patch("dailyStats", existing._id, snapshot);
    } else {
      await ctx.db.insert("dailyStats", snapshot);
    }
    return null;
  },
});

export const recent = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(dailyStatsValidator),
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 14), 1), 90);
    return await ctx.db
      .query("dailyStats")
      .withIndex("by_created")
      .order("desc")
      .take(limit);
  },
});
