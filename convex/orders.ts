import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { applyMemberDiscount } from "./lib/memberDiscount";
import {
  quoteDiscountForEmailAndCode,
  redeemFirstOrderIfNeeded,
} from "./members";
import {
  releaseInventory,
  reserveInventory,
  settleInventory,
} from "./inventory";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { recomputeMemberRfm } from "./rfm";
import { recordCheckoutActivityForOrder } from "./lifecycle";
import { getCatalogueItem } from "./lib/catalogue";
import {
  constantTimeEqual,
  enforceRateLimit,
  requireOrdersSecret,
} from "./lib/security";

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
  v.literal("pending_verification"),
  v.literal("paid"),
  v.literal("packed"),
  v.literal("shipped"),
  v.literal("delivered"),
  v.literal("refunded"),
  v.literal("failed"),
  v.literal("cancelled"),
);

const paymentMethodValidator = v.union(
  v.literal("moonpay"),
  v.literal("stripe"),
  v.literal("crypto"),
  v.literal("bank"),
  v.literal("whatsapp"),
);

const cryptoCurrencyValidator = v.union(
  v.literal("usdc"),
  v.literal("eth"),
  v.literal("usdt"),
  v.literal("btc"),
);

const cryptoChainValidator = v.union(
  v.literal("ethereum"),
  v.literal("solana"),
  v.literal("bitcoin"),
);

const proofVerificationStatusValidator = v.union(
  v.literal("uploaded"),
  v.literal("pending_review"),
  v.literal("verified"),
  v.literal("rejected"),
);

const publicOrderValidator = v.object({
  _id: v.id("orders"),
  status: orderStatusValidator,
  paymentMethod: v.union(paymentMethodValidator, v.null()),
  subtotalAud: v.number(),
  subtotalBeforeDiscountAud: v.union(v.number(), v.null()),
  discountPercent: v.union(v.number(), v.null()),
  discountAud: v.union(v.number(), v.null()),
  currencyCrypto: v.union(v.string(), v.null()),
  stripePaymentStatus: v.union(v.string(), v.null()),
  cryptoCurrency: v.union(cryptoCurrencyValidator, v.null()),
  cryptoChain: v.union(cryptoChainValidator, v.null()),
  cryptoExpectedAmount: v.union(v.number(), v.null()),
  cryptoVerificationNote: v.union(v.string(), v.null()),
  proofVerificationStatus: v.union(
    proofVerificationStatusValidator,
    v.null(),
  ),
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

const paidEmailOrderValidator = v.object({
  _id: v.id("orders"),
  email: v.string(),
  shipping: orderShippingValidator,
  lines: v.array(orderLineValidator),
  subtotalAud: v.number(),
  paymentMethod: v.union(paymentMethodValidator, v.null()),
  createdAt: v.number(),
  paidAt: v.number(),
});

const pendingOrderLineValidator = v.object({
  slug: v.string(),
  quantity: v.number(),
});

export const createPending = mutation({
  args: {
    email: v.string(),
    shipping: orderShippingValidator,
    lines: v.array(pendingOrderLineValidator),
    paymentMethod: paymentMethodValidator,
    researchAck: v.literal(true),
    paymentSecret: v.string(),
    statusToken: v.string(),
    discountCode: v.optional(v.string()),
    cryptoCurrency: v.optional(cryptoCurrencyValidator),
    cryptoChain: v.optional(cryptoChainValidator),
    cryptoExpectedAmount: v.optional(v.number()),
    cryptoWalletAddress: v.optional(v.string()),
  },
  returns: v.id("orders"),
  handler: async (ctx, args) => {
    requireOrdersSecret(args.paymentSecret);
    if (args.lines.length === 0) {
      throw new Error("Order must include at least one line item");
    }
    if (!args.email.includes("@")) {
      throw new Error("A valid email is required");
    }
    if (args.statusToken.length < 32) {
      throw new Error("Invalid order status token");
    }
    if (
      args.paymentMethod === "crypto" &&
      (!args.cryptoCurrency ||
        !args.cryptoChain ||
        !args.cryptoExpectedAmount ||
        args.cryptoExpectedAmount <= 0 ||
        !args.cryptoWalletAddress)
    ) {
      throw new Error("Crypto quote details are required");
    }

    const email = args.email.trim().toLowerCase();
    await enforceRateLimit(ctx, "checkout:global", 120, 60_000);
    await enforceRateLimit(ctx, `checkout:${email}`, 8, 10 * 60_000);
    const lines = args.lines.map((line) => {
      if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) {
        throw new Error("Cart item quantity is invalid");
      }
      const item = getCatalogueItem(line.slug);
      if (!item) {
        throw new Error(`Unknown product: ${line.slug}`);
      }
      const lineTotalAud =
        Math.round(item.priceAud * line.quantity * 100) / 100;
      return {
        slug: line.slug,
        name: item.name,
        quantity: line.quantity,
        unitPriceAud: item.priceAud,
        lineTotalAud,
      };
    });
    const catalogueSubtotal =
      Math.round(
        lines.reduce((sum, line) => sum + line.lineTotalAud, 0) * 100,
      ) / 100;
    const quote = await quoteDiscountForEmailAndCode(
      ctx,
      email,
      args.discountCode,
    );
    const applied = applyMemberDiscount(catalogueSubtotal, quote.percent);

    const now = Date.now();
    await reserveInventory(ctx, lines);
    await recordCheckoutActivityForOrder(ctx, { email, lines });
    return await ctx.db.insert("orders", {
      status: "pending",
      email,
      shipping: args.shipping,
      lines,
      subtotalAud: applied.subtotalAud,
      subtotalBeforeDiscountAud: catalogueSubtotal,
      discountCode: quote.code ?? undefined,
      discountPercent: quote.percent > 0 ? quote.percent : undefined,
      discountAud: quote.percent > 0 ? applied.discountAud : undefined,
      memberId: quote.memberId ?? undefined,
      currencyFiat: "aud",
      paymentMethod: args.paymentMethod,
      currencyCrypto: args.cryptoCurrency,
      cryptoCurrency: args.cryptoCurrency,
      cryptoChain: args.cryptoChain,
      cryptoExpectedAmount: args.cryptoExpectedAmount,
      cryptoWalletAddress: args.cryptoWalletAddress,
      researchAck: true,
      statusToken: args.statusToken,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const get = query({
  args: {
    orderId: v.id("orders"),
    statusToken: v.optional(v.string()),
  },
  returns: v.union(publicOrderValidator, v.null()),
  handler: async (ctx, args) => {
    const order = await ctx.db.get("orders", args.orderId);
    if (!order) return null;
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get("users", userId) : null;
    const ownerEmail =
      typeof user?.email === "string" ? user.email.trim().toLowerCase() : null;
    const hasToken =
      typeof args.statusToken === "string" &&
      typeof order.statusToken === "string" &&
      constantTimeEqual(args.statusToken, order.statusToken);
    if (!hasToken && ownerEmail !== order.email) return null;

    return {
      _id: order._id,
      status: order.status,
      paymentMethod: order.paymentMethod ?? null,
      subtotalAud: order.subtotalAud,
      subtotalBeforeDiscountAud: order.subtotalBeforeDiscountAud ?? null,
      discountPercent: order.discountPercent ?? null,
      discountAud: order.discountAud ?? null,
      currencyCrypto: order.currencyCrypto ?? null,
      stripePaymentStatus: order.stripePaymentStatus ?? null,
      cryptoCurrency: order.cryptoCurrency ?? null,
      cryptoChain: order.cryptoChain ?? null,
      cryptoExpectedAmount: order.cryptoExpectedAmount ?? null,
      cryptoVerificationNote: order.cryptoVerificationNote ?? null,
      proofVerificationStatus: order.proofVerificationStatus ?? null,
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

export const getForPayment = query({
  args: {
    orderId: v.string(),
    paymentSecret: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("orders"),
      status: orderStatusValidator,
      paymentMethod: v.union(paymentMethodValidator, v.null()),
      subtotalAud: v.number(),
      cryptoCurrency: v.union(cryptoCurrencyValidator, v.null()),
      cryptoChain: v.union(cryptoChainValidator, v.null()),
      cryptoExpectedAmount: v.union(v.number(), v.null()),
      cryptoWalletAddress: v.union(v.string(), v.null()),
      proofStorageId: v.union(v.id("_storage"), v.null()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    requireOrdersSecret(args.paymentSecret);
    const orderId = ctx.db.normalizeId("orders", args.orderId);
    if (!orderId) return null;
    const order = await ctx.db.get("orders", orderId);
    if (!order) return null;
    return {
      _id: order._id,
      status: order.status,
      paymentMethod: order.paymentMethod ?? null,
      subtotalAud: order.subtotalAud,
      cryptoCurrency: order.cryptoCurrency ?? null,
      cryptoChain: order.cryptoChain ?? null,
      cryptoExpectedAmount: order.cryptoExpectedAmount ?? null,
      cryptoWalletAddress: order.cryptoWalletAddress ?? null,
      proofStorageId: order.proofStorageId ?? null,
    };
  },
});

export async function applyStatus(
  ctx: MutationCtx,
  orderId: Id<"orders">,
  status: "paid" | "failed" | "cancelled",
): Promise<Id<"orders"> | null> {
  const order = await ctx.db.get("orders", orderId);
  if (!order) return null;
  if (order.status === "paid" && status === "paid") {
    await settleInventory(ctx, order);
    return orderId;
  }
  if (status !== "paid" && !["pending", "pending_verification"].includes(order.status)) {
    return orderId;
  }

  const now = Date.now();
  await ctx.db.patch("orders", orderId, {
    status,
    updatedAt: now,
    paidAt: status === "paid" ? now : order.paidAt,
  });
  if (status === "paid") {
    await applyPaidSideEffects(ctx, orderId, now);
  } else {
    const stoppedOrder = await ctx.db.get("orders", orderId);
    if (stoppedOrder) await releaseInventory(ctx, stoppedOrder);
  }
  return orderId;
}

async function applyPaidSideEffects(
  ctx: MutationCtx,
  orderId: Id<"orders">,
  now: number,
): Promise<void> {
  const paidOrder = await ctx.db.get("orders", orderId);
  if (!paidOrder) return;
  await settleInventory(ctx, paidOrder);
  await redeemFirstOrderIfNeeded(ctx, paidOrder);
  if (paidOrder.memberId) {
    await recomputeMemberRfm(ctx, paidOrder.memberId, now);
    await ctx.scheduler.runAfter(0, internal.klaviyo.syncMember, {
      memberId: paidOrder.memberId,
    });
  }
  if (
    paidOrder.paymentMethod !== "moonpay" &&
    paidOrder.paymentMethod !== "whatsapp"
  ) {
    await ctx.scheduler.runAfter(0, internal.purchaseAnalytics.capture, { orderId });
  }
  await ctx.scheduler.runAfter(0, internal.lifecycle.enqueuePostPurchase, { orderId });
  await ctx.scheduler.runAfter(0, internal.klaviyo.syncPlacedOrder, { orderId });
}

export const attachStripeIntent = mutation({
  args: {
    orderId: v.string(),
    paymentIntentId: v.string(),
    paymentStatus: v.string(),
    paymentSecret: v.string(),
  },
  returns: v.union(v.id("orders"), v.null()),
  handler: async (ctx, args) => {
    requireOrdersSecret(args.paymentSecret);
    const orderId = ctx.db.normalizeId("orders", args.orderId);
    if (!orderId) return null;
    const order = await ctx.db.get("orders", orderId);
    if (!order || order.paymentMethod !== "stripe") return null;
    if (
      order.stripePaymentIntentId &&
      order.stripePaymentIntentId !== args.paymentIntentId
    ) {
      throw new Error("Order already has a different PaymentIntent");
    }
    await ctx.db.patch("orders", orderId, {
      stripePaymentIntentId: args.paymentIntentId,
      stripePaymentStatus: args.paymentStatus,
      updatedAt: Date.now(),
    });
    return orderId;
  },
});

export const updateStripeFromWebhook = mutation({
  args: {
    orderId: v.string(),
    paymentIntentId: v.string(),
    paymentStatus: v.string(),
    paid: v.boolean(),
    failed: v.boolean(),
    paymentSecret: v.string(),
  },
  returns: v.union(v.id("orders"), v.null()),
  handler: async (ctx, args) => {
    requireOrdersSecret(args.paymentSecret);
    const orderId = ctx.db.normalizeId("orders", args.orderId);
    if (!orderId) return null;
    const order = await ctx.db.get("orders", orderId);
    if (!order || order.paymentMethod !== "stripe") return null;
    if (
      order.stripePaymentIntentId &&
      order.stripePaymentIntentId !== args.paymentIntentId
    ) {
      throw new Error("PaymentIntent does not match this order");
    }

    await ctx.db.patch("orders", orderId, {
      stripePaymentIntentId: args.paymentIntentId,
      stripePaymentStatus: args.paymentStatus,
      updatedAt: Date.now(),
    });
    if (args.paid) return await applyStatus(ctx, orderId, "paid");
    if (args.failed) return await applyStatus(ctx, orderId, "failed");
    return orderId;
  },
});

export const updateMoonPayFromBridge = mutation({
  args: {
    orderId: v.string(),
    status: v.union(v.literal("paid"), v.literal("failed")),
    moonpayTransactionId: v.optional(v.string()),
    paymentSecret: v.string(),
  },
  returns: v.union(v.id("orders"), v.null()),
  handler: async (ctx, args) => {
    requireOrdersSecret(args.paymentSecret);
    const orderId = ctx.db.normalizeId("orders", args.orderId);
    if (!orderId) return null;

    const order = await ctx.db.get("orders", orderId);
    if (!order || order.paymentMethod !== "moonpay") return null;
    if (
      order.moonpayTransactionId &&
      args.moonpayTransactionId &&
      order.moonpayTransactionId !== args.moonpayTransactionId
    ) {
      throw new Error("MoonPay transaction does not match this order");
    }

    if (args.moonpayTransactionId && !order.moonpayTransactionId) {
      await ctx.db.patch("orders", orderId, {
        moonpayTransactionId: args.moonpayTransactionId,
        updatedAt: Date.now(),
      });
    }
    return await applyStatus(ctx, orderId, args.status);
  },
});

export const updateFromPaymentBridge = mutation({
  args: {
    orderId: v.string(),
    paymentMethod: v.union(v.literal("stripe"), v.literal("moonpay")),
    status: v.union(v.literal("paid"), v.literal("failed")),
    transactionId: v.optional(v.string()),
    paymentSecret: v.string(),
  },
  returns: v.union(v.id("orders"), v.null()),
  handler: async (ctx, args) => {
    requireOrdersSecret(args.paymentSecret);
    const orderId = ctx.db.normalizeId("orders", args.orderId);
    if (!orderId) return null;
    const order = await ctx.db.get("orders", orderId);
    if (!order || order.paymentMethod !== args.paymentMethod) return null;

    if (args.paymentMethod === "stripe") {
      if (
        order.stripePaymentIntentId &&
        args.transactionId &&
        order.stripePaymentIntentId !== args.transactionId
      ) {
        throw new Error("Stripe transaction does not match this order");
      }
      await ctx.db.patch("orders", orderId, {
        stripePaymentIntentId:
          args.transactionId ?? order.stripePaymentIntentId,
        stripePaymentStatus: args.status,
        updatedAt: Date.now(),
      });
    } else if (args.transactionId) {
      if (
        order.moonpayTransactionId &&
        order.moonpayTransactionId !== args.transactionId
      ) {
        throw new Error("MoonPay transaction does not match this order");
      }
      await ctx.db.patch("orders", orderId, {
        moonpayTransactionId: args.transactionId,
        updatedAt: Date.now(),
      });
    }
    return await applyStatus(ctx, orderId, args.status);
  },
});

export const generateProofUploadUrl = mutation({
  args: { paymentSecret: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    requireOrdersSecret(args.paymentSecret);
    return await ctx.storage.generateUploadUrl();
  },
});

export const attachPaymentProof = mutation({
  args: {
    orderId: v.string(),
    storageId: v.id("_storage"),
    paymentSecret: v.string(),
  },
  returns: v.union(v.id("orders"), v.null()),
  handler: async (ctx, args) => {
    requireOrdersSecret(args.paymentSecret);
    const orderId = ctx.db.normalizeId("orders", args.orderId);
    if (!orderId) return null;
    const order = await ctx.db.get("orders", orderId);
    if (
      !order ||
      (order.paymentMethod !== "crypto" && order.paymentMethod !== "bank") ||
      (order.status !== "pending" && order.status !== "pending_verification")
    ) {
      return null;
    }
    if (order.proofStorageId && order.proofStorageId !== args.storageId) {
      await ctx.storage.delete(order.proofStorageId);
    }
    await ctx.db.patch("orders", orderId, {
      proofStorageId: args.storageId,
      proofVerificationStatus: "uploaded",
      updatedAt: Date.now(),
    });
    return orderId;
  },
});

export const getPaymentProofUrl = query({
  args: {
    orderId: v.string(),
    storageId: v.id("_storage"),
    paymentSecret: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    requireOrdersSecret(args.paymentSecret);
    const orderId = ctx.db.normalizeId("orders", args.orderId);
    if (!orderId) return null;
    const order = await ctx.db.get("orders", orderId);
    if (!order || order.proofStorageId !== args.storageId) return null;
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const finalizePaymentProof = mutation({
  args: {
    orderId: v.string(),
    storageId: v.id("_storage"),
    verificationStatus: proofVerificationStatusValidator,
    txid: v.optional(v.string()),
    reference: v.optional(v.string()),
    timestamp: v.optional(v.string()),
    verificationNote: v.string(),
    paymentSecret: v.string(),
  },
  returns: v.union(v.id("orders"), v.null()),
  handler: async (ctx, args) => {
    requireOrdersSecret(args.paymentSecret);
    const orderId = ctx.db.normalizeId("orders", args.orderId);
    if (!orderId) return null;
    const order = await ctx.db.get("orders", orderId);
    if (
      !order ||
      order.proofStorageId !== args.storageId ||
      (order.paymentMethod !== "crypto" && order.paymentMethod !== "bank")
    ) {
      return null;
    }
    if (args.verificationStatus === "verified" && order.paymentMethod !== "crypto") {
      throw new Error("Bank transfer proofs require manual settlement review");
    }

    const normalizedTxid = args.txid?.trim().toLowerCase();
    if (normalizedTxid) {
      const duplicate = await ctx.db
        .query("orders")
        .withIndex("by_crypto_txid", (q) => q.eq("cryptoTxid", normalizedTxid))
        .unique();
      if (duplicate && duplicate._id !== orderId) {
        throw new Error("This transaction has already been submitted");
      }
    }

    const now = Date.now();
    const paid = args.verificationStatus === "verified";
    await ctx.db.patch("orders", orderId, {
      status: paid
        ? "paid"
        : "pending_verification",
      proofVerificationStatus: args.verificationStatus,
      proofReference: args.reference,
      proofTimestamp: args.timestamp,
      cryptoTxid: normalizedTxid,
      cryptoVerifiedAt: paid ? now : undefined,
      cryptoVerificationNote: args.verificationNote,
      updatedAt: now,
      paidAt: paid ? now : order.paidAt,
    });
    if (paid) {
      await applyPaidSideEffects(ctx, orderId, now);
    }
    return orderId;
  },
});

export const submitCryptoVerification = mutation({
  args: {
    orderId: v.string(),
    txid: v.string(),
    verified: v.boolean(),
    verificationNote: v.string(),
    paymentSecret: v.string(),
  },
  returns: v.union(v.id("orders"), v.null()),
  handler: async (ctx, args) => {
    requireOrdersSecret(args.paymentSecret);
    const orderId = ctx.db.normalizeId("orders", args.orderId);
    if (!orderId) return null;
    const order = await ctx.db.get("orders", orderId);
    if (!order || order.paymentMethod !== "crypto") return null;

    const normalizedTxid = args.txid.trim().toLowerCase();
    if (order.status === "paid") {
      if (order.cryptoTxid === normalizedTxid) return orderId;
      throw new Error("This order is already paid");
    }
    const duplicate = await ctx.db
      .query("orders")
      .withIndex("by_crypto_txid", (q) => q.eq("cryptoTxid", normalizedTxid))
      .unique();
    if (duplicate && duplicate._id !== orderId) {
      throw new Error("This transaction has already been submitted");
    }

    const now = Date.now();
    await ctx.db.patch("orders", orderId, {
      status: args.verified ? "paid" : "pending_verification",
      cryptoTxid: normalizedTxid,
      cryptoVerifiedAt: args.verified ? now : undefined,
      cryptoVerificationNote: args.verificationNote,
      updatedAt: now,
      paidAt: args.verified ? now : order.paidAt,
    });
    if (args.verified) {
      await applyPaidSideEffects(ctx, orderId, now);
    }
    return orderId;
  },
});

export const claimPaidEmail = mutation({
  args: {
    orderId: v.string(),
    claimToken: v.string(),
    paymentSecret: v.string(),
  },
  returns: v.union(paidEmailOrderValidator, v.null()),
  handler: async (ctx, args) => {
    requireOrdersSecret(args.paymentSecret);
    const orderId = ctx.db.normalizeId("orders", args.orderId);
    if (!orderId) return null;

    const order = await ctx.db.get("orders", orderId);
    if (!order || order.status !== "paid" || !order.paidAt) return null;
    if (order.confirmationEmailSentAt) return null;

    const now = Date.now();
    const claimIsFresh =
      order.confirmationEmailClaimedAt !== undefined &&
      now - order.confirmationEmailClaimedAt < 15 * 60 * 1000;
    if (order.confirmationEmailClaimToken && claimIsFresh) return null;

    await ctx.db.patch("orders", orderId, {
      confirmationEmailClaimedAt: now,
      confirmationEmailClaimToken: args.claimToken,
    });

    return {
      _id: order._id,
      email: order.email,
      shipping: order.shipping,
      lines: order.lines,
      subtotalAud: order.subtotalAud,
      paymentMethod: order.paymentMethod ?? null,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
    };
  },
});

export const completePaidEmail = mutation({
  args: {
    orderId: v.string(),
    claimToken: v.string(),
    sent: v.boolean(),
    paymentSecret: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireOrdersSecret(args.paymentSecret);
    const orderId = ctx.db.normalizeId("orders", args.orderId);
    if (!orderId) return null;

    const order = await ctx.db.get("orders", orderId);
    if (!order || order.confirmationEmailClaimToken !== args.claimToken) {
      return null;
    }

    await ctx.db.patch("orders", orderId, {
      confirmationEmailClaimedAt: undefined,
      confirmationEmailClaimToken: undefined,
      confirmationEmailSentAt: args.sent
        ? Date.now()
        : order.confirmationEmailSentAt,
    });
    return null;
  },
});

export const markPaid = internalMutation({
  args: { orderId: v.id("orders") },
  returns: v.union(v.id("orders"), v.null()),
  handler: async (ctx, args) => await applyStatus(ctx, args.orderId, "paid"),
});

export const markFailed = internalMutation({
  args: { orderId: v.id("orders") },
  returns: v.union(v.id("orders"), v.null()),
  handler: async (ctx, args) => await applyStatus(ctx, args.orderId, "failed"),
});

export const claimPurchaseEvent = mutation({
  args: {
    orderId: v.string(),
    paymentSecret: v.string(),
  },
  returns: v.union(
    v.object({
      transactionId: v.string(),
      value: v.number(),
      valueBeforeDiscount: v.number(),
      discount: v.number(),
      discountPercent: v.number(),
      paymentType: v.string(),
      memberId: v.union(v.string(), v.null()),
      items: v.array(v.object({
        item_id: v.string(),
        item_name: v.string(),
        price: v.number(),
        quantity: v.number(),
      })),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    requireOrdersSecret(args.paymentSecret);
    const orderId = ctx.db.normalizeId("orders", args.orderId);
    if (!orderId) return null;
    const order = await ctx.db.get("orders", orderId);
    if (
      !order ||
      !["paid", "packed", "shipped", "delivered", "refunded"].includes(order.status) ||
      order.purchaseTrackedAt !== undefined
    ) {
      return null;
    }
    await ctx.db.patch("orders", orderId, { purchaseTrackedAt: Date.now() });
    return {
      transactionId: String(order._id),
      value: order.subtotalAud,
      valueBeforeDiscount: order.subtotalBeforeDiscountAud ?? order.subtotalAud,
      discount: order.discountAud ?? 0,
      discountPercent: order.discountPercent ?? 0,
      paymentType: order.paymentMethod ?? "unknown",
      memberId: order.memberId ? String(order.memberId) : null,
      items: order.lines.map((line) => ({
        item_id: line.slug,
        item_name: line.name,
        price: line.unitPriceAud,
        quantity: line.quantity,
      })),
    };
  },
});

const purchaseEventValidator = v.object({
  transactionId: v.string(),
  value: v.number(),
  valueBeforeDiscount: v.number(),
  discount: v.number(),
  discountPercent: v.number(),
  paymentType: v.string(),
  memberId: v.union(v.string(), v.null()),
  items: v.array(v.object({
    item_id: v.string(),
    item_name: v.string(),
    price: v.number(),
    quantity: v.number(),
  })),
});

export const getPurchaseEvent = internalQuery({
  args: { orderId: v.id("orders") },
  returns: v.union(purchaseEventValidator, v.null()),
  handler: async (ctx, args) => {
    const order = await ctx.db.get("orders", args.orderId);
    if (
      !order ||
      !["paid", "packed", "shipped", "delivered", "refunded"].includes(order.status) ||
      order.purchaseTrackedAt !== undefined
    ) {
      return null;
    }
    return {
      transactionId: String(order._id),
      value: order.subtotalAud,
      valueBeforeDiscount: order.subtotalBeforeDiscountAud ?? order.subtotalAud,
      discount: order.discountAud ?? 0,
      discountPercent: order.discountPercent ?? 0,
      paymentType: order.paymentMethod ?? "unknown",
      memberId: order.memberId ? String(order.memberId) : null,
      items: order.lines.map((line) => ({
        item_id: line.slug,
        item_name: line.name,
        price: line.unitPriceAud,
        quantity: line.quantity,
      })),
    };
  },
});

export const markPurchaseTracked = internalMutation({
  args: { orderId: v.id("orders") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const order = await ctx.db.get("orders", args.orderId);
    if (order && order.purchaseTrackedAt === undefined) {
      await ctx.db.patch("orders", args.orderId, { purchaseTrackedAt: Date.now() });
    }
    return null;
  },
});

export const getRefundEvent = internalQuery({
  args: { orderId: v.id("orders") },
  returns: v.union(
    v.object({
      transactionId: v.string(),
      value: v.number(),
      memberId: v.union(v.string(), v.null()),
      paymentType: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const order = await ctx.db.get("orders", args.orderId);
    if (
      !order ||
      order.status !== "refunded" ||
      order.refundAud === undefined ||
      order.refundTrackedAt !== undefined
    ) {
      return null;
    }
    return {
      transactionId: String(order._id),
      value: order.refundAud,
      memberId: order.memberId ? String(order.memberId) : null,
      paymentType: order.paymentMethod ?? "unknown",
    };
  },
});

export const markRefundTracked = internalMutation({
  args: { orderId: v.id("orders") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const order = await ctx.db.get("orders", args.orderId);
    if (
      order?.status === "refunded" &&
      order.refundTrackedAt === undefined
    ) {
      await ctx.db.patch("orders", order._id, { refundTrackedAt: Date.now() });
    }
    return null;
  },
});
