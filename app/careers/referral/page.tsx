"use client";

// /careers/referral — Content Creator referral tracking page.
// Enter referral code → see earnings, commissions, pending amounts.

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, TrendingUp, Clock, CheckCircle2, IndianRupee } from "lucide-react";

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
  pending: { label: "Pending",  cls: "bg-amber-100 text-amber-700",  Icon: Clock },
  cleared: { label: "Cleared",  cls: "bg-blue-100 text-blue-700",    Icon: CheckCircle2 },
  paid:    { label: "Paid",     cls: "bg-emerald-100 text-emerald-700", Icon: IndianRupee },
};

export default function ReferralPage() {
  const [code, setCode]       = useState("");
  const [earnings, setEarnings] = useState<Earning[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function lookup() {
    if (!code.trim()) return;
    setLoading(true); setError(null); setEarnings(null);
    const { data, error: err } = await supabase
      .from("referral_earnings")
      .select("*")
      .eq("referral_code", code.trim().toUpperCase())
      .order("created_at", { ascending: false });

    setLoading(false);
    if (err) { setError("Kuch galat hua. Dobara try karo."); return; }
    if (!data || data.length === 0) {
      setError("Is referral code se koi earnings nahi mili. Code check karo."); return;
    }
    setEarnings(data as Earning[]);
  }

  const totalEarned   = earnings?.reduce((s, e) => s + (e.commission_amount ?? 0), 0) ?? 0;
  const totalPending  = earnings?.filter(e => e.status === "pending").reduce((s, e) => s + (e.commission_amount ?? 0), 0) ?? 0;
  const totalPaid     = earnings?.filter(e => e.status === "paid").reduce((s, e) => s + (e.commission_amount ?? 0), 0) ?? 0;

  return (
    <main className="relative min-h-screen bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee44,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf633,transparent_35%)]" />

      <div className="relative z-10 mx-auto max-w-2xl px-5 py-14">
        <span className="inline-flex items-center gap-2 rounded-full border border-purple-300/60 bg-white/80 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-purple-700 shadow-md backdrop-blur dark:border-purple-400/30 dark:bg-white/10 dark:text-purple-200">
          🔗 Referral Tracker
        </span>
        <h1 className="mt-4 text-3xl font-black">
          Apni <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Earnings</span> Track Karo
        </h1>
        <p className="mt-2 text-sm font-medium text-black/55 dark:text-white/55">
          Apna unique referral code enter karo aur dekho kitne logo ne aapke link se purchase kiya hai.
          Har purchase pe <b>10% commission</b> milta hai. 48-hour clearing period hota hai.
        </p>

        {/* Search */}
        <div className="mt-8 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            placeholder="Apna Referral Code daalo (e.g. AFRAHUL1234)"
            className="flex-1 rounded-xl border border-cyan-200/50 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          <button onClick={lookup} disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-50">
            <Search className="h-4 w-4" />
            {loading ? "…" : "Check"}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm font-bold text-rose-600">{error}</p>
        )}

        {earnings && (
          <>
            {/* Summary cards */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <SummaryCard label="Total Earned" amount={totalEarned} color="from-purple-400 to-pink-500" Icon={TrendingUp} />
              <SummaryCard label="Pending (48h)" amount={totalPending} color="from-amber-400 to-orange-500" Icon={Clock} />
              <SummaryCard label="Paid Out" amount={totalPaid} color="from-emerald-400 to-emerald-600" Icon={CheckCircle2} />
            </div>

            <p className="mt-2 text-[10px] font-bold text-black/40 dark:text-white/30">
              * Pending amounts are cleared within 48 hours of customer purchase. Commission is 10% of each purchase.
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
                          {new Date(e.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
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

        {/* Info box */}
        <div className="mt-10 rounded-2xl border border-purple-200/50 bg-purple-50/60 p-5 dark:border-purple-400/20 dark:bg-purple-500/5">
          <p className="text-sm font-black text-purple-800 dark:text-purple-200">How Referral Works</p>
          <ul className="mt-3 space-y-2 text-sm font-medium text-black/70 dark:text-white/70">
            <li>🔗 Aapka unique referral link share karo social media pe</li>
            <li>💰 Har purchase pe 10% commission aapke account mein aata hai</li>
            <li>⏱️ 48 hours ka clearing period hota hai (payment confirm hone tak)</li>
            <li>📊 Is page pe apna code daalo aur sab track karo</li>
            <li>📞 Har month hamar team review karegi — accha performance = collaboration continue!</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({ label, amount, color, Icon }: { label: string; amount: number; color: string; Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-cyan-200/40 bg-white/85 p-4 shadow-md backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.05]">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-[11px] font-black uppercase tracking-wider text-black/50 dark:text-white/50">{label}</p>
      <p className="mt-1 text-xl font-black">₹{amount.toLocaleString("en-IN")}</p>
    </div>
  );
}
