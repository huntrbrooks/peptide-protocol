import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";
import { FaqList } from "@/components/FaqList";
import { getProductBySlug, products } from "@/content/products";
import { site } from "@/content/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: { absolute: product.metaTitle },
    description: product.metaDescription,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative aspect-[4/5] overflow-hidden border border-line bg-mist">
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 45vw"
          />
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            {product.shortLabel}
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-tight text-ink sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 font-display text-2xl text-ink">{product.headline}</p>
          <div className="mt-5 space-y-3 text-sm leading-relaxed text-muted">
            {product.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="mt-5 border border-accent/20 bg-sand/60 px-4 py-3 text-sm text-ink">
            {product.researchNotice}
          </p>
          {product.promoLabel ? (
            <p className="mt-3 text-sm text-accent">{product.promoLabel}</p>
          ) : null}
          <div className="mt-8">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="font-display text-3xl text-ink">What it&apos;s for</h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
          {product.whatItsFor.intro}
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {product.whatItsFor.uses.map((use) => (
            <li
              key={use}
              className="border border-line bg-mist/30 px-4 py-3 text-sm leading-relaxed text-ink"
            >
              {use}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-3xl text-ink">Specifications</h2>
        <div className="mt-6 overflow-x-auto border border-line">
          <table className="min-w-full text-left text-sm">
            <tbody>
              {product.specs.map((row) => (
                <tr key={row.label} className="border-b border-line last:border-0">
                  <th className="w-48 bg-mist/40 px-4 py-3 font-medium text-ink">
                    {row.label}
                  </th>
                  <td className="px-4 py-3 text-muted">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-12 grid gap-10 md:grid-cols-3">
        <section>
          <h2 className="font-display text-2xl text-ink">Storage and handling</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted">
            {product.storage.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">What is included</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted">
            {product.included.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">Quality signals</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted">
            {product.qualitySignals.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-14">
        <h2 className="font-display text-3xl text-ink">Product FAQ</h2>
        <div className="mt-6">
          <FaqList items={product.faqs} />
        </div>
      </section>

      <p className="mt-12 max-w-3xl text-sm leading-relaxed text-muted">
        {product.disclaimer} See also the{" "}
        <a href="/disclaimer" className="text-accent underline underline-offset-2">
          Research Use Disclaimer
        </a>
        . {site.researchDisclaimer}
      </p>
    </div>
  );
}
