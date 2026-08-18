import { home, site } from "@/content/site";
import { organizationSameAs, serializeJsonLd } from "@/lib/seo/jsonLd";

const sameAs = organizationSameAs();

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${site.url}/#organization`,
      name: site.name,
      url: site.url,
      email: site.email,
      description: site.tagline,
      ...(sameAs.length > 0 ? { sameAs } : {}),
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      description: home.metaDescription,
      publisher: { "@id": `${site.url}/#organization` },
      inLanguage: "en-AU",
    },
  ],
};

export function SiteJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(jsonLd),
      }}
    />
  );
}
