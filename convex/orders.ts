import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

const orderLineValidator = v.object({
  slug: v.string(),
  name: v.string(),
  quantity: v.number(),
  unitPriceAud: v.number(),
  lineTotalAud: v.number(),
});

const orderShippingValidator = v.object({
  fullName: v.string(),
  line1: v.string(),
  line2: v.optional(v.string()),
  city: v.string(),
  state: v.string(),
  postcode: v.string(),
  country: v.string(),
});

const orderStatusValidator = v.union(
  v.literal("pending"),
  v.literal("paid"),
  v.literal("failed"),
  v.literal("cancelled"),
);

/** Public projection for success page / status API — no shipping dump. */
const publicOrderValidator = v.object({
  _id: v.id("orders"),
  status: orderStatusValidator,
  email: v.string(),
  subtotalAud: v.number(),
  currencyCrypto: v.string(),
  lines: v.array(
    v.object({
      name: v.string(),
      quantity: v.number(),
      lineTotalAud: v.number(),
    }),
  ),
  paidAt: v.union(v.number(), v.null()),
  updatedAt: v.number(),
});

/**
 * Guest checkout: create a pending order.
 * Callable from the Next.js `/api/checkout/session` route via `fetchMutation`.
 * No auth — order IDs are unguessable Convex document IDs.
 */
export const create = mutation({
  args: {
    email: v.string(),
    shipping: orderShippingValidator,
    lines: v.array(orderLineValidator),
    subtotalAud: v.number(),
    currencyCrypto: v.string(),
    researchAck: v.literal(true),
  },
  returns: v.id("orders"),
  handler: async (ctx, args) => {
    if (args.lines.length === 0) {
      throw new Error("Order must include at least one line item");
    }
    if (args.subtotalAud <= 0) {
      throw new Error("Order total must be greater than zero");
    }
    if (!args.email.includes("@")) {
      throw new Error("A valid email is required");
    }

    const now = Date.now();
    return await ctx.db.insert("orders", {
      status: "pending",
      email: args.email.trim().toLowerCase(),
      shipping: args.shipping,
      lines: args.lines,
      subtotalAud: args.subtotalAud,
      currencyFiat: "aud",
      currencyCrypto: args.currencyCrypto.trim().toLowerCase(),
      researchAck: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Public get-by-id for the success page. Safe because Convex IDs are unguessable.
 * Returns null when missing. Never includes shipping address.
 */
export const get = query({
  args: {
    orderId: v.id("orders"),
  },
  returns: v.union(publicOrderValidator, v.null()),
  handler: async (ctx, args) => {
    const order = await ctx.db.get("orders", args.orderId);
    if (!order) return null;

    return {
      _id: order._id,
      status: order.status,
      email: order.email,
      subtotalAud: order.subtotalAud,
      currencyCrypto: order.currencyCrypto,
      lines: order.lines.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        lineTotalAud: line.lineTotalAud,
      })),
      paidAt: order.paidAt ?? null,
      updatedAt: order.updatedAt,
    };
  },
});

async function applyStatus(
  ctx: MutationCtx,
  orderId: Id<"orders">,
  status: "paid" | "failed" | "cancelled",
  moonpayTransactionId: string | undefined,
): Promise<Id<"orders"> | null> {
  const order = await ctx.db.get("orders", orderId);
  if (!order) return null;

  const now = Date.now();

  if (status === "paid") {
    if (order.status === "paid") {
      return orderId;
    }
    await ctx.db.patch("orders", orderId, {
      status: "paid",
      updatedAt: now,
      paidAt: now,
      moonpayTransactionId:
        moonpayTransactionId ?? order.moonpayTransactionId,
    });
    return orderId;
  }

  // failed / cancelled — only transition from pending
  if (order.status !== "pending") {
    return orderId;
  }

  await ctx.db.patch("orders", orderId, {
    status,
    updatedAt: now,
    moonpayTransactionId:
      moonpayTransactionId ?? order.moonpayTransactionId,
  });
  return orderId;
}

/** Backend-only: mark paid (scheduler / internal callers). */
export const markPaid = internalMutation({
  args: {
    orderId: v.id("orders"),
    moonpayTransactionId: v.optional(v.string()),
  },
  returns: v.union(v.id("orders"), v.null()),
  handler: async (ctx, args) => {
    return await applyStatus(
      ctx,
      args.orderId,
      "paid",
      args.moonpayTransactionId,
    );
  },
});

/** Backend-only: mark failed (scheduler / internal callers). */
export const markFailed = internalMutation({
  args: {
    orderId: v.id("orders"),
    moonpayTransactionId: v.optional(v.string()),
  },
  returns: v.union(v.id("orders"), v.null()),
  handler: async (ctx, args) => {
    return await applyStatus(
      ctx,
      args.orderId,
      "failed",
      args.moonpayTransactionId,
    );
  },
});

/**
 * Called from the Next.js MoonPay webhook after signature verification.
 * Requires ORDERS_WEBHOOK_SECRET (Convex env) to match the secret sent by Next.
 * Internal mutations cannot be called from outside Convex.
 */
export const updateStatusFromWebhook = mutation({
  args: {
    /** String from MoonPay externalTransactionId; normalized to Id<"orders">. */
    orderId: v.string(),
    status: v.union(v.literal("paid"), v.literal("failed")),
    moonpayTransactionId: v.optional(v.string()),
    webhookSecret: v.string(),
  },
  returns: v.union(v.id("orders"), v.null()),
  handler: async (ctx, args) => {
    const expected = process.env.ORDERS_WEBHOOK_SECRET;
    if (!expected || args.webhookSecret !== expected) {
      throw new Error("Unauthorized");
    }

    const orderId = ctx.db.normalizeId("orders", args.orderId);
    if (!orderId) {
      return null;
    }

    return await applyStatus(
      ctx,
      orderId,
      args.status,
      args.moonpayTransactionId,
    );
  },
});
