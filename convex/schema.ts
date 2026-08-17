import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const orderStatus = v.union(
  v.literal("pending"),
  v.literal("pending_verification"),
  v.literal("paid"),
  v.literal("failed"),
  v.literal("cancelled"),
);

const paymentMethod = v.union(
  v.literal("moonpay"),
  v.literal("stripe"),
  v.literal("crypto"),
  v.literal("bank"),
  v.literal("whatsapp"),
);

const orderLine = v.object({
  slug: v.string(),
  name: v.string(),
  quantity: v.number(),
  unitPriceAud: v.number(),
  lineTotalAud: v.number(),
});

const orderShipping = v.object({
  fullName: v.string(),
  line1: v.string(),
  line2: v.optional(v.string()),
  city: v.string(),
  state: v.string(),
  postcode: v.string(),
  country: v.string(),
});

export default defineSchema({
  orders: defineTable({
    status: orderStatus,
    email: v.string(),
    shipping: orderShipping,
    lines: v.array(orderLine),
    subtotalAud: v.number(),
    currencyFiat: v.literal("aud"),
    paymentMethod: v.optional(paymentMethod),
    /** Kept optional for compatibility with orders created before direct rails. */
    currencyCrypto: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    stripePaymentStatus: v.optional(v.string()),
    cryptoCurrency: v.optional(
      v.union(v.literal("eth"), v.literal("usdt"), v.literal("btc")),
    ),
    cryptoChain: v.optional(
      v.union(v.literal("ethereum"), v.literal("bitcoin")),
    ),
    cryptoExpectedAmount: v.optional(v.number()),
    cryptoWalletAddress: v.optional(v.string()),
    cryptoTxid: v.optional(v.string()),
    cryptoVerifiedAt: v.optional(v.number()),
    cryptoVerificationNote: v.optional(v.string()),
    /** Legacy field retained so existing MoonPay-era documents still validate. */
    moonpayTransactionId: v.optional(v.string()),
    researchAck: v.literal(true),
    createdAt: v.number(),
    updatedAt: v.number(),
    paidAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_email", ["email"])
    .index("by_stripe_payment_intent", ["stripePaymentIntentId"])
    .index("by_crypto_txid", ["cryptoTxid"]),
});
