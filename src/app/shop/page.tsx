import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { categories } from "@/content/categories";
import { products } from "@/content/products";
import { pages } from "@/content/pages";

const page = pages.shop!;

export const metadata: Metadata = {
  title: { absolute: page.metaTitle },
  description: page.metaDescription,
};

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Catalogue</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight text-ink sm:text-5xl">
        {page.headline}
      </h1>
      <p className="mt-4 max-w-2xl text-muted">{page.body[0]}</p>

      <div className="mt-8 flex flex-wrap gap-2">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/shop/${category.slug}`}
            className="rounded-sm border border-line bg-paper px-3 py-2 text-sm text-ink transition hover:border-accent hover:text-accent"
          >
            {category.name}
          </Link>
        ))}
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
