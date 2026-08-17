import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { scoreRfm } from "./lib/rfmScoring";
import type { RfmSegment } from "./lib/rfmScoring";

async function adjustSegmentCount(
  ctx: MutationCtx,
  segment: RfmSegment,
  delta: number,
  now: number,
): Promise<void> {
  const row = await ctx.db
    .query("rfmSegmentStats")
    .withIndex("by_segment", (q) => q.eq("segment", segment))
    .unique();
  if (row) {
    await ctx.db.patch("rfmSegmentStats", row._id, {
      count: Math.max(0, row.count + delta),
      updatedAt: now,
    });
  } else if (delta > 0) {
    await ctx.db.insert("rfmSegmentStats", {
      segment,
      count: delta,
      updatedAt: now,
    });
  }
}

export async function recomputeMemberRfm(
  ctx: MutationCtx,
  memberId: Id<"members">,
  now: number,
): Promise<void> {
  const member = await ctx.db.get("members", memberId);
  if (!member) return;

  const memberOrders = await ctx.db
    .query("orders")
    .withIndex("by_member", (q) => q.eq("memberId", memberId))
    .collect();
  const paidOrders = memberOrders.filter(
    (order): order is Doc<"orders"> & { paidAt: number } =>
      order.paidAt !== undefined,
  );
  const ordered = [...paidOrders].sort((a, b) => a.paidAt - b.paidAt);
  const firstPaidAt = ordered[0]?.paidAt;
  const lastPaidAt = ordered.at(-1)?.paidAt;
  const ltvAud = paidOrders.reduce(
    (sum, order) => sum + order.subtotalAud - (order.refundAud ?? 0),
    0,
  );
  const score = scoreRfm({
    orderCount: paidOrders.length,
    ltvAud,
    lastPaidAt,
    now,
  });
  if (member.rfmSegment !== score.segment) {
    if (member.rfmSegment) {
      await adjustSegmentCount(ctx, member.rfmSegment, -1, now);
    }
    await adjustSegmentCount(ctx, score.segment, 1, now);
  }

  await ctx.db.patch("members", memberId, {
    ltvAud,
    orderCount: paidOrders.length,
    firstPaidAt,
    lastPaidAt,
    rfmRecencyScore: score.recency,
    rfmFrequencyScore: score.frequency,
    rfmMonetaryScore: score.monetary,
    rfmSegment: score.segment,
    churned180: score.churned180,
    updatedAt: now,
  });
}

export const recomputeMember = internalMutation({
  args: { memberId: v.id("members"), now: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await recomputeMemberRfm(ctx, args.memberId, args.now);
    return null;
  },
});

export const nightly = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    await ctx.scheduler.runAfter(0, internal.rfm.recomputePage, {
      now,
      paginationOpts: { cursor: null, numItems: 100 },
    });
    return null;
  },
});

export const recomputePage = internalMutation({
  args: {
    now: v.number(),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("members")
      .withIndex("by_created")
      .paginate(args.paginationOpts);
    for (const member of page.page) {
      await recomputeMemberRfm(ctx, member._id, args.now);
    }
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.rfm.recomputePage, {
        now: args.now,
        paginationOpts: {
          cursor: page.continueCursor,
          numItems: args.paginationOpts.numItems,
        },
      });
    }
    return null;
  },
});
