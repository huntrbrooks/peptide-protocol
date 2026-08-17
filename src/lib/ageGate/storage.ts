import { site } from "@/content/site";

export const AGE_GATE_STORAGE_KEY = "pp-age-verified-v1";
export const AGE_GATE_COOKIE_NAME = "pp_age_ok";
export const AGE_GATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const listeners = new Set<() => void>();

export function isAgeGateExemptPath(pathname: string): boolean {
  return site.ageGate.legalPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function hasAgeGateCookie(cookieHeader: string): boolean {
  return cookieHeader.split(";").some((part) => {
    const [name, value] = part.trim().split("=");
    return name === AGE_GATE_COOKIE_NAME && value === "1";
  });
}

export function buildAgeGateCookie(): string {
  return `${AGE_GATE_COOKIE_NAME}=1; Path=/; Max-Age=${AGE_GATE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function subscribeAgeGate(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", listener);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", listener);
    }
  };
}

function emitAgeGateChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function isAgeVerified(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(AGE_GATE_STORAGE_KEY) === "1") return true;
  } catch {
    // Private mode or blocked storage — fall through to the cookie.
  }
  return hasAgeGateCookie(document.cookie);
}

export function persistAgeVerified(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AGE_GATE_STORAGE_KEY, "1");
  } catch {
    // Storage can be blocked; the cookie still lets later visits skip the flash.
  }
  document.cookie = buildAgeGateCookie();
  document.documentElement.dataset.ageOk = "1";
  emitAgeGateChange();
}

export function getAgeGateSnapshot(): boolean {
  return isAgeVerified();
}

export function getAgeGateServerSnapshot(): boolean {
  return false;
}
