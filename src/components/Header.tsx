"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { site } from "@/content/site";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-3"
          aria-label="Peptide Protocol home"
        >
          <Image
            src="/images/logo.png"
            alt="Peptide Protocol"
            width={220}
            height={45}
            priority
            className="h-9 w-auto sm:h-10"
          />
          <span className="hidden text-[10px] uppercase tracking-[0.18em] text-muted sm:block">
            Australia · Research only
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-ink/80 transition hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/shop"
            className="rounded-sm bg-ink px-4 py-2 text-sm text-paper transition hover:bg-accent"
          >
            Catalogue
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-line md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <div className="flex w-4 flex-col gap-1">
            <span className="h-px w-full bg-ink" />
            <span className="h-px w-full bg-ink" />
            <span className="h-px w-full bg-ink" />
          </div>
        </button>
      </div>

      {open ? (
        <div className="border-t border-line bg-paper px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-base text-ink"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
