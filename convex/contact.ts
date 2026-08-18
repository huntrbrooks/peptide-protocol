import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import {
  isValidMemberEmail,
  normalizeMemberEmail,
} from "./lib/memberDiscount";
import { enforceRateLimit } from "./lib/security";

const NAME_MAX_LENGTH = 120;
const MESSAGE_MAX_LENGTH = 4000;

/**
 * Public contact-form submission. No auth required, but rate-limited
 * globally and per sender email to keep the support inbox usable.
 */
export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const email = normalizeMemberEmail(args.email);
    const message = args.message.trim();

    if (!name || name.length > NAME_MAX_LENGTH) {
      throw new Error("Enter your name");
    }
    if (!isValidMemberEmail(email)) {
      throw new Error("Enter a valid email address");
    }
    if (!message) {
      throw new Error("Enter a message");
    }
    if (message.length > MESSAGE_MAX_LENGTH) {
      throw new Error("Message is too long (4000 characters max)");
    }

    await enforceRateLimit(ctx, "contact:global", 30, 60_000);
    await enforceRateLimit(ctx, `contact:${email}`, 3, 60 * 60_000);

    const messageId = await ctx.db.insert("contactMessages", {
      name,
      email,
      message,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.contactEmail.sendContactMessage, {
      messageId,
    });
    return null;
  },
});

export const getForSend = internalQuery({
  args: { messageId: v.id("contactMessages") },
  returns: v.union(
    v.object({
      name: v.string(),
      email: v.string(),
      message: v.string(),
      sentAt: v.union(v.number(), v.null()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db.get("contactMessages", args.messageId);
    if (!row) return null;
    return {
      name: row.name,
      email: row.email,
      message: row.message,
      sentAt: row.sentAt ?? null,
    };
  },
});

export const markSent = internalMutation({
  args: { messageId: v.id("contactMessages") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("contactMessages", args.messageId, {
      sentAt: Date.now(),
    });
    return null;
  },
});
