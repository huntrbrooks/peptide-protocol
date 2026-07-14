import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { pages } from "@/content/pages";

const page = pages.disclaimer!;

export const metadata: Metadata = {
  title: { absolute: page.metaTitle },
  description: page.metaDescription,
};

export default function DisclaimerPage() {
  return <ContentPage page={page} />;
}
