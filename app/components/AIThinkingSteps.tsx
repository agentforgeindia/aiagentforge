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
 * Premium "AI is thinking…" checklist that auto-advances through pipeline
 * steps. Completed items get a cyan check + line-through; the current item
 * pulses with a gradient dot and animated trailing dots; future items
 * appear faded.
 *
 * The auto-advance freezes on the last step (so the user keeps seeing the
 * final step "in progress" until the real generation finishes and the
 * caller unmounts this component).
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
          // hold on the last step or wrap to start
          return holdAtLast ? steps.length - 1 : 0;
        }
        return i + 1;
      });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, steps.length, holdAtLast]);

  const eyebrowColor = darkMode ? "text-cyan-300" : "text-cyan-700";
  const pendingTextColor = darkMode ? "text-white/50" : "text-slate-500";
  const currentTextColor = darkMode ? "text-white" : "text-slate-900";
  const doneTextColor = darkMode ? "text-white/65" : "text-slate-600";

  return (
    <div className="relative">
      <p className={`mb-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] ${eyebrowColor}`}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
        </span>
        {title}
      </p>

      <ul className="space-y-1.5">
        {steps.map((step, i) => {
          const status =
            i < currentIdx ? "done" : i === currentIdx ? "current" : "pending";
          return (
            <li
              key={step}
              className={`flex items-start gap-2.5 transition-all duration-500 ${
                status === "current"
                  ? "opacity-100 translate-x-0"
                  : status === "done"
                  ? "opacity-70 translate-x-0"
                  : "opacity-40 translate-x-0"
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition ${
                  status === "done"
                    ? "bg-cyan-500 text-white shadow-sm shadow-cyan-500/40"
                    : status === "current"
                    ? "bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-md shadow-cyan-500/40"
                    : darkMode
                    ? "bg-white/10 text-white/40"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {status === "done" ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : status === "current" ? (
                  <span className="block h-2 w-2 animate-pulse rounded-full bg-white" />
                ) : (
                  <span className="block h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                )}
              </span>

              <span
                className={`text-[12px] leading-5 sm:text-[13px] ${
                  status === "current"
                    ? `font-black ${currentTextColor}`
                    : status === "done"
                    ? `font-bold ${doneTextColor}`
                    : `font-bold ${pendingTextColor}`
                }`}
              >
                {step}
                {status === "current" && (
                  <span className="ml-0.5 inline-flex">
                    <span className="animate-pulse">.</span>
                    <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>
                      .
                    </span>
                    <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>
                      .
                    </span>
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
