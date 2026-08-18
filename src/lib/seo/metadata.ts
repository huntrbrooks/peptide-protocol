import type { Metadata } from "next";
import type { PageContent } from "@/content/types";
import { absoluteUrl } from "./urls";

const DEFAULT_OG_IMAGE = "/og-image.jpg";

export function publicPageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
}): Metadata {
  const url = absoluteUrl(opts.path);
  const imagePath = opts.image ?? DEFAULT_OG_IMAGE;
  const images = [
    {
      url: absoluteUrl(imagePath),
      width: opts.imageWidth ?? 1200,
      height: opts.imageHeight ?? 630,
      alt: opts.imageAlt ?? opts.title,
    },
  ];
  return {
    title: { absolute: opts.title },
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      type: "website",
      locale: "en_AU",
      images,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: opts.title,
      description: opts.description,
      images: images.map((image) => image.url),
    },
  };
}

export function contentPageMetadata(page: PageContent): Metadata {
  return publicPageMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: `/${page.slug}`,
  });
}
