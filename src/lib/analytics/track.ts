"use client";

import { getAgeGateSnapshot } from "@/lib/ageGate/storage";
import { readConsent } from "./consent";

type AnalyticsValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | AnalyticsValue[]
  | { [key: string]: AnalyticsValue };

export type AnalyticsProperties = { [key: string]: AnalyticsValue };

let clientPromise: Promise<typeof import("posthog-js").default | null> | null = null;
type Gtag = (
  command: "config" | "event" | "js",
  target: string | Date,
  properties?: AnalyticsProperties,
) => void;
let gtagPromise: Promise<Gtag | null> | null = null;

function sensitivePath(): boolean {
  return window.location.pathname.startsWith("/checkout") ||
    window.location.pathname.startsWith("/account");
}

function missingConfiguration(variableName: string): void {
  if (process.env.NODE_ENV !== "production") {
    console.error(
      new Error(
        `${variableName} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${variableName} is configured`,
      ),
    );
  }
}

async function getClient() {
  if (!getAgeGateSnapshot() || !readConsent()?.analytics) return null;
  const key = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim();
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim();
  if (!key) {
    missingConfiguration("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN");
    return null;
  }
  if (!host) {
    missingConfiguration("NEXT_PUBLIC_POSTHOG_HOST");
    return null;
  }
  clientPromise ??= import("posthog-js").then(({ default: posthog }) => {
    if (!posthog.__loaded) {
      const consent = readConsent();
      posthog.init(key, {
        api_host: host,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_exceptions: {
          capture_unhandled_errors: true,
          capture_unhandled_rejections: true,
          capture_console_errors: false,
        },
        disable_session_recording: true,
        mask_all_text: false,
        mask_all_element_attributes: true,
        person_profiles: "identified_only",
        persistence: "localStorage+cookie",
      });
      if (consent?.replay && !sensitivePath()) posthog.startSessionRecording();
    }
    return posthog;
  });
  return await clientPromise;
}

async function getGtag(): Promise<Gtag | null> {
  if (!getAgeGateSnapshot() || !readConsent()?.analytics) return null;
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (!measurementId) return null;
  gtagPromise ??= Promise.resolve().then(() => {
    const analyticsWindow = window as typeof window & {
      dataLayer?: unknown[][];
      gtag?: Gtag;
    };
    analyticsWindow.dataLayer ??= [];
    analyticsWindow.gtag ??= (
      command: "config" | "event" | "js",
      target: string | Date,
      properties?: AnalyticsProperties,
    ) => {
      analyticsWindow.dataLayer?.push(
        properties === undefined
          ? [command, target]
          : [command, target, properties],
      );
    };
    if (!document.querySelector(`script[data-ga-measurement-id="${measurementId}"]`)) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      script.dataset.gaMeasurementId = measurementId;
      document.head.appendChild(script);
      analyticsWindow.gtag("js", new Date());
      analyticsWindow.gtag("config", measurementId, { send_page_view: false });
    }
    return analyticsWindow.gtag;
  });
  return await gtagPromise;
}

export async function syncReplayForPath(): Promise<void> {
  const client = await getClient();
  if (!client) return;
  if (readConsent()?.replay && !sensitivePath()) {
    client.startSessionRecording();
  } else {
    client.stopSessionRecording();
  }
}

export function track(name: string, properties: AnalyticsProperties = {}): void {
  void getClient().then((client) => client?.capture(name, properties));
  void getGtag().then((gtag) => {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
    if (gtag && measurementId) {
      gtag("event", name, { ...properties, send_to: measurementId });
    }
  });
}

export function identify(memberId: string, email?: string): void {
  void getClient().then((client) => client?.identify(memberId, email ? { email } : undefined));
  void getGtag().then((gtag) => {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
    if (gtag && measurementId) gtag("config", measurementId, { user_id: memberId });
  });
}

export function resetAnalyticsIdentity(): void {
  void getClient().then((client) => client?.reset());
  void getGtag().then((gtag) => {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
    if (gtag && measurementId) gtag("config", measurementId, { user_id: null });
  });
}
