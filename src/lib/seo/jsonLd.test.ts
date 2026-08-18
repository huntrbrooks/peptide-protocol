import { describe, expect, it } from "vitest";
import { getProductBySlug } from "@/content/products";
import {
  buildFaqPageJsonLd,
  buildProductBreadcrumbJsonLd,
  buildProductJsonLd,
  organizationSameAs,
  serializeJsonLd,
} from "./jsonLd";

describe("serializeJsonLd", () => {
  it("escapes angle brackets for safe script embedding", () => {
    expect(serializeJsonLd({ text: "a < b" })).toContain("\\u003c");
    expect(serializeJsonLd({ text: "a < b" })).not.toContain("<");
  });
});

describe("buildFaqPageJsonLd", () => {
  it("returns null for an empty list", () => {
    expect(buildFaqPageJsonLd([])).toBeNull();
  });

  it("maps question and answer only", () => {
    const json = buildFaqPageJsonLd([
      {
        question: "Do you ship to AU?",
        answer: "Yes.",
        link: { href: "/shipping", label: "Shipping" },
      },
    ]);
    expect(json).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Do you ship to AU?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes.",
          },
        },
      ],
    });
  });
});

describe("buildProductJsonLd", () => {
  const product = getProductBySlug("bpc-157-10mg");
  if (!product) throw new Error("expected catalogue product");

  it("builds Product, Offer, specs, FAQ, and breadcrumb without medical claims", () => {
    const json = buildProductJsonLd(product);
    const graph = json["@graph"] as Record<string, unknown>[];
    const productNode = graph.find((node) => node["@type"] === "Product") as
      | Record<string, unknown>
      | undefined;
    const faqNode = graph.find((node) => node["@type"] === "FAQPage");
    const breadcrumb = graph.find((node) => node["@type"] === "BreadcrumbList");

    expect(productNode).toMatchObject({
      name: product.name,
      sku: product.stockCode,
      description: product.metaDescription,
      category: "Laboratory research material",
      brand: { "@type": "Brand", name: "The Protocol" },
      image: `https://theprotocolau.com${product.image}`,
      url: `https://theprotocolau.com/products/${product.slug}`,
    });
    expect(productNode?.offers).toMatchObject({
      "@type": "Offer",
      priceCurrency: "AUD",
      price: product.priceAud.toFixed(2),
      availability: "https://schema.org/InStock",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "AU",
        },
      },
    });
    expect(productNode?.additionalProperty).toEqual(
      product.specs.map((spec) => ({
        "@type": "PropertyValue",
        name: spec.label,
        value: spec.value,
      })),
    );
    expect(faqNode).toBeTruthy();
    expect(breadcrumb).toBeTruthy();
    expect(JSON.stringify(json)).not.toMatch(/medicalClaim|indication|disease/i);
  });

  it("marks out-of-stock products correctly", () => {
    const json = buildProductJsonLd({ ...product, inStock: false });
    const graph = json["@graph"] as Record<string, unknown>[];
    const productNode = graph.find((node) => node["@type"] === "Product") as
      | Record<string, unknown>
      | undefined;
    const offers = productNode?.offers as Record<string, unknown>;
    expect(offers.availability).toBe("https://schema.org/OutOfStock");
  });
});

describe("buildProductBreadcrumbJsonLd", () => {
  it("includes Home → Shop → Category → Product", () => {
    const product = getProductBySlug("bpc-157-10mg");
    if (!product) throw new Error("expected catalogue product");
    const breadcrumb = buildProductBreadcrumbJsonLd(product);
    expect(breadcrumb?.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://theprotocolau.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: "https://theprotocolau.com/shop",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Tissue & recovery research",
        item: "https://theprotocolau.com/shop/tissue-recovery",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: `https://theprotocolau.com/products/${product.slug}`,
      },
    ]);
  });
});

describe("organizationSameAs", () => {
  it("returns the established Instagram profile", () => {
    expect(organizationSameAs()).toEqual([
      "https://www.instagram.com/theprotocol.au/",
    ]);
  });
});
