export type MappedCheckoutError = {
  status: number;
  error: string;
};

const KNOWN_INPUT_PATTERNS = [
  /invalid checkout request/i,
  /research-use acknowledgement/i,
  /valid email/i,
  /shipping details/i,
  /cart items/i,
  /unknown product/i,
  /order total must be greater than zero/i,
  /out of stock/i,
  /is unavailable/i,
  /select a supported cryptocurrency/i,
  /select the stripe payment option/i,
] as const;

const KNOWN_CONFIG_PATTERNS = [
  /is not configured/i,
  /NEXT_PUBLIC_CONVEX_URL is not set/i,
] as const;

const KNOWN_RATE_LIMIT_PATTERNS = [/too many requests/i] as const;

/**
 * Maps known checkout failures to safe client-facing messages.
 * Unknown errors become a generic 500 body (no internal leak).
 */
export function mapCheckoutError(
  error: unknown,
  fallback = "Unable to complete checkout. Please try again.",
): MappedCheckoutError {
  const message = error instanceof Error ? error.message : "";

  if (KNOWN_RATE_LIMIT_PATTERNS.some((pattern) => pattern.test(message))) {
    return {
      status: 429,
      error: "Too many requests. Please try again shortly.",
    };
  }

  if (KNOWN_CONFIG_PATTERNS.some((pattern) => pattern.test(message))) {
    return {
      status: 503,
      error: "Payment options are temporarily unavailable. Please try again later.",
    };
  }

  if (KNOWN_INPUT_PATTERNS.some((pattern) => pattern.test(message))) {
    return { status: 400, error: message };
  }

  return { status: 500, error: fallback };
}
