import type { MetadataRoute } from "next";
import { absoluteUrl, siteOrigin } from "@/lib/seo/urls";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/checkout", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteOrigin(),
  };
}
