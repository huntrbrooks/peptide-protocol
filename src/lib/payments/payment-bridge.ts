import { createHmac } from "node:crypto";
import type { OrderLine } from "@/lib/orders/types";

export type PaymentBridgePayload = {
  orderId: string;
  amountAudCents: number;
  currency: "aud";
  email: string;
  items: Array<{ name: string; quantity: number }>;
  exp: number;
};

function requireBridgeSecret(): string {
  const secret = process.env.PAYMENT_BRIDGE_SECRET?.trim();
  if (!secret) {
    throw new Error("PAYMENT_BRIDGE_SECRET is not configured.");
  }
  return secret;
}

export function createPaymentBridgeToken(input: {
  orderId: string;
  amountAudCents: number;
  email: string;
  lines: OrderLine[];
  expiresInSeconds?: number;
}): string {
  const payload: PaymentBridgePayload = {
    orderId: input.orderId,
    amountAudCents: input.amountAudCents,
    currency: "aud",
    email: input.email,
    items: input.lines.map(({ name, quantity }) => ({ name, quantity })),
    exp: Math.floor(Date.now() / 1000) + (input.expiresInSeconds ?? 45 * 60),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const signature = createHmac("sha256", requireBridgeSecret())
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}
