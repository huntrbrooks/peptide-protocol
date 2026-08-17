"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

export const capture = internalAction({
  args: { orderId: v.id("orders") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = await ctx.runQuery(internal.orders.getPurchaseEvent, {
      orderId: args.orderId,
    });
    if (!event) return null;
    const key = process.env.POSTHOG_API_KEY?.trim();
    if (!key) return null;
    const host = (process.env.POSTHOG_HOST ?? "https://us.i.posthog.com").replace(/\/$/, "");
    const response = await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event: "purchase",
        properties: {
          distinct_id: event.memberId ?? `order:${event.transactionId}`,
          transaction_id: event.transactionId,
          value: event.value,
          value_before_discount: event.valueBeforeDiscount,
          discount: event.discount,
          discount_percent: event.discountPercent,
          currency: "AUD",
          payment_type: event.paymentType,
          member_id: event.memberId,
          items: event.items,
        },
      }),
    });
    if (!response.ok) {
      throw new Error(`PostHog purchase capture failed (${response.status})`);
    }
    await ctx.runMutation(internal.orders.markPurchaseTracked, {
      orderId: args.orderId,
    });
    return null;
  },
});
