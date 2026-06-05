"use client";

// /admin/sales-room — Sales War Room. Ranks, sales, incentives,
// kudos, daily/weekly achievers, targets. No personal info shown.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Trophy, Flame, Megaphone, Target, IndianRupee, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls, adminPrimaryBtnCls, adminInputCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Agent = {
  member: string; display: string; sales_today: number; sales_week: number;
  sales_month: number; leads_month: number; incentive: number; kudos: number; rank: number;
};
type Target = { label: string; per_day: number; bonus: string };
type Data = {
  agents: Agent[]; daily_achiever: string | null; weekly_achiever: string | null;
  targets: Target[]; error?: string;
};

export default function SalesRoomPage() {
  const { loading: pLoading, isAdmin, email } = useAdminPermissions();

  const [data, setData]       = useState<Data | null>(null);
  const [mine, setMine]       = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [pinging, setPinging] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    (async () => {
      const [{ data: d }, { data: m }] = await Promise.all([
        supabase.rpc("sales_room_stats"),
        supabase.rpc("my_sales_earnings"),
      ]);
      setData(d as Data);
      setMine(m);
      setLoading(false);
    })();
  }, [isAdmin, refreshKey]);

  async function giveKudos(toEmail: string) {
    const emoji = "👏";
    await supabase.from("sales_kudos").insert({ from_email: email, to_email: toEmail, emoji });
    setRefreshKey((k) => k + 1);
  }

  async function pingHeadOffice() {
    const msg = prompt("Emergency message for Founder/Admin:");
    if (!msg) return;
    setPinging(true);
    await supabase.rpc("ping_head_office", { p_message: msg });
    setPinging(false);
    alert("Ping sent to Head Office 🚨");
  }

  if (pLoading) return <Loading />;
  if (!isAdmin)  return <Denied />;

  const agents = data?.agents ?? [];
  const visible = showAll ? agents : agents.slice(0, 10);

  return (
    <AdminShell
      breadcrumbs={[{ label: "Sales Room" }]}
      title="🏆 Sales War Room"
      subtitle="Live ranks, sales, incentives — cheer your team!"
      email={email}
      actions={
        <div className="flex gap-2">
          <button type="button" onClick={pingHeadOffice} disabled={pinging}
            className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50">
            <Megaphone className="h-3.5 w-3.5" />Ping Head Office
          </button>
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : (
        <div className="space-y-4">
          {/* My earnings */}
          {mine && !mine.error && (
            <section className="rounded-xl bg-gradient-to-br from-slate-900 to-[#0e1117] p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-300">My Performance This Month</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Mini label="My Sales"      value={mine.sales_month}  color="text-emerald-400" />
                <Mini label="My Leads"      value={mine.leads_month}  color="text-sky-400" />
                <Mini label="Incentive"     value={`₹${(mine.incentive ?? 0).toLocaleString("en-IN")}`} color="text-amber-400" />
                <Mini label="Kudos"         value={`${mine.kudos} 👏`} color="text-pink-400" />
                <Mini label="Base Salary"   value={mine.base_salary ? `₹${Number(mine.base_salary).toLocaleString("en-IN")}` : "—"} color="text-white" />
              </div>
            </section>
          )}

          {/* Achievers + targets */}
          <section className="grid gap-3 sm:grid-cols-3">
            <div className={`${adminCardCls} flex items-center gap-3 p-4`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/10"><Flame className="h-5 w-5" /></span>
              <div><p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>Daily Achiever</p><p className="text-sm font-black capitalize">{data?.daily_achiever ?? "—"}</p></div>
            </div>
            <div className={`${adminCardCls} flex items-center gap-3 p-4`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10"><Trophy className="h-5 w-5" /></span>
              <div><p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>Weekly Achiever</p><p className="text-sm font-black capitalize">{data?.weekly_achiever ?? "—"}</p></div>
            </div>
            <div className={`${adminCardCls} p-4`}>
              <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}><Target className="h-3.5 w-3.5" />Targets &amp; Bonus</p>
              <div className="mt-1.5 space-y-0.5">
                {(data?.targets ?? []).map((t) => (
                  <p key={t.label} className="text-[11px]"><span className="font-bold">{t.label}:</span> {t.per_day}/day → <span className="text-emerald-600 dark:text-emerald-300">{t.bonus}</span></p>
                ))}
              </div>
            </div>
          </section>

          {/* Leaderboard cards */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Team Leaderboard</p>
              {agents.length > 10 && (
                <button type="button" onClick={() => setShowAll((s) => !s)} className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300">
                  {showAll ? "Show top 10" : `Show all (${agents.length})`}
                </button>
              )}
            </div>
            {agents.length === 0 ? (
              <div className={`${adminCardCls} p-10 text-center`}><p className={`text-sm ${adminMutedCls}`}>No sales activity yet. Assign leads to start.</p></div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {visible.map((a) => (
                  <div key={a.member} className={`${adminCardCls} flex items-center gap-3 p-3`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${a.rank===1?"bg-amber-400 text-white":a.rank===2?"bg-slate-300 text-white":a.rank===3?"bg-orange-400 text-white":"bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>
                      {a.rank <= 3 ? ["🥇","🥈","🥉"][a.rank-1] : a.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black capitalize">{a.display}</p>
                      <p className={`text-[11px] ${adminMutedCls}`}>{a.sales_month} sales · ₹{a.incentive.toLocaleString("en-IN")} incentive · {a.kudos} 👏</p>
                    </div>
                    <button type="button" onClick={() => giveKudos(a.member)} title="Appreciate"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600 transition hover:scale-110 dark:bg-pink-500/10 dark:text-pink-300">
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function Mini({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div>
      <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
    </div>
  );
}

function Loading() { return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">Checking access…</main>; }
function Denied()  {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" /><h1 className="mt-3 text-base font-bold">Access denied</h1>
      </div>
    </main>
  );
}
