"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users, GraduationCap, CheckCircle, XCircle, Trophy, IndianRupee,
  Clock, Phone, TrendingUp, Share2, Bot, Headphones, ChevronRight,
  Loader2, BarChart3, RefreshCw,
} from "lucide-react";

type Candidate = {
  id: string; name: string; mobile: string; email: string | null;
  city: string | null; job_category: string | null; status: string;
  assessment_pct: number | null; assessment_done_at: string | null;
  created_at: string;
};

type Overview = {
  total: number; applied: number; training: number;
  active: number; rejected: number; avg_score: number | null; payroll_pending: number;
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  applied:             { label: "Applied",     cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  assessment_pending:  { label: "Assessment",  cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
  training:            { label: "Training",    cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
  active:              { label: "Active",      cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
  rejected:            { label: "Rejected",    cls: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" },
};

const JOB_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  telecaller: Phone, researcher: TrendingUp, social_media: Share2,
  ai_operator: Bot, support: Headphones,
};

export default function AdminAcademyPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: ov }, { data: cands }] = await Promise.all([
      supabase.rpc("academy_overview"),
      supabase.from("academy_candidates").select("*").order("created_at", { ascending: false }),
    ]);
    setOverview(ov as Overview);
    setCandidates(cands || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    await supabase.from("academy_candidates").update({ status }).eq("id", id);
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    setUpdating(null);
  }

  const filtered = candidates.filter(c => {
    const matchStatus = filter === "all" || c.status === filter;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.mobile.includes(search);
    return matchStatus && matchSearch;
  });

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
    </div>
  );

  const ov = overview;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Learn &amp; Earn Academy</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Candidates, training progress aur payroll manage karo</p>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:border-cyan-400 transition-all">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {/* Stats */}
        {ov && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[
              { icon: Users, label: "Total", val: ov.total, cls: "text-slate-600" },
              { icon: Clock, label: "Applied", val: ov.applied, cls: "text-amber-500" },
              { icon: GraduationCap, label: "Training", val: ov.training, cls: "text-blue-500" },
              { icon: CheckCircle, label: "Active", val: ov.active, cls: "text-emerald-500" },
              { icon: XCircle, label: "Rejected", val: ov.rejected, cls: "text-red-500" },
              { icon: Trophy, label: "Avg Score", val: ov.avg_score ? `${ov.avg_score}%` : "–", cls: "text-yellow-500" },
              { icon: IndianRupee, label: "Pending Payroll", val: `₹${(ov.payroll_pending || 0).toLocaleString("en-IN")}`, cls: "text-purple-500" },
            ].map(({ icon: Icon, label, val, cls }) => (
              <div key={label} className="rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 p-4 text-center shadow-sm">
                <Icon className={`mx-auto mb-1 h-5 w-5 ${cls}`} />
                <p className="text-xl font-bold text-slate-900 dark:text-white">{val}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or mobile..."
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-2 text-sm outline-none focus:border-cyan-400 flex-1 min-w-[200px]"
          />
          <div className="flex flex-wrap gap-2">
            {["all", "applied", "assessment_pending", "training", "active", "rejected"].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all capitalize ${filter === s ? "bg-cyan-500 text-white" : "border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-cyan-400"}`}>
                {s === "all" ? "All" : STATUS_LABELS[s]?.label || s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/80 dark:bg-white/5 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Candidate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Applied</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-400">Koi candidate nahi mila</td></tr>
                ) : filtered.map(c => {
                  const JobIcon = c.job_category ? (JOB_ICONS[c.job_category] || BarChart3) : BarChart3;
                  const st = STATUS_LABELS[c.status] || { label: c.status, cls: "bg-slate-100 text-slate-600" };
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-white">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.mobile} {c.city ? `· ${c.city}` : ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <JobIcon className="h-3.5 w-3.5" />
                          <span className="text-xs capitalize">{c.job_category?.replace("_", " ") || "–"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${c.assessment_pct !== null ? (c.assessment_pct >= 50 ? "text-emerald-600" : "text-red-500") : "text-slate-400"}`}>
                          {c.assessment_pct !== null ? `${c.assessment_pct}%` : "–"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {new Date(c.created_at).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {c.status !== "active" && (
                            <button onClick={() => updateStatus(c.id, "active")} disabled={updating === c.id}
                              className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                              {updating === c.id ? "..." : "Activate"}
                            </button>
                          )}
                          {c.status !== "rejected" && (
                            <button onClick={() => updateStatus(c.id, "rejected")} disabled={updating === c.id}
                              className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-500/20 transition-all disabled:opacity-50">
                              Reject
                            </button>
                          )}
                          {c.status !== "training" && c.status !== "rejected" && c.assessment_pct !== null && (
                            <button onClick={() => updateStatus(c.id, "training")} disabled={updating === c.id}
                              className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-500/20 transition-all disabled:opacity-50">
                              Training
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="border-t border-slate-100 dark:border-white/5 px-4 py-3 text-xs text-slate-400">
              {filtered.length} candidates shown
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
