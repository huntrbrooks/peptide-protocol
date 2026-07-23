import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const orderStatus = v.union(
  v.literal("pending"),
  v.literal("paid"),
  v.literal("failed"),
  v.literal("cancelled"),
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
    /** Crypto settlement currency expected via MoonPay (e.g. usdc). */
    currencyCrypto: v.string(),
    researchAck: v.literal(true),
    moonpayTransactionId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    paidAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_email", ["email"]),
});
