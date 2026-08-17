import { NextResponse } from "next/server";
import { resolveCheckoutTotals } from "@/lib/orders/checkout";
import { createConvexOrder } from "@/lib/orders/convex";
import type { CryptoChain } from "@/lib/orders/types";
import { createOrderProofToken } from "@/lib/payments/order-proof";
import {
  createCryptoQuote,
  getCryptoOption,
} from "@/lib/payments/crypto";

export const runtime = "nodejs";

function isCryptoChain(value: unknown): value is CryptoChain {
  return value === "ethereum" || value === "solana";
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (!isCryptoChain(body.chain)) {
      return NextResponse.json(
        { ok: false, error: "Select a supported cryptocurrency." },
        { status: 400 },
      );
    }
    const checkout = await resolveCheckoutTotals(body);
    const option = getCryptoOption(body.chain);
    const quote = await createCryptoQuote(checkout.subtotalAud);
    const orderId = await createConvexOrder({
      ...checkout,
      paymentMethod: "crypto",
      cryptoCurrency: option.currency,
      cryptoChain: option.chain,
      cryptoExpectedAmount: quote.expectedAmount,
      cryptoWalletAddress: option.walletAddress,
    });

    return NextResponse.json({
      ok: true,
      orderId,
      currency: option.currency,
      chain: option.chain,
      expectedAmount: quote.expectedAmount,
      walletAddress: option.walletAddress,
      bufferPercent: quote.bufferPercent,
      proofToken: createOrderProofToken(String(orderId), "crypto"),
    });
  } catch (error) {
    console.error("[checkout] create crypto order failed", error);
    const message =
      error instanceof Error ? error.message : "Unable to create crypto order.";
    return NextResponse.json(
      { ok: false, error: message },
      { status: message.includes("configured") ? 503 : 400 },
    );
  }
}
