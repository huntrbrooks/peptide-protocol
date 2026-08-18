import { fetchMutation } from "convex/nextjs";
import { NextResponse } from "next/server";
import { api } from "../../../../../convex/_generated/api";
import { requirePaymentSecret } from "@/lib/orders/convex";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  const destination = new URL("/account", url.origin);
  if (!token || token.length < 64) {
    destination.searchParams.set("memberLink", "invalid");
    return NextResponse.redirect(destination);
  }

  try {
    const linked = await fetchMutation(api.members.completeMemberLink, {
      token,
      paymentSecret: requirePaymentSecret(),
    });
    destination.searchParams.set("memberLink", linked ? "verified" : "invalid");
  } catch (error) {
    console.error("[auth] member link verification failed", error);
    destination.searchParams.set("memberLink", "invalid");
  }
  return NextResponse.redirect(destination);
}
