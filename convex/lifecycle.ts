import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import {
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { normalizeMemberEmail } from "./lib/memberDiscount";

const lineValidator = v.object({
  slug: v.string(),
  name: v.string(),
  quantity: v.number(),
  unitPriceAud: v.number(),
  lineTotalAud: v.number(),
});

const activityKindValidator = v.union(
  v.literal("abandoned_cart"),
  v.literal("post_purchase"),
  v.literal("win_back"),
);

const emailTargetValidator = v.object({
  activityId: v.id("lifecycleActivities"),
  memberId: v.id("members"),
  orderId: v.union(v.id("orders"), v.null()),
  email: v.string(),
  code: v.string(),
  kind: activityKindValidator,
  stage: v.number(),
  lines: v.array(lineValidator),
  idempotencyKey: v.string(),
});

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

async function insertActivity(
  ctx: MutationCtx,
  values: {
    memberId: Id<"members">;
    email: string;
    kind: "post_purchase" | "win_back";
    sourceKey: string;
    orderId: Id<"orders">;
    lines: Doc<"orders">["lines"];
    occurredAt: number;
    nextSendAt: number;
  },
): Promise<void> {
  const existing = await ctx.db
    .query("lifecycleActivities")
    .withIndex("by_source_key", (q) => q.eq("sourceKey", values.sourceKey))
    .unique();
  if (existing) return;
  await ctx.db.insert("lifecycleActivities", {
    ...values,
    stage: 1,
    createdAt: values.occurredAt,
    updatedAt: values.occurredAt,
  });
}

export async function recordCheckoutActivityForOrder(
  ctx: MutationCtx,
  args: {
    email: string;
    lines: Doc<"orders">["lines"];
  },
): Promise<void> {
  if (args.lines.length === 0 || args.lines.length > 50) return;
  const email = normalizeMemberEmail(args.email);
  const member = await ctx.db
    .query("members")
    .withIndex("by_email", (q) => q.eq("email", email))
    .unique();
  if (!member || member.marketingConsent !== "opted_in") return;
  const now = Date.now();
  const activities = await ctx.db
    .query("lifecycleActivities")
    .withIndex("by_member", (q) => q.eq("memberId", member._id))
    .collect();
  const active = activities.find(
    (activity) =>
      activity.kind === "abandoned_cart" &&
      activity.completedAt === undefined &&
      activity.cancelledAt === undefined,
  );
  if (active) {
    await ctx.db.patch("lifecycleActivities", active._id, {
      lines: args.lines,
      occurredAt: now,
      nextSendAt: now + HOUR,
      stage: 1,
      claimedAt: undefined,
      updatedAt: now,
    });
    return;
  }
  await ctx.db.insert("lifecycleActivities", {
    memberId: member._id,
    email,
    kind: "abandoned_cart",
    sourceKey: `abandoned/${member._id}/${now}`,
    lines: args.lines,
    occurredAt: now,
    nextSendAt: now + HOUR,
    stage: 1,
    createdAt: now,
    updatedAt: now,
  });
}

export const recordCheckoutActivity = internalMutation({
  args: {
    email: v.string(),
    lines: v.array(lineValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await recordCheckoutActivityForOrder(ctx, args);
    return null;
  },
});

export const enqueuePostPurchase = internalMutation({
  args: { orderId: v.id("orders") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const order = await ctx.db.get("orders", args.orderId);
    if (!order?.paidAt) return null;
    const member = order.memberId
      ? await ctx.db.get("members", order.memberId)
      : await ctx.db
          .query("members")
          .withIndex("by_email", (q) => q.eq("email", order.email))
          .unique();
    if (!member || member.marketingConsent !== "opted_in") return null;
    await insertActivity(ctx, {
      memberId: member._id,
      email: member.email,
      kind: "post_purchase",
      sourceKey: `post-purchase/${order._id}`,
      orderId: order._id,
      lines: order.lines,
      occurredAt: order.paidAt,
      nextSendAt: order.paidAt + DAY,
    });
    await insertActivity(ctx, {
      memberId: member._id,
      email: member.email,
      kind: "win_back",
      sourceKey: `win-back/${order._id}`,
      orderId: order._id,
      lines: order.lines,
      occurredAt: order.paidAt,
      nextSendAt: order.paidAt + 90 * DAY,
    });
    return null;
  },
});

export const processDue = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const now = Date.now();
    const due = await ctx.db
      .query("lifecycleActivities")
      .withIndex("by_due", (q) => q.lte("nextSendAt", now))
      .take(50);
    let scheduled = 0;
    for (const activity of due) {
      if (
        activity.completedAt !== undefined ||
        activity.cancelledAt !== undefined ||
        (activity.claimedAt !== undefined && now - activity.claimedAt < HOUR)
      ) {
        continue;
      }
      await ctx.db.patch("lifecycleActivities", activity._id, {
        claimedAt: now,
        updatedAt: now,
      });
      await ctx.scheduler.runAfter(0, internal.lifecycleEmail.send, {
        activityId: activity._id,
      });
      scheduled += 1;
    }
    return scheduled;
  },
});

export const getEmailTarget = internalQuery({
  args: { activityId: v.id("lifecycleActivities") },
  returns: v.union(emailTargetValidator, v.null()),
  handler: async (ctx, args) => {
    const activity = await ctx.db.get("lifecycleActivities", args.activityId);
    if (
      !activity ||
      activity.claimedAt === undefined ||
      activity.completedAt !== undefined ||
      activity.cancelledAt !== undefined
    ) {
      return null;
    }
    const member = await ctx.db.get("members", activity.memberId);
    if (!member || member.marketingConsent !== "opted_in") return null;
    if (activity.orderId) {
      const sourceOrder = await ctx.db.get("orders", activity.orderId);
      if (!sourceOrder || sourceOrder.status === "refunded") return null;
    }
    const [memberOrders, emailOrders] = await Promise.all([
      ctx.db
        .query("orders")
        .withIndex("by_member", (q) => q.eq("memberId", member._id))
        .collect(),
      ctx.db
        .query("orders")
        .withIndex("by_email", (q) => q.eq("email", member.email))
        .collect(),
    ]);
    const orders = new Map(
      [...memberOrders, ...emailOrders].map((order) => [String(order._id), order]),
    );
    const laterPaidOrder = [...orders.values()].some(
      (order) =>
        order.paidAt !== undefined &&
        order.paidAt > activity.occurredAt &&
        ["paid", "packed", "shipped", "delivered"].includes(order.status),
    );
    if (
      (activity.kind === "abandoned_cart" || activity.kind === "win_back") &&
      laterPaidOrder
    ) {
      return null;
    }
    const type =
      activity.kind === "abandoned_cart"
        ? `abandoned_cart_${activity.stage === 1 ? "1h" : "24h"}`
        : activity.kind;
    const idempotencyKey = `${type}/${activity._id}`;
    const priorEvent = await ctx.db
      .query("emailEvents")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", idempotencyKey))
      .first();
    if (priorEvent?.status === "sent") return null;
    return {
      activityId: activity._id,
      memberId: member._id,
      orderId: activity.orderId ?? null,
      email: member.email,
      code: member.code,
      kind: activity.kind,
      stage: activity.stage,
      lines: activity.lines,
      idempotencyKey,
    };
  },
});

export const cancelActivity = internalMutation({
  args: { activityId: v.id("lifecycleActivities") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const activity = await ctx.db.get("lifecycleActivities", args.activityId);
    if (activity && activity.completedAt === undefined) {
      const now = Date.now();
      await ctx.db.patch("lifecycleActivities", activity._id, {
        cancelledAt: now,
        claimedAt: undefined,
        updatedAt: now,
      });
    }
    return null;
  },
});

export const recordEmailResult = internalMutation({
  args: {
    activityId: v.id("lifecycleActivities"),
    idempotencyKey: v.string(),
    sent: v.boolean(),
    providerMessageId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const activity = await ctx.db.get("lifecycleActivities", args.activityId);
    if (!activity) return null;
    const now = Date.now();
    const existing = await ctx.db
      .query("emailEvents")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    const event = {
      memberId: activity.memberId,
      orderId: activity.orderId,
      activityId: activity._id,
      type:
        activity.kind === "abandoned_cart"
          ? `abandoned_cart_${activity.stage === 1 ? "1h" : "24h"}`
          : activity.kind,
      idempotencyKey: args.idempotencyKey,
      providerMessageId: args.providerMessageId,
      status: args.sent ? ("sent" as const) : ("failed" as const),
      error: args.error,
      createdAt: now,
    };
    if (existing) {
      await ctx.db.patch("emailEvents", existing._id, event);
    } else {
      await ctx.db.insert("emailEvents", event);
    }
    if (!args.sent) {
      await ctx.db.patch("lifecycleActivities", activity._id, {
        claimedAt: undefined,
        nextSendAt: now + HOUR,
        updatedAt: now,
      });
      return null;
    }
    if (activity.kind === "abandoned_cart" && activity.stage === 1) {
      await ctx.db.patch("lifecycleActivities", activity._id, {
        stage: 2,
        nextSendAt: activity.occurredAt + DAY,
        claimedAt: undefined,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch("lifecycleActivities", activity._id, {
        completedAt: now,
        claimedAt: undefined,
        updatedAt: now,
      });
    }
    return null;
  },
});
