import { NextResponse } from "next/server";
import { parseCheckoutDetails } from "@/lib/orders/checkout";
import { createConvexOrder } from "@/lib/orders/convex";
import type { CryptoCurrency } from "@/lib/orders/types";
import {
  createCryptoQuote,
  getCryptoOption,
} from "@/lib/payments/crypto";

export const runtime = "nodejs";

function isCryptoCurrency(value: unknown): value is CryptoCurrency {
  return value === "eth" || value === "usdt" || value === "btc";
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (!isCryptoCurrency(body.currency)) {
      return NextResponse.json(
        { ok: false, error: "Select a supported cryptocurrency." },
        { status: 400 },
      );
    }
    const checkout = parseCheckoutDetails(body);
    const option = getCryptoOption(body.currency);
    const quote = await createCryptoQuote(checkout.subtotalAud, body.currency);
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
