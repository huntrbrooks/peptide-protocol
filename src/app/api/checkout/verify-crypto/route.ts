import { NextResponse } from "next/server";
import {
  getConvexOrder,
  submitCryptoVerification,
} from "@/lib/orders/convex";
import { verifyCryptoTransaction } from "@/lib/payments/crypto";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      orderId?: unknown;
      txid?: unknown;
    };
    if (
      typeof body.orderId !== "string" ||
      typeof body.txid !== "string" ||
      !body.orderId.trim() ||
      !body.txid.trim()
    ) {
      return NextResponse.json(
        { ok: false, error: "Order ID and transaction ID are required." },
        { status: 400 },
      );
    }

    const order = await getConvexOrder(body.orderId.trim());
    if (
      !order ||
      order.paymentMethod !== "crypto" ||
      !order.cryptoCurrency ||
      !order.cryptoExpectedAmount ||
      !order.cryptoWalletAddress
    ) {
      return NextResponse.json(
        { ok: false, error: "Crypto order not found." },
        { status: 404 },
      );
    }
    const result = await verifyCryptoTransaction({
      currency: order.cryptoCurrency,
      expectedAmount: order.cryptoExpectedAmount,
      walletAddress: order.cryptoWalletAddress,
      txid: body.txid.trim(),
    });
    const updated = await submitCryptoVerification({
      orderId: body.orderId.trim(),
      txid: body.txid.trim(),
      verified: result.verified,
      verificationNote: result.note,
    });
    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "Crypto order not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      verified: result.verified,
      status: result.verified ? "paid" : "pending_verification",
      message: result.note,
    });
  } catch (error) {
    console.error("[checkout] crypto verification failed", error);
    const message =
      error instanceof Error ? error.message : "Unable to verify transaction.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
