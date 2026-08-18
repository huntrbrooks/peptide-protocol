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

export const sendContactMessage = internalAction({
  args: { messageId: v.id("contactMessages") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const submission = await ctx.runQuery(internal.contact.getForSend, {
      messageId: args.messageId,
    });
    if (!submission || submission.sentAt !== null) {
      return null;
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
    if (!apiKey || !fromEmail) {
      throw new Error(
        "RESEND_API_KEY and RESEND_FROM_EMAIL are required to send contact messages",
      );
    }
    const toEmail = process.env.CONTACT_INBOX_EMAIL?.trim() || fromEmail;

    const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Contact form message</title></head>
  <body style="margin:0;background:#f5f5f3;color:#171717;font-family:Arial,sans-serif">
    <div style="max-width:640px;margin:0 auto;padding:32px 18px">
      <div style="background:#ffffff;border:1px solid #deded8;padding:32px">
        <p style="margin:0 0 8px;font-size:13px;letter-spacing:1.5px">THE PROTOCOL — CONTACT FORM</p>
        <p style="margin:0 0 4px"><strong>Name:</strong> ${escapeHtml(submission.name)}</p>
        <p style="margin:0 0 16px"><strong>Email:</strong> ${escapeHtml(submission.email)}</p>
        <p style="margin:0 0 8px"><strong>Message:</strong></p>
        <p style="margin:0;padding:16px;border:1px solid #deded8;background:#fafafa;white-space:pre-wrap">${escapeHtml(submission.message)}</p>
      </div>
    </div>
  </body>
</html>`;
    const text = [
      "THE PROTOCOL — CONTACT FORM",
      "",
      `Name: ${submission.name}`,
      `Email: ${submission.email}`,
      "",
      submission.message,
    ].join("\n");

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send(
      {
        from: fromHeader(fromEmail),
        to: [toEmail],
        replyTo: [submission.email],
        subject: `Contact form: ${submission.name}`,
        html,
        text,
        tags: [{ name: "email_type", value: "contact_form" }],
      },
      { idempotencyKey: `contact-form/${args.messageId}` },
    );
    if (error) {
      throw new Error(`Resend rejected the contact message: ${error.message}`);
    }
    if (!data?.id) {
      throw new Error("Resend accepted no email ID");
    }

    await ctx.runMutation(internal.contact.markSent, {
      messageId: args.messageId,
    });
    return null;
  },
});
