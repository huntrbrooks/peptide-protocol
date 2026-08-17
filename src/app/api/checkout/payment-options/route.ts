import { NextResponse } from "next/server";
import { getSettlementOptions } from "@/lib/payments/settlement";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ ok: true, ...getSettlementOptions() });
}
