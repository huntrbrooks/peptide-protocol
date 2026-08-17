import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
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
  v.literal("pending_verification"),
  v.literal("paid"),
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
  email: v.string(),
  subtotalAud: v.number(),
  currencyCrypto: v.union(v.string(), v.null()),
  moonpayTransactionId: v.union(v.string(), v.null()),
  stripePaymentStatus: v.union(v.string(), v.null()),
  cryptoCurrency: v.union(cryptoCurrencyValidator, v.null()),
  cryptoChain: v.union(cryptoChainValidator, v.null()),
  cryptoExpectedAmount: v.union(v.number(), v.null()),
  cryptoWalletAddress: v.union(v.string(), v.null()),
  cryptoTxid: v.union(v.string(), v.null()),
  cryptoVerifiedAt: v.union(v.number(), v.null()),
  cryptoVerificationNote: v.union(v.string(), v.null()),
  proofStorageId: v.union(v.id("_storage"), v.null()),
  proofVerificationStatus: v.union(
    proofVerificationStatusValidator,
    v.null(),
  ),
  proofReference: v.union(v.string(), v.null()),
  proofTimestamp: v.union(v.string(), v.null()),
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

function requirePaymentSecret(secret: string): void {
  const expected = process.env.ORDERS_WEBHOOK_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Unauthorized");
  }
}

export const createPending = mutation({
  args: {
    email: v.string(),
    shipping: orderShippingValidator,
    lines: v.array(orderLineValidator),
    subtotalAud: v.number(),
    paymentMethod: paymentMethodValidator,
    researchAck: v.literal(true),
    cryptoCurrency: v.optional(cryptoCurrencyValidator),
    cryptoChain: v.optional(cryptoChainValidator),
    cryptoExpectedAmount: v.optional(v.number()),
    cryptoWalletAddress: v.optional(v.string()),
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

    const now = Date.now();
    return await ctx.db.insert("orders", {
      status: "pending",
      email: args.email.trim().toLowerCase(),
      shipping: args.shipping,
      lines: args.lines,
      subtotalAud: args.subtotalAud,
      currencyFiat: "aud",
      paymentMethod: args.paymentMethod,
      currencyCrypto: args.cryptoCurrency,
      cryptoCurrency: args.cryptoCurrency,
      cryptoChain: args.cryptoChain,
      cryptoExpectedAmount: args.cryptoExpectedAmount,
      cryptoWalletAddress: args.cryptoWalletAddress,
      researchAck: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const get = query({
  args: { orderId: v.id("orders") },
  returns: v.union(publicOrderValidator, v.null()),
  handler: async (ctx, args) => {
    const order = await ctx.db.get("orders", args.orderId);
    if (!order) return null;

    return {
      _id: order._id,
      status: order.status,
      paymentMethod: order.paymentMethod ?? null,
      email: order.email,
      subtotalAud: order.subtotalAud,
      currencyCrypto: order.currencyCrypto ?? null,
      moonpayTransactionId: order.moonpayTransactionId ?? null,
      stripePaymentStatus: order.stripePaymentStatus ?? null,
      cryptoCurrency: order.cryptoCurrency ?? null,
      cryptoChain: order.cryptoChain ?? null,
      cryptoExpectedAmount: order.cryptoExpectedAmount ?? null,
      cryptoWalletAddress: order.cryptoWalletAddress ?? null,
      cryptoTxid: order.cryptoTxid ?? null,
      cryptoVerifiedAt: order.cryptoVerifiedAt ?? null,
      cryptoVerificationNote: order.cryptoVerificationNote ?? null,
      proofStorageId: order.proofStorageId ?? null,
      proofVerificationStatus: order.proofVerificationStatus ?? null,
      proofReference: order.proofReference ?? null,
      proofTimestamp: order.proofTimestamp ?? null,
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
): Promise<Id<"orders"> | null> {
  const order = await ctx.db.get("orders", orderId);
  if (!order) return null;
  if (order.status === "paid") return orderId;
  if (status !== "paid" && !["pending", "pending_verification"].includes(order.status)) {
    return orderId;
  }

  const now = Date.now();
  await ctx.db.patch("orders", orderId, {
    status,
    updatedAt: now,
    paidAt: status === "paid" ? now : order.paidAt,
  });
  return orderId;
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
    requirePaymentSecret(args.paymentSecret);
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
    requirePaymentSecret(args.paymentSecret);
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
    requirePaymentSecret(args.paymentSecret);
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
    requirePaymentSecret(args.paymentSecret);
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
    requirePaymentSecret(args.paymentSecret);
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
    requirePaymentSecret(args.paymentSecret);
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
    requirePaymentSecret(args.paymentSecret);
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
    requirePaymentSecret(args.paymentSecret);
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
    requirePaymentSecret(args.paymentSecret);
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
    requirePaymentSecret(args.paymentSecret);
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
    requirePaymentSecret(args.paymentSecret);
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
