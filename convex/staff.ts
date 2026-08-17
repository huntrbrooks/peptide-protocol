import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireStaff, writeAudit } from "./lib/staff";

const roleValidator = v.union(
  v.literal("owner"),
  v.literal("ops"),
  v.literal("support"),
  v.literal("view_only"),
);

export const me = query({
  args: {},
  returns: v.union(
    v.object({ email: v.string(), role: roleValidator }),
    v.null(),
  ),
  handler: async (ctx) => {
    try {
      const staff = await requireStaff(ctx);
      return { email: staff.email, role: staff.role };
    } catch {
      return null;
    }
  },
});

export const assignRole = mutation({
  args: { email: v.string(), role: roleValidator },
  returns: v.id("staffRoles"),
  handler: async (ctx, args) => {
    const actor = await requireStaff(ctx, ["owner"]);
    const email = args.email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (!user) throw new Error("No Convex Auth user exists for that email");
    const existing = await ctx.db
      .query("staffRoles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    const now = Date.now();
    const roleId = existing?._id ?? await ctx.db.insert("staffRoles", {
      userId: user._id,
      email,
      role: args.role,
      createdAt: now,
      updatedAt: now,
    });
    if (existing) {
      await ctx.db.patch("staffRoles", existing._id, {
        email,
        role: args.role,
        updatedAt: now,
      });
    }
    await writeAudit(ctx, actor, "staff.assign_role", "staffRole", String(roleId), args.role);
    return roleId;
  },
});
