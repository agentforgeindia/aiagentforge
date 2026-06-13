"use client";

// Shared Thank-You UI for the workshop. The day is resolved from EITHER the
// path segment (/workshop/thankyou/21-june — preferred, survives Razorpay's
// own appended query params) OR the legacy ?slot= query param.
export type SlotInfo = { date: string; ordinal: string; community: string };

export const SLOT_COMMUNITIES: Record<string, SlotInfo> = {
  "20-june": {
    date: "20 June 2026 (Saturday, 7:00 PM)",
    ordinal: "First",
    community: "https://chat.whatsapp.com/F4ZfEeVXEmv2NaTwe4aIbs",
  },
  "21-june": {
    date: "21 June 2026 (Sunday, 3:00 PM)",
    ordinal: "Second",
    community: "https://chat.whatsapp.com/FkvRQXy6x6AGZ82L83AY7l",
  },
  "27-june": {
    date: "27 June 2026 (Saturday, 7:00 PM)",
    ordinal: "Third",
    community: "https://chat.whatsapp.com/H28rLyxfhXp6ieRc0tlytB",
  },
  "28-june": {
    date: "28 June 2026 (Sunday, 3:00 PM)",
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

export default function ThankYouContent({ slot }: { slot?: string | null }) {
  const slotInfo = resolveSlot(slot);
  const COMMUNITY_LINK = slotInfo?.community ?? DEFAULT_COMMUNITY;
  const ordinal = slotInfo?.ordinal ?? "First";

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-slate-950">
      {/* Premium Workshop Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee20,transparent_30%),radial-gradient(circle_at_top_right,#8b5cf620,transparent_35%),radial-gradient(circle_at_bottom,#f59e0b15,transparent_30%),linear-gradient(180deg,#f7fbff_0%,#eef8ff_55%,#fffaf5_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "radial-gradient(#7dd3fc 1px, transparent 1px), linear-gradient(to right, rgba(125,211,252,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(139,92,246,0.06) 1px, transparent 1px)",
            backgroundSize: "42px 42px, 42px 42px, 42px 42px",
          }}
        />
        {["🧵", "✂️", "🪡", "👕", "🧶", "🧣", "🛏️", "🧥", "👜", "🪢", "👗", "🧺"].map((icon, i) => (
          <div
            key={i}
            className="absolute rounded-[1.8rem] bg-white/80 p-4 text-4xl shadow-2xl backdrop-blur-xl"
            style={{
              left: `${(i * 8) % 92}%`,
              top: `${(i * 11) % 88}%`,
              animation: `floatTextile ${10 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.6}s`,
            }}
          >
            {icon}
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes floatTextile {
          0% {
            transform: translate(0px, 0px) rotate(0deg);
          }
          50% {
            transform: translate(25px, -20px) rotate(4deg);
          }
          100% {
            transform: translate(0px, 0px) rotate(0deg);
          }
        }
        body:has(.workshop-thankyou-page) header,
        body:has(.workshop-thankyou-page) footer {
          display: none !important;
        }
      `}</style>

      <section className="workshop-thankyou-page relative z-10 w-full max-w-4xl overflow-hidden rounded-[2.8rem] border border-white/60 bg-white/90 p-8 text-center shadow-2xl shadow-cyan-100/60 backdrop-blur-xl md:p-14">
        <div className="mb-5 inline-flex rounded-full bg-cyan-50 px-6 py-3 text-xs font-black uppercase tracking-[0.24em] text-cyan-700">
          Workshop Registration Successful
        </div>

        <h1 className="bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-6xl md:text-7xl">
          Thank You 🎉
        </h1>

        <p className="mx-auto mt-5 max-w-3xl text-base font-medium leading-7 text-slate-600 sm:mt-6 sm:text-xl sm:leading-9">
          Thank you for joining India’s {ordinal} TextilePrints to Mockup AI
          Workshop. Your seat has been successfully reserved.
        </p>

        {slotInfo && (
          <div className="mx-auto mt-6 inline-flex rounded-full bg-violet-50 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-violet-700">
            Your Slot: {slotInfo.date}
          </div>
        )}

        <div className="mt-10 rounded-[2.5rem] border border-cyan-100 bg-cyan-50/70 p-7 text-left shadow-inner">
          <h2 className="text-3xl font-black text-slate-950">Important Next Step</h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Join our official WhatsApp community to receive:
          </p>
          <div className="mt-7 grid gap-4">
            {["Workshop joining link", "Workshop schedule & updates", "Bonus AI resources & announcements"].map((item) => (
              <div key={item} className="flex items-center gap-4 rounded-[1.8rem] bg-white p-5 shadow-lg">
                <span className="text-3xl">✅</span>
                <p className="text-lg font-black text-slate-800">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <a
            href={COMMUNITY_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 px-10 py-5 text-sm font-black uppercase tracking-[0.12em] text-white shadow-2xl shadow-green-200/60 transition hover:scale-[1.03]"
          >
            Join WhatsApp Community →
          </a>
          <p className="mt-6 text-base font-semibold text-slate-500">
            Workshop details will be shared inside the community.
          </p>
        </div>
      </section>
    </main>
  );
}
