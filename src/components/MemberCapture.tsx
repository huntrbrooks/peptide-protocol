"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { api } from "../../convex/_generated/api";
import { site } from "@/content/site";
import {
  getAgeGateServerSnapshot,
  getAgeGateSnapshot,
  subscribeAgeGate,
} from "@/lib/ageGate/storage";
import {
  getMemberCaptureServerSnapshot,
  getMemberCaptureSnapshot,
  isMemberCaptureExemptPath,
  persistMemberCaptureDismissed,
  persistMemberCaptureRecord,
  subscribeMemberCapture,
} from "@/lib/membership/storage";

const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled])";
const SCROLL_THRESHOLD_PX = 40;

function isInSiteAnchor(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const anchor = target.closest("a");
  if (!anchor) return false;
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }
  try {
    const url = new URL(anchor.href, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

export function MemberCapture() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return null;
  }
  return <MemberCaptureLive />;
}

function MemberCaptureLive() {
  const pathname = usePathname();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useConvexAuth();
  const membership = useQuery(
    api.members.getMyMembership,
    isAuthenticated ? {} : "skip",
  );
  const captureEmail = useMutation(api.members.captureEmail);
  const { signIn } = useAuthActions();
  const ageVerified = useSyncExternalStore(
    subscribeAgeGate,
    getAgeGateSnapshot,
    getAgeGateServerSnapshot,
  );
  const captureState = useSyncExternalStore(
    subscribeMemberCapture,
    getMemberCaptureSnapshot,
    getMemberCaptureServerSnapshot,
  );

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exempt = isMemberCaptureExemptPath(pathname);
  const alreadyMember = Boolean(captureState.record || membership);
  const canPrompt =
    ageVerified &&
    !exempt &&
    !isAuthenticated &&
    !alreadyMember &&
    !captureState.dismissed;

  useEffect(() => {
    if (membership) {
      persistMemberCaptureRecord({
        email: membership.email,
        code: membership.code,
      });
    }
  }, [membership]);

  useEffect(() => {
    if (!canPrompt || open) return;

    const reveal = () => {
      setOpen(true);
    };

    const onScroll = () => {
      if (window.scrollY >= SCROLL_THRESHOLD_PX) {
        reveal();
      }
    };
    const onClick = (event: MouseEvent) => {
      if (isInSiteAnchor(event.target)) {
        reveal();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
    };
  }, [canPrompt, open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    emailRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
        return;
      }
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
  }, [open]);

  function dismiss() {
    persistMemberCaptureDismissed();
    setOpen(false);
    setError(null);
  }

  function finishWithCode(nextEmail: string, nextCode: string) {
    persistMemberCaptureRecord({ email: nextEmail, code: nextCode });
    setOpen(false);
    setError(null);
  }

  async function onCaptureEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await captureEmail({ email });
      setCode(result.code);
      setEmail(email.trim().toLowerCase());
      persistMemberCaptureRecord({
        email: email.trim().toLowerCase(),
        code: result.code,
      });
      setStep(2);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create a member code.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onCreateAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("flow", "signUp");
      await signIn("password", formData);
      finishWithCode(email, code);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create an account.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const copy = site.memberCapture;

  return (
    <div className="member-capture fixed inset-0 z-100 flex items-center justify-center px-4 py-8">
      <div
        className="absolute inset-0 bg-ink/72 backdrop-blur-sm"
        aria-hidden
        onClick={dismiss}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="age-gate-panel animate-rise relative w-full max-w-104 border border-line bg-paper px-6 py-8 text-center shadow-[0_24px_64px_rgba(26,26,26,0.28),0_0_72px_rgba(176,48,96,0.12)] sm:px-8 sm:py-10"
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-3 right-3 px-2 py-1 text-sm text-muted transition hover:text-ink"
          aria-label={copy.closeLabel}
        >
          ×
        </button>
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted">
          {step === 1 ? copy.eyebrow : copy.step2Eyebrow}
        </p>
        <Image
          src="/images/brand/the-protocol-logo.png"
          alt="The Protocol"
          width={1024}
          height={407}
          className="mx-auto mt-4 h-auto w-36 sm:w-40"
        />
        <div className="mx-auto mt-6 h-px w-full bg-line" />
        <h2
          id={titleId}
          className="mt-6 font-display text-3xl tracking-tight text-ink sm:text-4xl"
        >
          {step === 1 ? copy.heading : copy.step2Heading}
        </h2>
        {step === 1 ? (
          <form onSubmit={(event) => void onCaptureEmail(event)}>
            <p
              id={descriptionId}
              className="mt-4 text-sm leading-relaxed text-muted"
            >
              <strong className="font-medium text-ink">{copy.firstRate}</strong>{" "}
              {copy.offerLine} ·{" "}
              <strong className="font-medium text-ink">{copy.memberRate}</strong>{" "}
              {copy.afterLine}. {copy.body}
            </p>
            <ul className="mt-4 flex flex-wrap justify-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted">
              {copy.chips.map((chip) => (
                <li
                  key={chip}
                  className="border border-line px-2.5 py-1 text-ink"
                >
                  {chip}
                </li>
              ))}
            </ul>
            <label className="mt-6 grid gap-1.5 text-left text-sm text-muted">
              {copy.emailLabel}
              <input
                ref={emailRef}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-sm border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="btn-primary mt-5 w-full rounded-sm bg-ink px-5 py-3.5 text-sm font-medium text-paper hover:bg-accent disabled:opacity-50"
            >
              {busy ? "Saving…" : copy.submitLabel}
            </button>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              {copy.finePrint}{" "}
              <Link
                href={copy.privacyHref}
                className="font-medium text-accent underline underline-offset-2"
              >
                {copy.privacyLabel}
              </Link>{" "}
              ·{" "}
              <Link
                href={copy.termsHref}
                className="font-medium text-accent underline underline-offset-2"
              >
                {copy.termsLabel}
              </Link>
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="mt-4 text-sm font-medium text-accent underline underline-offset-2"
            >
              {copy.laterLabel}
            </button>
          </form>
        ) : (
          <form onSubmit={(event) => void onCreateAccount(event)}>
            <p
              id={descriptionId}
              className="mt-4 text-sm leading-relaxed text-muted"
            >
              {copy.step2Body}{" "}
              <strong className="font-medium text-ink">{email}</strong>.
            </p>
            <label className="mt-6 grid gap-1.5 text-left text-sm text-muted">
              {copy.passwordLabel}
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-sm border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="btn-primary mt-5 w-full rounded-sm bg-ink px-5 py-3.5 text-sm font-medium text-paper hover:bg-accent disabled:opacity-50"
            >
              {busy ? "Creating…" : copy.createAccountLabel}
            </button>
            <button
              type="button"
              onClick={() => finishWithCode(email, code)}
              className="mt-4 text-sm font-medium text-accent underline underline-offset-2"
            >
              {copy.skipLabel}
            </button>
          </form>
        )}
        {error ? (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
