import { site } from "@/content/site";

export const MEMBER_CAPTURE_DISMISS_KEY = "pp-member-capture-dismissed";
export const MEMBER_CAPTURE_RECORD_KEY = "pp-member-capture";
export const MEMBER_CAPTURE_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

export type MemberCaptureRecord = {
  email: string;
  code: string;
};

const listeners = new Set<() => void>();
const EMPTY_CAPTURE_STATE = { record: null, dismissed: false } as const;
let cachedRecordRaw: string | null | undefined;
let cachedDismissedRaw: string | null | undefined;
let cachedCaptureState: {
  record: MemberCaptureRecord | null;
  dismissed: boolean;
} = EMPTY_CAPTURE_STATE;

function emit(): void {
  cachedRecordRaw = undefined;
  cachedDismissedRaw = undefined;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeMemberCapture(listener: () => void): () => void {
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

export function isMemberCaptureExemptPath(pathname: string): boolean {
  return site.memberCapture.hiddenPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function readMemberCaptureRecord(): MemberCaptureRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MEMBER_CAPTURE_RECORD_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MemberCaptureRecord>;
    if (
      typeof parsed.email === "string" &&
      parsed.email.includes("@") &&
      typeof parsed.code === "string" &&
      parsed.code.length > 0
    ) {
      return { email: parsed.email, code: parsed.code };
    }
  } catch {
    return null;
  }
  return null;
}

export function persistMemberCaptureRecord(record: MemberCaptureRecord): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      MEMBER_CAPTURE_RECORD_KEY,
      JSON.stringify(record),
    );
  } catch {
    // Private mode — checkout can still accept a typed code from the email.
  }
  emit();
}

export function isMemberCaptureDismissed(now = Date.now()): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(MEMBER_CAPTURE_DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return false;
    return now - dismissedAt < MEMBER_CAPTURE_DISMISS_MS;
  } catch {
    return false;
  }
}

export function persistMemberCaptureDismissed(now = Date.now()): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MEMBER_CAPTURE_DISMISS_KEY, String(now));
  } catch {
    // Ignore blocked storage; the session just will not remember dismiss.
  }
  emit();
}

export function getMemberCaptureSnapshot(): {
  record: MemberCaptureRecord | null;
  dismissed: boolean;
} {
  if (typeof window === "undefined") return EMPTY_CAPTURE_STATE;
  const recordRaw = window.localStorage.getItem(MEMBER_CAPTURE_RECORD_KEY);
  const dismissedRaw = window.localStorage.getItem(MEMBER_CAPTURE_DISMISS_KEY);
  if (recordRaw === cachedRecordRaw && dismissedRaw === cachedDismissedRaw) {
    return cachedCaptureState;
  }
  cachedRecordRaw = recordRaw;
  cachedDismissedRaw = dismissedRaw;
  cachedCaptureState = {
    record: readMemberCaptureRecord(),
    dismissed: isMemberCaptureDismissed(),
  };
  return cachedCaptureState;
}

export function getMemberCaptureServerSnapshot(): {
  record: MemberCaptureRecord | null;
  dismissed: boolean;
} {
  return EMPTY_CAPTURE_STATE;
}
