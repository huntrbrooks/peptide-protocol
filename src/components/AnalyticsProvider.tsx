"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";
import { identify, syncReplayForPath, track } from "@/lib/analytics/track";

export function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const { isAuthenticated } = useConvexAuth();
  const identity = useQuery(
    api.members.getCurrentIdentity,
    isAuthenticated ? {} : "skip",
  );
  const identifiedId = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      identifiedId.current = null;
      return;
    }
    if (!identity || identifiedId.current === identity.distinctId) return;

    identify(identity.distinctId, identity.email || undefined);
    identifiedId.current = identity.distinctId;
  }, [identity, isAuthenticated]);

  useEffect(() => {
    const path = query ? `${pathname}?${query}` : pathname;
    track("$pageview", {
      path,
      title: document.title,
      referrer: document.referrer,
    });
    void syncReplayForPath();
  }, [pathname, query]);

  return null;
}
