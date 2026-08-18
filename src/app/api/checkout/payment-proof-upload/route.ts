import { NextResponse } from "next/server";
import {
  generateProofUploadUrl,
  getConvexPaymentOrder,
} from "@/lib/orders/convex";
import { verifyOrderProofToken } from "@/lib/payments/order-proof";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      orderId?: unknown;
      proofToken?: unknown;
      contentType?: unknown;
    };
    if (
      typeof body.orderId !== "string" ||
      typeof body.proofToken !== "string" ||
      typeof body.contentType !== "string" ||
      !ALLOWED_IMAGE_TYPES.has(body.contentType)
    ) {
      return NextResponse.json(
        { ok: false, error: "A valid order and PNG, JPEG, or WebP proof are required." },
        { status: 400 },
      );
    }
    const order = await getConvexPaymentOrder(body.orderId);
    if (
      !order ||
      (order.paymentMethod !== "crypto" && order.paymentMethod !== "bank") ||
      (order.status !== "pending" && order.status !== "pending_verification") ||
      !verifyOrderProofToken(
        body.orderId,
        order.paymentMethod,
        body.proofToken,
      )
    ) {
      return NextResponse.json(
        { ok: false, error: "This payment proof session is invalid or expired." },
        { status: 403 },
      );
    }
    return NextResponse.json({
      ok: true,
      uploadUrl: await generateProofUploadUrl(),
    });
  } catch (error) {
    console.error("[checkout] proof upload URL failed", error);
    return NextResponse.json(
      { ok: false, error: "Unable to prepare the proof upload." },
      { status: 500 },
    );
  }
}
