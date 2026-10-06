"use client";

// First-launch intro — shown once inside the Android app, on the
// home screen, to people who are not logged in on this phone.
//
// Three screens, each with a hand-drawn doodle that draws itself:
//   1. one photo in → a full shoot out
//   2. the three agents
//   3. 100 free credits → sign up
//
// "Seen" is remembered on the phone (localStorage, SEEN_KEY). To show
// the intro to everyone again after a redesign, change SEEN_KEY.

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Zap } from "lucide-react";

import { APP_AGENTS } from "./appData";
import { pushBackHandler } from "./appBus";

const SEEN_KEY = "af_app_intro_v1";
const LAST = 2;

const SLIDES = [
  {
    title: "One photo in. A full shoot out.",
    text: "Click your fabric, jewellery or product on your phone. AgentForge turns it into a model or studio shot.",
  },
  {
    title: "Pick the agent for your product",
    text: "Textile for fabric and prints. Jewellery for model shoots. Productography for catalogue and ad shots.",
  },
  {
    title: "Start with 100 free credits",
    text: "Sign up and make your first visuals free. No payment needed to start.",
  },
];

function shouldShow(pathname: string): boolean {
  if (pathname !== "/") return false;
  try {
    if (localStorage.getItem(SEEN_KEY)) return false;
    // Already logged in on this phone → no intro.
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      if (key.startsWith("sb-") && key.endsWith("-auth-token")) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Animation delay (and optional duration) for the doodle helpers in globals.css. */
const at = (delay: number, dur?: number) =>
  ({ "--d": `${delay}s`, ...(dur ? { "--dur": `${dur}s` } : {}) }) as CSSProperties;

/** Four-point sparkle path centred on (cx, cy). */
function sparkle(cx: number, cy: number, s: number): string {
  const k = s * 0.26;
  return `M${cx} ${cy - s}L${cx + k} ${cy - k}L${cx + s} ${cy}L${cx + k} ${cy + k}L${cx} ${cy + s}L${cx - k} ${cy + k}L${cx - s} ${cy}L${cx - k} ${cy - k}Z`;
}

/** A circle drawn by hand: slightly uneven, ends overlap. */
function handCircle(cx: number, cy: number, r: number): string {
  return (
    `M${cx - r + 3} ${cy + 6}` +
    `C${cx - r - 4} ${cy - r * 0.6} ${cx - r * 0.4} ${cy - r - 5} ${cx + 4} ${cy - r + 1}` +
    `C${cx + r * 0.7} ${cy - r + 3} ${cx + r + 5} ${cy - r * 0.3} ${cx + r - 1} ${cy + 8}` +
    `C${cx + r - 4} ${cy + r * 0.7} ${cx + r * 0.3} ${cy + r + 4} ${cx - 6} ${cy + r - 1}` +
    `C${cx - r * 0.7} ${cy + r - 4} ${cx - r - 2} ${cy + r * 0.2} ${cx - r + 6} ${cy - 10}`
  );
}

const CYAN = "#06b6d4";
const BLUE = "#2563eb";
const PURPLE = "#9333ea";

const svgProps = {
  viewBox: "0 0 320 250",
  fill: "none",
  strokeWidth: 3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "absolute inset-0 h-full w-full",
  "aria-hidden": true,
};

const popBox: CSSProperties = { transformBox: "fill-box", transformOrigin: "center" };

function Sparkle({ cx, cy, s, color, delay }: { cx: number; cy: number; s: number; color: string; delay: number }) {
  return <path d={sparkle(cx, cy, s)} fill={color} stroke="none" className="af-pop-in" style={{ ...popBox, ...at(delay) }} />;
}

/* ───────── 1. photo → shoot ───────── */
function ScenePhoto() {
  return (
    <>
      <svg {...svgProps} stroke="currentColor">
        {/* phone */}
        <path
          pathLength={1}
          className="af-draw"
          style={at(0.1, 1.1)}
          d="M44 60C43 50 49 45 58 45L104 44C113 44 118 49 118 58L119 178C119 188 114 193 105 193L59 194C50 194 45 189 45 180Z"
        />
        <path pathLength={1} className="af-draw" style={at(0.9, 0.3)} d="M72 56L92 56" />
        {/* fabric print on the phone */}
        <g strokeWidth={2.5}>
          <path pathLength={1} className="af-draw" style={at(0.7, 0.5)} stroke={CYAN} d="M57 86l8-8 8 8 8-8 8 8 8-8 8 8" />
          <path pathLength={1} className="af-draw" style={at(0.85, 0.5)} stroke={PURPLE} d="M57 106l8-8 8 8 8-8 8 8 8-8 8 8" />
          <path pathLength={1} className="af-draw" style={at(1.0, 0.5)} stroke={CYAN} d="M57 126l8-8 8 8 8-8 8 8 8-8 8 8" />
        </g>
        <path pathLength={1} className="af-draw" style={at(1.15, 0.3)} strokeWidth={5} stroke={BLUE} d="M61 146h.01M75 146h.01M89 146h.01M103 146h.01" />
        <circle pathLength={1} className="af-draw" style={at(1.2, 0.4)} cx="82" cy="172" r="8" />
        {/* arrow to the result */}
        <g stroke={PURPLE}>
          <path pathLength={1} className="af-draw" style={at(1.35, 0.5)} d="M127 116C136 84 152 70 174 77" />
          <path pathLength={1} className="af-draw" style={at(1.8, 0.25)} d="M162 67L175 77L161 86" />
        </g>
        {/* loose doodles */}
        <circle pathLength={1} className="af-draw" style={at(0.4, 0.4)} stroke={CYAN} cx="26" cy="28" r="6" />
        <path pathLength={1} className="af-draw" style={at(0.5, 0.3)} stroke={PURPLE} d="M16 218h14M23 211v14" />
        <path pathLength={1} className="af-draw" style={at(2.2, 0.7)} stroke={BLUE} d="M112 236q8-9 16 0t16 0t16 0t16 0t16 0t16 0" />
        <Sparkle cx={302} cy={22} s={11} color={PURPLE} delay={2.3} />
        <Sparkle cx={170} cy={176} s={8} color={CYAN} delay={2.45} />
        <Sparkle cx={308} cy={150} s={6} color={BLUE} delay={2.6} />
      </svg>

      {/* the result: a real output */}
      <div className="af-pop-in absolute left-[57%] top-[11%] w-[36%]" style={{ ...at(1.95), "--r": "4deg" } as CSSProperties}>
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border-[3px] border-white shadow-xl shadow-black/25">
          {/* wider than the frame, pinned right: shows the model, not the input panel */}
          <div className="absolute inset-y-0 right-0 w-[160%]">
            <Image src="/gallery/textile/design-27.png" alt="" fill sizes="200px" priority className="object-cover object-right-top" />
          </div>
        </div>
      </div>

      <p className="af-fade absolute left-[8%] top-[80%] w-[35%] text-center text-xs font-black" style={at(1.3)}>
        Your photo
      </p>
      <p className="af-fade absolute left-[57%] top-[80%] w-[36%] text-center text-xs font-black" style={at(2.3)}>
        Your shoot
      </p>
    </>
  );
}

/* ───────── 2. the three agents ───────── */
function SceneAgents() {
  const spots = [
    { cx: 58, color: CYAN, label: "Textile", tilt: "-4deg" },
    { cx: 160, color: PURPLE, label: "Jewellery", tilt: "3deg" },
    { cx: 262, color: BLUE, label: "Product", tilt: "-2deg" },
  ];
  return (
    <>
      <svg {...svgProps} stroke="currentColor">
        {spots.map((spot, i) => (
          <path
            key={spot.cx}
            pathLength={1}
            className="af-draw"
            style={at(0.25 + i * 0.45, 0.7)}
            stroke={spot.color}
            d={handCircle(spot.cx, 52, 40)}
          />
        ))}
        <path pathLength={1} className="af-draw" style={at(0.6, 0.3)} d="M103 52h12M109 46v12" />
        <path pathLength={1} className="af-draw" style={at(1.05, 0.3)} d="M205 52h12M211 46v12" />
        <Sparkle cx={16} cy={126} s={7} color={PURPLE} delay={1.9} />
        <Sparkle cx={306} cy={118} s={8} color={CYAN} delay={2.05} />
      </svg>

      {APP_AGENTS.map((agent, i) => {
        const spot = spots[i];
        const left = `${(spot.cx / 320) * 100}%`;
        return (
          <div key={agent.slug} className="absolute top-0 h-full w-0" style={{ left }}>
            <span
              className={`af-pop-in absolute left-[-28px] top-[9.6%] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${agent.tint} text-white shadow-lg`}
              style={at(0.1 + i * 0.45)}
            >
              <agent.Icon className="h-6 w-6" />
            </span>
            <p className="af-fade absolute left-[-50px] top-[40%] w-[100px] text-center text-[13px] font-black" style={at(0.5 + i * 0.45)}>
              {spot.label}
            </p>
            <div
              className="af-pop-in absolute left-[-36px] top-[51%] w-[72px]"
              style={{ ...at(0.75 + i * 0.45), "--r": spot.tilt } as CSSProperties}
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl border-[3px] border-white shadow-lg shadow-black/20">
                <div className={`absolute inset-y-0 right-0 ${agent.slug === "productography" ? "w-full" : "w-[160%]"}`}>
                  <Image src={agent.image} alt="" fill sizes="120px" className="object-cover object-right-top" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ───────── 3. 100 free credits ───────── */
function SceneCredits() {
  const bolts = [
    { left: "3%", top: "16%", size: 28, color: CYAN, tilt: "-18deg", delay: 1.2 },
    { left: "87%", top: "6%", size: 24, color: PURPLE, tilt: "14deg", delay: 1.35 },
    { left: "88%", top: "60%", size: 30, color: BLUE, tilt: "-8deg", delay: 1.5 },
    { left: "2%", top: "66%", size: 22, color: PURPLE, tilt: "10deg", delay: 1.65 },
  ];
  return (
    <>
      <p
        className="af-pop-in absolute inset-x-0 top-[19%] bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-center text-[96px] font-black leading-none tracking-tight text-transparent"
        style={at(0.1)}
      >
        100
      </p>
      <svg {...svgProps} stroke="currentColor">
        {/* circled by hand */}
        <path
          pathLength={1}
          className="af-draw"
          style={at(0.5, 1.3)}
          stroke={PURPLE}
          d="M52 96C48 44 126 16 190 20C254 24 296 56 286 102C276 150 190 168 122 162C66 156 40 130 50 88C58 54 110 32 168 30"
        />
        <path pathLength={1} className="af-draw" style={at(1.7, 0.7)} stroke={CYAN} d="M88 232q9-9 18 0t18 0t18 0t18 0t18 0t18 0t18 0t18 0" />
        <Sparkle cx={64} cy={14} s={7} color={CYAN} delay={1.8} />
        <Sparkle cx={262} cy={190} s={6} color={BLUE} delay={1.95} />
      </svg>
      <p className="af-rise absolute inset-x-0 top-[74%] text-center text-[26px] font-black leading-none" style={{ "--i": 22 } as CSSProperties}>
        free credits
      </p>
      {bolts.map((bolt) => (
        <span key={bolt.left + bolt.top} className="af-bob absolute" style={{ left: bolt.left, top: bolt.top, ...at(bolt.delay) }}>
          <Zap
            className="af-pop-in block fill-current"
            style={{ width: bolt.size, height: bolt.size, color: bolt.color, ...at(bolt.delay), "--r": bolt.tilt } as CSSProperties}
          />
        </span>
      ))}
    </>
  );
}

export default function AppIntro() {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => shouldShow(pathname));
  const [step, setStep] = useState(0);
  const touchX = useRef<number | null>(null);

  const close = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode: the intro simply shows again next time */
    }
    setOpen(false);
  };

  // Android back: previous screen, or leave the intro from the first one.
  useEffect(() => {
    if (!open) return;
    return pushBackHandler(() => {
      if (step > 0) setStep(step - 1);
      else close();
    });
  }, [open, step]);

  if (!open) return null;

  const slide = SLIDES[step];
  const next = () => setStep((s) => Math.min(LAST, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to AgentForge"
      className="af-fade fixed inset-0 z-[100] flex flex-col overflow-y-auto overscroll-contain bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
        backgroundImage:
          "radial-gradient(70% 38% at 90% 0%, rgba(34,211,238,0.22), transparent 70%), radial-gradient(70% 40% at 0% 100%, rgba(147,51,234,0.16), transparent 70%)",
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        if (start === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? start) - start;
        if (dx < -56) next();
        else if (dx > 56) prev();
      }}
    >
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <span className="flex items-center gap-2">
          <Image src="/af-logo.png" alt="" width={32} height={32} sizes="32px" className="h-8 w-8 rounded-lg" />
          <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 bg-clip-text text-base font-black text-transparent">
            AgentForge
          </span>
        </span>
        {step < LAST && (
          <button type="button" onClick={close} className="h-10 rounded-full px-3 text-sm font-black text-black/55 active:bg-black/5 dark:text-white/60 dark:active:bg-white/10">
            Skip
          </button>
        )}
      </div>

      <div className="flex min-h-[250px] flex-1 items-center justify-center px-6">
        {/* key = replay the drawing on every screen */}
        <div key={step} className="relative aspect-[320/250] w-full max-w-[320px]">
          {step === 0 ? <ScenePhoto /> : step === 1 ? <SceneAgents /> : <SceneCredits />}
        </div>
      </div>

      <div key={`text-${step}`} className="shrink-0 px-6 pt-2">
        <h2 className="af-rise text-[28px] font-black leading-[1.12] tracking-tight">{slide.title}</h2>
        <p className="af-rise mt-3 text-[15px] leading-6 text-black/60 dark:text-white/65" style={{ "--i": 1 } as CSSProperties}>
          {slide.text}
        </p>
      </div>

      <div className="shrink-0 px-6 pt-6">
        <div className="mb-5 flex items-center gap-1.5" aria-hidden>
          {SLIDES.map((s, i) => (
            <span
              key={s.title}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-7 bg-gradient-to-r from-cyan-400 to-blue-600" : "w-1.5 bg-black/20 dark:bg-white/25"
              }`}
            />
          ))}
        </div>

        {step < LAST ? (
          <button
            type="button"
            onClick={next}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-base font-black text-white shadow-lg shadow-cyan-500/25 transition active:scale-[0.98]"
          >
            Next
          </button>
        ) : (
          <div className="af-rise grid gap-2.5" style={{ "--i": 2 } as CSSProperties}>
            <Link
              href="/signup"
              onClick={close}
              className="flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-base font-black text-white shadow-lg shadow-cyan-500/25 transition active:scale-[0.98]"
            >
              Sign up free
            </Link>
            <Link
              href="/login"
              onClick={close}
              className="flex h-12 items-center justify-center rounded-2xl border border-black/12 text-sm font-black transition active:scale-[0.98] dark:border-white/20"
            >
              I already have an account
            </Link>
            <button type="button" onClick={close} className="h-10 text-sm font-black text-black/55 dark:text-white/60">
              Look around first
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
