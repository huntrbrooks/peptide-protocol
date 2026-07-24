import type { Metadata } from "next";
import { DosingCalculator } from "@/components/dosing-calculator/DosingCalculator";
import { dosingCalculatorMeta } from "@/content/dosingCalculator";
import { products } from "@/content/products";

export const metadata: Metadata = {
  title: { absolute: dosingCalculatorMeta.metaTitle },
  description: dosingCalculatorMeta.metaDescription,
};

type Props = {
  searchParams: Promise<{ product?: string | string[] }>;
};

export default async function DosingCalculatorPage({ searchParams }: Props) {
  const query = await searchParams;
  const productSlug = Array.isArray(query.product) ? query.product[0] : query.product;
  const productOptions = products.map(({ slug, name, strength }) => ({
    slug,
    name,
    strength,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          {dosingCalculatorMeta.eyebrow}
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-ink sm:text-5xl">
          {dosingCalculatorMeta.headline}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
          {dosingCalculatorMeta.intro}
        </p>
      </header>

      <div className="mt-8">
        <DosingCalculator
          products={productOptions}
          initialProductSlug={productSlug}
        />
      </div>
    </div>
  );
}
