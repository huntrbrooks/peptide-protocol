import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireStaff, writeAudit } from "./lib/staff";
import {
  availableForSlug,
  KIT_PARENT,
  OPENING_STOCK,
  expandInventoryLines,
  type StockEntry,
} from "./lib/stockList";

const inventoryRow = v.object({
  slug: v.string(),
  available: v.number(),
});

async function upsertStock(
  ctx: MutationCtx,
  products: StockEntry[],
): Promise<number> {
  let updated = 0;
  for (const product of products) {
    if (!Number.isInteger(product.onHand) || product.onHand < 0) {
      throw new Error(`Invalid on-hand quantity for ${product.slug}`);
    }
    const existing = await ctx.db
      .query("inventory")
      .withIndex("by_slug", (q) => q.eq("slug", product.slug))
      .unique();
    if (existing) {
      await ctx.db.patch("inventory", existing._id, {
        stockCode: product.stockCode,
        onHand: product.onHand,
        lowStockThreshold: Math.max(0, product.lowStockThreshold),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("inventory", {
        slug: product.slug,
        stockCode: product.stockCode,
        onHand: product.onHand,
        reserved: 0,
        lowStockThreshold: Math.max(0, product.lowStockThreshold),
        updatedAt: Date.now(),
      });
    }
    updated += 1;
  }
  return updated;
}

export async function reserveInventory(
  ctx: MutationCtx,
  lines: Array<{ slug: string; quantity: number }>,
): Promise<void> {
  for (const line of expandInventoryLines(lines)) {
    const row = await ctx.db
      .query("inventory")
      .withIndex("by_slug", (q) => q.eq("slug", line.slug))
      .unique();
    if (!row) {
      throw new Error(`${line.slug} is unavailable`);
    }
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
  for (const line of expandInventoryLines(order.lines)) {
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
  for (const line of expandInventoryLines(order.lines)) {
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

async function readAvailability(
  ctx: QueryCtx | MutationCtx,
  slugs: string[],
): Promise<Array<{ slug: string; available: number }>> {
  if (slugs.length === 0 || slugs.length > 50) {
    throw new Error("Request between 1 and 50 catalogue items");
  }
  const rows = [];
  for (const slug of slugs) {
    const lookupSlug = KIT_PARENT[slug] ?? slug;
    const row = await ctx.db
      .query("inventory")
      .withIndex("by_slug", (q) => q.eq("slug", lookupSlug))
      .unique();
    if (row) {
      rows.push({
        slug,
        available: availableForSlug(slug, row.onHand - row.reserved),
      });
    }
  }
  return rows;
}

export const availability = mutation({
  args: { slugs: v.array(v.string()) },
  returns: v.array(inventoryRow),
  handler: async (ctx, args) => {
    return await readAvailability(ctx, args.slugs);
  },
});

export const listAvailability = query({
  args: { slugs: v.array(v.string()) },
  returns: v.array(inventoryRow),
  handler: async (ctx, args) => {
    return await readAvailability(ctx, args.slugs);
  },
});

export const applyOpeningStock = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    return await upsertStock(ctx, OPENING_STOCK);
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
    const updated = await upsertStock(ctx, args.products);
    await writeAudit(ctx, staff, "inventory.seed", "inventory", "catalogue", `${updated} rows`);
    return updated;
  },
});

export const applyWarehouseStock = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const staff = await requireStaff(ctx, ["owner", "ops"]);
    const updated = await upsertStock(ctx, OPENING_STOCK);
    await writeAudit(
      ctx,
      staff,
      "inventory.apply_warehouse_stock",
      "inventory",
      "catalogue",
      `${updated} rows`,
    );
    return updated;
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
