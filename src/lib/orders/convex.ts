import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { OrderLine, OrderShipping } from "./types";

function requireConvexUrl(): void {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL is not set. Run `npx convex dev` to link a project.",
    );
  }
}

function requireWebhookSecret(): string {
  const secret = process.env.ORDERS_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "ORDERS_WEBHOOK_SECRET is not set. Add it to .env.local and Convex env.",
    );
  }
  return secret;
}

export async function createConvexOrder(input: {
  email: string;
  shipping: OrderShipping;
  lines: OrderLine[];
  subtotalAud: number;
  currencyCrypto: string;
}): Promise<Id<"orders">> {
  requireConvexUrl();
  return await fetchMutation(api.orders.create, {
    email: input.email,
    shipping: input.shipping,
    lines: input.lines,
    subtotalAud: input.subtotalAud,
    currencyCrypto: input.currencyCrypto,
    researchAck: true,
  });
}

export async function getConvexOrder(orderId: string) {
  requireConvexUrl();
  return await fetchQuery(api.orders.get, {
    orderId: orderId as Id<"orders">,
  });
}

export async function markConvexOrderFromWebhook(input: {
  orderId: string;
  status: "paid" | "failed";
  moonpayTransactionId?: string;
}): Promise<Id<"orders"> | null> {
  requireConvexUrl();
  const webhookSecret = requireWebhookSecret();
  return await fetchMutation(api.orders.updateStatusFromWebhook, {
    orderId: input.orderId,
    status: input.status,
    moonpayTransactionId: input.moonpayTransactionId,
    webhookSecret,
  });
}
