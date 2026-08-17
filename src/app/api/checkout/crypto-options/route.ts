import { NextResponse } from "next/server";
import { getConfiguredCryptoOptions } from "@/lib/payments/crypto";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    ok: true,
    options: getConfiguredCryptoOptions().map(({ currency, chain, label }) => ({
      currency,
      chain,
      label,
    })),
  });
}
