import { NextResponse } from "next/server";
import { getProductBySlug } from "@/content/products";
import { createConvexOrder } from "@/lib/orders/convex";
import type { OrderLine, OrderShipping } from "@/lib/orders/types";
import { buildSignedBuyUrl, getMoonPayConfig } from "@/lib/payments/moonpay";

export const runtime = "nodejs";

type CartItemInput = {
  slug: string;
  quantity: number;
};

type SessionBody = {
  email?: unknown;
  researchAck?: unknown;
  shipping?: unknown;
  items?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseItems(value: unknown): CartItemInput[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const items: CartItemInput[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") return null;
    const slug = (row as { slug?: unknown }).slug;
    const quantity = (row as { quantity?: unknown }).quantity;
    if (!isNonEmptyString(slug)) return null;
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    ) {
      return null;
    }
    items.push({ slug: slug.trim(), quantity });
  }
  return items;
}

function parseShipping(value: unknown): OrderShipping | null {
  if (!value || typeof value !== "object") return null;
  const s = value as Record<string, unknown>;
  if (
    !isNonEmptyString(s.fullName) ||
    !isNonEmptyString(s.line1) ||
    !isNonEmptyString(s.city) ||
    !isNonEmptyString(s.state) ||
    !isNonEmptyString(s.postcode)
  ) {
    return null;
  }
  return {
    fullName: s.fullName.trim(),
    line1: s.line1.trim(),
    line2: isNonEmptyString(s.line2) ? s.line2.trim() : undefined,
    city: s.city.trim(),
    state: s.state.trim(),
    postcode: s.postcode.trim(),
    country: isNonEmptyString(s.country) ? s.country.trim() : "AU",
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as SessionBody;

    if (body.researchAck !== true) {
      return NextResponse.json(
        { ok: false, error: "Research-use acknowledgement is required." },
        { status: 400 },
      );
    }

    if (!isNonEmptyString(body.email) || !body.email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "A valid email is required." },
        { status: 400 },
      );
    }

    const shipping = parseShipping(body.shipping);
    if (!shipping) {
      return NextResponse.json(
        { ok: false, error: "Shipping details are incomplete." },
        { status: 400 },
      );
    }

    const items = parseItems(body.items);
    if (!items) {
      return NextResponse.json(
        { ok: false, error: "Cart items are invalid or empty." },
        { status: 400 },
      );
    }

    const lines: OrderLine[] = [];
    for (const item of items) {
      const product = getProductBySlug(item.slug);
      if (!product) {
        return NextResponse.json(
          { ok: false, error: `Unknown product: ${item.slug}` },
          { status: 400 },
        );
      }
      const lineTotalAud =
        Math.round(product.priceAud * item.quantity * 100) / 100;
      lines.push({
        slug: product.slug,
        name: product.name,
        quantity: item.quantity,
        unitPriceAud: product.priceAud,
        lineTotalAud,
      });
    }

    const subtotalAud =
      Math.round(lines.reduce((sum, line) => sum + line.lineTotalAud, 0) * 100) /
      100;

    if (subtotalAud <= 0) {
      return NextResponse.json(
        { ok: false, error: "Order total must be greater than zero." },
        { status: 400 },
      );
    }

    const moonpay = getMoonPayConfig();
    if (!moonpay) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "MoonPay checkout is not configured yet. Set MOONPAY_API_KEY, MOONPAY_SECRET_KEY, and MOONPAY_WALLET_ADDRESS.",
        },
        { status: 503 },
      );
    }

    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Orders backend is not configured. Set NEXT_PUBLIC_CONVEX_URL (run `npx convex dev`).",
        },
        { status: 503 },
      );
    }

    const orderId = await createConvexOrder({
      email: body.email.trim().toLowerCase(),
      shipping,
      lines,
      subtotalAud,
      currencyCrypto: moonpay.defaultCurrency,
    });

    const redirectURL = `${moonpay.siteUrl}/checkout/success?orderId=${encodeURIComponent(orderId)}`;
    const paymentUrl = buildSignedBuyUrl(
      {
        apiKey: moonpay.apiKey,
        baseCurrencyCode: "aud",
        baseCurrencyAmount: subtotalAud.toFixed(2),
        currencyCode: moonpay.defaultCurrency,
        walletAddress: moonpay.walletAddress,
        externalTransactionId: orderId,
        redirectURL,
        email: body.email.trim().toLowerCase(),
      },
      moonpay.secretKey,
    );

    return NextResponse.json({
      ok: true,
      orderId,
      paymentUrl,
    });
  } catch (error) {
    console.error("checkout/session failure", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error creating checkout session.",
      },
      { status: 500 },
    );
  }
}
