import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { categories } from "@/content/categories";
import { products } from "@/content/products";
import { home, site } from "@/content/site";

export const metadata: Metadata = {
  title: { absolute: home.metaTitle },
  description: home.metaDescription,
};

export default function HomePage() {
  const featured = products.filter((p) => p.featured).slice(0, 6);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-au-industrial.png"
            alt="The Protocol research laboratory and dispatch aesthetic"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          {/* AU clinical: charcoal bands for type — lighter on the right so the
              bright industrial facility / city view stays visible */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink/88 via-ink/55 to-ink/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
        </div>
        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col items-center justify-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <div className="order-first mx-auto w-full max-w-[429px] shrink-0 sm:max-w-[546px] lg:order-last lg:mx-0 lg:max-w-[663px]">
            <Image
              src="/images/products/retatrutide-20mg-hero.webp"
              alt="Retatrutide 20 MG"
              width={2048}
              height={2048}
              priority
              unoptimized
              className="h-auto w-full"
            />
          </div>

          <div className="min-w-0 w-full flex-1 lg:w-auto">
            {/* AU clinical: raspberry-tinted eyebrow, wider tracking */}
            <p className="animate-rise text-xs uppercase tracking-[0.3em] text-teal-soft">
              {home.eyebrow}
            </p>
            <h1 className="animate-rise-delay mt-4 max-w-3xl font-display text-4xl leading-[1.08] tracking-tight text-paper sm:text-6xl">
              The Protocol
            </h1>
            <p className="animate-rise-delay mt-4 max-w-2xl font-display text-2xl leading-snug text-paper/90 sm:text-3xl">
              {home.headline}
            </p>
            <p className="animate-rise-delay-2 mt-5 max-w-xl text-base leading-relaxed text-paper/75">
              {home.subheadline}
            </p>
            <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
              <Link
                href={home.primaryCta.href}
                className="btn-primary rounded-sm bg-paper px-5 py-3 text-sm font-medium text-ink hover:bg-teal-soft"
              >
                {home.primaryCta.label}
              </Link>
              <Link
                href={home.secondaryCta.href}
                className="rounded-sm border border-paper/30 px-5 py-3 text-sm text-paper transition hover:border-paper hover:bg-paper/10"
              >
                {home.secondaryCta.label}
              </Link>
            </div>
            {/* AU logistics: Express Post mark under CTAs (matches reference mock) */}
            <div className="animate-rise-delay-2 mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-paper/80">
              <Image
                src="/images/brand/express-post.jpg"
                alt="Australia Post Express Post"
                width={1024}
                height={194}
                className="h-7 w-auto sm:h-8"
              />
              {site.trustBar
                .filter(
                  (item) => item.includes("Dispatch") || item.includes("Express"),
                )
                .map((item, index, chips) => (
                  <span key={item} className="flex items-center gap-3">
                    <span>{item}</span>
                    {index < chips.length - 1 ? (
                      <span aria-hidden className="h-3 w-px bg-paper/30" />
                    ) : null}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* AU clinical: clean white trust bar, hairline borders */}
      <section className="border-y border-line bg-paper">
        <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 py-4 text-sm text-muted sm:px-6">
          {site.trustBar.map((item) => (
            <p key={item} className="whitespace-nowrap">
              {item}
            </p>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="reveal max-w-2xl">
          <h2 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
            Built for research workflows
          </h2>
          <p className="mt-3 text-muted">
            Specs and batch docs first. Local packing and tracked dispatch.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {home.valueProps.map((item) => (
            <div
              key={item.title}
              className="card-lift border border-line bg-paper p-6"
            >
              <h3 className="font-display text-xl text-ink">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink py-16 text-paper">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
                Research categories
              </h2>
              <p className="mt-3 max-w-xl text-sm text-paper/65">
                Browse by research focus. Laboratory use only.
              </p>
            </div>
            <Link href="/shop" className="hidden text-sm text-teal-soft transition hover:text-paper sm:inline">
              View all
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/shop/${category.slug}`}
                className="group relative min-h-44 overflow-hidden border border-paper/10 transition duration-300 hover:border-accent/60"
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover opacity-50 transition duration-500 group-hover:scale-105 group-hover:opacity-60"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                <div className="relative flex h-full flex-col justify-end p-5">
                  <h3 className="font-display text-xl">{category.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-paper/70">
                    {category.intro[0]}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
              Featured materials
            </h2>
            <p className="mt-3 text-muted">Selected items with documented purity targets.</p>
          </div>
          <Link href="/shop" className="text-sm text-accent transition hover:text-ink">
            Full catalogue
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-mist/30">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              Research questionnaire
            </p>
            <h2 className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl">
              Find a research stack
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Maps research goals to catalogue pathways — with caution flags and a
              research-only disclaimer.
            </p>
          </div>
          <Link
            href="/stack-finder"
            className="btn-primary w-fit rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent"
          >
            Start questionnaire
          </Link>
        </div>
      </section>

      <section className="border-b border-line bg-sand/50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="font-display text-3xl tracking-tight text-ink">How ordering works</h2>
          </div>
          <ol className="space-y-5">
            {home.howItWorks.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="font-display text-2xl text-accent">{index + 1}</span>
                <p className="pt-1 text-sm leading-relaxed text-muted">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="border border-line bg-paper p-8 sm:p-10">
          <h2 className="font-display text-3xl text-ink">{home.complianceTitle}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
            {home.complianceBody}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={home.finalCta.href}
              className="btn-primary rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent"
            >
              {home.finalCta.label}
            </Link>
            <p className="text-sm text-muted">{home.finalSupport}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
