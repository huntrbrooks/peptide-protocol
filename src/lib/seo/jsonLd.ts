import { getCategoryBySlug } from "@/content/categories";
import { site } from "@/content/site";
import type { FaqItem, Product } from "@/content/types";
import { absoluteUrl } from "./urls";

const RESEARCH_CATEGORY = "Laboratory research material";
const INSTAGRAM_SAME_AS = "https://www.instagram.com/theprotocol.au/";

/** Escape `<` so JSON-LD cannot break out of a script tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function buildFaqPageJsonLd(faqs: FaqItem[]): Record<string, unknown> | null {
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function organizationSameAs(): string[] {
  if (site.handle === "@theprotocol.au") {
    return [INSTAGRAM_SAME_AS];
  }
  return [];
}

export function buildProductJsonLd(product: Product): Record<string, unknown> {
  const productUrl = absoluteUrl(`/products/${product.slug}`);
  const inStock = product.inStock ?? true;
  const image = absoluteUrl(product.image);

  const offer: Record<string, unknown> = {
    "@type": "Offer",
    url: productUrl,
    priceCurrency: site.currency,
    price: product.priceAud.toFixed(2),
    availability: inStock
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: "AU",
      },
    },
  };

  const productNode: Record<string, unknown> = {
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    description: product.metaDescription,
    image,
    brand: {
      "@type": "Brand",
      name: site.name,
    },
    category: RESEARCH_CATEGORY,
    url: productUrl,
    offers: offer,
    additionalProperty: product.specs.map((spec) => ({
      "@type": "PropertyValue",
      name: spec.label,
      value: spec.value,
    })),
  };

  if (product.stockCode) {
    productNode.sku = product.stockCode;
  }

  const graph: Record<string, unknown>[] = [productNode];

  if (product.faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: product.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
  }

  const breadcrumb = buildProductBreadcrumbJsonLd(product);
  if (breadcrumb) {
    graph.push(breadcrumb);
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function buildProductBreadcrumbJsonLd(
  product: Product,
): Record<string, unknown> | null {
  const primarySlug = product.categorySlugs[0];
  const category = primarySlug ? getCategoryBySlug(primarySlug) : undefined;

  const crumbs: { name: string; path: string }[] = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
  ];
  if (category) {
    crumbs.push({
      name: category.name,
      path: `/shop/${category.slug}`,
    });
  }
  crumbs.push({
    name: product.name,
    path: `/products/${product.slug}`,
  });

  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}
