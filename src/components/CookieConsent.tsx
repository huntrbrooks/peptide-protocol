"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  CONSENT_EVENT,
  readConsent,
  saveConsent,
} from "@/lib/analytics/consent";
import {
  getAgeGateServerSnapshot,
  getAgeGateSnapshot,
  subscribeAgeGate,
} from "@/lib/ageGate/storage";
import { track } from "@/lib/analytics/track";

const SCROLL_THRESHOLD_PX = 40;

function subscribeConsent(callback: () => void): () => void {
  window.addEventListener(CONSENT_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CONSENT_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function isCtaTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const control = target.closest("a, button");
  if (!control) return false;
  if (control instanceof HTMLAnchorElement) {
    const href = control.getAttribute("href");
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return false;
    }
    try {
      return new URL(control.href, window.location.origin).origin ===
        window.location.origin;
    } catch {
      return false;
    }
  }
  return true;
}

export function CookieConsent() {
  const ageVerified = useSyncExternalStore(
    subscribeAgeGate,
    getAgeGateSnapshot,
    getAgeGateServerSnapshot,
  );
  const [decided, setDecided] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [replay, setReplay] = useState(false);

  useEffect(() => {
    const sync = () => setDecided(readConsent() !== null);
    sync();
    return subscribeConsent(sync);
  }, []);

  // Defer the banner until scroll or the first CTA so the age gate stays
  // the only first-paint modal.
  useEffect(() => {
    if (!ageVerified || decided || engaged) return;

    const onScroll = () => {
      if (window.scrollY >= SCROLL_THRESHOLD_PX) setEngaged(true);
    };
    const onClick = (event: MouseEvent) => {
      if (isCtaTarget(event.target)) setEngaged(true);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
    };
  }, [ageVerified, decided, engaged]);

  if (!ageVerified || !engaged || decided) return null;

  function persist(next: { analytics: boolean; marketing: boolean; replay: boolean }) {
    const consent = saveConsent(next);
    setDecided(true);
    track("consent_updated", {
      analytics: consent.analytics,
      marketing: consent.marketing,
      replay: consent.replay,
    });
  }

  return (
    <aside
      aria-label="Cookie preferences"
      className="fixed inset-x-4 bottom-4 z-90 mx-auto max-w-2xl border border-line bg-paper p-5 shadow-2xl"
    >
      <h2 className="font-display text-xl text-ink">Privacy choices</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Essential storage keeps the age gate, cart, authentication, and checkout working.
        Optional analytics, marketing, and replay remain off unless you choose them.{" "}
        <Link href="/privacy" className="text-accent underline">Privacy policy</Link>
      </p>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <label className="flex items-center gap-2 text-muted">
          <input type="checkbox" checked disabled /> Essential (always on)
        </label>
        <label className="flex items-center gap-2 text-muted">
          <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} />
          Analytics
        </label>
        <label className="flex items-center gap-2 text-muted">
          <input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} />
          Marketing
        </label>
        <label className="flex items-center gap-2 text-muted">
          <input
            type="checkbox"
            checked={replay}
            onChange={(event) => {
              setReplay(event.target.checked);
              if (event.target.checked) setAnalytics(true);
            }}
          />
          Masked session replay
        </label>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-sm bg-ink px-4 py-2 text-sm text-paper"
          onClick={() => persist({ analytics, marketing, replay: analytics && replay })}
        >
          Save choices
        </button>
        <button
          type="button"
          className="rounded-sm border border-line px-4 py-2 text-sm text-ink"
          onClick={() => persist({ analytics: false, marketing: false, replay: false })}
        >
          Essential only
        </button>
      </div>
    </aside>
  );
}
