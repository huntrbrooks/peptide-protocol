import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { pages } from "@/content/pages";
import { contentPageMetadata } from "@/lib/seo/metadata";
import { ContactForm } from "./ContactForm";

const page = pages.contact!;

export const metadata: Metadata = contentPageMetadata(page);

export default function ContactPage() {
  return (
    <div>
      <ContentPage page={page} />
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <ContactForm />
      </div>
    </div>
  );
}
