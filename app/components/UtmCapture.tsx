"use client";

// ============================================================
// UtmCapture — mounts once globally (from LayoutClient).
// Calls captureUtmOnLanding on every route change so the first
// visit with utm_* params gets recorded into localStorage and
// is later available to the signup callback.
// ============================================================

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureUtmOnLanding } from "@/lib/utmAttribution";

export default function UtmCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    captureUtmOnLanding();
    // Re-run on every route change in case the user clicks a link
    // that re-introduces UTM params (rare, but cheap).
  }, [pathname, searchParams]);

  return null;
}
