import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { pages } from "@/content/pages";

const page = pages.returns!;

export const metadata: Metadata = {
  title: { absolute: page.metaTitle },
  description: page.metaDescription,
};

export default function ReturnsPage() {
  return <ContentPage page={page} />;
}
