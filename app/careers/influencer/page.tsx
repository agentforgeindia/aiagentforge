"use client";

import Link from "next/link";
import { Star, TrendingUp, Gift, Users, ArrowRight, BadgeCheck } from "lucide-react";
import { useTheme } from "@/app/components/ThemeProvider";

const PERKS = [
  { Icon: TrendingUp, title: "10% Commission",       desc: "Earn on every purchase made through your unique referral link — no cap." },
  { Icon: Gift,       title: "Real-time Tracking",   desc: "See your earnings, pending amounts and paid commissions on your dashboard." },
  { Icon: Users,      title: "Brand Collabs",        desc: "Top partners get featured campaigns, exclusive deals and monthly collaboration reviews." },
  { Icon: BadgeCheck, title: "AI-Scored Profile",    desc: "Our AI analyses your reach and eligibility — no manual review wait." },
];

const STEPS = [
  { num: "01", title: "Apply",         desc: "Fill a short form — your name, mobile, and social media links." },
  { num: "02", title: "AI Review",     desc: "Our AI instantly scores your reach, followers and engagement." },
  { num: "03", title: "Get Your Code", desc: "If eligible, your unique referral code appears on screen immediately." },
  { num: "04", title: "Share & Earn",  desc: "Share your link anywhere — Instagram, YouTube, WhatsApp. Earn 10% per sale." },
];

const PLATFORMS = [
  { icon: "📸", name: "Instagram",  color: "from-pink-400 to-rose-500" },
  { icon: "▶️", name: "YouTube",    color: "from-rose-500 to-red-600" },
  { icon: "👥", name: "Facebook",   color: "from-blue-400 to-blue-600" },
  { icon: "🔗", name: "Any other",  color: "from-slate-400 to-slate-600" },
];

const FAQS = [
  { q: "Who can apply?",                   a: "Any content creator with a social media following — Instagram, YouTube, Facebook, or any other platform. Minimum follower count helps, but engagement and niche matter too." },
  { q: "How is my profile scored?",         a: "Our AI looks at number of platforms, follower count, average views, and content niche. A score of 50 or above out of 100 qualifies you for the referral programme." },
  { q: "When do I get my referral code?",   a: "Instantly — right after you apply and accept the referral proposal on screen. No waiting for manual approval." },
  { q: "How do I track my earnings?",       a: "Go to /careers/referral, enter your referral code, and see all transactions, pending amounts, and paid commissions in real time." },
  { q: "When does commission get paid?",    a: "Commission clears within 48 hours of a confirmed purchase. Payments are processed monthly." },
  { q: "Is there a minimum payout?",        a: "Payouts are processed monthly. Our team will confirm your payment details after you qualify." },
];

export default function InfluencerPage() {
  const { darkMode } = useTheme();
  const card = darkMode ? "border-white/10 bg-white/[0.05]" : "border-black/10 bg-white/80";

  return (
    <main className="relative min-h-screen bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#f472b644,transparent_40%),radial-gradient(circle_at_top_right,#8b5cf633,transparent_40%)]" />

      <div className="relative z-10 mx-auto max-w-4xl px-5 py-20">

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
            Partner with AgentForge AI. Share your link. Earn <b>10% commission</b> on every purchase.
            No investment. No minimum followers. Just real reach.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/careers/apply?role=content-creator"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-4 text-sm font-black text-white shadow-xl shadow-pink-500/30 transition hover:scale-[1.03] active:scale-95">
              <Star className="h-4 w-4" /> Apply Now — It&apos;s Free
            </Link>
            <Link href="/careers/referral"
              className={`inline-flex items-center gap-2 rounded-full border px-6 py-4 text-sm font-black transition hover:scale-[1.02] ${card}`}>
              📊 Check My Earnings
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
          <h2 className="mt-2 text-center text-2xl font-black sm:text-3xl">4 steps to your first commission</h2>
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

        {/* Commission highlight */}
        <div className="mt-16 overflow-hidden rounded-[2rem] bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 p-10 text-center text-white shadow-2xl">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/70">Commission Rate</p>
          <p className="mt-2 text-7xl font-black">10%</p>
          <p className="mt-2 text-base font-bold text-white/80">on every purchase through your link — forever</p>
          <p className="mt-4 text-sm font-medium text-white/65">No cap. No expiry. As long as your link is active, you earn.</p>
          <Link href="/careers/apply?role=content-creator"
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
          <p className="mt-2 text-sm font-medium text-black/55 dark:text-white/55">Apply in under 2 minutes. Get your referral code instantly if eligible.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/careers/apply?role=content-creator"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-4 text-sm font-black text-white shadow-xl shadow-pink-500/30 transition hover:scale-[1.03]">
              📸 Apply as Content Creator
            </Link>
            <Link href="/careers/referral"
              className={`inline-flex items-center gap-2 rounded-full border px-6 py-4 text-sm font-black transition hover:scale-[1.02] ${card}`}>
              Already have a code? Track Earnings →
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
