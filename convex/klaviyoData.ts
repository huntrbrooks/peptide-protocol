import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

export const consentedMember = internalQuery({
  args: { memberId: v.id("members") },
  returns: v.union(
    v.object({
      memberId: v.string(),
      email: v.string(),
      orderCount: v.number(),
      ltvAud: v.number(),
      rfmSegment: v.union(v.string(), v.null()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const member = await ctx.db.get("members", args.memberId);
    if (!member || member.marketingConsent !== "opted_in") return null;
    return {
      memberId: String(member._id),
      email: member.email,
      orderCount: member.orderCount ?? 0,
      ltvAud: member.ltvAud ?? 0,
      rfmSegment: member.rfmSegment ?? null,
    };
  },
});

export const consentedPaidOrder = internalQuery({
  args: { orderId: v.id("orders") },
  returns: v.union(
    v.object({
      orderId: v.string(),
      email: v.string(),
      paidAt: v.number(),
      value: v.number(),
      valueBeforeDiscount: v.number(),
      discount: v.number(),
      discountCode: v.union(v.string(), v.null()),
      paymentMethod: v.string(),
      items: v.array(v.object({
        productId: v.string(),
        name: v.string(),
        quantity: v.number(),
        itemPrice: v.number(),
        rowTotal: v.number(),
      })),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const order = await ctx.db.get("orders", args.orderId);
    if (!order?.memberId || order.paidAt === undefined) return null;
    const member = await ctx.db.get("members", order.memberId);
    if (!member || member.marketingConsent !== "opted_in") return null;
    return {
      orderId: String(order._id),
      email: member.email,
      paidAt: order.paidAt,
      value: order.subtotalAud,
      valueBeforeDiscount: order.subtotalBeforeDiscountAud ?? order.subtotalAud,
      discount: order.discountAud ?? 0,
      discountCode: order.discountCode ?? null,
      paymentMethod: order.paymentMethod ?? "unknown",
      items: order.lines.map((line) => ({
        productId: line.slug,
        name: line.name,
        quantity: line.quantity,
        itemPrice: line.unitPriceAud,
        rowTotal: line.lineTotalAud,
      })),
    };
  },
});
