"use client";

import {
  BadgeCheck,
  Briefcase,
  EyeOff,
  ImageIcon,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type Accent = "emerald" | "cyan" | "blue" | "violet" | "indigo" | "amber";

type Badge = {
  Icon: typeof ShieldCheck;
  label: string;
  accent: Accent;
};

const BADGES: Badge[] = [
  { Icon: ShieldCheck, label: "Secure Payments", accent: "emerald" },
  { Icon: Sparkles, label: "AI Powered", accent: "cyan" },
  { Icon: BadgeCheck, label: "Commercial Use Allowed", accent: "blue" },
  { Icon: Briefcase, label: "Made for Businesses", accent: "violet" },
  { Icon: ImageIcon, label: "HD Output", accent: "indigo" },
  { Icon: EyeOff, label: "Watermark Free", accent: "amber" },
];

const ACCENT_LIGHT: Record<Accent, string> = {
  emerald: "from-emerald-400 to-teal-500 shadow-emerald-500/30",
  cyan: "from-cyan-400 to-blue-500 shadow-cyan-500/30",
  blue: "from-blue-400 to-indigo-500 shadow-blue-500/30",
  violet: "from-violet-400 to-fuchsia-500 shadow-violet-500/30",
  indigo: "from-indigo-400 to-blue-600 shadow-indigo-500/30",
  amber: "from-amber-400 to-orange-500 shadow-amber-500/30",
};

const ACCENT_TEXT: Record<Accent, string> = {
  emerald: "text-emerald-700 dark:text-emerald-200",
  cyan: "text-cyan-700 dark:text-cyan-200",
  blue: "text-blue-700 dark:text-blue-200",
  violet: "text-violet-700 dark:text-violet-200",
  indigo: "text-indigo-700 dark:text-indigo-200",
  amber: "text-amber-700 dark:text-amber-200",
};

type Props = {
  /**
   * "pills" → small horizontal row of compact pills (for footer, agent pages).
   * "grid"  → 2×3 / 3×2 grid of bigger cards (for home / pricing).
   */
  variant?: "pills" | "grid";
  darkMode?: boolean;
  /** Optional title / eyebrow shown above. */
  title?: string;
  /** Optional className for the outer wrapper. */
  className?: string;
};

export default function TrustBadges({
  variant = "grid",
  darkMode = false,
  title,
  className = "",
}: Props) {
  const cardBase = darkMode
    ? "border-white/10 bg-white/[0.05]"
    : "border-black/10 bg-white/80";

  if (variant === "pills") {
    return (
      <div className={className}>
        {title && (
          <p className={`mb-3 text-center text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600`}>
            {title}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {BADGES.map(({ Icon, label, accent }) => (
            <span
              key={label}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:text-[13px] ${cardBase} ${ACCENT_TEXT[accent]}`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br ${ACCENT_LIGHT[accent]} text-white shadow-sm`}>
                <Icon className="h-3 w-3" />
              </span>
              {label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // grid variant
  return (
    <div className={className}>
      {title && (
        <p className={`mb-3 text-center text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600`}>
          {title}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
        {BADGES.map(({ Icon, label, accent }) => (
          <div
            key={label}
            className={`group flex items-center gap-2 rounded-2xl border p-2.5 transition hover:-translate-y-0.5 hover:shadow-md sm:flex-col sm:p-3 sm:text-center ${cardBase}`}
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${ACCENT_LIGHT[accent]} text-white shadow-md sm:h-10 sm:w-10`}>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <p className={`text-[11px] font-black leading-tight sm:text-[12px] ${ACCENT_TEXT[accent]}`}>
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
