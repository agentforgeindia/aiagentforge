"use client";

import { useEffect, useRef, useState } from "react";

/**
 * AppIntro
 * --------
 * Plays /App-intro.mp4 as a full-screen intro when the site is opened inside
 * the installed app shell (mobile TWA, desktop Electron, or PWA standalone).
 *
 * Behaviour:
 * - Renders nothing for regular browser visits.
 * - Renders only once per session (sessionStorage flag).
 * - Skippable; auto-dismisses when the video finishes.
 * - White background with floating AI/design doodles (no black screen).
 */
export default function AppIntro() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Show only once per session
    if (sessionStorage.getItem("af_app_intro_shown") === "1") return;

    const ua = navigator.userAgent.toLowerCase();
    const params = new URLSearchParams(window.location.search);

    const isInApp =
      // PWA / TWA installed (Chrome reports standalone for installed PWAs and TWAs)
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches ||
      // iOS Safari "Add to Home Screen"
      // @ts-expect-error - standalone is a non-standard iOS Safari property
      window.navigator.standalone === true ||
      // Electron desktop wrapper
      ua.includes("electron") ||
      ua.includes("agentforgedesktop") ||
      // Android TWA launches with this referrer
      document.referrer.startsWith("android-app://") ||
      // Explicit override (set by Electron loader / TWA start_url)
      params.get("source") === "app";

    if (!isInApp) return;

    setVisible(true);
    sessionStorage.setItem("af_app_intro_shown", "1");
  }, []);

  const close = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => setVisible(false), 450);
  };

  // Safety: if video can't load for any reason, auto-close after 8s
  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(close, 8000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="App intro"
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-white transition-opacity duration-500 ${
        exiting ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Soft tinted glow so pure white is not flat */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,#a78bfa22,transparent_45%),radial-gradient(circle_at_80%_15%,#22d3ee22,transparent_40%),radial-gradient(circle_at_50%_95%,#f472b622,transparent_45%)]" />

      {/* Floating AI / design doodles */}
      <FloatingDoodles />

      {/* Video */}
      <video
        ref={videoRef}
        src="/App-intro.mp4"
        autoPlay
        muted
        playsInline
        onEnded={close}
        onError={close}
        className="relative z-10 max-h-[80vh] max-w-[90vw] rounded-3xl shadow-[0_30px_90px_-20px_rgba(80,40,200,0.35)] ring-1 ring-black/5"
      />

      {/* Skip button */}
      <button
        type="button"
        onClick={close}
        className="absolute right-4 top-4 z-20 rounded-full border border-black/10 bg-white/80 px-4 py-1.5 text-sm font-medium text-gray-800 shadow-sm backdrop-blur transition hover:bg-white sm:right-6 sm:top-6"
      >
        Skip
      </button>
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
  { Icon: SparkleDoodle, top: "8%", left: "10%", size: 42, delay: 0, duration: 6, rotate: -8, color: PALETTE[0] },
  { Icon: PencilDoodle, top: "14%", left: "82%", size: 48, delay: 0.6, duration: 7, rotate: 12, color: PALETTE[1] },
  { Icon: PaletteDoodle, top: "22%", left: "4%", size: 56, delay: 1.2, duration: 8, rotate: -15, color: PALETTE[2] },
  { Icon: WandDoodle, top: "70%", left: "86%", size: 50, delay: 0.3, duration: 7.5, rotate: 18, color: PALETTE[3] },
  { Icon: CameraDoodle, top: "78%", left: "8%", size: 52, delay: 0.9, duration: 6.5, rotate: -10, color: PALETTE[4] },
  { Icon: SparkleDoodle, top: "52%", left: "92%", size: 36, delay: 1.5, duration: 5, rotate: 22, color: PALETTE[5] },
  { Icon: DiamondDoodle, top: "30%", left: "90%", size: 42, delay: 0.4, duration: 8, rotate: -8, color: PALETTE[6] },
  { Icon: ShirtDoodle, top: "62%", left: "2%", size: 56, delay: 1.0, duration: 7, rotate: 8, color: PALETTE[0] },
  { Icon: ChipDoodle, top: "88%", left: "62%", size: 46, delay: 0.7, duration: 6.5, rotate: -14, color: PALETTE[1] },
  { Icon: StarDoodle, top: "6%", left: "48%", size: 38, delay: 1.8, duration: 5.5, rotate: 14, color: PALETTE[2] },
  { Icon: SparkleDoodle, top: "44%", left: "16%", size: 30, delay: 2.1, duration: 5, rotate: -6, color: PALETTE[3] },
  { Icon: BoltDoodle, top: "38%", left: "70%", size: 40, delay: 0.2, duration: 6, rotate: 10, color: PALETTE[4] },
];

function FloatingDoodles() {
  return (
    <>
      <style>{`
        @keyframes af-float {
          0%   { transform: translate(0, 0) rotate(var(--rot, 0deg)); }
          50%  { transform: translate(0, -14px) rotate(calc(var(--rot, 0deg) + 4deg)); }
          100% { transform: translate(0, 0) rotate(var(--rot, 0deg)); }
        }
        .af-doodle {
          animation: af-float var(--af-dur, 6s) ease-in-out infinite;
          animation-delay: var(--af-delay, 0s);
          opacity: 0.85;
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
                  // CSS custom props for keyframes
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
/* Doodle SVGs (hand-drawn style)                                     */
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
