import { NextResponse } from "next/server";
import { getSettlementOptions } from "@/lib/payments/settlement";

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json({ ok: true, ...getSettlementOptions() });
  } catch (error) {
    console.error("[checkout] payment options unavailable", error);
    return NextResponse.json(
      { ok: false, error: "Payment options unavailable" },
      { status: 503 },
    );
  }
}
