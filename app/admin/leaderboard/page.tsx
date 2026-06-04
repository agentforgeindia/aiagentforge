"use client";

// /admin/leaderboard — Sales Gamification & Leaderboard.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Trophy, Clock, CheckSquare, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls, adminPrimaryBtnCls, adminInputCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type BoardEntry = { rank: number; member_email: string; member_name?: string; revenue?: number; deals?: number; leads_added?: number; days?: number; total_hours?: number; done?: number; pending?: number };
type Badge      = { member_email: string; badge_slug: string; badge_label: string; badge_icon: string; awarded_at: string };
type Data       = { month: string; revenue_board: BoardEntry[]; attendance_board: BoardEntry[]; badges: Badge[]; tasks_board: BoardEntry[] };

const RANK_COLORS = ["from-amber-400 to-amber-600", "from-slate-300 to-slate-500", "from-orange-400 to-orange-600"];
const RANK_MEDALS = ["🥇", "🥈", "🥉"];

const BADGE_PRESETS = [
  { slug: "top_closer",     label: "Top Closer",      icon: "🏆" },
  { slug: "fast_responder", label: "Fast Responder",  icon: "⚡" },
  { slug: "lead_hunter",    label: "Lead Hunter",     icon: "🎯" },
  { slug: "consistent",     label: "Most Consistent", icon: "📅" },
  { slug: "team_player",    label: "Team Player",     icon: "🤝" },
  { slug: "best_closer",    label: "Best Closer",     icon: "🔥" },
];

export default function LeaderboardPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView   = has("team.view");
  const canManage = has("incentives.manage");

  const [data, setData]       = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [refreshKey, setRefreshKey] = useState(0);

  // Award badge state
  const [awardEmail, setAwardEmail]   = useState("");
  const [awardBadge, setAwardBadge]   = useState(BADGE_PRESETS[0].slug);
  const [awardSaving, setAwardSaving] = useState(false);
  const [showAward, setShowAward]     = useState(false);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data: m } = await supabase.rpc("leaderboard_data", { p_month: selectedMonth + "-01" });
      setData(m as Data);
      setLoading(false);
    })();
  }, [canView, selectedMonth, refreshKey]);

  async function awardBadgeToMember() {
    if (!awardEmail) return;
    setAwardSaving(true);
    const preset = BADGE_PRESETS.find((b) => b.slug === awardBadge)!;
    await supabase.from("member_badges").upsert({
      member_email: awardEmail,
      badge_slug:   preset.slug,
      badge_label:  preset.label,
      badge_icon:   preset.icon,
      awarded_by:   email,
      month:        selectedMonth + "-01",
    }, { onConflict: "member_email,badge_slug,month" });
    setAwardEmail(""); setShowAward(false); setAwardSaving(false);
    setRefreshKey((k) => k + 1);
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  return (
    <AdminShell
      breadcrumbs={[{ label: "Leaderboard" }]}
      title="🏆 Leaderboard"
      subtitle="Sales rankings, attendance champions, task closers"
      email={email}
      actions={
        <div className="flex items-center gap-2">
          {canManage && (
            <button type="button" onClick={() => setShowAward((s) => !s)} className={adminPrimaryBtnCls}>
              <Plus className="h-3.5 w-3.5" />Award Badge
            </button>
          )}
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900" />
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : !data ? null : (
        <div className="space-y-4">
          {/* Award badge form */}
          {showAward && canManage && (
            <section className={`${adminCardCls} p-4`}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Award a Badge</p>
              <div className="flex gap-3">
                <input className={`${adminInputCls} flex-1`} placeholder="Member email" value={awardEmail} onChange={(e) => setAwardEmail(e.target.value)} />
                <select className={adminInputCls} value={awardBadge} onChange={(e) => setAwardBadge(e.target.value)}>
                  {BADGE_PRESETS.map((b) => <option key={b.slug} value={b.slug}>{b.icon} {b.label}</option>)}
                </select>
                <button type="button" onClick={awardBadgeToMember} disabled={awardSaving} className={adminPrimaryBtnCls}>
                  {awardSaving ? "Awarding…" : "Award"}
                </button>
              </div>
            </section>
          )}

          {/* Badges */}
          {data.badges.length > 0 && (
            <section className={`${adminCardCls} p-4`}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Badges This Month
              </p>
              <div className="flex flex-wrap gap-2">
                {data.badges.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 dark:border-amber-700/40 dark:bg-amber-500/10">
                    <span className="text-lg">{b.badge_icon}</span>
                    <div>
                      <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">{b.badge_label}</p>
                      <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70">{b.member_email.split("@")[0]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Three boards */}
          <section className="grid gap-4 lg:grid-cols-3">
            {/* Leads Board */}
            <Board
              title="Sales Board"
              icon={<Trophy className="h-4 w-4 text-amber-500" />}
              rows={data.revenue_board.slice(0, 5)}
              renderRow={(r, i) => (
                <div key={r.member_email} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${i < 3 ? "bg-gradient-to-r " + RANK_COLORS[i] + " text-white" : "bg-slate-50 dark:bg-slate-800/40"}`}>
                  <span className="text-lg shrink-0">{i < 3 ? RANK_MEDALS[i] : `#${i+1}`}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-xs font-bold ${i < 3 ? "text-white" : ""}`}>{r.member_email?.split("@")[0] ?? "—"}</p>
                    <p className={`text-[10px] ${i < 3 ? "text-white/70" : adminMutedCls}`}>{r.leads_added ?? 0} leads · {r.deals ?? 0} deals</p>
                  </div>
                </div>
              )}
            />

            {/* Attendance Board */}
            <Board
              title="Hours Board"
              icon={<Clock className="h-4 w-4 text-blue-500" />}
              rows={data.attendance_board.slice(0, 5)}
              renderRow={(r, i) => (
                <div key={r.member_email} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${i < 3 ? "bg-gradient-to-r " + RANK_COLORS[i] + " text-white" : "bg-slate-50 dark:bg-slate-800/40"}`}>
                  <span className="text-lg shrink-0">{i < 3 ? RANK_MEDALS[i] : `#${i+1}`}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-xs font-bold ${i < 3 ? "text-white" : ""}`}>{r.member_name ?? r.member_email?.split("@")[0] ?? "—"}</p>
                    <p className={`text-[10px] ${i < 3 ? "text-white/70" : adminMutedCls}`}>{r.total_hours}h · {r.days} days</p>
                  </div>
                </div>
              )}
            />

            {/* Tasks Board */}
            <Board
              title="Tasks Board"
              icon={<CheckSquare className="h-4 w-4 text-emerald-500" />}
              rows={data.tasks_board.slice(0, 5)}
              renderRow={(r, i) => (
                <div key={r.member_email} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${i < 3 ? "bg-gradient-to-r " + RANK_COLORS[i] + " text-white" : "bg-slate-50 dark:bg-slate-800/40"}`}>
                  <span className="text-lg shrink-0">{i < 3 ? RANK_MEDALS[i] : `#${i+1}`}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-xs font-bold ${i < 3 ? "text-white" : ""}`}>{r.member_email?.split("@")[0] ?? "—"}</p>
                    <p className={`text-[10px] ${i < 3 ? "text-white/70" : adminMutedCls}`}>{r.done ?? 0} done · {r.pending ?? 0} pending</p>
                  </div>
                </div>
              )}
            />
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function Board<T>({ title, icon, rows, renderRow }: { title: string; icon: React.ReactNode; rows: T[]; renderRow: (r: T, i: number) => React.ReactNode }) {
  return (
    <div className={adminCardCls}>
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</p>
      </div>
      <div className="space-y-1.5 p-3">
        {rows.length === 0
          ? <p className={`py-4 text-center text-xs ${adminMutedCls}`}>No data this month.</p>
          : rows.map((r, i) => renderRow(r, i))}
      </div>
    </div>
  );
}

function Loading() { return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">Checking access…</main>; }
function Denied()  {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
        <h1 className="mt-3 text-base font-bold">Access denied</h1>
      </div>
    </main>
  );
}
