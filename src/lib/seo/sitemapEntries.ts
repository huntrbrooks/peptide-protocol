import type { MetadataRoute } from "next";
import { categories } from "@/content/categories";
import { pages } from "@/content/pages";
import { products } from "@/content/products";
import { absoluteUrl } from "./urls";

const LEGAL_SLUGS = new Set(["terms", "privacy", "disclaimer"]);

type Entry = {
  path: string;
  priority: number;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
};

const EXTRA_PATHS: Entry[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/dosing-calculator", priority: 0.6, changeFrequency: "monthly" },
  { path: "/stack-finder", priority: 0.5, changeFrequency: "monthly" },
];

export function buildSitemapEntries(
  lastModified: Date = new Date(),
): MetadataRoute.Sitemap {
  const fromPages: Entry[] = Object.values(pages).map((page) => ({
    path: `/${page.slug}`,
    priority:
      page.slug === "shop" ? 0.9 : LEGAL_SLUGS.has(page.slug) ? 0.3 : 0.6,
    changeFrequency: page.slug === "shop" ? "weekly" : "monthly",
  }));

  const fromCategories: Entry[] = categories.map((category) => ({
    path: `/shop/${category.slug}`,
    priority: 0.7,
    changeFrequency: "weekly",
  }));

  const fromProducts: Entry[] = products.map((product) => ({
    path: `/products/${product.slug}`,
    priority: 0.8,
    changeFrequency: "weekly",
  }));

  return [...EXTRA_PATHS, ...fromPages, ...fromCategories, ...fromProducts].map(
    (entry) => ({
      url: absoluteUrl(entry.path),
      lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    }),
  );
}
