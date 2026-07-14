import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { categories, getCategoryBySlug } from "@/content/categories";
import { getProductsByCategory } from "@/content/products";

type Props = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: { absolute: category.metaTitle },
    description: category.metaDescription,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const categoryProducts = getProductsByCategory(category.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Category</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight text-ink sm:text-5xl">
        {category.headline}
      </h1>
      <div className="mt-5 max-w-3xl space-y-3 text-muted">
        {category.intro.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categoryProducts.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
