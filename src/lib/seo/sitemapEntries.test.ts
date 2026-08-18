import { describe, expect, it } from "vitest";
import { categories } from "@/content/categories";
import { products } from "@/content/products";
import { buildSitemapEntries } from "./sitemapEntries";

describe("buildSitemapEntries", () => {
  const urls = buildSitemapEntries(new Date("2026-08-18T00:00:00.000Z")).map(
    (entry) => entry.url,
  );

  it("includes home, shop, products, and categories", () => {
    expect(urls).toContain("https://theprotocolau.com");
    expect(urls).toContain("https://theprotocolau.com/shop");
    expect(urls).toContain("https://theprotocolau.com/products/bpc-157-10mg");
    expect(urls).toContain("https://theprotocolau.com/shop/metabolic");
  });

  it("covers every catalogue product and category", () => {
    for (const product of products) {
      expect(urls).toContain(
        `https://theprotocolau.com/products/${product.slug}`,
      );
    }
    for (const category of categories) {
      expect(urls).toContain(
        `https://theprotocolau.com/shop/${category.slug}`,
      );
    }
  });

  it("omits private and checkout routes", () => {
    expect(urls.some((url) => url.includes("/checkout"))).toBe(false);
    expect(urls.some((url) => url.includes("/admin"))).toBe(false);
    expect(urls.some((url) => url.includes("/account"))).toBe(false);
    expect(urls.some((url) => url.includes("/api/"))).toBe(false);
  });
});
