import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";
import { createMemberForAuth } from "./members";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx: MutationCtx, { userId, profile }) {
      const email =
        typeof profile.email === "string"
          ? profile.email.trim().toLowerCase()
          : "";
      if (!email.includes("@")) return;

      const member = await ctx.db
        .query("members")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();
      if (!member) {
        await createMemberForAuth(ctx, email, userId);
        return;
      }
      if (member.authUserId !== undefined) {
        return;
      }

      const now = Date.now();
      const token = `${crypto.randomUUID()}${crypto.randomUUID()}`;
      const pending = await ctx.db
        .query("memberLinkVerifications")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();
      const verificationId = pending
        ? pending._id
        : await ctx.db.insert("memberLinkVerifications", {
            memberId: member._id,
            userId,
            token,
            expiresAt: now + 30 * 60 * 1000,
            createdAt: now,
          });
      if (pending) {
        await ctx.db.patch("memberLinkVerifications", pending._id, {
          memberId: member._id,
          token,
          expiresAt: now + 30 * 60 * 1000,
          createdAt: now,
        });
      }
      await ctx.scheduler.runAfter(0, internal.memberVerification.send, {
        verificationId,
      });
    },
  },
});
