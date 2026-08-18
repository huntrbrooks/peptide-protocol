import { describe, expect, it } from "vitest";
import { catalogue } from "../../convex/lib/catalogue";
import { products } from "./products";

describe("Convex catalogue", () => {
  it("matches every storefront product name and price", () => {
    const storefront = Object.fromEntries(
      products.map(({ slug, name, priceAud }) => [slug, { name, priceAud }]),
    );

    expect(catalogue).toEqual(storefront);
  });
});
