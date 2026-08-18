import { getProductBySlug } from "@/content/products";
import { applyMemberDiscount, normalizeMemberCode } from "@/lib/membership/discount";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { OrderLine, OrderShipping } from "./types";

type CartItemInput = {
  slug: string;
  quantity: number;
};

export type CheckoutDetails = {
  email: string;
  shipping: OrderShipping;
  lines: OrderLine[];
  subtotalAud: number;
  discountCode?: string;
};

export type ResolvedCheckout = CheckoutDetails & {
  subtotalBeforeDiscountAud: number;
  discountAud: number;
  discountPercent: number;
  memberId?: Id<"members">;
};

type CheckoutBody = {
  email?: unknown;
  researchAck?: unknown;
  shipping?: unknown;
  items?: unknown;
  discountCode?: unknown;
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
  const shipping = value as Record<string, unknown>;
  if (
    !isNonEmptyString(shipping.fullName) ||
    !isNonEmptyString(shipping.line1) ||
    !isNonEmptyString(shipping.city) ||
    !isNonEmptyString(shipping.state) ||
    !isNonEmptyString(shipping.postcode)
  ) {
    return null;
  }
  return {
    fullName: shipping.fullName.trim(),
    line1: shipping.line1.trim(),
    line2: isNonEmptyString(shipping.line2)
      ? shipping.line2.trim()
      : undefined,
    city: shipping.city.trim(),
    state: shipping.state.trim(),
    postcode: shipping.postcode.trim(),
    country: isNonEmptyString(shipping.country)
      ? shipping.country.trim().toUpperCase()
      : "AU",
  };
}

export function parseCheckoutDetails(body: unknown): CheckoutDetails {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid checkout request.");
  }
  const input = body as CheckoutBody;
  if (input.researchAck !== true) {
    throw new Error("Research-use acknowledgement is required.");
  }
  if (!isNonEmptyString(input.email) || !input.email.includes("@")) {
    throw new Error("A valid email is required.");
  }
  const shipping = parseShipping(input.shipping);
  if (!shipping) {
    throw new Error("Shipping details are incomplete.");
  }
  const items = parseItems(input.items);
  if (!items) {
    throw new Error("Cart items are invalid or empty.");
  }

  const lines = items.map((item): OrderLine => {
    const product = getProductBySlug(item.slug);
    if (!product) {
      throw new Error(`Unknown product: ${item.slug}`);
    }
    return {
      slug: product.slug,
      name: product.name,
      quantity: item.quantity,
      unitPriceAud: product.priceAud,
      lineTotalAud:
        Math.round(product.priceAud * item.quantity * 100) / 100,
    };
  });
  const subtotalAud =
    Math.round(lines.reduce((sum, line) => sum + line.lineTotalAud, 0) * 100) /
    100;
  if (subtotalAud <= 0) {
    throw new Error("Order total must be greater than zero.");
  }

  const discountCode = isNonEmptyString(input.discountCode)
    ? normalizeMemberCode(input.discountCode)
    : undefined;

  return {
    email: input.email.trim().toLowerCase(),
    shipping,
    lines,
    subtotalAud,
    discountCode,
  };
}

export async function resolveCheckoutTotals(
  body: unknown,
): Promise<ResolvedCheckout> {
  const checkout = parseCheckoutDetails(body);
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL is not set. Run `npx convex dev` to link a project.",
    );
  }
  const availability = await fetchMutation(api.inventory.availability, {
    slugs: checkout.lines.map((line) => line.slug),
  });
  const availableBySlug = new Map(
    availability.map((row) => [row.slug, row.available]),
  );
  for (const line of checkout.lines) {
    const available = availableBySlug.get(line.slug);
    if (available === undefined) {
      throw new Error(`${line.name} is unavailable.`);
    }
    if (available < line.quantity) {
      throw new Error(`${line.name} is out of stock.`);
    }
  }
  const quote = await fetchQuery(api.members.quoteDiscount, {
    email: checkout.email,
    code: checkout.discountCode,
  });
  const applied = applyMemberDiscount(checkout.subtotalAud, quote.percent);
  return {
    ...checkout,
    subtotalBeforeDiscountAud: checkout.subtotalAud,
    subtotalAud: applied.subtotalAud,
    discountAud: applied.discountAud,
    discountPercent: quote.percent,
    discountCode: quote.code ?? undefined,
    memberId: quote.memberId ?? undefined,
  };
}
