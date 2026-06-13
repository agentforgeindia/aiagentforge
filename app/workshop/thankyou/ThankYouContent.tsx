"use client";

// Shared Thank-You UI for the workshop. The day is resolved from EITHER the
// path segment (/workshop/thankyou/21-june — preferred, survives Razorpay's
// own appended query params) OR the legacy ?slot= query param.
export type SlotInfo = { date: string; ordinal: string; community: string };

export const SLOT_COMMUNITIES: Record<string, SlotInfo> = {
  "20-june": {
    date: "20 June 2026 · Saturday · 7:00 PM",
    ordinal: "First",
    community: "https://chat.whatsapp.com/F4ZfEeVXEmv2NaTwe4aIbs",
  },
  "21-june": {
    date: "21 June 2026 · Sunday · 3:00 PM",
    ordinal: "Second",
    community: "https://chat.whatsapp.com/FkvRQXy6x6AGZ82L83AY7l",
  },
  "27-june": {
    date: "27 June 2026 · Saturday · 7:00 PM",
    ordinal: "Third",
    community: "https://chat.whatsapp.com/H28rLyxfhXp6ieRc0tlytB",
  },
  "28-june": {
    date: "28 June 2026 · Sunday · 3:00 PM",
    ordinal: "Fourth",
    community: "https://chat.whatsapp.com/J3MK8J1bEHNJOdoFzYuv6s",
  },
};

// Accept a few friendly aliases so the redirect URL is forgiving.
const SLOT_ALIASES: Record<string, string> = {
  day1: "20-june",
  day2: "21-june",
  day3: "27-june",
  day4: "28-june",
  "20june": "20-june",
  "21june": "21-june",
  "27june": "27-june",
  "28june": "28-june",
};

export function resolveSlot(raw: string | null | undefined): SlotInfo | null {
  if (!raw) return null;
  const key = String(raw).toLowerCase().trim();
  const id = SLOT_COMMUNITIES[key] ? key : SLOT_ALIASES[key];
  return id && SLOT_COMMUNITIES[id] ? SLOT_COMMUNITIES[id] : null;
}

// If the slot can't be resolved we fall back to the Day-1 community.
const DEFAULT_COMMUNITY = "https://chat.whatsapp.com/F4ZfEeVXEmv2NaTwe4aIbs";

const PERKS = [
  { icon: "🔗", text: "Your live workshop joining link" },
  { icon: "🗓️", text: "Schedule, reminders & updates" },
  { icon: "🎁", text: "Bonus AI resources & announcements" },
];

export default function ThankYouContent({ slot }: { slot?: string | null }) {
  const slotInfo = resolveSlot(slot);
  const COMMUNITY_LINK = slotInfo?.community ?? DEFAULT_COMMUNITY;
  const ordinal = slotInfo?.ordinal ?? "First";

  return (
    <main className="workshop-thankyou-page relative isolate flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#fff8e8] px-4 py-8 text-[#111827] sm:py-14">
      {/* Main-website background theme (cream base + cyan/purple glow + grid) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,#22d3ee66,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf655,transparent_35%),radial-gradient(circle_at_bottom,#0ea5e955,transparent_30%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.05))]" />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.10]"
        style={{
          backgroundImage:
            "linear-gradient(45deg, #1f2937 1px, transparent 1px), linear-gradient(-45deg, #1f2937 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />
      {/* floating doodles (main-site style) — hidden on small screens */}
      <div className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden sm:block">
        {["✨", "💎", "🧵", "👕", "📸", "🪡", "💍", "🧣"].map((icon, i) => (
          <div
            key={i}
            className="absolute rounded-2xl bg-white/70 p-3 text-3xl shadow-xl backdrop-blur-md"
            style={{
              left: `${(i * 13 + 4) % 90}%`,
              top: `${(i * 17 + 6) % 84}%`,
              animation: `floatTextile ${11 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.7}s`,
            }}
          >
            {icon}
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes floatTextile {
          0% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(22px, -18px) rotate(4deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        body:has(.workshop-thankyou-page) header,
        body:has(.workshop-thankyou-page) footer {
          display: none !important;
        }
      `}</style>

      <section className="relative z-10 w-full max-w-2xl rounded-[1.8rem] border border-white/70 bg-white/85 p-6 text-center shadow-2xl shadow-blue-200/50 backdrop-blur-2xl sm:rounded-[2.5rem] sm:p-10 md:p-12">
        {/* Success badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 sm:text-xs">
          ✓ Payment Successful
        </div>

        {/* Heading — AgentForge logo gradient (blue → violet) */}
        <h1 className="mt-5 text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
          <span className="bg-gradient-to-tr from-blue-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
            Thank You
          </span>{" "}
          🎉
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-7 text-slate-600 sm:mt-5 sm:text-lg sm:leading-8">
          Your seat for India&apos;s {ordinal}{" "}
          <span className="font-black text-slate-800">TextilePrints to Mockup AI Workshop</span>{" "}
          is reserved.
        </p>

        {/* Slot pill */}
        {slotInfo && (
          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-violet-700 sm:text-sm">
            🗓️ {slotInfo.date}
          </div>
        )}

        {/* Community step */}
        <div className="mt-8 rounded-[1.5rem] border border-cyan-100 bg-gradient-to-br from-cyan-50/80 via-white to-violet-50/60 p-5 text-left shadow-inner sm:mt-10 sm:rounded-[2rem] sm:p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500 sm:text-xs">
            One Last Step
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-900 sm:text-2xl">
            Join the WhatsApp Community
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            All workshop details are shared <span className="font-bold">only</span> inside the
            community. Join now so you don&apos;t miss anything:
          </p>

          <div className="mt-5 grid gap-2.5">
            {PERKS.map((perk) => (
              <div
                key={perk.text}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm sm:p-4"
              >
                <span className="text-xl sm:text-2xl">{perk.icon}</span>
                <p className="text-sm font-bold text-slate-800 sm:text-[15px]">{perk.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <a
          href={COMMUNITY_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 px-6 py-4 text-sm font-black uppercase tracking-[0.1em] text-white shadow-xl shadow-green-200/70 transition hover:scale-[1.02] active:scale-95 sm:py-5 sm:text-base"
        >
          Join WhatsApp Community →
        </a>
        <p className="mt-4 text-xs font-semibold text-slate-500 sm:text-sm">
          See you at the workshop! Add the date to your calendar.
        </p>
      </section>
    </main>
  );
}
