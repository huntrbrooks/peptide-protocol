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

function sensitivePath(): boolean {
  return window.location.pathname.startsWith("/checkout") ||
    window.location.pathname.startsWith("/account");
}

async function getClient() {
  if (!getAgeGateSnapshot() || !readConsent()?.analytics) return null;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key) return null;
  clientPromise ??= import("posthog-js").then(({ default: posthog }) => {
    if (!posthog.__loaded) {
      const consent = readConsent();
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
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
}

export function identify(memberId: string, email?: string): void {
  void getClient().then((client) => client?.identify(memberId, email ? { email } : undefined));
}

export function resetAnalyticsIdentity(): void {
  void getClient().then((client) => client?.reset());
}
