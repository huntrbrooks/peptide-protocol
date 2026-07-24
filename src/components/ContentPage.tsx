import Link from "next/link";
import type { PageContent } from "@/content/types";
import { FaqList } from "./FaqList";

export function ContentPage({ page }: { page: PageContent }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Peptide Protocol</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight text-ink sm:text-5xl">
        {page.headline}
      </h1>
      <div className="mt-6 space-y-4 text-base leading-relaxed text-muted">
        {page.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      {page.video ? (
        <figure className="mt-8">
          <div className="overflow-hidden border border-line bg-mist/40">
            <video
              controls
              playsInline
              preload="metadata"
              aria-label={page.video.title}
              className="aspect-video w-full"
            >
              <source src={page.video.src} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          {page.video.caption ? (
            <figcaption className="mt-3 text-xs leading-relaxed text-muted">
              {page.video.caption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      {page.sections?.map((section) => (
        <section key={section.title} className="mt-10">
          <h2 className="font-display text-2xl text-ink">{section.title}</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
            {section.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          {section.bullets ? (
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted">
              {section.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      {page.faqs ? (
        <section className="mt-12">
          <FaqList items={page.faqs} />
        </section>
      ) : null}

      {page.ctaLink ? (
        <p className="mt-10 text-sm text-muted">
          <Link
            href={page.ctaLink.href}
            className="text-accent underline underline-offset-2"
          >
            {page.ctaLink.label}
          </Link>
        </p>
      ) : null}
    </article>
  );
}
