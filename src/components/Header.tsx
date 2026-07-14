"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { site } from "@/content/site";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 sm:py-3">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-3 transition-opacity duration-300 hover:opacity-85"
          aria-label="Peptide Protocol home"
        >
          <Image
            src="/images/logo.png"
            alt="Peptide Protocol"
            width={140}
            height={180}
            priority
            className="h-14 w-auto sm:h-16"
          />
          <span className="hidden text-[10px] uppercase tracking-[0.18em] text-muted lg:block">
            Australia · Research only
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {site.nav.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link text-sm">
              {item.label}
            </Link>
          ))}
          <Link
            href="/shop"
            className="btn-primary rounded-sm bg-ink px-4 py-2 text-sm text-paper hover:bg-accent"
          >
            Catalogue
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-line transition hover:border-accent hover:text-accent md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <div className="flex w-4 flex-col gap-1">
            <span className="h-px w-full bg-current" />
            <span className="h-px w-full bg-current" />
            <span className="h-px w-full bg-current" />
          </div>
        </button>
      </div>

      {open ? (
        <div className="animate-fade border-t border-line bg-paper px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-base text-ink transition hover:text-accent"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/shop"
              className="btn-primary mt-1 w-fit rounded-sm bg-ink px-4 py-2 text-sm text-paper hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              Catalogue
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
