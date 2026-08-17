"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { resetAnalyticsIdentity, track } from "@/lib/analytics/track";

export function AccountControl() {
  const { isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const membership = useQuery(
    api.members.getMyMembership,
    isAuthenticated ? {} : "skip",
  );
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("email", email);
      form.set("password", password);
      form.set("flow", "signIn");
      await signIn("password", form);
      track("login", { method: "password" });
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await signOut();
    track("logout", { method: "password" });
    resetAnalyticsIdentity();
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center rounded-sm border border-line px-3 py-2 text-sm text-ink transition hover:border-accent hover:text-accent"
        aria-expanded={open}
      >
        Account
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-60 w-72 border border-line bg-paper p-4 shadow-xl">
          {isAuthenticated ? (
            <div className="text-sm">
              <p className="text-muted">Signed in</p>
              {membership ? (
                <p className="mt-2 text-ink">
                  Code <strong>{membership.code}</strong> · {membership.percent}%
                </p>
              ) : null}
              <button type="button" onClick={() => void logout()} className="mt-4 text-accent underline">
                Log out
              </button>
            </div>
          ) : (
            <form onSubmit={(event) => void login(event)} className="grid gap-3">
              <label className="grid gap-1 text-xs text-muted">
                Email
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="border border-line bg-paper px-3 py-2 text-sm text-ink"
                />
              </label>
              <label className="grid gap-1 text-xs text-muted">
                Password
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="border border-line bg-paper px-3 py-2 text-sm text-ink"
                />
              </label>
              <button disabled={busy} className="bg-ink px-3 py-2 text-sm text-paper disabled:opacity-50">
                {busy ? "Signing in…" : "Log in"}
              </button>
              {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
