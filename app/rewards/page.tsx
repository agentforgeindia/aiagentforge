"use client";

// /rewards — customer Rewards & Earnings. Referral code, link,
// stats, and the reward rules.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, Copy, Check, Users, Sparkles, Share2, IndianRupee } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Data = { code: string; link: string; referred_count: number; credits_earned: number; error?: string };

const REWARD_RULES = [
  { icon: "🎁", title: "Refer a friend",     reward: "50 credits", note: "Jab aapke link se koi naya user signup kare." },
  { icon: "🎉", title: "Your friend's bonus", reward: "25 credits", note: "Naye user ko bhi welcome bonus milta hai." },
  { icon: "⭐", title: "Rate your result",    reward: "+1 credit",  note: "Har generation pe rating do." },
  { icon: "✍️", title: "Write feedback",      reward: "+2 credits", note: "Result ke saath feedback likho." },
];

export default function RewardsPage() {
  const [data, setData]   = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) { setLoggedIn(false); setLoading(false); return; }
      const { data: r } = await supabase.rpc("get_my_referral");
      setData(r as Data);
      setLoading(false);
    })();
  }, []);

  function copy(what: "code" | "link", text: string) {
    navigator.clipboard.writeText(text);
    setCopied(what); setTimeout(() => setCopied(null), 1500);
  }

  async function share() {
    if (navigator.share && data) {
      try { await navigator.share({ title: "AgentForge AI", text: "Join AgentForge AI — banao professional product images with AI! Use my link for bonus credits:", url: data.link }); } catch { /* ignore */ }
    } else if (data) { copy("link", data.link); }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee44,transparent_40%),radial-gradient(circle_at_top_right,#8b5cf633,transparent_40%)]" />

      <div className="relative z-10 mx-auto max-w-2xl px-5 py-14">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-white/80 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.28em] text-cyan-700 shadow-md shadow-cyan-300/30 backdrop-blur dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200">
            🎁 Rewards &amp; Earnings
          </span>
          <h1 className="mt-5 text-3xl font-black sm:text-4xl">
            Refer &amp; <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">earn credits</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium text-black/60 dark:text-white/60">
            Apne friends ko AgentForge invite karo. Har signup pe aapko <b>50 credits</b> —
            aur unhe bhi <b>25 bonus credits</b>!
          </p>
        </div>

        {!loggedIn ? (
          <div className="mt-10 rounded-3xl border border-cyan-200/40 bg-white/85 p-8 text-center backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.05]">
            <p className="text-sm font-medium text-black/60 dark:text-white/60">Apna referral link paane ke liye login karein.</p>
            <Link href="/login" className="mt-4 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/30">Login</Link>
          </div>
        ) : loading ? (
          <p className="mt-10 text-center text-sm text-black/50 dark:text-white/50">Loading…</p>
        ) : (
          <>
            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-cyan-200/40 bg-white/85 p-5 text-center backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.05]">
                <Users className="mx-auto h-6 w-6 text-cyan-500" />
                <p className="mt-2 text-3xl font-black tabular-nums">{data?.referred_count ?? 0}</p>
                <p className="text-[11px] font-bold uppercase tracking-wider text-black/45 dark:text-white/45">Friends Referred</p>
              </div>
              <div className="rounded-2xl border border-emerald-200/40 bg-emerald-50/60 p-5 text-center backdrop-blur dark:border-emerald-400/20 dark:bg-emerald-500/5">
                <Sparkles className="mx-auto h-6 w-6 text-emerald-500" />
                <p className="mt-2 text-3xl font-black tabular-nums text-emerald-600 dark:text-emerald-300">{data?.credits_earned ?? 0}</p>
                <p className="text-[11px] font-bold uppercase tracking-wider text-black/45 dark:text-white/45">Credits Earned</p>
              </div>
            </div>

            {/* Referral link */}
            <div className="mt-6 rounded-2xl border border-cyan-200/40 bg-white/85 p-5 backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.05]">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-600">Your Referral Link</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg bg-slate-100 px-3 py-2.5 font-mono text-xs text-slate-700 dark:bg-white/10 dark:text-white/80">{data?.link}</code>
                <button type="button" onClick={() => data && copy("link", data.link)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 hover:bg-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300">
                  {copied === "link" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[11px] font-bold text-black/50 dark:text-white/50">Code: <span className="font-mono text-cyan-700 dark:text-cyan-300">{data?.code}</span></p>
                <button type="button" onClick={share} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2 text-xs font-black text-white shadow-lg shadow-cyan-500/30">
                  <Share2 className="h-3.5 w-3.5" />Share &amp; Earn
                </button>
              </div>
            </div>

            {/* Reward rules */}
            <h2 className="mt-10 text-lg font-black">How to earn rewards</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {REWARD_RULES.map((r) => (
                <div key={r.title} className="flex items-start gap-3 rounded-2xl border border-cyan-200/40 bg-white/80 p-4 backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.05]">
                  <span className="text-2xl">{r.icon}</span>
                  <div>
                    <p className="text-sm font-black">{r.title} <span className="text-emerald-600 dark:text-emerald-300">· {r.reward}</span></p>
                    <p className="mt-0.5 text-[11px] font-medium text-black/50 dark:text-white/50">{r.note}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link href="/billing" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-7 py-3 text-sm font-bold transition hover:scale-105 dark:border-white/15 dark:bg-white/10 dark:text-white">
                <IndianRupee className="h-4 w-4" />View Billing &amp; Credits
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
