import "server-only";

import { createHash } from "node:crypto";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { requirePaymentSecret } from "@/lib/orders/convex";

function requestFingerprint(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
  return createHash("sha256").update(address).digest("hex").slice(0, 24);
}

export async function enforceRouteRateLimit(
  request: Request,
  route: string,
  limit: number,
  windowMs: number,
): Promise<void> {
  await fetchMutation(api.security.consumeRateLimit, {
    key: `route:${route}:${requestFingerprint(request)}`,
    limit,
    windowMs,
    paymentSecret: requirePaymentSecret(),
  });
}
