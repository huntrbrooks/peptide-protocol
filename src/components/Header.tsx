"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { site } from "@/content/site";
import { useCartCount } from "@/lib/cart/useCartCount";
import { AccountControl } from "@/components/AccountControl";

function CartLink({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  const count = useCartCount();

  return (
    <Link
      href="/checkout"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-sm border border-line px-4 py-2 text-sm text-ink transition hover:border-accent hover:text-accent ${className ?? ""}`}
      aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
    >
      Cart
      <span className="inline-flex min-w-5 items-center justify-center rounded-sm bg-ink px-1.5 py-0.5 text-xs font-medium leading-none text-paper">
        {count}
      </span>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-line/80 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="group flex items-center transition-opacity duration-300 hover:opacity-85"
          aria-label="The Protocol home"
        >
          <Image
            src="/images/brand/the-protocol-logo.png"
            alt="The Protocol"
            width={1024}
            height={407}
            priority
            sizes="(max-width: 639px) 144px, 176px"
            className="h-auto w-36 sm:w-44"
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {site.nav.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link text-sm">
              {item.label}
            </Link>
          ))}
          <AccountControl />
          <CartLink />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <AccountControl />
          <CartLink />
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-line transition hover:border-accent hover:text-accent"
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
      </div>

      {open ? (
        <div className="animate-fade border-t border-line bg-paper px-4 py-2 md:hidden">
          <div className="flex flex-col">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 items-center text-base text-ink transition hover:text-accent"
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
