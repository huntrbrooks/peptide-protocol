"use node";

import { v } from "convex/values";
import { Resend } from "resend";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

function fromHeader(email: string): string {
  return email.includes("<") ? email : `The Protocol <${email}>`;
}

export const send = internalAction({
  args: { verificationId: v.id("memberLinkVerifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const verification = await ctx.runQuery(
      internal.members.getLinkVerification,
      args,
    );
    if (!verification) return null;

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
    const siteUrl = process.env.SITE_URL?.trim();
    if (!apiKey || !fromEmail || !siteUrl) {
      throw new Error(
        "RESEND_API_KEY, RESEND_FROM_EMAIL, and SITE_URL are required for member verification",
      );
    }
    const verifyUrl = new URL("/api/auth/verify-member-link", siteUrl);
    verifyUrl.searchParams.set("token", verification.token);

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send(
      {
        from: fromHeader(fromEmail),
        to: [verification.email],
        subject: "Verify your The Protocol member account",
        html: `<p>Use this one-time link to connect your existing membership to your account:</p><p><a href="${verifyUrl.toString()}">Verify member account</a></p><p>This link expires in 30 minutes. If you did not request it, ignore this email.</p>`,
        text: `Verify your member account: ${verifyUrl.toString()}\n\nThis link expires in 30 minutes. If you did not request it, ignore this email.`,
        tags: [{ name: "email_type", value: "member_link_verification" }],
      },
      { idempotencyKey: `member-link/${args.verificationId}/${verification.expiresAt}` },
    );
    if (error) {
      throw new Error(`Resend rejected the verification email: ${error.message}`);
    }
    if (!data?.id) throw new Error("Resend accepted no email ID");
    return null;
  },
});
