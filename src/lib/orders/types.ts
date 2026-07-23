/**
 * Shared order shapes used by Next.js checkout routes.
 * Canonical persistence lives in Convex (`convex/schema.ts` / `orders` table).
 * Timestamps in Convex are epoch ms; REST fallbacks may expose numbers.
 */

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

export type OrderLine = {
  slug: string;
  name: string;
  quantity: number;
  unitPriceAud: number;
  lineTotalAud: number;
};

export type OrderShipping = {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
};
