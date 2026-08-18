import { describe, expect, it } from "vitest";
import {
  availableForSlug,
  expandInventoryLines,
  inventoryDemand,
  OPENING_STOCK,
  PHYSICAL_STOCK,
} from "./stockList";

describe("stock list", () => {
  it("totals 360 physical vials", () => {
    expect(PHYSICAL_STOCK.reduce((sum, row) => sum + row.onHand, 0)).toBe(360);
  });

  it("covers every opening SKU once", () => {
    const slugs = OPENING_STOCK.map((row) => row.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toHaveLength(18);
  });

  it("expands kit demand onto the parent vial pool", () => {
    expect(inventoryDemand("bpc-157-10mg-kit-10", 2)).toEqual({
      slug: "bpc-157-10mg",
      quantity: 20,
    });
    expect(
      expandInventoryLines([
        { slug: "bpc-157-10mg", quantity: 3 },
        { slug: "bpc-157-10mg-kit-10", quantity: 1 },
      ]),
    ).toEqual([{ slug: "bpc-157-10mg", quantity: 13 }]);
  });

  it("derives kit availability from parent vials", () => {
    expect(availableForSlug("retatrutide-60mg-kit-10", 10)).toBe(1);
    expect(availableForSlug("retatrutide-60mg", 10)).toBe(10);
    expect(availableForSlug("cjc-1295-no-dac-10mg-kit-10", 19)).toBe(1);
  });
});
