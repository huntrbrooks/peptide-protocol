"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { site } from "@/content/site";
import {
  buildAgeGateCookie,
  getAgeGateServerSnapshot,
  getAgeGateSnapshot,
  isAgeGateExemptPath,
  persistAgeVerified,
  subscribeAgeGate,
} from "@/lib/ageGate/storage";
import { track } from "@/lib/analytics/track";

const FOCUSABLE = "a[href], button:not([disabled])";

export function AgeGate() {
  const pathname = usePathname();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);
  const verified = useSyncExternalStore(
    subscribeAgeGate,
    getAgeGateSnapshot,
    getAgeGateServerSnapshot,
  );

  const exempt = isAgeGateExemptPath(pathname);
  const locked = !verified && !exempt;

  useEffect(() => {
    if (!verified) return;
    document.cookie = buildAgeGateCookie();
    document.documentElement.dataset.ageOk = "1";
  }, [verified]);

  useEffect(() => {
    if (!locked) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    enterRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = [
        ...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ];
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [locked]);

  if (!locked) return null;

  const copy = site.ageGate;

  return (
    <div className="age-gate fixed inset-0 z-100 flex items-center justify-center px-4 py-8">
      <div
        className="absolute inset-0 bg-ink/72 backdrop-blur-sm"
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="age-gate-panel animate-rise relative w-full max-w-104 border border-line bg-paper px-6 py-8 text-center shadow-[0_24px_64px_rgba(26,26,26,0.28),0_0_72px_rgba(176,48,96,0.12)] sm:px-8 sm:py-10"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted">
          {copy.eyebrow}
        </p>
        <Image
          src="/images/brand/the-protocol-logo.png"
          alt="The Protocol"
          width={1024}
          height={407}
          priority
          className="mx-auto mt-4 h-auto w-40 sm:w-44"
        />
        <div className="mx-auto mt-6 h-px w-full bg-line" />
        <h2
          id={titleId}
          className="mt-6 font-display text-3xl tracking-tight text-ink sm:text-4xl"
        >
          {copy.heading}
        </h2>
        <p
          id={descriptionId}
          className="mt-4 text-sm leading-relaxed text-muted"
        >
          All products are supplied strictly for{" "}
          <strong className="font-medium text-ink">
            {copy.researchEmphasis}
          </strong>{" "}
          — not for human or veterinary use. By entering, you confirm you are{" "}
          <strong className="font-medium text-ink">{copy.ageEmphasis}</strong>{" "}
          and accept our{" "}
          <Link
            href={copy.termsHref}
            className="font-medium text-accent underline underline-offset-2 transition hover:text-ink"
          >
            {copy.termsLabel}
          </Link>{" "}
          and{" "}
          <Link
            href={copy.disclaimerHref}
            className="font-medium text-accent underline underline-offset-2 transition hover:text-ink"
          >
            {copy.disclaimerLabel}
          </Link>
          .
        </p>
        <button
          ref={enterRef}
          type="button"
          className="btn-primary mt-7 w-full rounded-sm bg-ink px-5 py-3.5 text-sm font-medium text-paper hover:bg-accent"
          onClick={() => {
            persistAgeVerified();
            track("age_gate_pass");
          }}
        >
          {copy.enterLabel}
        </button>
        <div className="mx-auto mt-6 h-px w-full bg-line" />
        <p className="mt-5 text-sm text-muted">
          {copy.under18Prefix}{" "}
          <a
            href={copy.leaveHref}
            onClick={() => track("age_gate_leave")}
            rel="noopener noreferrer"
            className="font-medium text-accent underline underline-offset-2 transition hover:text-ink"
          >
            {copy.leaveLabel}
          </a>
        </p>
      </div>
    </div>
  );
}
