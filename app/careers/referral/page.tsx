"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Search, TrendingUp, Clock, CheckCircle2, IndianRupee, Copy, Share2 } from "lucide-react";
import PageDoodles from "@/app/components/PageDoodles";

type Earning = {
  id: string;
  order_id: string;
  purchase_amount: number;
  commission_pct: number;
  commission_amount: number;
  status: string;
  cleared_at: string | null;
  created_at: string;
};

const STATUS_MAP: Record<string, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Pending (48h)", cls: "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",    Icon: Clock },
  cleared: { label: "Cleared",       cls: "bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300",        Icon: CheckCircle2 },
  paid:    { label: "Paid",          cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300", Icon: IndianRupee },
};

function ReferralInner() {
  const params = useSearchParams();
  const [code, setCode]         = useState(params.get("code")?.toUpperCase() ?? "");
  const [earnings, setEarnings] = useState<Earning[] | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [copied, setCopied]     = useState(false);

  // Auto-lookup if code comes from URL
  useEffect(() => {
    if (params.get("code")) lookup(params.get("code")!.toUpperCase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function lookup(overrideCode?: string) {
    const c = (overrideCode ?? code).trim().toUpperCase();
    if (!c) return;
    setLoading(true); setError(null); setEarnings(null);
    const { data, error: err } = await supabase
      .from("referral_earnings")
      .select("*")
      .eq("referral_code", c)
      .order("created_at", { ascending: false });

    setLoading(false);
    if (err) { setError("Something went wrong. Please try again."); return; }
    if (!data || data.length === 0) {
      setError("No earnings found for this code. Please check your referral code and try again."); return;
    }
    setEarnings(data as Earning[]);
  }

  const totalEarned  = earnings?.reduce((s, e) => s + (e.commission_amount ?? 0), 0) ?? 0;
  const totalPending = earnings?.filter(e => e.status === "pending").reduce((s, e) => s + (e.commission_amount ?? 0), 0) ?? 0;
  const totalPaid    = earnings?.filter(e => e.status === "paid").reduce((s, e) => s + (e.commission_amount ?? 0), 0) ?? 0;

  const referralLink = code ? `https://aiagentforge.in/?ref=${code}` : "";

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareLink() {
    if (navigator.share && referralLink) {
      navigator.share({ title: "AgentForge — AI Visual Studio", text: "Check out AgentForge AI — use my link!", url: referralLink });
    } else {
      copyLink();
    }
  }

  return (
    <main className="relative min-h-screen bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee44,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf633,transparent_35%)]" />
      <PageDoodles variant="careers" glow={false} grid />

      <div className="relative z-10 mx-auto max-w-2xl px-5 py-14">
        <span className="inline-flex items-center gap-2 rounded-full border border-purple-300/60 bg-white/80 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-purple-700 shadow-md backdrop-blur dark:border-purple-400/30 dark:bg-white/10 dark:text-purple-200">
          🔗 Referral Dashboard
        </span>
        <h1 className="mt-4 text-3xl font-black">
          Your <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Earnings</span>
        </h1>
        <p className="mt-2 text-sm font-medium text-black/55 dark:text-white/55">
          Enter your referral code to see how many purchases were made through your link.
          Earn <b>10% reward</b> on every sale. 48-hour clearing period applies.
        </p>

        {/* Search */}
        <div className="mt-8 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            placeholder="Your referral code (e.g. AFRAHUL1234)"
            className="flex-1 rounded-xl border border-cyan-200/50 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/25 dark:border-white/10 dark:bg-[#0f1a2e] dark:text-white"
          />
          <button onClick={() => lookup()} disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-50">
            <Search className="h-4 w-4" />
            {loading ? "…" : "Check"}
          </button>
        </div>

        {error && <p className="mt-3 text-sm font-bold text-rose-600">{error}</p>}

        {/* Referral Link Share Box — shown once code is entered */}
        {code.length >= 6 && earnings !== null && (
          <div className="mt-6 rounded-2xl border border-purple-200/60 bg-purple-50/60 p-4 dark:border-purple-400/20 dark:bg-purple-500/5">
            <p className="text-[11px] font-black uppercase tracking-widest text-purple-600">Your Referral Link</p>
            <p className="mt-1.5 rounded-xl border border-purple-200/40 bg-white px-3 py-2 text-sm font-mono font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white">
              {referralLink}
            </p>
            <div className="mt-2 flex gap-2">
              <button onClick={copyLink}
                className="flex items-center gap-1.5 rounded-full bg-purple-500 px-4 py-1.5 text-xs font-black text-white transition hover:bg-purple-600">
                <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy Link"}
              </button>
              <button onClick={shareLink}
                className="flex items-center gap-1.5 rounded-full border border-purple-300/50 bg-white px-4 py-1.5 text-xs font-black text-purple-700 transition hover:bg-purple-50 dark:border-purple-400/30 dark:bg-white/10 dark:text-purple-300">
                <Share2 className="h-3 w-3" /> Share
              </button>
            </div>
          </div>
        )}

        {earnings && (
          <>
            {/* Summary cards */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <SummaryCard label="Total Earned"  amount={totalEarned}  color="from-purple-400 to-pink-500"    Icon={TrendingUp} />
              <SummaryCard label="Pending (48h)" amount={totalPending} color="from-amber-400 to-orange-500"   Icon={Clock} />
              <SummaryCard label="Paid Out"      amount={totalPaid}    color="from-emerald-400 to-emerald-600" Icon={CheckCircle2} />
            </div>
            <p className="mt-2 text-[10px] font-bold text-black/40 dark:text-white/30">
              * Pending amounts clear within 48 hours of confirmed sale. Reward = 10% per sale.
            </p>

            {/* Transactions */}
            <div className="mt-6">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-600">Transactions ({earnings.length})</p>
              <div className="mt-3 space-y-2">
                {earnings.map((e) => {
                  const st = STATUS_MAP[e.status] ?? STATUS_MAP.pending;
                  return (
                    <div key={e.id} className="flex items-center justify-between rounded-xl border border-cyan-200/40 bg-white/85 px-4 py-3 shadow-sm backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.05]">
                      <div>
                        <p className="text-sm font-black">₹{e.purchase_amount?.toLocaleString("en-IN")} purchase</p>
                        <p className="text-[11px] font-medium text-black/40 dark:text-white/40">
                          {new Date(e.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-600">+₹{e.commission_amount?.toLocaleString("en-IN")}</p>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${st.cls}`}>
                          <st.Icon className="h-3 w-3" />{st.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* How it works */}
        <div className="mt-10 rounded-2xl border border-purple-200/50 bg-purple-50/60 p-5 dark:border-purple-400/20 dark:bg-purple-500/5">
          <p className="text-sm font-black text-purple-800 dark:text-purple-200">How the Referral Programme Works</p>
          <ul className="mt-3 space-y-2 text-sm font-medium text-black/70 dark:text-white/70">
            <li>🔗 Share your unique referral link on social media, WhatsApp, or anywhere</li>
            <li>💰 Earn 10% reward on every sale made through your link</li>
            <li>⏱️ 48-hour clearing period — reward confirms after payment is verified</li>
            <li>📊 Enter your code on this page anytime to track your earnings</li>
            <li>📞 Monthly reviews — strong performance means continued and upgraded collaboration</li>
          </ul>
        </div>

        {/* Apply box for new influencers */}
        <div className="mt-6 rounded-2xl border border-cyan-200/50 bg-white/80 p-5 text-center shadow-sm backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.05]">
          <p className="text-sm font-black">Not yet a partner?</p>
          <p className="mt-1 text-[11px] font-medium text-black/55 dark:text-white/45">Apply as a Content Creator — our AI will analyse your social media reach and offer you a referral code if eligible.</p>
          <a href="/careers/apply?role=content-creator"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02]">
            Apply as Content Creator →
          </a>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({ label, amount, color, Icon }: { label: string; amount: number; color: string; Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-cyan-200/40 bg-white/85 p-4 shadow-md backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.05]">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-2 text-[11px] font-black uppercase tracking-wider text-black/40 dark:text-white/40">{label}</p>
      <p className="mt-1 text-2xl font-black">₹{amount.toLocaleString("en-IN")}</p>
    </div>
  );
}

export default function ReferralPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">Loading…</div>}>
      <ReferralInner />
    </Suspense>
  );
}
