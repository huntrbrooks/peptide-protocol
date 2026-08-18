import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { pages } from "@/content/pages";
import { contentPageMetadata } from "@/lib/seo/metadata";

const page = pages.terms!;

export const metadata: Metadata = contentPageMetadata(page);

export default function TermsPage() {
  return <ContentPage page={page} />;
}
