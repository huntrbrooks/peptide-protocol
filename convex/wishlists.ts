import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

async function requireMember(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"members">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const member = await ctx.db
    .query("members")
    .withIndex("by_auth_user", (q) => q.eq("authUserId", userId))
    .unique();
  if (member) return member;
  const user = await ctx.db.get("users", userId);
  const email = typeof user?.email === "string"
    ? user.email.trim().toLowerCase()
    : "";
  const byEmail = email
    ? await ctx.db
      .query("members")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique()
    : null;
  if (!byEmail) throw new Error("Member record not found");
  return byEmail;
}

export const list = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const member = await requireMember(ctx);
    const rows = await ctx.db
      .query("wishlists")
      .withIndex("by_member", (q) => q.eq("memberId", member._id))
      .collect();
    return rows.map((row) => row.productSlug);
  },
});

export const add = mutation({
  args: { productSlug: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const member = await requireMember(ctx);
    const productSlug = args.productSlug.trim();
    if (!productSlug || productSlug.length > 160) {
      throw new Error("Invalid product");
    }
    const existing = await ctx.db
      .query("wishlists")
      .withIndex("by_member_product", (q) =>
        q.eq("memberId", member._id).eq("productSlug", productSlug)
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("wishlists", {
        memberId: member._id,
        productSlug,
        createdAt: Date.now(),
      });
    }
    return null;
  },
});

export const remove = mutation({
  args: { productSlug: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const member = await requireMember(ctx);
    const existing = await ctx.db
      .query("wishlists")
      .withIndex("by_member_product", (q) =>
        q.eq("memberId", member._id).eq("productSlug", args.productSlug.trim())
      )
      .unique();
    if (existing) await ctx.db.delete("wishlists", existing._id);
    return null;
  },
});
