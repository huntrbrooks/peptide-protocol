import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { MutationCtx } from "./_generated/server";

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
      if (member && member.authUserId !== userId) {
        await ctx.db.patch(member._id, { authUserId: userId });
      }
    },
  },
});
