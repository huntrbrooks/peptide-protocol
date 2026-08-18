import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const orderStatus = v.union(
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

const proofVerificationStatus = v.union(
  v.literal("uploaded"),
  v.literal("pending_review"),
  v.literal("verified"),
  v.literal("rejected"),
);

export default defineSchema({
  ...authTables,
  members: defineTable({
    email: v.string(),
    authUserId: v.optional(v.id("users")),
    code: v.string(),
    marketingConsent: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("opted_in"),
        v.literal("opted_out"),
      ),
    ),
    marketingConsentAt: v.optional(v.number()),
    analyticsConsent: v.optional(v.boolean()),
    firstTouch: v.optional(v.string()),
    lastTouch: v.optional(v.string()),
    firstOrderRedeemedAt: v.optional(v.number()),
    welcomeEmailSentAt: v.optional(v.number()),
    ltvAud: v.optional(v.number()),
    orderCount: v.optional(v.number()),
    firstPaidAt: v.optional(v.number()),
    lastPaidAt: v.optional(v.number()),
    rfmRecencyScore: v.optional(v.number()),
    rfmFrequencyScore: v.optional(v.number()),
    rfmMonetaryScore: v.optional(v.number()),
    rfmSegment: v.optional(
      v.union(
        v.literal("Champions"),
        v.literal("Loyal"),
        v.literal("New"),
        v.literal("At Risk"),
        v.literal("Lost"),
      ),
    ),
    churned180: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_code", ["code"])
    .index("by_auth_user", ["authUserId"])
    .index("by_created", ["createdAt"])
    .index("by_rfm_segment", ["rfmSegment"]),
  orders: defineTable({
    status: orderStatus,
    email: v.string(),
    shipping: orderShipping,
    lines: v.array(orderLine),
    subtotalAud: v.number(),
    subtotalBeforeDiscountAud: v.optional(v.number()),
    discountCode: v.optional(v.string()),
    discountPercent: v.optional(v.number()),
    discountAud: v.optional(v.number()),
    memberId: v.optional(v.id("members")),
    currencyFiat: v.literal("aud"),
    paymentMethod: v.optional(paymentMethod),
    /** Kept optional for compatibility with orders created before direct rails. */
    currencyCrypto: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    stripePaymentStatus: v.optional(v.string()),
    cryptoCurrency: v.optional(
      v.union(
        v.literal("usdc"),
        v.literal("eth"),
        v.literal("usdt"),
        v.literal("btc"),
      ),
    ),
    cryptoChain: v.optional(
      v.union(
        v.literal("ethereum"),
        v.literal("solana"),
        v.literal("bitcoin"),
      ),
    ),
    cryptoExpectedAmount: v.optional(v.number()),
    cryptoWalletAddress: v.optional(v.string()),
    cryptoTxid: v.optional(v.string()),
    cryptoVerifiedAt: v.optional(v.number()),
    cryptoVerificationNote: v.optional(v.string()),
    proofStorageId: v.optional(v.id("_storage")),
    proofVerificationStatus: v.optional(proofVerificationStatus),
    proofReference: v.optional(v.string()),
    proofTimestamp: v.optional(v.string()),
    /** Legacy field retained so existing MoonPay-era documents still validate. */
    moonpayTransactionId: v.optional(v.string()),
    researchAck: v.literal(true),
    createdAt: v.number(),
    updatedAt: v.number(),
    paidAt: v.optional(v.number()),
    packedAt: v.optional(v.number()),
    shippedAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    refundedAt: v.optional(v.number()),
    refundAud: v.optional(v.number()),
    trackingNumber: v.optional(v.string()),
    internalNotes: v.optional(v.string()),
    purchaseTrackedAt: v.optional(v.number()),
    refundTrackedAt: v.optional(v.number()),
    inventorySettledAt: v.optional(v.number()),
    inventoryReleasedAt: v.optional(v.number()),
    statusToken: v.optional(v.string()),
    confirmationEmailClaimedAt: v.optional(v.number()),
    confirmationEmailClaimToken: v.optional(v.string()),
    confirmationEmailSentAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_email", ["email"])
    .index("by_member", ["memberId"])
    .index("by_created", ["createdAt"])
    .index("by_paid_at", ["paidAt"])
    .index("by_stripe_payment_intent", ["stripePaymentIntentId"])
    .index("by_crypto_txid", ["cryptoTxid"]),
  staffRoles: defineTable({
    userId: v.id("users"),
    email: v.string(),
    role: v.union(
      v.literal("owner"),
      v.literal("ops"),
      v.literal("support"),
      v.literal("view_only"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"]),
  consentLedger: defineTable({
    memberId: v.id("members"),
    category: v.union(v.literal("marketing"), v.literal("analytics")),
    state: v.union(v.literal("pending"), v.literal("opted_in"), v.literal("opted_out")),
    source: v.string(),
    createdAt: v.number(),
  }).index("by_member", ["memberId"]),
  addresses: defineTable({
    memberId: v.id("members"),
    label: v.string(),
    fullName: v.string(),
    line1: v.string(),
    line2: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    postcode: v.string(),
    country: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_member", ["memberId"]),
  lifecycleActivities: defineTable({
    memberId: v.id("members"),
    email: v.string(),
    kind: v.union(
      v.literal("abandoned_cart"),
      v.literal("post_purchase"),
      v.literal("win_back"),
    ),
    sourceKey: v.string(),
    orderId: v.optional(v.id("orders")),
    lines: v.array(orderLine),
    occurredAt: v.number(),
    nextSendAt: v.number(),
    stage: v.number(),
    claimedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_due", ["nextSendAt"])
    .index("by_source_key", ["sourceKey"])
    .index("by_member", ["memberId"]),
  emailEvents: defineTable({
    memberId: v.id("members"),
    orderId: v.optional(v.id("orders")),
    activityId: v.optional(v.id("lifecycleActivities")),
    type: v.string(),
    idempotencyKey: v.string(),
    providerMessageId: v.optional(v.string()),
    status: v.union(v.literal("sent"), v.literal("failed")),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_idempotency_key", ["idempotencyKey"])
    .index("by_member", ["memberId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),
  inventory: defineTable({
    slug: v.string(),
    stockCode: v.string(),
    onHand: v.number(),
    reserved: v.number(),
    lowStockThreshold: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_stock_code", ["stockCode"]),
  memberLinkVerifications: defineTable({
    memberId: v.id("members"),
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),
  rateLimits: defineTable({
    key: v.string(),
    count: v.number(),
    windowStartedAt: v.number(),
  }).index("by_key", ["key"]),
  contactMessages: defineTable({
    name: v.string(),
    email: v.string(),
    message: v.string(),
    createdAt: v.number(),
    sentAt: v.optional(v.number()),
  }).index("by_created", ["createdAt"]),
  auditLogs: defineTable({
    staffUserId: v.id("users"),
    staffEmail: v.string(),
    action: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    detail: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_staff", ["staffUserId"])
    .index("by_created", ["createdAt"]),
  wishlists: defineTable({
    memberId: v.id("members"),
    productSlug: v.string(),
    createdAt: v.number(),
  })
    .index("by_member", ["memberId"])
    .index("by_member_product", ["memberId", "productSlug"]),
  dailyStats: defineTable({
    dateKey: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    grossGmvAud: v.number(),
    netGmvAud: v.number(),
    orderCount: v.number(),
    memberOrderCount: v.number(),
    memberAttachPercent: v.number(),
    rfmCounts: v.object({
      champions: v.number(),
      loyal: v.number(),
      new: v.number(),
      atRisk: v.number(),
      lost: v.number(),
    }),
    createdAt: v.number(),
  })
    .index("by_date_key", ["dateKey"])
    .index("by_created", ["createdAt"]),
  rfmSegmentStats: defineTable({
    segment: v.union(
      v.literal("Champions"),
      v.literal("Loyal"),
      v.literal("New"),
      v.literal("At Risk"),
      v.literal("Lost"),
    ),
    count: v.number(),
    updatedAt: v.number(),
  }).index("by_segment", ["segment"]),
});
