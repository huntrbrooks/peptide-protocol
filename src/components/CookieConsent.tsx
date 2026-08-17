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

function subscribeConsent(callback: () => void): () => void {
  window.addEventListener(CONSENT_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CONSENT_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function CookieConsent() {
  const ageVerified = useSyncExternalStore(
    subscribeAgeGate,
    getAgeGateSnapshot,
    getAgeGateServerSnapshot,
  );
  const [decided, setDecided] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [replay, setReplay] = useState(false);

  useEffect(() => {
    const sync = () => setDecided(readConsent() !== null);
    sync();
    return subscribeConsent(sync);
  }, []);

  if (!ageVerified || decided) return null;

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
