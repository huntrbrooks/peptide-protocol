import { getAuthUserId } from "@convex-dev/auth/server";
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
  isValidMemberEmail,
  normalizeMemberCode,
  normalizeMemberEmail,
} from "./lib/memberDiscount";

const quoteValidator = v.object({
  percent: v.number(),
  code: v.union(v.string(), v.null()),
  memberId: v.union(v.id("members"), v.null()),
  firstOrder: v.boolean(),
});

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
): Promise<{
  percent: number;
  code: string | null;
  memberId: Id<"members"> | null;
  firstOrder: boolean;
}> {
  const normalizedEmail = normalizeMemberEmail(email);
  const normalizedCode = code ? normalizeMemberCode(code) : "";
  if (!isValidMemberEmail(normalizedEmail) || !normalizedCode) {
    return { percent: 0, code: null, memberId: null, firstOrder: false };
  }

  const member = await findMemberByCode(ctx, normalizedCode);
  if (!member || member.email !== normalizedEmail) {
    return { percent: 0, code: null, memberId: null, firstOrder: false };
  }

  const quoted = await percentForMember(ctx, member);
  return {
    percent: quoted.percent,
    code: member.code,
    memberId: member._id,
    firstOrder: quoted.firstOrder,
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

export const captureEmail = mutation({
  args: {
    email: v.string(),
    marketingConsent: v.boolean(),
    attribution: v.optional(v.string()),
  },
  returns: v.object({
    memberId: v.id("members"),
    code: v.string(),
    isNew: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const email = normalizeMemberEmail(args.email);
    if (!isValidMemberEmail(email)) {
      throw new Error("Enter a valid email address");
    }

    const existing = await findMemberByEmail(ctx, email);
    if (existing) {
      const now = Date.now();
      const consent = args.marketingConsent ? "opted_in" : "opted_out";
      if (existing.marketingConsent !== consent) {
        await ctx.db.patch("members", existing._id, {
          marketingConsent: consent,
          marketingConsentAt: now,
          lastTouch: args.attribution,
          updatedAt: now,
        });
        await ctx.db.insert("consentLedger", {
          memberId: existing._id,
          category: "marketing",
          state: consent,
          source: "member_capture",
          createdAt: now,
        });
      }
      if (existing.welcomeEmailSentAt === undefined) {
        await ctx.scheduler.runAfter(0, internal.welcomeEmail.sendWelcome, {
          memberId: existing._id,
        });
      }
      return { memberId: existing._id, code: existing.code, isNew: false };
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
    return { memberId, code: member.code, isNew: true };
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

    const byAuth = await ctx.db
      .query("members")
      .withIndex("by_auth_user", (q) => q.eq("authUserId", userId))
      .unique();
    const user = byAuth ? null : await ctx.db.get("users", userId);
    const email =
      typeof user?.email === "string"
        ? normalizeMemberEmail(user.email)
        : "";
    const member =
      byAuth ?? (email ? await findMemberByEmail(ctx, email) : null);
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

export const quoteDiscount = query({
  args: {
    email: v.string(),
    code: v.optional(v.string()),
  },
  returns: quoteValidator,
  handler: async (ctx, args) => {
    return await quoteDiscountForEmailAndCode(ctx, args.email, args.code);
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
