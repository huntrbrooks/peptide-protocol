import { site } from "@/content/site";

/** Canonical origin without a trailing slash. */
export function siteOrigin(): string {
  return site.url.replace(/\/$/, "");
}

/** Absolute URL for a site path (`/` → origin, `/shop` → origin + path). */
export function absoluteUrl(path = "/"): string {
  const origin = siteOrigin();
  if (!path || path === "/") {
    return origin;
  }
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
