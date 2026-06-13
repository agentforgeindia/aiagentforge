"use client";

export type SlotInfo = { date: string; ordinal: string; community: string; time: string; day: string };

export const SLOT_COMMUNITIES: Record<string, SlotInfo> = {
  "20-june": {
    date: "20 June 2026",
    day: "Saturday",
    time: "7:00 PM IST",
    ordinal: "Day 1",
    community: "https://chat.whatsapp.com/F4ZfEeVXEmv2NaTwe4aIbs",
  },
  "21-june": {
    date: "21 June 2026",
    day: "Sunday",
    time: "3:00 PM IST",
    ordinal: "Day 2",
    community: "https://chat.whatsapp.com/FkvRQXy6x6AGZ82L83AY7l",
  },
  "27-june": {
    date: "27 June 2026",
    day: "Saturday",
    time: "7:00 PM IST",
    ordinal: "Day 3",
    community: "https://chat.whatsapp.com/H28rLyxfhXp6ieRc0tlytB",
  },
  "28-june": {
    date: "28 June 2026",
    day: "Sunday",
    time: "3:00 PM IST",
    ordinal: "Day 4",
    community: "https://chat.whatsapp.com/J3MK8J1bEHNJOdoFzYuv6s",
  },
};

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

const DEFAULT_COMMUNITY = "https://chat.whatsapp.com/F4ZfEeVXEmv2NaTwe4aIbs";

export default function ThankYouContent({ slot }: { slot?: string | null }) {
  const slotInfo = resolveSlot(slot);
  const COMMUNITY_LINK = slotInfo?.community ?? DEFAULT_COMMUNITY;

  return (
    <main className="workshop-thankyou-page relative isolate min-h-screen overflow-hidden bg-[#f7fbff]">
      <style jsx global>{`
        @keyframes floatUp {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
          50% { transform: translateY(-18px) rotate(4deg); opacity: 1; }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes scaleIn {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
          0% { transform: translateY(24px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .anim-scale-in { animation: scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        .anim-slide-up { animation: slideUp 0.5s ease both; }
        .anim-slide-up-1 { animation: slideUp 0.5s 0.1s ease both; }
        .anim-slide-up-2 { animation: slideUp 0.5s 0.2s ease both; }
        .anim-slide-up-3 { animation: slideUp 0.5s 0.3s ease both; }
        .anim-slide-up-4 { animation: slideUp 0.5s 0.4s ease both; }
        body:has(.workshop-thankyou-page) header,
        body:has(.workshop-thankyou-page) footer { display: none !important; }
      `}</style>

      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,#a5f3fc33,transparent_45%),radial-gradient(ellipse_at_bottom_right,#c4b5fd33,transparent_45%),linear-gradient(160deg,#f0fffe,#f5f0ff)]" />
        <div className="absolute left-[-10%] top-[-8%] h-[420px] w-[420px] rounded-full bg-cyan-200/30 blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-8%] h-[360px] w-[360px] rounded-full bg-violet-200/30 blur-[80px]" />
      </div>

      {/* Floating textile icons — subtle, small on mobile */}
      {["🧵", "✂️", "👕", "🧶", "🛏️", "🧺"].map((icon, i) => (
        <div
          key={i}
          className="pointer-events-none fixed hidden rounded-2xl bg-white/70 p-3 text-2xl shadow-lg backdrop-blur-sm md:block"
          style={{
            left: `${[6, 88, 4, 92, 12, 85][i]}%`,
            top: `${[10, 15, 60, 55, 82, 78][i]}%`,
            animation: `floatUp ${10 + i * 1.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.8}s`,
          }}
        >
          {icon}
        </div>
      ))}

      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-10 sm:px-6">

        {/* ✅ Success badge */}
        <div className="anim-scale-in mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-2xl shadow-green-300/50 sm:h-24 sm:w-24">
          <svg className="h-10 w-10 text-white sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Heading */}
        <div className="anim-slide-up text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-600 sm:text-sm">
            Payment Successful
          </p>
          <h1 className="mt-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl md:text-6xl">
            You&apos;re In! 🎉
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base font-medium leading-7 text-slate-500 sm:text-lg">
            Your seat is confirmed for India&apos;s AI Textile Workshop.
          </p>
        </div>

        {/* Slot pill */}
        {slotInfo && (
          <div className="anim-slide-up-1 mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-violet-700 sm:text-sm">
              {slotInfo.ordinal}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm sm:text-sm">
              📅 {slotInfo.date} · {slotInfo.day}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm sm:text-sm">
              🕐 {slotInfo.time}
            </span>
          </div>
        )}

        {/* What's next card */}
        <div className="anim-slide-up-2 mt-8 w-full rounded-3xl border border-cyan-100 bg-white/80 p-6 shadow-xl shadow-cyan-100/40 backdrop-blur-sm sm:p-8">
          <h2 className="text-lg font-black text-slate-800 sm:text-xl">
            Important Next Step
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Join the WhatsApp community to get your workshop link & updates
          </p>

          <div className="mt-5 space-y-3">
            {[
              { icon: "🔗", text: "Workshop joining link (shared 30 min before)" },
              { icon: "📅", text: "Schedule & time reminders" },
              { icon: "🎁", text: "Bonus AI resources & announcements" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 sm:items-center"
              >
                <span className="mt-0.5 text-xl sm:mt-0">{item.icon}</span>
                <p className="text-sm font-semibold text-slate-700 sm:text-base">{item.text}</p>
              </div>
            ))}
          </div>

          {/* WhatsApp CTA */}
          <a
            href={COMMUNITY_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 text-sm font-black uppercase tracking-wide text-white shadow-xl shadow-green-200/60 transition hover:scale-[1.02] active:scale-95 sm:text-base"
          >
            <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Join WhatsApp Community
          </a>

          <p className="mt-4 text-center text-xs text-slate-400">
            Workshop details will be shared inside the community
          </p>
        </div>

        {/* Certificate note */}
        <div className="anim-slide-up-3 mt-5 w-full rounded-2xl border border-amber-100 bg-amber-50/80 px-5 py-4 text-center">
          <p className="text-sm font-bold text-amber-700 sm:text-base">
            🏅 Certificate of completion will be given after the workshop
          </p>
        </div>

        {/* Footer note */}
        <div className="anim-slide-up-4 mt-8 text-center">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} AgentForge AI · Powered by Razorpay
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-slate-400">
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-violet-500">Terms</a>
            <span>·</span>
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-violet-500">Privacy</a>
            <span>·</span>
            <a href="/refund-policy" target="_blank" rel="noopener noreferrer" className="hover:text-violet-500">Refund</a>
            <span>·</span>
            <a href="/support" target="_blank" rel="noopener noreferrer" className="hover:text-violet-500">Support</a>
          </div>
        </div>

      </div>
    </main>
  );
}
