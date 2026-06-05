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

    // Affiliate referral capture — store ?ref=CODE for 60 days so a
    // later signup/payment can be attributed to the partner.
    const ref = searchParams.get("ref");
    if (ref) {
      try {
        localStorage.setItem("af_ref_code", ref);
        document.cookie = `af_ref=${encodeURIComponent(ref)};path=/;max-age=${60 * 60 * 24 * 60}`;
      } catch { /* ignore */ }
    }
  }, [pathname, searchParams]);

  return null;
}
