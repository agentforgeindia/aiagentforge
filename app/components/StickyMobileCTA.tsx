"use client";

// ============================================================
// StickyMobileCTA
// ============================================================
// Fixed-position primary action shown ONLY on mobile (<lg) at
// the bottom of the viewport. Lifts conversion on agent pages
// where the actual generate button can be 1–3 screens down.
//
// Hidden automatically when:
//   • a generation is in progress (so it doesn't cover the
//     loading modal),
//   • the viewport is >= lg (desktop already has a visible CTA).
//
// Click is auto-tagged with the `cta_click` analytics event.
// Each page passes a label + click handler:
//
//   <StickyMobileCTA
//     label="Generate Jewellery Mockup"
//     subLabel="100 free credits on signup"
//     ctaName="jewellery_sticky_mobile"
//     hidden={isGenerating}
//     onClick={() => scrollToBuilder()}
//   />
// ============================================================

import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { track } from "@/lib/analytics";

type Props = {
  /** Big bold text on the button. */
  label: string;
  /** Small upper line (optional). Use for value props. */
  subLabel?: string;
  /** Stable name sent to analytics so you can filter by CTA. */
  ctaName: string;
  /** What happens on tap — usually a scroll-into-view or a popup trigger. */
  onClick: () => void;
  /** External hide signal (e.g. isGenerating). */
  hidden?: boolean;
};

export default function StickyMobileCTA({
  label,
  subLabel,
  ctaName,
  onClick,
  hidden,
}: Props) {
  // Hide on initial render until we know there is content to scroll
  // past — prevents the bar flashing on a 1-screen page.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  if (hidden || !ready) return null;

  return (
    <div
      role="region"
      aria-label="Primary action"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-3 lg:hidden"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
      }}
    >
      <button
        type="button"
        onClick={() => {
          track({ name: "cta_click", cta: ctaName, location: "sticky_mobile" });
          onClick();
        }}
        className="pointer-events-auto group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/40 bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3.5 text-left shadow-2xl shadow-cyan-500/40 ring-1 ring-cyan-300/60 backdrop-blur-xl transition active:scale-[0.98] dark:border-cyan-300/30"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
          <Sparkles className="h-5 w-5" />
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          {subLabel && (
            <span className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-white/80">
              {subLabel}
            </span>
          )}
          <span className="truncate text-sm font-black leading-tight text-white">
            {label}
          </span>
        </span>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-cyan-700 transition group-hover:translate-x-0.5">
          <ArrowRight className="h-5 w-5" />
        </span>
      </button>
    </div>
  );
}
