"use node";

import { v } from "convex/values";
import { Resend } from "resend";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

function fromHeader(email: string): string {
  return email.includes("<") ? email : `The Protocol <${email}>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export const sendWelcome = internalAction({
  args: { memberId: v.id("members") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const member = await ctx.runQuery(internal.members.getForWelcome, {
      memberId: args.memberId,
    });
    if (!member || member.welcomeEmailSentAt !== null) {
      return null;
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
    if (!apiKey || !fromEmail) {
      throw new Error(
        "RESEND_API_KEY and RESEND_FROM_EMAIL are required to send welcome email",
      );
    }

    const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Welcome to The Protocol</title></head>
  <body style="margin:0;background:#f5f5f3;color:#171717;font-family:Arial,sans-serif">
    <div style="max-width:640px;margin:0 auto;padding:32px 18px">
      <div style="background:#ffffff;border:1px solid #deded8;padding:32px">
        <p style="margin:0 0 8px;font-size:13px;letter-spacing:1.5px">THE PROTOCOL</p>
        <h1 style="margin:0 0 20px;font-size:28px">Your member code</h1>
        <p>Welcome. Your unique member code is ready to use at checkout.</p>
        <p style="margin:24px 0;padding:16px;border:1px solid #deded8;background:#fafafa;font-size:22px;letter-spacing:1px;text-align:center"><strong>${escapeHtml(member.code)}</strong></p>
        <p><strong>15%</strong> off your first dispatch, then <strong>10%</strong> on later orders while you remain a member.</p>
        <p>The rate applies automatically when you are logged in. Guests can type the code if the checkout email matches ${escapeHtml(member.email)}.</p>
        <p style="margin-top:28px;font-size:12px;color:#666">Research materials only. Not for human consumption. This member-code message is transactional; marketing preferences are managed separately.</p>
      </div>
    </div>
  </body>
</html>`;
    const text = [
      "THE PROTOCOL — YOUR MEMBER CODE",
      "",
      `Code: ${member.code}`,
      "15% off your first dispatch, then 10% on later orders while you remain a member.",
      "The rate applies automatically when you are logged in.",
      `Guests can type the code if the checkout email matches ${member.email}.`,
      "",
      "Research materials only. Not for human consumption.",
    ].join("\n");

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send(
      {
        from: fromHeader(fromEmail),
        to: [member.email],
        subject: "Welcome to The Protocol — your member code",
        html,
        text,
        headers: {
          "List-Unsubscribe": "<mailto:contact@theprotocolau.com?subject=Unsubscribe>",
        },
        tags: [
          { name: "email_type", value: "member_welcome" },
          { name: "member_id", value: String(member._id) },
        ],
      },
      { idempotencyKey: `member-welcome/${member._id}` },
    );
    if (error) {
      throw new Error(`Resend rejected the welcome email: ${error.message}`);
    }
    if (!data?.id) {
      throw new Error("Resend accepted no email ID");
    }

    await ctx.runMutation(internal.members.markWelcomeSent, {
      memberId: args.memberId,
    });
    return null;
  },
});
