import crypto from "crypto";

/**
 * MoonPay hosted on-ramp (buy) widget helpers.
 *
 * Flow: Apple/Google Pay (or card) → MoonPay buys crypto → sends to
 * MOONPAY_WALLET_ADDRESS → webhook marks order paid.
 *
 * FX: catalogue totals are AUD (`baseCurrencyCode=aud`). MoonPay converts fiat
 * to the crypto settlement currency (`currencyCode`, default usdc) at widget
 * rates. We do not run our own FX; the charged fiat amount is the cart AUD total.
 *
 * Docs: https://dev.moonpay.com/widget/on-ramp/
 */

export type MoonPayWidgetParams = {
  apiKey: string;
  baseCurrencyCode: string;
  baseCurrencyAmount: string;
  currencyCode: string;
  walletAddress: string;
  externalTransactionId: string;
  redirectURL: string;
  email?: string;
};

function buyHost(): string {
  const env = (process.env.MOONPAY_ENVIRONMENT ?? "sandbox").toLowerCase();
  return env === "production"
    ? "https://buy.moonpay.com"
    : "https://buy-sandbox.moonpay.com";
}

/**
 * Build query string in a stable order, then HMAC-SHA256 sign with secret key.
 * Wallet address params require signing (MoonPay dashboard secret key).
 */
export function buildSignedBuyUrl(
  params: MoonPayWidgetParams,
  secretKey: string,
): string {
  const search = new URLSearchParams({
    apiKey: params.apiKey,
    baseCurrencyCode: params.baseCurrencyCode,
    baseCurrencyAmount: params.baseCurrencyAmount,
    currencyCode: params.currencyCode,
    walletAddress: params.walletAddress,
    externalTransactionId: params.externalTransactionId,
    redirectURL: params.redirectURL,
  });
  if (params.email) {
    search.set("email", params.email);
  }

  const query = `?${search.toString()}`;
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(query)
    .digest("base64");

  return `${buyHost()}${query}&signature=${encodeURIComponent(signature)}`;
}

/**
 * Verify Moonpay-Signature-V2 webhook header.
 * signed_payload = `${timestamp}.${rawBody}` → HMAC-SHA256 hex with webhook key.
 * @see https://dev.moonpay.com/api-reference/widget/webhooks/signature
 */
export function verifyMoonPayWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string,
): boolean {
  if (!signatureHeader || !webhookSecret) return false;

  let timestamp: string | undefined;
  let signature: string | undefined;
  for (const part of signatureHeader.split(",")) {
    const [prefix, value] = part.split("=");
    if (prefix === "t") timestamp = value;
    if (prefix === "s") signature = value;
  }
  if (!timestamp || !signature) return false;

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export type MoonPayWebhookPayload = {
  type?: string;
  data?: {
    id?: string;
    status?: string;
    externalTransactionId?: string | null;
  };
};

export function isPaidWebhookEvent(payload: MoonPayWebhookPayload): boolean {
  const type = payload.type ?? "";
  const status = payload.data?.status ?? "";
  return (
    (type === "transaction_updated" || type === "transaction.completed") &&
    status === "completed"
  );
}

export function getMoonPayConfig(): {
  apiKey: string;
  secretKey: string;
  webhookSecret: string;
  walletAddress: string;
  defaultCurrency: string;
  siteUrl: string;
} | null {
  const apiKey = process.env.MOONPAY_API_KEY?.trim();
  const secretKey = process.env.MOONPAY_SECRET_KEY?.trim();
  const webhookSecret = process.env.MOONPAY_WEBHOOK_SECRET?.trim();
  const walletAddress = process.env.MOONPAY_WALLET_ADDRESS?.trim();
  const defaultCurrency = (
    process.env.MOONPAY_DEFAULT_CURRENCY ?? "usdc"
  ).trim().toLowerCase();
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  if (!apiKey || !secretKey || !walletAddress) {
    return null;
  }

  return {
    apiKey,
    secretKey,
    webhookSecret: webhookSecret ?? "",
    walletAddress,
    defaultCurrency,
    siteUrl,
  };
}
