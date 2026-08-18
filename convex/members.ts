import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { generateMemberCode } from "./lib/memberCodes";
import {
  FIRST_ORDER_PERCENT,
  MEMBER_RATE_PERCENT,
  applyMemberDiscount,
  isValidMemberEmail,
  normalizeMemberCode,
  normalizeMemberEmail,
} from "./lib/memberDiscount";
import { enforceRateLimit, requireOrdersSecret } from "./lib/security";

const quoteValidator = v.object({
  percent: v.number(),
  code: v.union(v.string(), v.null()),
  memberId: v.union(v.id("members"), v.null()),
  firstOrder: v.boolean(),
  discountAud: v.number(),
  subtotalAud: v.number(),
});

const addressFieldsValidator = {
  label: v.string(),
  fullName: v.string(),
  line1: v.string(),
  line2: v.optional(v.string()),
  city: v.string(),
  state: v.string(),
  postcode: v.string(),
  country: v.string(),
};

async function getAuthenticatedMember(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"members"> | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  const byAuth = await ctx.db
    .query("members")
    .withIndex("by_auth_user", (q) => q.eq("authUserId", userId))
    .unique();
  return byAuth;
}

async function findMemberByEmail(
  ctx: QueryCtx | MutationCtx,
  email: string,
): Promise<Doc<"members"> | null> {
  return await ctx.db
    .query("members")
    .withIndex("by_email", (q) => q.eq("email", email))
    .unique();
}

async function findMemberByCode(
  ctx: QueryCtx | MutationCtx,
  code: string,
): Promise<Doc<"members"> | null> {
  return await ctx.db
    .query("members")
    .withIndex("by_code", (q) => q.eq("code", code))
    .unique();
}

async function hasOpenFirstOrderHold(
  ctx: QueryCtx | MutationCtx,
  memberId: Id<"members">,
): Promise<boolean> {
  const orders = await ctx.db
    .query("orders")
    .withIndex("by_member", (q) => q.eq("memberId", memberId))
    .collect();
  return orders.some(
    (order) =>
      (order.status === "pending" ||
        order.status === "pending_verification") &&
      order.discountPercent === FIRST_ORDER_PERCENT,
  );
}

export async function percentForMember(
  ctx: QueryCtx | MutationCtx,
  member: Doc<"members">,
): Promise<{ percent: number; firstOrder: boolean }> {
  if (member.firstOrderRedeemedAt !== undefined) {
    return { percent: MEMBER_RATE_PERCENT, firstOrder: false };
  }
  if (await hasOpenFirstOrderHold(ctx, member._id)) {
    return { percent: MEMBER_RATE_PERCENT, firstOrder: false };
  }
  return { percent: FIRST_ORDER_PERCENT, firstOrder: true };
}

export async function quoteDiscountForEmailAndCode(
  ctx: QueryCtx | MutationCtx,
  email: string,
  code: string | undefined,
  subtotalAud = 0,
): Promise<{
  percent: number;
  code: string | null;
  memberId: Id<"members"> | null;
  firstOrder: boolean;
  discountAud: number;
  subtotalAud: number;
}> {
  const normalizedEmail = normalizeMemberEmail(email);
  const normalizedCode = code ? normalizeMemberCode(code) : "";
  if (!isValidMemberEmail(normalizedEmail) || !normalizedCode) {
    const applied = applyMemberDiscount(subtotalAud, 0);
    return {
      percent: 0,
      code: null,
      memberId: null,
      firstOrder: false,
      discountAud: applied.discountAud,
      subtotalAud: applied.subtotalAud,
    };
  }

  const member = await findMemberByCode(ctx, normalizedCode);
  if (!member || member.email !== normalizedEmail) {
    const applied = applyMemberDiscount(subtotalAud, 0);
    return {
      percent: 0,
      code: null,
      memberId: null,
      firstOrder: false,
      discountAud: applied.discountAud,
      subtotalAud: applied.subtotalAud,
    };
  }

  const quoted = await percentForMember(ctx, member);
  const applied = applyMemberDiscount(subtotalAud, quoted.percent);
  return {
    percent: quoted.percent,
    code: member.code,
    memberId: member._id,
    firstOrder: quoted.firstOrder,
    discountAud: applied.discountAud,
    subtotalAud: applied.subtotalAud,
  };
}

export async function redeemFirstOrderIfNeeded(
  ctx: MutationCtx,
  order: Doc<"orders">,
): Promise<void> {
  if (!order.memberId || order.discountPercent !== FIRST_ORDER_PERCENT) {
    return;
  }
  const member = await ctx.db.get("members", order.memberId);
  if (!member || member.firstOrderRedeemedAt !== undefined) {
    return;
  }
  await ctx.db.patch(member._id, { firstOrderRedeemedAt: Date.now() });
}

async function allocateUniqueCode(ctx: MutationCtx): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateMemberCode();
    const existing = await findMemberByCode(ctx, code);
    if (!existing) return code;
  }
  throw new Error("Unable to allocate a member code");
}

export async function createMemberForAuth(
  ctx: MutationCtx,
  email: string,
  userId: Id<"users">,
): Promise<Doc<"members"> | null> {
  const existing = await findMemberByEmail(ctx, email);
  if (existing) return existing;
  const now = Date.now();
  const memberId = await ctx.db.insert("members", {
    email,
    authUserId: userId,
    code: await allocateUniqueCode(ctx),
    marketingConsent: "pending",
    createdAt: now,
    updatedAt: now,
  });
  await ctx.scheduler.runAfter(0, internal.welcomeEmail.sendWelcome, { memberId });
  return await ctx.db.get("members", memberId);
}

export const captureEmail = mutation({
  args: {
    email: v.string(),
    marketingConsent: v.boolean(),
    attribution: v.optional(v.string()),
  },
  returns: v.union(
    v.object({ isNew: v.literal(false) }),
    v.object({
      memberId: v.id("members"),
      code: v.string(),
      isNew: v.literal(true),
    }),
  ),
  handler: async (ctx, args) => {
    const email = normalizeMemberEmail(args.email);
    if (!isValidMemberEmail(email)) {
      throw new Error("Enter a valid email address");
    }
    await enforceRateLimit(ctx, "member-capture:global", 100, 60_000);
    await enforceRateLimit(ctx, `member-capture:${email}`, 3, 60 * 60_000);

    const existing = await findMemberByEmail(ctx, email);
    if (existing) {
      if (existing.welcomeEmailSentAt === undefined) {
        await ctx.scheduler.runAfter(0, internal.welcomeEmail.sendWelcome, {
          memberId: existing._id,
        });
      }
      return { isNew: false as const };
    }

    const now = Date.now();
    const marketingConsent = args.marketingConsent ? "opted_in" : "opted_out";
    const memberId = await ctx.db.insert("members", {
      email,
      code: await allocateUniqueCode(ctx),
      marketingConsent,
      marketingConsentAt: now,
      firstTouch: args.attribution,
      lastTouch: args.attribution,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("consentLedger", {
      memberId,
      category: "marketing",
      state: marketingConsent,
      source: "member_capture",
      createdAt: now,
    });
    const member = await ctx.db.get("members", memberId);
    if (!member) {
      throw new Error("Unable to create membership");
    }
    await ctx.scheduler.runAfter(0, internal.welcomeEmail.sendWelcome, {
      memberId,
    });
    if (args.marketingConsent) {
      await ctx.scheduler.runAfter(0, internal.klaviyo.syncMember, {
        memberId,
      });
    }
    return { memberId, code: member.code, isNew: true as const };
  },
});

export const getMyMembership = query({
  args: {},
  returns: v.union(
    v.object({
      email: v.string(),
      code: v.string(),
      percent: v.number(),
      firstOrder: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const member = await ctx.db
      .query("members")
      .withIndex("by_auth_user", (q) => q.eq("authUserId", userId))
      .unique();
    if (!member) return null;

    const quoted = await percentForMember(ctx, member);
    return {
      email: member.email,
      code: member.code,
      percent: quoted.percent,
      firstOrder: quoted.firstOrder,
    };
  },
});

export const getMyAccount = query({
  args: {},
  returns: v.union(
    v.object({
      email: v.string(),
      code: v.string(),
      percent: v.number(),
      firstOrder: v.boolean(),
      marketingConsent: v.union(
        v.literal("pending"),
        v.literal("opted_in"),
        v.literal("opted_out"),
      ),
      addresses: v.array(v.object({
        _id: v.id("addresses"),
        label: v.string(),
        fullName: v.string(),
        line1: v.string(),
        line2: v.union(v.string(), v.null()),
        city: v.string(),
        state: v.string(),
        postcode: v.string(),
        country: v.string(),
      })),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const member = await getAuthenticatedMember(ctx);
    if (!member) return null;
    const addresses = await ctx.db
      .query("addresses")
      .withIndex("by_member", (q) => q.eq("memberId", member._id))
      .take(50);
    const quoted = await percentForMember(ctx, member);
    return {
      email: member.email,
      code: member.code,
      percent: quoted.percent,
      firstOrder: quoted.firstOrder,
      marketingConsent: member.marketingConsent ?? "pending",
      addresses: addresses.map((address) => ({
        _id: address._id,
        label: address.label,
        fullName: address.fullName,
        line1: address.line1,
        line2: address.line2 ?? null,
        city: address.city,
        state: address.state,
        postcode: address.postcode,
        country: address.country,
      })),
    };
  },
});

const accountOrderValidator = v.object({
  _id: v.id("orders"),
  status: v.string(),
  subtotalAud: v.number(),
  discountAud: v.number(),
  paymentMethod: v.string(),
  createdAt: v.number(),
  trackingNumber: v.union(v.string(), v.null()),
  lines: v.array(v.object({
    slug: v.string(),
    name: v.string(),
    quantity: v.number(),
    lineTotalAud: v.number(),
  })),
});

export const listMyOrders = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(accountOrderValidator),
  handler: async (ctx, args) => {
    const member = await getAuthenticatedMember(ctx);
    if (!member) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }
    const result = await ctx.db
      .query("orders")
      .withIndex("by_member", (q) => q.eq("memberId", member._id))
      .order("desc")
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map((order) => ({
        _id: order._id,
        status: order.status,
        subtotalAud: order.subtotalAud,
        discountAud: order.discountAud ?? 0,
        paymentMethod: order.paymentMethod ?? "unknown",
        createdAt: order.createdAt,
        trackingNumber: order.trackingNumber ?? null,
        lines: order.lines.map((line) => ({
          slug: line.slug,
          name: line.name,
          quantity: line.quantity,
          lineTotalAud: line.lineTotalAud,
        })),
      })),
    };
  },
});

export const updateMarketingConsent = mutation({
  args: { optedIn: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const member = await getAuthenticatedMember(ctx);
    if (!member) throw new Error("Not authenticated");
    const now = Date.now();
    const state = args.optedIn ? "opted_in" : "opted_out";
    await ctx.db.patch("members", member._id, {
      marketingConsent: state,
      marketingConsentAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("consentLedger", {
      memberId: member._id,
      category: "marketing",
      state,
      source: "account",
      createdAt: now,
    });
    if (args.optedIn) {
      await ctx.scheduler.runAfter(0, internal.klaviyo.syncMember, {
        memberId: member._id,
      });
    }
    return null;
  },
});

export const saveAddress = mutation({
  args: {
    addressId: v.optional(v.id("addresses")),
    ...addressFieldsValidator,
  },
  returns: v.id("addresses"),
  handler: async (ctx, args) => {
    const member = await getAuthenticatedMember(ctx);
    if (!member) throw new Error("Not authenticated");
    const values = {
      label: args.label.trim(),
      fullName: args.fullName.trim(),
      line1: args.line1.trim(),
      line2: args.line2?.trim() || undefined,
      city: args.city.trim(),
      state: args.state.trim(),
      postcode: args.postcode.trim(),
      country: args.country.trim().toUpperCase(),
    };
    if (!values.label || !values.fullName || !values.line1 || !values.city ||
        !values.state || !values.postcode || !values.country) {
      throw new Error("Complete all required address fields");
    }
    const now = Date.now();
    if (args.addressId) {
      const existing = await ctx.db.get("addresses", args.addressId);
      if (!existing || existing.memberId !== member._id) {
        throw new Error("Address not found");
      }
      await ctx.db.patch("addresses", existing._id, { ...values, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("addresses", {
      memberId: member._id,
      ...values,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteAddress = mutation({
  args: { addressId: v.id("addresses") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const member = await getAuthenticatedMember(ctx);
    if (!member) throw new Error("Not authenticated");
    const address = await ctx.db.get("addresses", args.addressId);
    if (!address || address.memberId !== member._id) {
      throw new Error("Address not found");
    }
    await ctx.db.delete("addresses", address._id);
    return null;
  },
});

export const getCurrentIdentity = query({
  args: {},
  returns: v.union(
    v.object({
      distinctId: v.string(),
      email: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const member = await ctx.db
      .query("members")
      .withIndex("by_auth_user", (q) => q.eq("authUserId", userId))
      .unique();
    const user = await ctx.db.get("users", userId);
    const email =
      typeof user?.email === "string"
        ? normalizeMemberEmail(user.email)
        : member?.email ?? "";

    return {
      distinctId: String(member?._id ?? userId),
      email,
    };
  },
});

export const quoteDiscount = query({
  args: {
    email: v.string(),
    code: v.optional(v.string()),
    subtotalAud: v.optional(v.number()),
  },
  returns: quoteValidator,
  handler: async (ctx, args) => {
    return await quoteDiscountForEmailAndCode(
      ctx,
      args.email,
      args.code,
      args.subtotalAud ?? 0,
    );
  },
});

export const getLinkVerification = internalQuery({
  args: { verificationId: v.id("memberLinkVerifications") },
  returns: v.union(
    v.object({
      email: v.string(),
      token: v.string(),
      expiresAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const verification = await ctx.db.get(
      "memberLinkVerifications",
      args.verificationId,
    );
    if (!verification) return null;
    const member = await ctx.db.get("members", verification.memberId);
    if (!member) return null;
    return {
      email: member.email,
      token: verification.token,
      expiresAt: verification.expiresAt,
    };
  },
});

export const completeMemberLink = mutation({
  args: {
    token: v.string(),
    paymentSecret: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    requireOrdersSecret(args.paymentSecret);
    const verification = await ctx.db
      .query("memberLinkVerifications")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!verification || verification.expiresAt < Date.now()) return false;
    const member = await ctx.db.get("members", verification.memberId);
    if (!member || member.authUserId !== undefined) return false;
    await ctx.db.patch("members", member._id, {
      authUserId: verification.userId,
      updatedAt: Date.now(),
    });
    await ctx.db.delete("memberLinkVerifications", verification._id);
    return true;
  },
});

export const getForWelcome = internalQuery({
  args: { memberId: v.id("members") },
  returns: v.union(
    v.object({
      _id: v.id("members"),
      email: v.string(),
      code: v.string(),
      welcomeEmailSentAt: v.union(v.number(), v.null()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const member = await ctx.db.get("members", args.memberId);
    if (!member) return null;
    return {
      _id: member._id,
      email: member.email,
      code: member.code,
      welcomeEmailSentAt: member.welcomeEmailSentAt ?? null,
    };
  },
});

export const markWelcomeSent = internalMutation({
  args: { memberId: v.id("members") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const member = await ctx.db.get("members", args.memberId);
    if (!member || member.welcomeEmailSentAt !== undefined) return null;
    await ctx.db.patch(member._id, { welcomeEmailSentAt: Date.now() });
    return null;
  },
});
