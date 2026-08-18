import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/seo/sitemapEntries";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries();
}
