import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { pages } from "@/content/pages";
import { buildFaqPageJsonLd, serializeJsonLd } from "@/lib/seo/jsonLd";
import { contentPageMetadata } from "@/lib/seo/metadata";

const page = pages.faq!;
const faqJsonLd = buildFaqPageJsonLd(page.faqs ?? []);

export const metadata: Metadata = contentPageMetadata(page);

export default function FaqPage() {
  return (
    <>
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }}
        />
      ) : null}
      <ContentPage page={page} />
    </>
  );
}
