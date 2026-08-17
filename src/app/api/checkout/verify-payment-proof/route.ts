import { NextResponse } from "next/server";
import type { Id } from "../../../../../convex/_generated/dataModel";
import {
  attachPaymentProof,
  finalizePaymentProof,
  getConvexOrder,
  getPaymentProofUrl,
} from "@/lib/orders/convex";
import { sendOrderPaidEmails } from "@/lib/orders/paid-email";
import { verifyCryptoTransaction } from "@/lib/payments/crypto";
import { verifyOrderProofToken } from "@/lib/payments/order-proof";
import { extractPaymentProof } from "@/lib/payments/proof-verifier";
import { getSettlementOptions } from "@/lib/payments/settlement";

export const runtime = "nodejs";

const MAX_PROOF_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function normalize(value: string | null): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function amountMatches(actual: number | null, expected: number): boolean {
  return actual !== null && Math.abs(actual - expected) <= 0.01;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      orderId?: unknown;
      proofToken?: unknown;
      storageId?: unknown;
    };
    if (
      typeof body.orderId !== "string" ||
      typeof body.proofToken !== "string" ||
      typeof body.storageId !== "string"
    ) {
      return NextResponse.json(
        { ok: false, error: "Valid payment proof details are required." },
        { status: 400 },
      );
    }

    const order = await getConvexOrder(body.orderId);
    if (
      !order ||
      (order.paymentMethod !== "crypto" && order.paymentMethod !== "bank") ||
      !verifyOrderProofToken(
        body.orderId,
        order.paymentMethod,
        body.proofToken,
      )
    ) {
      return NextResponse.json(
        { ok: false, error: "This payment proof session is invalid." },
        { status: 403 },
      );
    }
    if (order.status === "paid") {
      return NextResponse.json({ ok: true, status: "paid" });
    }

    const storageId = body.storageId as Id<"_storage">;
    const attached = await attachPaymentProof({
      orderId: body.orderId,
      storageId,
    });
    if (!attached) {
      return NextResponse.json(
        { ok: false, error: "This order can no longer accept payment proof." },
        { status: 409 },
      );
    }
    const proofUrl = await getPaymentProofUrl({
      orderId: body.orderId,
      storageId,
    });
    if (!proofUrl) throw new Error("Uploaded payment proof was not found.");

    const imageResponse = await fetch(proofUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const contentType = imageResponse.headers.get("content-type")?.split(";")[0] ?? "";
    const contentLength = Number(imageResponse.headers.get("content-length") ?? "0");
    if (
      !imageResponse.ok ||
      !ALLOWED_IMAGE_TYPES.has(contentType) ||
      contentLength > MAX_PROOF_BYTES
    ) {
      throw new Error("Upload a PNG, JPEG, or WebP screenshot under 8 MB.");
    }
    const bytes = await imageResponse.arrayBuffer();
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_PROOF_BYTES) {
      throw new Error("Upload a payment screenshot under 8 MB.");
    }

    const settlement = getSettlementOptions();
    const expectedDestination =
      order.paymentMethod === "crypto"
        ? order.cryptoWalletAddress
        : settlement.bank.accountNumber;
    if (!expectedDestination) throw new Error("Order settlement details are incomplete.");

    const extraction = await extractPaymentProof({
      bytes,
      contentType,
      paymentMethod: order.paymentMethod,
      expectedAmount:
        order.paymentMethod === "crypto"
          ? (order.cryptoExpectedAmount ?? 0)
          : order.subtotalAud,
      expectedNetwork:
        order.cryptoChain === "ethereum" || order.cryptoChain === "solana"
          ? order.cryptoChain
          : undefined,
      expectedDestination,
      expectedBsb:
        order.paymentMethod === "bank" ? settlement.bank.bsb : undefined,
    });

    if (order.paymentMethod === "bank") {
      const accountMatches =
        normalize(extraction.destination) ===
          normalize(settlement.bank.accountNumber) ||
        normalize(extraction.accountLast4) ===
          settlement.bank.accountNumber.slice(-4);
      const bankMatches =
        extraction.looksAuthentic &&
        extraction.confidence >= 0.65 &&
        amountMatches(extraction.amount, order.subtotalAud) &&
        normalize(extraction.currency).includes("aud") &&
        normalize(extraction.bsb) === normalize(settlement.bank.bsb) &&
        accountMatches;
      const verificationStatus = bankMatches ? "pending_review" : "rejected";
      await finalizePaymentProof({
        orderId: body.orderId,
        storageId,
        verificationStatus,
        reference: extraction.reference ?? undefined,
        timestamp: extraction.timestamp ?? undefined,
        verificationNote: bankMatches
          ? "Receipt details match the order; bank settlement requires staff review."
          : "The uploaded bank receipt did not match the expected amount or account.",
      });
      if (!bankMatches) {
        return NextResponse.json(
          {
            ok: false,
            status: "rejected",
            error:
              "The screenshot did not clearly show a successful transfer for the expected amount and account.",
          },
          { status: 422 },
        );
      }
      return NextResponse.json(
        {
          ok: true,
          status: "pending_review",
          message: "Receipt received. Bank settlement is pending staff review.",
        },
        { status: 202 },
      );
    }

    if (
      !order.cryptoExpectedAmount ||
      !order.cryptoWalletAddress ||
      (order.cryptoChain !== "ethereum" && order.cryptoChain !== "solana")
    ) {
      throw new Error("Crypto order settlement details are incomplete.");
    }
    const txid = extraction.transactionHash?.trim();
    const screenshotMatches =
      extraction.looksAuthentic &&
      extraction.confidence >= 0.65 &&
      amountMatches(extraction.amount, order.cryptoExpectedAmount) &&
      normalize(extraction.currency).includes("usdc") &&
      Boolean(txid);
    if (!screenshotMatches || !txid) {
      await finalizePaymentProof({
        orderId: body.orderId,
        storageId,
        verificationStatus: "rejected",
        reference: extraction.reference ?? undefined,
        timestamp: extraction.timestamp ?? undefined,
        verificationNote:
          "The screenshot did not clearly show a successful USDC transfer matching this order.",
      });
      return NextResponse.json(
        {
          ok: false,
          status: "rejected",
          error:
            "The screenshot did not clearly show the expected successful USDC transfer.",
        },
        { status: 422 },
      );
    }

    const chainResult = await verifyCryptoTransaction({
      currency: "usdc",
      chain: order.cryptoChain,
      expectedAmount: order.cryptoExpectedAmount,
      walletAddress: order.cryptoWalletAddress,
      txid,
    });
    const verificationStatus = chainResult.verified
      ? "verified"
      : "pending_review";
    const updated = await finalizePaymentProof({
      orderId: body.orderId,
      storageId,
      verificationStatus,
      txid,
      reference: extraction.reference ?? undefined,
      timestamp: extraction.timestamp ?? undefined,
      verificationNote: chainResult.note,
    });
    if (!updated) throw new Error("Crypto order not found.");
    if (chainResult.verified) {
      await sendOrderPaidEmails(String(updated));
    }
    return NextResponse.json(
      {
        ok: true,
        status: chainResult.verified ? "paid" : "pending_review",
        message: chainResult.note,
      },
      { status: chainResult.verified ? 200 : 202 },
    );
  } catch (error) {
    console.error("[checkout] payment proof verification failed", error);
    const message =
      error instanceof Error ? error.message : "Unable to verify payment proof.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
