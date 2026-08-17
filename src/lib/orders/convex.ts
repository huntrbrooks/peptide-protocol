import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type {
  CryptoChain,
  CryptoCurrency,
  OrderLine,
  OrderShipping,
  PaymentMethod,
} from "./types";

function requireConvexUrl(): void {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL is not set. Run `npx convex dev` to link a project.",
    );
  }
}

export function requirePaymentSecret(): string {
  const secret = process.env.ORDERS_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "ORDERS_WEBHOOK_SECRET is not set in Next.js and the Convex deployment.",
    );
  }
  return secret;
}

export async function createConvexOrder(input: {
  email: string;
  shipping: OrderShipping;
  lines: OrderLine[];
  subtotalAud: number;
  paymentMethod: PaymentMethod;
  cryptoCurrency?: CryptoCurrency;
  cryptoChain?: CryptoChain;
  cryptoExpectedAmount?: number;
  cryptoWalletAddress?: string;
}): Promise<Id<"orders">> {
  requireConvexUrl();
  return await fetchMutation(api.orders.createPending, {
    email: input.email,
    shipping: input.shipping,
    lines: input.lines,
    subtotalAud: input.subtotalAud,
    paymentMethod: input.paymentMethod,
    researchAck: true,
    cryptoCurrency: input.cryptoCurrency,
    cryptoChain: input.cryptoChain,
    cryptoExpectedAmount: input.cryptoExpectedAmount,
    cryptoWalletAddress: input.cryptoWalletAddress,
  });
}

export async function getConvexOrder(orderId: string) {
  requireConvexUrl();
  return await fetchQuery(api.orders.get, {
    orderId: orderId as Id<"orders">,
  });
}

export async function attachStripeIntent(input: {
  orderId: string;
  paymentIntentId: string;
  paymentStatus: string;
}): Promise<Id<"orders"> | null> {
  requireConvexUrl();
  return await fetchMutation(api.orders.attachStripeIntent, {
    ...input,
    paymentSecret: requirePaymentSecret(),
  });
}

export async function updateStripeOrder(input: {
  orderId: string;
  paymentIntentId: string;
  paymentStatus: string;
  paid: boolean;
  failed: boolean;
}): Promise<Id<"orders"> | null> {
  requireConvexUrl();
  return await fetchMutation(api.orders.updateStripeFromWebhook, {
    ...input,
    paymentSecret: requirePaymentSecret(),
  });
}

export async function updateMoonPayOrder(input: {
  orderId: string;
  status: "paid" | "failed";
  moonpayTransactionId?: string;
}): Promise<Id<"orders"> | null> {
  requireConvexUrl();
  return await fetchMutation(api.orders.updateMoonPayFromBridge, {
    ...input,
    paymentSecret: requirePaymentSecret(),
  });
}

export async function submitCryptoVerification(input: {
  orderId: string;
  txid: string;
  verified: boolean;
  verificationNote: string;
}): Promise<Id<"orders"> | null> {
  requireConvexUrl();
  return await fetchMutation(api.orders.submitCryptoVerification, {
    ...input,
    paymentSecret: requirePaymentSecret(),
  });
}

export async function claimPaidEmail(input: {
  orderId: string;
  claimToken: string;
}) {
  requireConvexUrl();
  return await fetchMutation(api.orders.claimPaidEmail, {
    ...input,
    paymentSecret: requirePaymentSecret(),
  });
}

export async function completePaidEmail(input: {
  orderId: string;
  claimToken: string;
  sent: boolean;
}): Promise<void> {
  requireConvexUrl();
  await fetchMutation(api.orders.completePaidEmail, {
    ...input,
    paymentSecret: requirePaymentSecret(),
  });
}
