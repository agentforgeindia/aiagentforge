"use client";

// PageDoodles — floating background doodles, same theme as home page.
// Drop inside any page's <main> as the first child (pointer-events-none, fixed).

type Variant = "careers" | "influencer" | "academy" | "apply" | "test" | "training" | "default";

const SETS: Record<Variant, { emoji: string; cls: string; pos: string }[]> = {
  default: [
    { emoji: "✨", cls: "float-slow",   pos: "left-[6%] top-[6%]" },
    { emoji: "💎", cls: "float-medium", pos: "right-[8%] top-[10%]" },
    { emoji: "👕", cls: "float-medium", pos: "left-[3%] top-[28%]" },
    { emoji: "💍", cls: "float-slow",   pos: "right-[4%] top-[32%]" },
    { emoji: "📸", cls: "float-fast",   pos: "left-[8%] top-[44%]" },
    { emoji: "🚀", cls: "float-fast",   pos: "left-[14%] top-[62%]" },
    { emoji: "🎁", cls: "float-slow",   pos: "right-[14%] top-[66%]" },
    { emoji: "✨", cls: "float-medium", pos: "right-[18%] top-[82%]" },
  ],
  careers: [
    { emoji: "💼", cls: "float-slow",   pos: "left-[6%] top-[6%]" },
    { emoji: "🚀", cls: "float-medium", pos: "right-[8%] top-[10%]" },
    { emoji: "✨", cls: "float-medium", pos: "left-[3%] top-[28%]" },
    { emoji: "🎯", cls: "float-slow",   pos: "right-[4%] top-[32%]" },
    { emoji: "📝", cls: "float-fast",   pos: "left-[8%] top-[44%]" },
    { emoji: "💡", cls: "float-fast",   pos: "left-[14%] top-[62%]" },
    { emoji: "🏆", cls: "float-slow",   pos: "right-[14%] top-[66%]" },
    { emoji: "🌟", cls: "float-medium", pos: "right-[18%] top-[82%]" },
  ],
  influencer: [
    { emoji: "🌟", cls: "float-slow",   pos: "left-[6%] top-[6%]" },
    { emoji: "📸", cls: "float-medium", pos: "right-[8%] top-[10%]" },
    { emoji: "❤️", cls: "float-medium", pos: "left-[3%] top-[28%]" },
    { emoji: "🔥", cls: "float-slow",   pos: "right-[4%] top-[32%]" },
    { emoji: "💬", cls: "float-fast",   pos: "left-[8%] top-[44%]" },
    { emoji: "✨", cls: "float-fast",   pos: "left-[14%] top-[62%]" },
    { emoji: "🎬", cls: "float-slow",   pos: "right-[14%] top-[66%]" },
    { emoji: "💎", cls: "float-medium", pos: "right-[18%] top-[82%]" },
  ],
  academy: [
    { emoji: "📚", cls: "float-slow",   pos: "left-[6%] top-[6%]" },
    { emoji: "🎓", cls: "float-medium", pos: "right-[8%] top-[10%]" },
    { emoji: "💡", cls: "float-medium", pos: "left-[3%] top-[28%]" },
    { emoji: "🧠", cls: "float-slow",   pos: "right-[4%] top-[32%]" },
    { emoji: "🏆", cls: "float-fast",   pos: "left-[8%] top-[44%]" },
    { emoji: "✨", cls: "float-fast",   pos: "left-[14%] top-[62%]" },
    { emoji: "🚀", cls: "float-slow",   pos: "right-[14%] top-[66%]" },
    { emoji: "📝", cls: "float-medium", pos: "right-[18%] top-[82%]" },
  ],
  apply: [
    { emoji: "📝", cls: "float-slow",   pos: "left-[6%] top-[6%]" },
    { emoji: "✨", cls: "float-medium", pos: "right-[8%] top-[10%]" },
    { emoji: "🚀", cls: "float-medium", pos: "left-[3%] top-[28%]" },
    { emoji: "💡", cls: "float-slow",   pos: "right-[4%] top-[32%]" },
    { emoji: "🎯", cls: "float-fast",   pos: "left-[8%] top-[44%]" },
    { emoji: "🌟", cls: "float-fast",   pos: "left-[14%] top-[62%]" },
    { emoji: "💼", cls: "float-slow",   pos: "right-[14%] top-[66%]" },
    { emoji: "🎉", cls: "float-medium", pos: "right-[18%] top-[82%]" },
  ],
  test: [
    { emoji: "🧠", cls: "float-slow",   pos: "left-[6%] top-[6%]" },
    { emoji: "💡", cls: "float-medium", pos: "right-[8%] top-[10%]" },
    { emoji: "✅", cls: "float-medium", pos: "left-[3%] top-[28%]" },
    { emoji: "📝", cls: "float-slow",   pos: "right-[4%] top-[32%]" },
    { emoji: "🎯", cls: "float-fast",   pos: "left-[8%] top-[44%]" },
    { emoji: "🏆", cls: "float-fast",   pos: "left-[14%] top-[62%]" },
    { emoji: "✨", cls: "float-slow",   pos: "right-[14%] top-[66%]" },
    { emoji: "🚀", cls: "float-medium", pos: "right-[18%] top-[82%]" },
  ],
  training: [
    { emoji: "📚", cls: "float-slow",   pos: "left-[6%] top-[6%]" },
    { emoji: "💻", cls: "float-medium", pos: "right-[8%] top-[10%]" },
    { emoji: "🚀", cls: "float-medium", pos: "left-[3%] top-[28%]" },
    { emoji: "🎓", cls: "float-slow",   pos: "right-[4%] top-[32%]" },
    { emoji: "💡", cls: "float-fast",   pos: "left-[8%] top-[44%]" },
    { emoji: "🏆", cls: "float-fast",   pos: "left-[14%] top-[62%]" },
    { emoji: "✨", cls: "float-slow",   pos: "right-[14%] top-[66%]" },
    { emoji: "🌟", cls: "float-medium", pos: "right-[18%] top-[82%]" },
  ],
};

// Gradient glow combos per variant
const GLOWS: Record<Variant, string> = {
  default:    "radial-gradient(circle_at_top_left,#22d3ee66,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf655,transparent_35%),radial-gradient(circle_at_bottom,#0ea5e955,transparent_30%)",
  careers:    "radial-gradient(circle_at_top_left,#22d3ee55,transparent_40%),radial-gradient(circle_at_top_right,#a855f744,transparent_40%),radial-gradient(circle_at_bottom_right,#0ea5e933,transparent_35%)",
  influencer: "radial-gradient(circle_at_top_left,#a855f744,transparent_45%),radial-gradient(circle_at_bottom_right,#ec489933,transparent_45%)",
  academy:    "radial-gradient(circle_at_top_left,#06b6d455,transparent_40%),radial-gradient(circle_at_top_right,#6366f144,transparent_40%),radial-gradient(circle_at_bottom,#8b5cf633,transparent_35%)",
  apply:      "radial-gradient(circle_at_top_left,#22d3ee55,transparent_40%),radial-gradient(circle_at_bottom_right,#a855f744,transparent_40%)",
  test:       "radial-gradient(circle_at_top_left,#6366f155,transparent_40%),radial-gradient(circle_at_top_right,#06b6d444,transparent_40%),radial-gradient(circle_at_bottom,#a855f733,transparent_35%)",
  training:   "radial-gradient(circle_at_top_left,#10b98155,transparent_40%),radial-gradient(circle_at_top_right,#6366f144,transparent_40%),radial-gradient(circle_at_bottom_right,#06b6d433,transparent_35%)",
};

interface Props {
  variant?: Variant;
  grid?: boolean; // show subtle grid overlay (default true)
  glow?: boolean; // show gradient glow layer (default true)
}

export default function PageDoodles({ variant = "default", grid = true, glow = true }: Props) {
  const doodles = SETS[variant];
  const glow    = GLOWS[variant];

  return (
    <>
      {/* Gradient glow layer */}
      {glow && (
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: GLOWS[variant] }}
        />
      )}

      {/* Subtle diagonal grid overlay */}
      {grid && (
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.06] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
            backgroundSize: "34px 34px",
          }}
        />
      )}

      {/* Floating emoji doodles */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {doodles.map((d, i) => (
          <div
            key={i}
            className={`${d.cls} absolute ${d.pos} text-4xl opacity-60 sm:text-5xl`}
          >
            {d.emoji}
          </div>
        ))}
      </div>
    </>
  );
}
