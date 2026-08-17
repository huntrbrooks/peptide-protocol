import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireStaff, writeAudit } from "./lib/staff";

const inventoryRow = v.object({
  slug: v.string(),
  stockCode: v.string(),
  onHand: v.number(),
  reserved: v.number(),
  lowStockThreshold: v.number(),
  available: v.number(),
});

export async function reserveInventory(
  ctx: MutationCtx,
  lines: Array<{ slug: string; quantity: number }>,
): Promise<void> {
  for (const line of lines) {
    const row = await ctx.db
      .query("inventory")
      .withIndex("by_slug", (q) => q.eq("slug", line.slug))
      .unique();
    // Existing catalogue remains sellable during the one-time inventory migration.
    if (!row) continue;
    if (row.onHand - row.reserved < line.quantity) {
      throw new Error(`${line.slug} is out of stock`);
    }
    await ctx.db.patch("inventory", row._id, {
      reserved: row.reserved + line.quantity,
      updatedAt: Date.now(),
    });
  }
}

export async function settleInventory(
  ctx: MutationCtx,
  order: Doc<"orders">,
): Promise<void> {
  if (order.inventorySettledAt !== undefined) return;
  for (const line of order.lines) {
    const row = await ctx.db
      .query("inventory")
      .withIndex("by_slug", (q) => q.eq("slug", line.slug))
      .unique();
    if (!row) continue;
    await ctx.db.patch("inventory", row._id, {
      onHand: Math.max(0, row.onHand - line.quantity),
      reserved: Math.max(0, row.reserved - line.quantity),
      updatedAt: Date.now(),
    });
  }
  await ctx.db.patch("orders", order._id, { inventorySettledAt: Date.now() });
}

export async function releaseInventory(
  ctx: MutationCtx,
  order: Doc<"orders">,
): Promise<void> {
  if (order.inventorySettledAt !== undefined || order.inventoryReleasedAt !== undefined) return;
  for (const line of order.lines) {
    const row = await ctx.db
      .query("inventory")
      .withIndex("by_slug", (q) => q.eq("slug", line.slug))
      .unique();
    if (!row) continue;
    await ctx.db.patch("inventory", row._id, {
      reserved: Math.max(0, row.reserved - line.quantity),
      updatedAt: Date.now(),
    });
  }
  await ctx.db.patch("orders", order._id, { inventoryReleasedAt: Date.now() });
}

export const availability = query({
  args: { slugs: v.array(v.string()) },
  returns: v.array(inventoryRow),
  handler: async (ctx, args) => {
    const rows = [];
    for (const slug of args.slugs) {
      const row = await ctx.db
        .query("inventory")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      if (row) {
        rows.push({
          slug: row.slug,
          stockCode: row.stockCode,
          onHand: row.onHand,
          reserved: row.reserved,
          lowStockThreshold: row.lowStockThreshold,
          available: Math.max(0, row.onHand - row.reserved),
        });
      }
    }
    return rows;
  },
});

export const seed = mutation({
  args: {
    products: v.array(v.object({
      slug: v.string(),
      stockCode: v.string(),
      onHand: v.number(),
      lowStockThreshold: v.number(),
    })),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx, ["owner", "ops"]);
    let created = 0;
    for (const product of args.products) {
      const existing = await ctx.db
        .query("inventory")
        .withIndex("by_slug", (q) => q.eq("slug", product.slug))
        .unique();
      if (existing) continue;
      await ctx.db.insert("inventory", {
        ...product,
        reserved: 0,
        updatedAt: Date.now(),
      });
      created += 1;
    }
    await writeAudit(ctx, staff, "inventory.seed", "inventory", "catalogue", `${created} rows`);
    return created;
  },
});

export const setStock = mutation({
  args: {
    slug: v.string(),
    onHand: v.number(),
    lowStockThreshold: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx, ["owner", "ops"]);
    const row = await ctx.db
      .query("inventory")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!row) throw new Error("Inventory row not found");
    if (!Number.isInteger(args.onHand) || args.onHand < 0) throw new Error("Invalid on-hand quantity");
    await ctx.db.patch("inventory", row._id, {
      onHand: args.onHand,
      lowStockThreshold: Math.max(0, args.lowStockThreshold),
      updatedAt: Date.now(),
    });
    await writeAudit(ctx, staff, "inventory.set_stock", "inventory", String(row._id), `${args.onHand}`);
    return null;
  },
});
