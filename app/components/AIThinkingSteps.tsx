"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

type Props = {
  steps: string[];
  /** Time spent on each step before advancing. Default 2200ms. */
  intervalMs?: number;
  /** Optional dark-mode flag for color tuning. */
  darkMode?: boolean;
  /** Optional title shown above the list. */
  title?: string;
  /** If true, the last step stays in "current" state forever (until the modal unmounts). Defaults to true. */
  holdAtLast?: boolean;
};

/**
 * Premium "AI is thinking…" indicator that shows ONE step at a time
 * (not a long vertical list). Designed mobile-first — total height ~120px
 * instead of growing with step count.
 *
 * Layout per render:
 *   ● [title]              Step 3 of 8
 *   ──────────────────────────────────
 *   ┌────────────────────────────────┐
 *   │  ✓  Choosing the perfect       │  ← current step (animated)
 *   │     pose...                    │
 *   └────────────────────────────────┘
 *   ●●●○○○○○                        38% done
 */
export default function AIThinkingSteps({
  steps,
  intervalMs = 2200,
  darkMode = false,
  title = "AI is working",
  holdAtLast = true,
}: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (steps.length === 0) return;
    const id = window.setInterval(() => {
      setCurrentIdx((i) => {
        if (i >= steps.length - 1) {
          return holdAtLast ? steps.length - 1 : 0;
        }
        return i + 1;
      });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, steps.length, holdAtLast]);

  if (steps.length === 0) return null;

  const currentStep = steps[currentIdx];
  const isLast = currentIdx >= steps.length - 1;
  const progressPct = Math.round(((currentIdx + 1) / steps.length) * 100);

  const eyebrowColor = darkMode ? "text-cyan-300" : "text-cyan-700";
  const counterColor = darkMode ? "text-white/55" : "text-slate-500";
  const stepBg = darkMode ? "bg-white/[0.06]" : "bg-slate-50";
  const stepBorder = darkMode ? "border-white/10" : "border-cyan-200/60";
  const stepText = darkMode ? "text-white" : "text-slate-900";
  const pipDone = "bg-gradient-to-r from-cyan-400 to-blue-600";
  const pipPending = darkMode ? "bg-white/15" : "bg-slate-300";
  const progressTextColor = darkMode ? "text-white/55" : "text-slate-500";

  return (
    <div className="relative">
      {/* Header row: title + step counter */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] ${eyebrowColor}`}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
          </span>
          <span className="truncate">{title}</span>
        </p>
        <span className={`shrink-0 text-[10px] font-black uppercase tracking-[0.18em] ${counterColor}`}>
          {currentIdx + 1} / {steps.length}
        </span>
      </div>

      {/* Single-step card — only the CURRENT step is visible, with cross-fade on change */}
      <div
        key={currentIdx /* re-mount on step change to trigger animation */}
        className={`flex items-start gap-3 rounded-2xl border ${stepBorder} ${stepBg} p-3.5 transition`}
        style={{ animation: "afStepIn 0.4s ease-out" }}
      >
        {/* Animated icon — pulse while current, check on hold-at-last */}
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white shadow-md shadow-cyan-500/40 ${
            isLast ? "bg-gradient-to-br from-cyan-500 to-blue-600" : "bg-gradient-to-br from-cyan-400 to-blue-600"
          }`}
        >
          {isLast ? (
            <Check className="h-4 w-4" strokeWidth={3} />
          ) : (
            <span className="block h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
          )}
        </span>

        {/* Step label */}
        <span className={`text-sm font-black leading-snug sm:text-[15px] ${stepText}`}>
          {currentStep}
          {!isLast && (
            <span className="ml-0.5 inline-flex">
              <span className="animate-pulse">.</span>
              <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>.</span>
              <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>.</span>
            </span>
          )}
        </span>
      </div>

      {/* Tiny pip indicators — visualises overall progress without growing the height */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                i <= currentIdx ? pipDone : pipPending
              } ${i === currentIdx ? "w-4" : ""}`}
            />
          ))}
        </div>
        <span className={`text-[10px] font-black uppercase tracking-[0.18em] ${progressTextColor}`}>
          {progressPct}% done
        </span>
      </div>

      {/* Local keyframes for the step cross-fade */}
      <style>{`
        @keyframes afStepIn {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
