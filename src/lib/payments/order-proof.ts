import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { requirePaymentSecret } from "@/lib/orders/convex";

function signature(orderId: string, paymentMethod: "crypto" | "bank"): Buffer {
  return createHmac("sha256", requirePaymentSecret())
    .update(`payment-proof:${paymentMethod}:${orderId}`)
    .digest();
}

export function createOrderProofToken(
  orderId: string,
  paymentMethod: "crypto" | "bank",
): string {
  return signature(orderId, paymentMethod).toString("base64url");
}

export function verifyOrderProofToken(
  orderId: string,
  paymentMethod: "crypto" | "bank",
  token: string,
): boolean {
  try {
    const actual = Buffer.from(token, "base64url");
    const expected = signature(orderId, paymentMethod);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
