"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { syncReplayForPath, track } from "@/lib/analytics/track";

export function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

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
