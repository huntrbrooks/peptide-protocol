import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { applyStatus } from "./orders";
import { releaseInventory } from "./inventory";
import { requireStaff, writeAudit } from "./lib/staff";

const queueOrder = v.object({
  _id: v.id("orders"),
  email: v.string(),
  paymentMethod: v.string(),
  subtotalAud: v.number(),
  createdAt: v.number(),
  proofVerificationStatus: v.string(),
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
    const paid = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", "paid"))
      .collect();
    const today = paid.filter((order) => (order.paidAt ?? 0) >= args.dayStart);
    const netGmv = today.reduce((sum, order) => sum + order.subtotalAud, 0);
    const pending = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", "pending_verification"))
      .collect();
    const inventory = await ctx.db.query("inventory").collect();
    return {
      netGmv,
      orders: today.length,
      netAov: today.length ? netGmv / today.length : 0,
      memberAttachPercent: today.length
        ? (today.filter((order) => order.memberId !== undefined).length / today.length) * 100
        : 0,
      pendingProofs: pending.filter((order) => order.proofVerificationStatus === "pending_review").length,
      lowStock: inventory.filter((row) => row.onHand - row.reserved <= row.lowStockThreshold).length,
      emailFailures: paid.filter((order) =>
        order.confirmationEmailSentAt === undefined &&
        order.paidAt !== undefined &&
        order.paidAt < args.dayStart
      ).length,
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
      .collect();
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
  args: {},
  returns: v.array(v.object({
    _id: v.id("orders"),
    email: v.string(),
    status: v.union(v.literal("paid"), v.literal("packed")),
    subtotalAud: v.number(),
    createdAt: v.number(),
  })),
  handler: async (ctx) => {
    await requireStaff(ctx);
    const [paid, packed] = await Promise.all([
      ctx.db.query("orders").withIndex("by_status", (q) => q.eq("status", "paid")).collect(),
      ctx.db.query("orders").withIndex("by_status", (q) => q.eq("status", "packed")).collect(),
    ]);
    return [...paid, ...packed].map((order) => ({
      _id: order._id,
      email: order.email,
      status: order.status as "paid" | "packed",
      subtotalAud: order.subtotalAud,
      createdAt: order.createdAt,
    }));
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
    await writeAudit(ctx, staff, "order.shipped", "order", String(order._id), trackingNumber);
    return null;
  },
});
