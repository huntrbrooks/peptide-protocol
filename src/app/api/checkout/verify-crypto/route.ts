import { NextResponse } from "next/server";
import {
  getConvexPaymentOrder,
  submitCryptoVerification,
} from "@/lib/orders/convex";
import { sendOrderPaidEmails } from "@/lib/orders/paid-email";
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

    const order = await getConvexPaymentOrder(body.orderId.trim());
    if (
      !order ||
      order.paymentMethod !== "crypto" ||
      order.cryptoCurrency !== "usdc" ||
      (order.cryptoChain !== "ethereum" && order.cryptoChain !== "solana") ||
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
      chain: order.cryptoChain,
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
    if (result.verified) {
      try {
        await sendOrderPaidEmails(String(updated));
      } catch (error) {
        console.error("[checkout] paid-order email failed", error);
        return NextResponse.json(
          {
            ok: false,
            verified: true,
            status: "paid",
            error:
              "Payment was confirmed, but the confirmation email could not be sent. Please contact support.",
          },
          { status: 502 },
        );
      }
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
