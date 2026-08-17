"use node";

import { Resend } from "resend";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fromHeader(email: string): string {
  return email.includes("<") ? email : `The Protocol <${email}>`;
}

export const send = internalAction({
  args: { activityId: v.id("lifecycleActivities") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const target = await ctx.runQuery(internal.lifecycle.getEmailTarget, {
      activityId: args.activityId,
    });
    if (!target) {
      await ctx.runMutation(internal.lifecycle.cancelActivity, {
        activityId: args.activityId,
      });
      return null;
    }
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
    if (!apiKey || !fromEmail) {
      await ctx.runMutation(internal.lifecycle.recordEmailResult, {
        activityId: args.activityId,
        idempotencyKey: target.idempotencyKey,
        sent: false,
        error: "Resend environment is not configured",
      });
      return null;
    }

    const productNames = target.lines.map((line) => line.name).join(", ");
    const siteUrl = (
      process.env.SITE_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      ""
    ).replace(/\/$/, "");
    const accountUrl = siteUrl ? `${siteUrl}/account` : "";
    const checkoutUrl = siteUrl ? `${siteUrl}/checkout` : "";
    let subject: string;
    let heading: string;
    let body: string;
    let textBody: string;
    let actionUrl: string;
    let actionLabel: string;

    if (target.kind === "abandoned_cart") {
      subject =
        target.stage === 1
          ? "Your Protocol cart is still available"
          : "A final reminder about your Protocol cart";
      heading = target.stage === 1 ? "Your cart is waiting" : "Still considering your cart?";
      body = `<p>You left ${escapeHtml(productNames)} in your cart.</p>
        <p>Your member code <strong>${escapeHtml(target.code)}</strong> remains available at checkout.</p>`;
      textBody = `You left ${productNames} in your cart.\nYour member code ${target.code} remains available at checkout.`;
      actionUrl = checkoutUrl;
      actionLabel = "Return to cart";
    } else if (target.kind === "post_purchase") {
      subject = "Research-use handling reminder from The Protocol";
      heading = "For your research records";
      body = `<p>Thank you for your recent order of ${escapeHtml(productNames)}.</p>
        <p>On arrival, retain the product label and any supplied analytical documentation with your research records. Store sealed materials according to the storage statement on the label and use only appropriate laboratory handling procedures.</p>
        <p>This message is limited to research-material care. It is not dosing guidance or medical advice.</p>`;
      textBody = `Thank you for your recent order of ${productNames}.\n\nRetain the product label and supplied analytical documentation with your research records. Store sealed materials according to the storage statement on the label and use appropriate laboratory handling procedures.\n\nThis is research-material care only, not dosing guidance or medical advice.`;
      actionUrl = accountUrl;
      actionLabel = "View order history";
    } else {
      subject = "Your Protocol member rate is still available";
      heading = "Your member code remains active";
      body = `<p>It has been a while since your last order. Your member code <strong>${escapeHtml(target.code)}</strong> remains available for eligible research-material orders.</p>`;
      textBody = `Your member code ${target.code} remains available for eligible research-material orders.`;
      actionUrl = siteUrl ? `${siteUrl}/shop` : "";
      actionLabel = "Browse research materials";
    }

    const action = actionUrl
      ? `<p style="margin:28px 0"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#171717;color:#fff;padding:12px 18px;text-decoration:none">${escapeHtml(actionLabel)}</a></p>`
      : "";
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;background:#f5f5f3;color:#171717;font-family:Arial,sans-serif">
  <div style="max-width:640px;margin:0 auto;padding:32px 18px">
    <div style="background:#fff;border:1px solid #deded8;padding:32px">
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:1.5px">THE PROTOCOL</p>
      <h1 style="margin:0 0 20px;font-size:28px">${escapeHtml(heading)}</h1>
      ${body}${action}
      <p style="margin-top:28px;font-size:12px;color:#666">Research materials only. Not for human consumption.</p>
      <p style="font-size:12px;color:#666">${accountUrl ? `<a href="${escapeHtml(accountUrl)}">Manage marketing preferences</a>` : "Reply with “Unsubscribe” to opt out."}</p>
    </div>
  </div>
</body></html>`;
    const text = [
      `THE PROTOCOL — ${heading.toUpperCase()}`,
      "",
      textBody,
      actionUrl ? `\n${actionLabel}: ${actionUrl}` : "",
      "",
      "Research materials only. Not for human consumption.",
      accountUrl ? `Manage marketing preferences: ${accountUrl}` : "Reply with “Unsubscribe” to opt out.",
    ].join("\n");

    try {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send(
        {
          from: fromHeader(fromEmail),
          to: [target.email],
          subject,
          html,
          text,
          headers: {
            "List-Unsubscribe": accountUrl
              ? `<${accountUrl}>, <mailto:contact@theprotocolau.com?subject=Unsubscribe>`
              : "<mailto:contact@theprotocolau.com?subject=Unsubscribe>",
          },
          tags: [
            {
              name: "email_type",
              value:
                target.kind === "abandoned_cart"
                  ? `abandoned_cart_${target.stage === 1 ? "1h" : "24h"}`
                  : target.kind,
            },
            { name: "member_id", value: String(target.memberId) },
          ],
        },
        { idempotencyKey: target.idempotencyKey },
      );
      if (error) throw new Error(error.message);
      if (!data?.id) throw new Error("Resend accepted no email ID");
      await ctx.runMutation(internal.lifecycle.recordEmailResult, {
        activityId: args.activityId,
        idempotencyKey: target.idempotencyKey,
        sent: true,
        providerMessageId: data.id,
      });
    } catch (error) {
      await ctx.runMutation(internal.lifecycle.recordEmailResult, {
        activityId: args.activityId,
        idempotencyKey: target.idempotencyKey,
        sent: false,
        error: error instanceof Error ? error.message : "Unknown Resend error",
      });
    }
    return null;
  },
});
