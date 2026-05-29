"use client";

// ============================================================
// AnalyticsRouteTracker
// ============================================================
// Next.js App Router does NOT fire a fresh page_view on
// client-side navigation by default — gtag only fires once when
// the page first loads. This component listens for pathname
// changes and reports each one as a GA4 page_view (also tagged
// in Clarity for filterable session replays).
//
// We also send Meta Pixel PageView again because that mirrors
// the user's behaviour on multi-page SPAs.
// ============================================================

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { track } from "@/lib/analytics";

export default function AnalyticsRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    // Compose the canonical URL the trackers should see.
    const qs = searchParams?.toString();
    const fullPath = qs ? `${pathname}?${qs}` : pathname;

    // Suppress duplicate fires when only ?utm tags change but
    // the meaningful path stays the same.
    if (lastPath.current === fullPath) return;
    lastPath.current = fullPath;

    const title = typeof document !== "undefined" ? document.title : undefined;
    track({ name: "page_view", path: fullPath, title });
  }, [pathname, searchParams]);

  return null;
}
