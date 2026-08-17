"use client";

import { useConvexAuth, useQuery } from "convex/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { api } from "../../../convex/_generated/api";

export function AdminGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const staff = useQuery(api.staff.me, isAuthenticated ? {} : "skip");

  if (isLoading || (isAuthenticated && staff === undefined)) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted">Checking staff access…</div>;
  }
  if (!isAuthenticated || !staff) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="font-display text-3xl text-ink">Staff access required</h1>
        <p className="mt-3 text-sm text-muted">
          Sign in with an allowlisted staff account using the Account control, then return here.
        </p>
        <Link href="/" className="mt-5 inline-block text-accent underline">Return to store</Link>
      </div>
    );
  }
  // Convex Auth has no built-in MFA; the owner allowlist is the accepted MVP control.
  return <>{children}</>;
}
