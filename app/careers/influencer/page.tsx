"use client";

// /careers/influencer — Influencer Partner Programme landing page

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, TrendingUp, Gift, Users, ArrowRight, BadgeCheck, ExternalLink } from "lucide-react";
import { useTheme } from "@/app/components/ThemeProvider";
import PageDoodles from "@/app/components/PageDoodles";

const PERKS = [
  { Icon: TrendingUp, title: "Earn on Every Sale",    desc: "Earn a commission on every purchase made through your unique referral link — no cap, no expiry." },
  { Icon: Gift,       title: "Real-time Tracking",    desc: "See your signups, purchases and earnings in real time on your personal dashboard." },
  { Icon: Users,      title: "Brand Collabs",         desc: "Top partners get featured campaigns, exclusive deals and monthly collaboration reviews." },
  { Icon: BadgeCheck, title: "AI-Scored Profile",     desc: "Our AI analyses your reach and eligibility — no manual review wait." },
];

const STEPS = [
  { num: "01", title: "Apply",         desc: "Fill a short form — your name, mobile, and social media links." },
  { num: "02", title: "AI Review",     desc: "Our AI instantly scores your reach, followers and engagement." },
  { num: "03", title: "Get Your Code", desc: "If eligible, your unique referral code and dashboard are set up immediately." },
  { num: "04", title: "Share & Earn",  desc: "Share your link anywhere — Instagram, YouTube, WhatsApp. Earn on every sale." },
];

const PLATFORMS = [
  { icon: "📸", name: "Instagram",  color: "from-pink-400 to-rose-500" },
  { icon: "▶️", name: "YouTube",    color: "from-rose-500 to-red-600" },
  { icon: "👥", name: "Facebook",   color: "from-blue-400 to-blue-600" },
  { icon: "🔗", name: "Any other",  color: "from-slate-400 to-slate-600" },
];

const FAQS = [
  { q: "Who can apply?",                   a: "Any content creator with a social media following — Instagram, YouTube, Facebook, or any other platform. Follower count helps, but engagement and niche matter too." },
  { q: "How is my profile scored?",         a: "Our AI looks at number of platforms, follower count, average views, and content niche. Qualifying creators get their referral code immediately." },
  { q: "When do I get my referral code?",   a: "Right after you apply and get approved. Our team reviews your application and activates your referral programme." },
  { q: "How do I track my earnings?",       a: "Log in to your personal Influencer Dashboard. You'll see all signups, purchases and earnings in real time." },
  { q: "When does commission get paid?",    a: "Payments are processed monthly. Our team will confirm your payment details once you are approved." },
  { q: "Is there a minimum payout?",        a: "Our team will share payout details directly with you once you join. Everything is explained in your dashboard." },
];

export default function InfluencerPage() {
  const { darkMode } = useTheme();
  const router = useRouter();
  const card = darkMode ? "border-white/10 bg-white/[0.05]" : "border-black/10 bg-white/80";

  const [showAccessForm, setShowAccessForm] = useState(false);
  const [email, setEmail] = useState("");
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setAccessLoading(true);
    setAccessError(null);
    try {
      const res = await fetch("/api/careers/influencer/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const d = await res.json();
      if (d.ok) {
        router.push(`/careers/influencer/dashboard?cid=${d.cid}`);
      } else {
        setAccessError(d.error ?? "Something went wrong.");
      }
    } catch {
      setAccessError("Network error. Please try again.");
    }
    setAccessLoading(false);
  }

  return (
    <main className="relative min-h-screen bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#f472b644,transparent_40%),radial-gradient(circle_at_top_right,#8b5cf633,transparent_40%)]" />

      <div className="relative z-10 mx-auto max-w-4xl px-5 py-20">

        {/* ── Already a partner banner ── */}
        <div className={`mb-10 flex flex-col items-center justify-between gap-4 rounded-2xl border p-4 sm:flex-row ${card}`}>
          <div>
            <p className="text-sm font-black">Already an AgentForge Influencer?</p>
            <p className="text-xs text-black/55 dark:text-white/45">Access your dashboard, scripts, earnings and referral link.</p>
          </div>
          {!showAccessForm ? (
            <button
              onClick={() => setShowAccessForm(true)}
              className="shrink-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2.5 text-xs font-black text-white shadow transition hover:scale-[1.02]"
            >
              Go to My Dashboard →
            </button>
          ) : (
            <form onSubmit={handleLookup} className="flex w-full max-w-sm items-center gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 placeholder-black/30 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-white/25"
              />
              <button type="submit" disabled={accessLoading}
                className="shrink-0 rounded-full bg-purple-600 px-5 py-2.5 text-xs font-black text-white transition hover:bg-purple-500 disabled:opacity-50">
                {accessLoading ? "…" : "Go →"}
              </button>
            </form>
          )}
        </div>
        {accessError && (
          <div className="mb-4 -mt-6 rounded-xl border border-rose-400/30 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            {accessError}
          </div>
        )}

        {/* Hero */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-300/60 bg-white/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-pink-700 shadow-md backdrop-blur dark:border-pink-400/30 dark:bg-white/10 dark:text-pink-300">
            🌟 Influencer Partner Programme
          </div>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl md:text-6xl">
            Turn your{" "}
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              audience
            </span>
            <br />into income.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-relaxed text-black/60 dark:text-white/60">
            Partner with AgentForge AI. Share your link. Earn commission on every purchase through your referral.
            No investment. No minimum followers. Just real reach.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/careers/apply?role=content_creator"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-4 text-sm font-black text-white shadow-xl shadow-pink-500/30 transition hover:scale-[1.03] active:scale-95">
              <Star className="h-4 w-4" /> Apply Now — It&apos;s Free
            </Link>
            <Link href="/influencer-hub"
              className={`inline-flex items-center gap-2 rounded-full border px-6 py-4 text-sm font-black transition hover:scale-[1.02] ${card}`}>
              <ExternalLink className="h-4 w-4" /> Influencer Hub
            </Link>
          </div>

          {/* Platform pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {PLATFORMS.map((p) => (
              <span key={p.name} className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${p.color} px-3 py-1 text-xs font-black text-white shadow`}>
                {p.icon} {p.name}
              </span>
            ))}
          </div>
        </div>

        {/* Perks */}
        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map((p) => (
            <div key={p.title} className={`rounded-2xl border p-5 backdrop-blur ${card}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-purple-600 text-white shadow">
                <p.Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-black">{p.title}</p>
              <p className="mt-1 text-[12px] font-medium leading-relaxed text-black/55 dark:text-white/50">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-20">
          <p className="text-center text-[11px] font-black uppercase tracking-[0.28em] text-pink-600">How It Works</p>
          <h2 className="mt-2 text-center text-2xl font-black sm:text-3xl">4 steps to start earning</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.num} className={`relative rounded-2xl border p-5 backdrop-blur ${card}`}>
                <p className="text-4xl font-black text-pink-500/20">{s.num}</p>
                <p className="mt-2 text-sm font-black">{s.title}</p>
                <p className="mt-1 text-[12px] font-medium leading-relaxed text-black/55 dark:text-white/50">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Earn highlight */}
        <div className="mt-16 overflow-hidden rounded-[2rem] bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 p-10 text-center text-white shadow-2xl">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/70">Your Earning Potential</p>
          <p className="mt-2 text-5xl font-black">Earn Every Month</p>
          <p className="mt-3 text-base font-bold text-white/80">Commission on every purchase — forever, no cap</p>
          <p className="mt-3 text-sm font-medium text-white/65">Share once. Earn as long as your link stays active. Commission rates are shared with approved partners.</p>
          <Link href="/careers/apply?role=content_creator"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-black text-purple-700 shadow-xl transition hover:scale-[1.03]">
            Get My Referral Code <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Platforms detail */}
        <div className="mt-20">
          <p className="text-center text-[11px] font-black uppercase tracking-[0.28em] text-pink-600">Supported Platforms</p>
          <h2 className="mt-2 text-center text-2xl font-black">We accept creators from all major platforms</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { icon: "📸", name: "Instagram", desc: "Reels, stories, posts — any format works. Niche creators with strong engagement qualify easily." },
              { icon: "▶️", name: "YouTube",   desc: "Long-form, shorts, tutorials — if your audience is engaged, you qualify." },
              { icon: "👥", name: "Facebook",  desc: "Pages, groups, and personal profiles with active reach are all accepted." },
              { icon: "🔗", name: "LinkedIn / Twitter / Others", desc: "Any platform with an active audience — blogs, newsletters, podcasts too." },
            ].map((pl) => (
              <div key={pl.name} className={`flex gap-4 rounded-2xl border p-5 backdrop-blur ${card}`}>
                <span className="text-3xl">{pl.icon}</span>
                <div>
                  <p className="font-black">{pl.name}</p>
                  <p className="mt-0.5 text-[12px] font-medium leading-relaxed text-black/55 dark:text-white/50">{pl.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <p className="text-center text-[11px] font-black uppercase tracking-[0.28em] text-pink-600">FAQ</p>
          <h2 className="mt-2 text-center text-2xl font-black">Common Questions</h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((f) => (
              <div key={f.q} className={`rounded-2xl border p-5 backdrop-blur ${card}`}>
                <p className="text-sm font-black">{f.q}</p>
                <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-black/60 dark:text-white/55">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-black sm:text-3xl">Ready to start earning?</h2>
          <p className="mt-2 text-sm font-medium text-black/55 dark:text-white/55">Apply in under 2 minutes.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/careers/apply?role=content_creator"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-4 text-sm font-black text-white shadow-xl shadow-pink-500/30 transition hover:scale-[1.03]">
              📸 Apply as Content Creator
            </Link>
            <Link href="/influencer-hub"
              className={`inline-flex items-center gap-2 rounded-full border px-6 py-4 text-sm font-black transition hover:scale-[1.02] ${card}`}>
              🌟 Browse Influencer Hub →
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
