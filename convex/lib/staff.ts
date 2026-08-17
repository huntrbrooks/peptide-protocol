import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export type StaffRole = "owner" | "ops" | "support" | "view_only";

function ownerAllowlist(): Set<string> {
  return new Set(
    (process.env.STAFF_EMAIL_ALLOWLIST ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function requireStaff(
  ctx: QueryCtx | MutationCtx,
  allowed: readonly StaffRole[] = ["owner", "ops", "support", "view_only"],
): Promise<{ userId: Doc<"users">["_id"]; email: string; role: StaffRole }> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const user = await ctx.db.get("users", userId);
  const email = typeof user?.email === "string" ? user.email.trim().toLowerCase() : "";
  if (!email) throw new Error("Staff email is required");

  const assigned = await ctx.db
    .query("staffRoles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  const role: StaffRole | null = ownerAllowlist().has(email)
    ? "owner"
    : (assigned?.role ?? null);
  if (!role || !allowed.includes(role)) throw new Error("Staff access required");
  return { userId, email, role };
}

export async function writeAudit(
  ctx: MutationCtx,
  staff: { userId: Doc<"users">["_id"]; email: string },
  action: string,
  targetType: string,
  targetId: string,
  detail?: string,
): Promise<void> {
  await ctx.db.insert("auditLogs", {
    staffUserId: staff.userId,
    staffEmail: staff.email,
    action,
    targetType,
    targetId,
    detail,
    createdAt: Date.now(),
  });
}
