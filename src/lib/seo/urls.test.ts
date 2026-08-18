import { describe, expect, it } from "vitest";
import { site } from "@/content/site";
import { absoluteUrl, siteOrigin } from "./urls";

describe("seo urls", () => {
  it("returns the configured origin without a trailing slash", () => {
    expect(siteOrigin()).toBe("https://theprotocolau.com");
    expect(absoluteUrl("/")).toBe(site.url.replace(/\/$/, ""));
  });

  it("joins site paths onto the origin", () => {
    expect(absoluteUrl("/shop")).toBe("https://theprotocolau.com/shop");
    expect(absoluteUrl("sitemap.xml")).toBe(
      "https://theprotocolau.com/sitemap.xml",
    );
  });
});
