"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

type KlaviyoConfig = {
  apiKey: string;
  revision: string;
  listId?: string;
};

function config(): KlaviyoConfig | null {
  const apiKey = process.env.KLAVIYO_API_KEY?.trim();
  const revision = process.env.KLAVIYO_REVISION?.trim();
  if (!apiKey || !revision) return null;
  const listId = process.env.KLAVIYO_LIST_ID?.trim();
  return { apiKey, revision, listId: listId || undefined };
}

async function post(
  settings: KlaviyoConfig,
  path: string,
  body: unknown,
): Promise<boolean> {
  try {
    const response = await fetch(`https://a.klaviyo.com${path}`, {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${settings.apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        Revision: settings.revision,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.error(`Klaviyo request failed: ${path} (${response.status})`);
      return false;
    }
    return true;
  } catch (error: unknown) {
    console.error(
      `Klaviyo request failed: ${path}`,
      error instanceof Error ? error.message : "Unknown network error",
    );
    return false;
  }
}

async function upsertProfile(
  settings: KlaviyoConfig,
  member: {
    memberId: string;
    email: string;
    orderCount: number;
    ltvAud: number;
    rfmSegment: string | null;
  },
): Promise<boolean> {
  return await post(settings, "/api/profile-import/", {
    data: {
      type: "profile",
      attributes: {
        email: member.email,
        external_id: member.memberId,
        properties: {
          protocol_order_count: member.orderCount,
          protocol_ltv_aud: member.ltvAud,
          protocol_rfm_segment: member.rfmSegment,
        },
      },
    },
  });
}

export const syncMember = internalAction({
  args: { memberId: v.id("members") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const settings = config();
    if (!settings) return null;
    const member = await ctx.runQuery(internal.klaviyoData.consentedMember, {
      memberId: args.memberId,
    });
    if (!member || !(await upsertProfile(settings, member))) return null;
    if (settings.listId) {
      await post(settings, "/api/profile-subscription-bulk-create-jobs/", {
        data: {
          type: "profile-subscription-bulk-create-job",
          attributes: {
            profiles: {
              data: [{
                type: "profile",
                attributes: {
                  email: member.email,
                  subscriptions: {
                    email: { marketing: { consent: "SUBSCRIBED" } },
                  },
                },
              }],
            },
          },
          relationships: {
            list: { data: { type: "list", id: settings.listId } },
          },
        },
      });
    }
    return null;
  },
});

export const syncPlacedOrder = internalAction({
  args: { orderId: v.id("orders") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const settings = config();
    if (!settings) return null;
    const order = await ctx.runQuery(internal.klaviyoData.consentedPaidOrder, {
      orderId: args.orderId,
    });
    if (!order) return null;
    await post(settings, "/api/events/", {
      data: {
        type: "event",
        attributes: {
          properties: {
            OrderId: order.orderId,
            ItemNames: order.items.map((item) => item.name),
            Items: order.items.map((item) => ({
              ProductID: item.productId,
              ProductName: item.name,
              Quantity: item.quantity,
              ItemPrice: item.itemPrice,
              RowTotal: item.rowTotal,
            })),
            DiscountCode: order.discountCode,
            DiscountValue: order.discount,
            ValueBeforeDiscount: order.valueBeforeDiscount,
            PaymentMethod: order.paymentMethod,
          },
          time: new Date(order.paidAt).toISOString(),
          value: order.value,
          value_currency: "AUD",
          unique_id: order.orderId,
          metric: {
            data: { type: "metric", attributes: { name: "Placed Order" } },
          },
          profile: {
            data: { type: "profile", attributes: { email: order.email } },
          },
        },
      },
    });
    return null;
  },
});
