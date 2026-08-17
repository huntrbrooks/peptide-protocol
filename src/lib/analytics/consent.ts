"use client";

export const CONSENT_STORAGE_KEY = "protocol:consent:v1";
export const CONSENT_EVENT = "protocol:consent-changed";

export type ConsentState = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  replay: boolean;
  updatedAt: number;
};

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY) ?? "null");
    if (!value || typeof value !== "object") return null;
    const consent = value as Partial<ConsentState>;
    if (
      typeof consent.analytics !== "boolean" ||
      typeof consent.marketing !== "boolean" ||
      typeof consent.replay !== "boolean"
    ) {
      return null;
    }
    return {
      essential: true,
      analytics: consent.analytics,
      marketing: consent.marketing,
      replay: consent.replay,
      updatedAt: typeof consent.updatedAt === "number" ? consent.updatedAt : 0,
    };
  } catch {
    return null;
  }
}

export function saveConsent(input: Omit<ConsentState, "essential" | "updatedAt">): ConsentState {
  const consent: ConsentState = { essential: true, ...input, updatedAt: Date.now() };
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new Event(CONSENT_EVENT));
  return consent;
}
