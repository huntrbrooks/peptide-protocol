import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { applyStatus } from "./orders";
import { releaseInventory } from "./inventory";
import { requireStaff, writeAudit } from "./lib/staff";
import { recomputeMemberRfm } from "./rfm";

const OVERVIEW_SCAN_LIMIT = 500;

const queueOrder = v.object({
  _id: v.id("orders"),
  email: v.string(),
  paymentMethod: v.string(),
  subtotalAud: v.number(),
  createdAt: v.number(),
  proofVerificationStatus: v.string(),
});

const fulfillmentOrder = v.object({
  _id: v.id("orders"),
  email: v.string(),
  status: v.union(
    v.literal("paid"),
    v.literal("packed"),
    v.literal("shipped"),
    v.literal("delivered"),
  ),
  subtotalAud: v.number(),
  createdAt: v.number(),
});

export const overview = query({
  args: { dayStart: v.number() },
  returns: v.object({
    netGmv: v.number(),
    orders: v.number(),
    netAov: v.number(),
    memberAttachPercent: v.number(),
    pendingProofs: v.number(),
    lowStock: v.number(),
    emailFailures: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const today = await ctx.db
      .query("orders")
      .withIndex("by_paid_at", (q) => q.gte("paidAt", args.dayStart))
      .take(OVERVIEW_SCAN_LIMIT);
    const netGmv = today.reduce((sum, order) => sum + order.subtotalAud, 0);
    const pending = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", "pending_verification"))
      .take(OVERVIEW_SCAN_LIMIT);
    const pastDueEmails = await ctx.db
      .query("orders")
      .withIndex("by_paid_at", (q) => q.lt("paidAt", args.dayStart))
      .order("desc")
      .take(OVERVIEW_SCAN_LIMIT);
    const lifecycleEmailFailures = await ctx.db
      .query("emailEvents")
      .withIndex("by_status", (q) => q.eq("status", "failed"))
      .take(OVERVIEW_SCAN_LIMIT);
    const inventory = await ctx.db.query("inventory").take(OVERVIEW_SCAN_LIMIT);
    return {
      netGmv,
      orders: today.length,
      netAov: today.length ? netGmv / today.length : 0,
      memberAttachPercent: today.length
        ? (today.filter((order) => order.memberId !== undefined).length / today.length) * 100
        : 0,
      pendingProofs: pending.filter((order) => order.proofVerificationStatus === "pending_review").length,
      lowStock: inventory.filter((row) => row.onHand - row.reserved <= row.lowStockThreshold).length,
      emailFailures:
        pastDueEmails.filter((order) =>
          order.confirmationEmailSentAt === undefined &&
          order.paidAt !== undefined &&
          order.paidAt < args.dayStart
        ).length + lifecycleEmailFailures.length,
    };
  },
});

export const pendingProofs = query({
  args: {},
  returns: v.array(queueOrder),
  handler: async (ctx) => {
    await requireStaff(ctx);
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", "pending_verification"))
      .take(OVERVIEW_SCAN_LIMIT);
    return orders
      .filter((order) => order.proofVerificationStatus === "pending_review")
      .map((order) => ({
        _id: order._id,
        email: order.email,
        paymentMethod: order.paymentMethod ?? "unknown",
        subtotalAud: order.subtotalAud,
        createdAt: order.createdAt,
        proofVerificationStatus: order.proofVerificationStatus ?? "pending_review",
      }));
  },
});

export const fulfillmentQueue = query({
  args: {
    status: v.union(
      v.literal("paid"),
      v.literal("packed"),
      v.literal("shipped"),
      v.literal("delivered"),
    ),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(fulfillmentOrder),
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const result = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map((order) => ({
        _id: order._id,
        email: order.email,
        status: order.status as "paid" | "packed" | "shipped" | "delivered",
        subtotalAud: order.subtotalAud,
        createdAt: order.createdAt,
      })),
    };
  },
});

export const reviewProof = mutation({
  args: {
    orderId: v.id("orders"),
    decision: v.union(v.literal("approve"), v.literal("reject")),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx, ["owner", "ops"]);
    const order = await ctx.db.get("orders", args.orderId);
    if (!order || order.proofVerificationStatus !== "pending_review") {
      throw new Error("Order is not pending proof review");
    }
    if (args.decision === "approve") {
      await applyStatus(ctx, order._id, "paid");
      await ctx.db.patch("orders", order._id, {
        proofVerificationStatus: "verified",
        internalNotes: args.note,
      });
    } else {
      await ctx.db.patch("orders", order._id, {
        status: "cancelled",
        proofVerificationStatus: "rejected",
        internalNotes: args.note,
        updatedAt: Date.now(),
      });
      await releaseInventory(ctx, order);
    }
    await writeAudit(
      ctx,
      staff,
      `order.proof_${args.decision}`,
      "order",
      String(order._id),
      args.note,
    );
    return null;
  },
});

export const markPacked = mutation({
  args: { orderId: v.id("orders") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx, ["owner", "ops"]);
    const order = await ctx.db.get("orders", args.orderId);
    if (!order || order.status !== "paid") throw new Error("Only paid orders can be packed");
    const now = Date.now();
    await ctx.db.patch("orders", order._id, { status: "packed", packedAt: now, updatedAt: now });
    await writeAudit(ctx, staff, "order.packed", "order", String(order._id));
    return null;
  },
});

export const markShipped = mutation({
  args: { orderId: v.id("orders"), trackingNumber: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx, ["owner", "ops"]);
    const order = await ctx.db.get("orders", args.orderId);
    if (!order || order.status !== "packed") throw new Error("Only packed orders can be shipped");
    const trackingNumber = args.trackingNumber.trim();
    if (!trackingNumber) throw new Error("Tracking number is required");
    const now = Date.now();
    await ctx.db.patch("orders", order._id, {
      status: "shipped",
      shippedAt: now,
      trackingNumber,
      updatedAt: now,
    });
    if (order.memberId) {
      await recomputeMemberRfm(ctx, order.memberId, now);
      await ctx.scheduler.runAfter(0, internal.klaviyo.syncMember, {
        memberId: order.memberId,
      });
    }
    await writeAudit(ctx, staff, "order.shipped", "order", String(order._id), trackingNumber);
    return null;
  },
});

export const markDelivered = mutation({
  args: { orderId: v.id("orders") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx, ["owner", "ops"]);
    const order = await ctx.db.get("orders", args.orderId);
    if (!order || order.status !== "shipped") {
      throw new Error("Only shipped orders can be delivered");
    }
    const now = Date.now();
    await ctx.db.patch("orders", order._id, {
      status: "delivered",
      deliveredAt: now,
      updatedAt: now,
    });
    await writeAudit(ctx, staff, "order.delivered", "order", String(order._id));
    return null;
  },
});

export const recordRefund = mutation({
  args: {
    orderId: v.id("orders"),
    refundAud: v.number(),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx, ["owner"]);
    const order = await ctx.db.get("orders", args.orderId);
    if (
      !order ||
      !["paid", "packed", "shipped", "delivered"].includes(order.status)
    ) {
      throw new Error("Only settled orders can be refunded");
    }
    const refundAud = Math.round(args.refundAud * 100) / 100;
    if (refundAud <= 0 || refundAud > order.subtotalAud) {
      throw new Error("Refund must be greater than zero and no more than the amount paid");
    }
    const now = Date.now();
    await ctx.db.patch("orders", order._id, {
      status: "refunded",
      refundAud,
      refundedAt: now,
      internalNotes: args.note?.trim() || order.internalNotes,
      updatedAt: now,
    });
    await writeAudit(
      ctx,
      staff,
      "order.refunded",
      "order",
      String(order._id),
      `${refundAud.toFixed(2)} AUD${args.note ? ` — ${args.note}` : ""}`,
    );
    await ctx.scheduler.runAfter(0, internal.purchaseAnalytics.captureRefund, {
      orderId: order._id,
    });
    return null;
  },
});

export const dashboard = query({
  args: { periodStart: v.number(), now: v.number() },
  returns: v.object({
    grossGmv: v.number(),
    netGmv: v.number(),
    discountLiability: v.number(),
    refundsAud: v.number(),
    railMix: v.array(v.object({ label: v.string(), orders: v.number(), netAud: v.number() })),
    rateMix: v.array(v.object({ label: v.string(), orders: v.number() })),
    newMembers: v.number(),
    passwordAttachPercent: v.number(),
    guestOrders: v.number(),
    memberOrders: v.number(),
    deliveredOrders: v.number(),
    refundedOrders: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    if (args.periodStart > args.now) throw new Error("Invalid dashboard period");
    const [settled, newMembers] = await Promise.all([
      ctx.db
        .query("orders")
        .withIndex("by_paid_at", (q) =>
          q.gte("paidAt", args.periodStart).lte("paidAt", args.now)
        )
        .collect(),
      ctx.db
        .query("members")
        .withIndex("by_created", (q) =>
          q.gte("createdAt", args.periodStart).lte("createdAt", args.now)
        )
        .collect(),
    ]);
    const grossGmv = settled.reduce(
      (sum, order) => sum + (order.subtotalBeforeDiscountAud ?? order.subtotalAud),
      0,
    );
    const charged = settled.reduce((sum, order) => sum + order.subtotalAud, 0);
    const refundsAud = settled.reduce((sum, order) => sum + (order.refundAud ?? 0), 0);
    const rails = new Map<string, { orders: number; netAud: number }>();
    const rates = new Map<string, number>([
      ["15% member", 0],
      ["10% member", 0],
      ["Full price", 0],
    ]);
    for (const order of settled) {
      const rail = order.paymentMethod ?? "unknown";
      const current = rails.get(rail) ?? { orders: 0, netAud: 0 };
      current.orders += 1;
      current.netAud += order.subtotalAud - (order.refundAud ?? 0);
      rails.set(rail, current);
      const rate =
        order.discountPercent === 15
          ? "15% member"
          : order.discountPercent === 10
            ? "10% member"
            : "Full price";
      rates.set(rate, (rates.get(rate) ?? 0) + 1);
    }
    return {
      grossGmv,
      netGmv: charged - refundsAud,
      discountLiability: settled.reduce((sum, order) => sum + (order.discountAud ?? 0), 0),
      refundsAud,
      railMix: [...rails.entries()].map(([label, value]) => ({ label, ...value })),
      rateMix: [...rates.entries()].map(([label, orders]) => ({ label, orders })),
      newMembers: newMembers.length,
      passwordAttachPercent: newMembers.length
        ? (newMembers.filter((member) => member.authUserId !== undefined).length / newMembers.length) * 100
        : 0,
      guestOrders: settled.filter((order) => order.memberId === undefined).length,
      memberOrders: settled.filter((order) => order.memberId !== undefined).length,
      deliveredOrders: settled.filter((order) => order.status === "delivered").length,
      refundedOrders: settled.filter((order) => order.status === "refunded").length,
    };
  },
});

const rfmSegmentValidator = v.union(
  v.literal("Champions"),
  v.literal("Loyal"),
  v.literal("New"),
  v.literal("At Risk"),
  v.literal("Lost"),
);

export const memberDirectory = query({
  args: { segment: v.optional(rfmSegmentValidator) },
  returns: v.object({
    counts: v.array(v.object({
      segment: rfmSegmentValidator,
      count: v.number(),
    })),
    members: v.array(v.object({
      _id: v.id("members"),
      email: v.string(),
      code: v.string(),
      segment: v.union(rfmSegmentValidator, v.null()),
      recencyScore: v.union(v.number(), v.null()),
      frequencyScore: v.union(v.number(), v.null()),
      monetaryScore: v.union(v.number(), v.null()),
      orderCount: v.number(),
      ltvAud: v.number(),
      lastPaidAt: v.union(v.number(), v.null()),
    })),
  }),
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const segments = [
      "Champions",
      "Loyal",
      "New",
      "At Risk",
      "Lost",
    ] as const;
    const countRows = await Promise.all(
      segments.map(async (segment) => await ctx.db
        .query("rfmSegmentStats")
        .withIndex("by_segment", (q) => q.eq("segment", segment))
        .unique()),
    );
    const selected = args.segment
      ? await ctx.db
        .query("members")
        .withIndex("by_rfm_segment", (q) => q.eq("rfmSegment", args.segment))
        .order("desc")
        .take(200)
      : await ctx.db
        .query("members")
        .withIndex("by_created")
        .order("desc")
        .take(200);
    return {
      counts: segments.map((segment, index) => ({
        segment,
        count: countRows[index]?.count ?? 0,
      })),
      members: selected.map((member) => ({
        _id: member._id,
        email: member.email,
        code: member.code,
        segment: member.rfmSegment ?? null,
        recencyScore: member.rfmRecencyScore ?? null,
        frequencyScore: member.rfmFrequencyScore ?? null,
        monetaryScore: member.rfmMonetaryScore ?? null,
        orderCount: member.orderCount ?? 0,
        ltvAud: member.ltvAud ?? 0,
        lastPaidAt: member.lastPaidAt ?? null,
      })),
    };
  },
});
