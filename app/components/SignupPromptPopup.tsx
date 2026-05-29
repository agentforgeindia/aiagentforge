"use client";

// ============================================================
// SignupPromptPopup
// ============================================================
// Shown when a logged-out visitor tries to trigger a generation.
// Conversion-critical surface — every analytics event here is
// piped to GA4 + Meta + Clarity so we can measure prompt → signup.
//
// Improvements vs the original:
//   • Logo uses next/image (smaller, lazy, AVIF/WebP auto).
//   • Body scroll locked when open (no background slide).
//   • ESC key closes (a11y win for keyboard + mobile users).
//   • Three new analytics events:
//       signup_prompt_shown      → fires on open
//       signup_prompt_dismissed  → fires on close (X / ESC / backdrop)
//       cta_click                → fires on signup or login link
//     Each carries `source` so you can attribute prompts to
//     jewellery / textile / productography.
// ============================================================

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

import { track } from "@/lib/analytics";

export default function SignupPromptPopup({
  open,
  onClose,
  source = "generate",
  context,
}: {
  open: boolean;
  onClose: () => void;
  source?: string;
  context?: string; // e.g. "jewellery", "textile", "product shoot"
}) {
  // Fire `signup_prompt_shown` exactly once per open transition.
  useEffect(() => {
    if (!open) return;
    track({
      name: "custom_event",
      event_name: "signup_prompt_shown",
      props: { source, context: context ?? null },
    });
  }, [open, source, context]);

  // Lock body scroll while the popup is mounted, plus ESC-to-close.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss("escape");
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function dismiss(via: "close_button" | "backdrop" | "escape") {
    track({
      name: "custom_event",
      event_name: "signup_prompt_dismissed",
      props: { source, context: context ?? null, via },
    });
    onClose();
  }

  if (!open) return null;

  const label = context || "AI mockup";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 px-4 backdrop-blur-md"
      onClick={() => dismiss("backdrop")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-prompt-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-cyan-200/60 bg-gradient-to-br from-white via-cyan-50 to-blue-50 text-[#111827] shadow-[0_0_80px_rgba(34,211,238,0.25)]"
      >
        {/* Glow blobs */}
        <div className="absolute -left-20 top-10 h-44 w-44 rounded-full bg-cyan-300/40 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-44 w-44 rounded-full bg-blue-300/40 blur-3xl" />

        {/* Floating sparkle doodles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-6 top-8 float-slow text-4xl opacity-70">✨</div>
          <div className="absolute left-5 top-12 float-medium text-3xl opacity-70">💎</div>
          <div className="absolute right-10 bottom-24 float-fast text-3xl opacity-70">🚀</div>
          <div className="absolute left-8 bottom-16 float-medium text-3xl opacity-70">🎁</div>
          <div className="absolute right-20 top-32 float-fast text-2xl opacity-60">✦</div>
        </div>

        {/* Close button */}
        <button
          onClick={() => dismiss("close_button")}
          aria-label="Close popup"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-cyan-200 bg-white/80 text-lg font-bold text-black backdrop-blur hover:bg-cyan-50"
        >
          ×
        </button>

        <div className="relative z-10 p-7 text-center">
          {/* Logo */}
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[2rem] border border-cyan-200 bg-white shadow-2xl shadow-cyan-300/40">
            <Image
              src="/af-logo.png"
              alt="AgentForge"
              width={96}
              height={96}
              sizes="96px"
              className="h-full w-full rounded-[2rem] object-cover"
            />
          </div>

          {/* Badge — leans toward the value, not the gate */}
          <div className="mb-4 inline-flex rounded-full border border-emerald-300 bg-emerald-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            🎁 100 free credits
          </div>

          {/* Heading */}
          <h2
            id="signup-prompt-title"
            className="text-3xl font-black leading-tight text-[#111827] sm:text-4xl"
          >
            Sign up to start your{" "}
            <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
              {label}
            </span>
          </h2>

          {/* Subtext */}
          <p className="mt-3 text-base text-black/70">
            <span className="font-bold text-black">100 free credits</span> on
            signup. No card. Takes 30 seconds.
          </p>

          {/* Benefits */}
          <div className="mt-5 rounded-3xl border border-cyan-100 bg-white/70 p-4 text-left shadow-inner backdrop-blur">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-cyan-600">✓</span>
                <span className="text-black/75">Premium AI mockups in 30 seconds</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-600">✓</span>
                <span className="text-black/75">Jewellery, textile &amp; product visuals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-600">✓</span>
                <span className="text-black/75">HD downloads for Amazon, Meesho, WhatsApp</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-600">✓</span>
                <span className="text-black/75">Cancel anytime · No card required</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <Link
            href={`/signup?source=${encodeURIComponent(source)}`}
            onClick={() => {
              track({
                name: "cta_click",
                cta: "signup_popup_signup",
                location: source,
              });
              onClose();
            }}
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-cyan-400/30 transition hover:scale-[1.02]"
          >
            Sign Up Free — Get 100 Credits →
          </Link>

          {/* Secondary */}
          <p className="mt-4 text-xs text-black/45">
            Already have an account?{" "}
            <Link
              href={`/login?source=${encodeURIComponent(source)}`}
              onClick={() => {
                track({
                  name: "cta_click",
                  cta: "signup_popup_login",
                  location: source,
                });
                onClose();
              }}
              className="font-bold text-cyan-700 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
