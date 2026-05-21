"use client";

import { useEffect, useState } from "react";

/**
 * AppIntro
 * --------
 * Static brand intro shown only inside the installed app shell
 * (mobile TWA, desktop Electron, or PWA standalone).
 *
 * Design:
 * - Light off-white background with soft brand-tinted radial glows.
 * - Centred logo + wordmark + thin brand-gradient loading bar.
 * - Floating AI/design doodles drift gently in the background.
 * - Auto-dismisses after 4s (between user-requested 3–5s range).
 * - No black surfaces anywhere; logo sits on white with a gradient halo.
 */

const INTRO_DURATION_MS = 4000;
const FADE_OUT_MS = 500;

export default function AppIntro() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Decide on mount whether to show the intro
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("af_app_intro_shown") === "1") return;

    const ua = navigator.userAgent.toLowerCase();
    const params = new URLSearchParams(window.location.search);

    const isInApp =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches ||
      // @ts-expect-error - non-standard iOS Safari property
      window.navigator.standalone === true ||
      ua.includes("electron") ||
      ua.includes("agentforgedesktop") ||
      document.referrer.startsWith("android-app://") ||
      params.get("source") === "app";

    if (!isInApp) return;

    setVisible(true);
    sessionStorage.setItem("af_app_intro_shown", "1");
  }, []);

  // Auto-dismiss
  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => triggerClose(), INTRO_DURATION_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const triggerClose = () => {
    setExiting((prev) => {
      if (prev) return prev;
      window.setTimeout(() => setVisible(false), FADE_OUT_MS);
      return true;
    });
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="App intro"
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#fafbff] transition-opacity duration-500 ${
        exiting ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Soft brand-tinted radial glows — light theme, no black */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,#a78bfa33,transparent_45%),radial-gradient(circle_at_82%_15%,#22d3ee33,transparent_42%),radial-gradient(circle_at_50%_95%,#f472b633,transparent_45%)]" />

      {/* Floating doodles */}
      <FloatingDoodles />

      {/* Centre stack — logo + wordmark + loading bar */}
      <div className="relative z-10 flex flex-col items-center px-6">
        {/* Gradient halo */}
        <div className="relative">
          <div className="absolute inset-0 -m-10 rounded-full bg-[conic-gradient(from_0deg,#22d3ee,#a78bfa,#f472b6,#22d3ee)] opacity-40 blur-2xl af-halo-spin" />
          <div className="absolute inset-0 -m-6 rounded-full bg-white/60 blur-xl" />

          {/* Logo (no black frame — sits directly on the soft white background) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/af-logo.png"
            alt="AI Agentforge"
            className="relative h-32 w-32 sm:h-40 sm:w-40 select-none af-logo-enter drop-shadow-[0_12px_28px_rgba(124,58,237,0.35)]"
            draggable={false}
          />
        </div>

        {/* Wordmark */}
        <div className="mt-6 text-center">
          <div className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl af-text-rise">
            AI Agentforge
          </div>
          <div className="mt-1 text-xs font-medium text-gray-500 sm:text-sm af-text-rise-slow">
            Designing with intelligence
          </div>
        </div>

        {/* Brand-gradient loading bar */}
        <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-black/5">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-400 af-loader"
            style={{ animationDuration: `${INTRO_DURATION_MS}ms` }}
          />
        </div>
      </div>

      {/* Skip */}
      <button
        type="button"
        onClick={triggerClose}
        className="absolute right-4 top-4 z-20 rounded-full border border-black/5 bg-white/80 px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm backdrop-blur transition hover:bg-white sm:right-6 sm:top-6"
      >
        Skip
      </button>

      {/* Component-scoped keyframes */}
      <style>{`
        @keyframes af-logo-enter {
          0%   { opacity: 0; transform: scale(0.85); }
          60%  { opacity: 1; transform: scale(1.04); }
          100% { opacity: 1; transform: scale(1); }
        }
        .af-logo-enter {
          animation: af-logo-enter 900ms cubic-bezier(0.22, 1, 0.36, 1) both,
                     af-logo-breathe 2.4s ease-in-out 900ms infinite;
        }
        @keyframes af-logo-breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.03); }
        }
        @keyframes af-halo-spin {
          to { transform: rotate(360deg); }
        }
        .af-halo-spin { animation: af-halo-spin 10s linear infinite; }

        @keyframes af-text-rise {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .af-text-rise      { animation: af-text-rise 700ms cubic-bezier(0.22, 1, 0.36, 1) 300ms both; }
        .af-text-rise-slow { animation: af-text-rise 700ms cubic-bezier(0.22, 1, 0.36, 1) 500ms both; }

        @keyframes af-loader-fill {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
        .af-loader { animation: af-loader-fill linear forwards; }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Floating doodles                                                   */
/* ------------------------------------------------------------------ */

type Doodle = {
  Icon: React.FC<{ className?: string }>;
  top: string;
  left: string;
  size: number;
  delay: number;
  duration: number;
  rotate: number;
  color: string;
};

const PALETTE = ["#7c3aed", "#0ea5e9", "#f472b6", "#22d3ee", "#a855f7", "#06b6d4", "#ec4899"];

const DOODLES: Doodle[] = [
  { Icon: SparkleDoodle,  top: "8%",  left: "10%", size: 38, delay: 0.0, duration: 5.0, rotate: -8,  color: PALETTE[0] },
  { Icon: PencilDoodle,   top: "14%", left: "82%", size: 44, delay: 0.4, duration: 5.5, rotate: 12,  color: PALETTE[1] },
  { Icon: PaletteDoodle,  top: "22%", left: "4%",  size: 50, delay: 0.8, duration: 6.0, rotate: -15, color: PALETTE[2] },
  { Icon: WandDoodle,     top: "70%", left: "86%", size: 46, delay: 0.2, duration: 5.5, rotate: 18,  color: PALETTE[3] },
  { Icon: CameraDoodle,   top: "78%", left: "8%",  size: 48, delay: 0.6, duration: 5.0, rotate: -10, color: PALETTE[4] },
  { Icon: SparkleDoodle,  top: "52%", left: "92%", size: 32, delay: 1.0, duration: 4.5, rotate: 22,  color: PALETTE[5] },
  { Icon: DiamondDoodle,  top: "30%", left: "90%", size: 38, delay: 0.3, duration: 6.0, rotate: -8,  color: PALETTE[6] },
  { Icon: ShirtDoodle,    top: "62%", left: "2%",  size: 50, delay: 0.7, duration: 5.5, rotate: 8,   color: PALETTE[0] },
  { Icon: ChipDoodle,     top: "88%", left: "62%", size: 42, delay: 0.5, duration: 5.0, rotate: -14, color: PALETTE[1] },
  { Icon: StarDoodle,     top: "6%",  left: "48%", size: 34, delay: 1.2, duration: 4.5, rotate: 14,  color: PALETTE[2] },
  { Icon: SparkleDoodle,  top: "44%", left: "16%", size: 28, delay: 1.4, duration: 4.2, rotate: -6,  color: PALETTE[3] },
  { Icon: BoltDoodle,     top: "38%", left: "70%", size: 36, delay: 0.1, duration: 5.0, rotate: 10,  color: PALETTE[4] },
];

function FloatingDoodles() {
  return (
    <>
      <style>{`
        @keyframes af-float {
          0%   { transform: translate(0, 0) rotate(var(--rot, 0deg)); }
          50%  { transform: translate(0, -12px) rotate(calc(var(--rot, 0deg) + 6deg)); }
          100% { transform: translate(0, 0) rotate(var(--rot, 0deg)); }
        }
        @keyframes af-doodle-in {
          0%   { opacity: 0; transform: scale(0.6) rotate(var(--rot, 0deg)); }
          100% { opacity: 0.85; transform: scale(1) rotate(var(--rot, 0deg)); }
        }
        .af-doodle {
          opacity: 0;
          animation:
            af-doodle-in 500ms cubic-bezier(0.22, 1, 0.36, 1) var(--af-delay, 0s) forwards,
            af-float var(--af-dur, 5s) ease-in-out var(--af-delay, 0s) infinite;
          will-change: transform;
        }
      `}</style>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {DOODLES.map((d, i) => {
          const { Icon } = d;
          return (
            <div
              key={i}
              className="af-doodle absolute"
              style={
                {
                  top: d.top,
                  left: d.left,
                  width: d.size,
                  height: d.size,
                  color: d.color,
                  ["--af-dur" as never]: `${d.duration}s`,
                  ["--af-delay" as never]: `${d.delay}s`,
                  ["--rot" as never]: `${d.rotate}deg`,
                } as React.CSSProperties
              }
            >
              <Icon className="h-full w-full" />
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Doodle SVGs                                                        */
/* ------------------------------------------------------------------ */

function SparkleDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <path d="M12 8.5l1.5 2 2 .8-1.7 1.3.4 2.2-2.2-1.1-2.2 1.1.4-2.2L8.5 11.3l2-.8z" />
    </svg>
  );
}

function PencilDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 21l3.5-.7 11-11-2.8-2.8-11 11L3 21z" />
      <path d="M14 6.5l3.5 3.5" />
      <path d="M16 4.5L18.5 2 22 5.5 19.5 8z" />
    </svg>
  );
}

function PaletteDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3a9 9 0 1 0 0 18c1.5 0 2.5-1 2.5-2.2 0-.8-.5-1.3-.5-2 0-1 .9-1.8 2-1.8h1.5A3.5 3.5 0 0 0 21 11.5 8.5 8.5 0 0 0 12 3z" />
      <circle cx="7.5" cy="11" r="1" fill="currentColor" />
      <circle cx="10" cy="7" r="1" fill="currentColor" />
      <circle cx="15" cy="7.5" r="1" fill="currentColor" />
      <circle cx="17.5" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}

function WandDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 21l11-11" />
      <path d="M14 10l3 3" />
      <path d="M17 4l.7 1.6L19.3 6l-1.6.7L17 8.3l-.7-1.6L14.7 6l1.6-.7z" />
      <path d="M20 12l.6 1.4L22 14l-1.4.6L20 16l-.6-1.4L18 14l1.4-.6z" />
    </svg>
  );
}

function CameraDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function DiamondDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9l3-4h6l3 4-6 11z" />
      <path d="M6 9h12" />
      <path d="M9 5l3 4 3-4" />
      <path d="M9 9l3 11 3-11" />
    </svg>
  );
}

function ShirtDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 7l5-3 3 2 3-2 5 3-2 4-3-1v9H9v-9l-3 1z" />
    </svg>
  );
}

function ChipDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
    </svg>
  );
}

function StarDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3l2.6 5.5 6 .9-4.3 4.2 1 6L12 16.8 6.7 19.6l1-6L3.4 9.4l6-.9z" />
    </svg>
  );
}

function BoltDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M13 3L4 14h6l-1 7 9-11h-6z" />
    </svg>
  );
}
