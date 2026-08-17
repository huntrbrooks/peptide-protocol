import "server-only";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const XAI_URL = "https://api.x.ai/v1/chat/completions";
// Claude Sonnet 5 is the production-default for reliable small-text screenshot
// reading and structured extraction at lower cost than flagship vision models;
// the model is env-overridable so it can be rotated without a code change.
const DEFAULT_VISION_MODEL = "anthropic/claude-sonnet-5";
const DEFAULT_XAI_VISION_MODEL = "grok-4.3-latest";

export type PaymentProofExtraction = {
  amount: number | null;
  currency: string | null;
  destination: string | null;
  accountLast4: string | null;
  bsb: string | null;
  transactionHash: string | null;
  reference: string | null;
  timestamp: string | null;
  looksAuthentic: boolean;
  confidence: number;
};

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function parseExtraction(value: unknown): PaymentProofExtraction {
  if (!value || typeof value !== "object") {
    throw new Error("The payment proof response was invalid.");
  }
  const item = value as Record<string, unknown>;
  if (
    !(item.amount === null || typeof item.amount === "number") ||
    !isNullableString(item.currency) ||
    !isNullableString(item.destination) ||
    !isNullableString(item.accountLast4) ||
    !isNullableString(item.bsb) ||
    !isNullableString(item.transactionHash) ||
    !isNullableString(item.reference) ||
    !isNullableString(item.timestamp) ||
    typeof item.looksAuthentic !== "boolean" ||
    typeof item.confidence !== "number"
  ) {
    throw new Error("The payment proof response was incomplete.");
  }
  return {
    amount: item.amount,
    currency: item.currency,
    destination: item.destination,
    accountLast4: item.accountLast4,
    bsb: item.bsb,
    transactionHash: item.transactionHash,
    reference: item.reference,
    timestamp: item.timestamp,
    looksAuthentic: item.looksAuthentic,
    confidence: item.confidence,
  };
}

type PaymentProofInput = {
  bytes: ArrayBuffer;
  contentType: string;
  paymentMethod: "crypto" | "bank";
  expectedAmount: number;
  expectedNetwork?: "ethereum" | "solana";
  expectedDestination: string;
  expectedBsb?: string;
};

type VisionProvider = "openrouter" | "xai";

async function extractWithProvider(
  input: PaymentProofInput,
  image: string,
  provider: VisionProvider,
): Promise<PaymentProofExtraction> {
  const isOpenRouter = provider === "openrouter";
  const apiKey = (
    isOpenRouter
      ? process.env.OPENROUTER_API_KEY
      : process.env.XAI_API_KEY
  )?.trim();
  if (!apiKey) {
    throw new Error(`${provider} vision verification is not configured.`);
  }

  const response = await fetch(isOpenRouter ? OPENROUTER_URL : XAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(isOpenRouter
        ? {
            "HTTP-Referer":
              process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
              "https://www.theprotocolau.com",
            "X-OpenRouter-Title": "The Protocol payment proof verifier",
          }
        : {}),
    },
    body: JSON.stringify({
      model: isOpenRouter
        ? process.env.OPENROUTER_VISION_MODEL?.trim() || DEFAULT_VISION_MODEL
        : process.env.XAI_VISION_MODEL?.trim() || DEFAULT_XAI_VISION_MODEL,
      ...(isOpenRouter ? { provider: { require_parameters: true } } : {}),
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                `Extract payment receipt fields. Expected method=${input.paymentMethod}, ` +
                `amount=${input.expectedAmount}, network=${input.expectedNetwork ?? "bank"}, ` +
                `destination=${input.expectedDestination}, bsb=${input.expectedBsb ?? "n/a"}. ` +
                "Do not infer hidden characters. Mark looksAuthentic false for unrelated, edited-looking, " +
                "failed, pending, or unreadable screenshots. A visual result is evidence only; blockchain " +
                "confirmation is performed separately.",
            },
            { type: "image_url", image_url: { url: image, detail: "high" } },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "payment_proof",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              amount: { type: ["number", "null"] },
              currency: { type: ["string", "null"] },
              destination: { type: ["string", "null"] },
              accountLast4: { type: ["string", "null"] },
              bsb: { type: ["string", "null"] },
              transactionHash: { type: ["string", "null"] },
              reference: { type: ["string", "null"] },
              timestamp: { type: ["string", "null"] },
              looksAuthentic: { type: "boolean" },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: [
              "amount",
              "currency",
              "destination",
              "accountLast4",
              "bsb",
              "transactionHash",
              "reference",
              "timestamp",
              "looksAuthentic",
              "confidence",
            ],
          },
        },
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`${provider} could not read the payment screenshot.`);
  }
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`${provider} returned an empty payment proof response.`);
  }
  return parseExtraction(JSON.parse(content) as unknown);
}

export async function extractPaymentProof(
  input: PaymentProofInput,
): Promise<PaymentProofExtraction> {
  const image = `data:${input.contentType};base64,${Buffer.from(input.bytes).toString("base64")}`;
  try {
    return await extractWithProvider(input, image, "openrouter");
  } catch {
    try {
      return await extractWithProvider(input, image, "xai");
    } catch {
      throw new Error(
        "The payment screenshot could not be read. Please try again.",
      );
    }
  }
}
