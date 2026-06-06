"use client";

// /admin/marketing/influencers
// Full influencer management: list, stats, script upload, video approvals

import { useEffect, useState } from "react";
import { Users, IndianRupee, ShoppingBag, Plus, X, Check, ExternalLink, RefreshCw } from "lucide-react";
import AdminShell, {
  adminCardCls, adminMutedCls, adminSecondaryBtnCls, adminInputCls, adminPrimaryBtnCls,
} from "../../AdminShell";
import { useAdminPermissions } from "../../AdminPermissions";
import { supabase } from "@/lib/supabase";

type Influencer = {
  candidate_id: string; name: string; email: string; mobile: string;
  referral_code: string; referral_status: string; stage: string;
  instagram_url?: string; youtube_url?: string; followers_count?: string;
  niche?: string; ai_score?: number; total_signups: number;
  total_purchases: number; total_earnings: number;
  videos_submitted: number; videos_approved: number; created_at: string;
};

type Script = {
  id: string; title: string; description?: string; script_text: string;
  video_ref?: string; status: string; created_at: string;
};

type PendingVideo = {
  id: string; candidate_id: string; script_id?: string;
  video_url: string; platform?: string; caption?: string;
  status: string; created_at: string;
};

export default function InfluencerAdminPage() {
  const { loading: pLoading, has } = useAdminPermissions();
  const canView = has("marketing.view");

  const [tab, setTab] = useState<"influencers" | "scripts" | "videos">("influencers");
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [pendingVideos, setPendingVideos] = useState<PendingVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const [showScriptForm, setShowScriptForm] = useState(false);
  const [scriptForm, setScriptForm] = useState({ title: "", description: "", script_text: "", video_ref: "" });
  const [scriptSaving, setScriptSaving] = useState(false);

  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState<string | null>(null);

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  }

  async function load() {
    setLoading(true);
    const token = await getToken();
    const res = await fetch("/api/admin/influencers", { headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    if (d.ok) { setInfluencers(d.influencers); setScripts(d.scripts); setPendingVideos(d.pending_videos); }
    setLoading(false);
  }

  useEffect(() => { if (canView) load(); }, [canView]);

  async function saveScript() {
    if (!scriptForm.title || !scriptForm.script_text) return alert("Title and script text are required.");
    setScriptSaving(true);
    const token = await getToken();
    const res = await fetch("/api/admin/influencer-scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(scriptForm),
    });
    const d = await res.json();
    if (d.ok) { setShowScriptForm(false); setScriptForm({ title: "", description: "", script_text: "", video_ref: "" }); await load(); }
    else alert(d.error ?? "Save failed.");
    setScriptSaving(false);
  }

  async function archiveScript(id: string) {
    if (!confirm("Archive this script? Influencers will no longer see it.")) return;
    const token = await getToken();
    await fetch(`/api/admin/influencer-scripts?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    await load();
  }

  async function reviewVideo(id: string, status: "approved" | "rejected") {
    setReviewing(id);
    const token = await getToken();
    await fetch("/api/admin/influencer-videos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status, admin_note: reviewNote[id] ?? "" }),
    });
    setReviewing(null);
    await load();
  }

  const totalSignups   = influencers.reduce((s, i) => s + (i.total_signups ?? 0), 0);
  const totalPurchases = influencers.reduce((s, i) => s + (i.total_purchases ?? 0), 0);
  const totalEarnings  = influencers.reduce((s, i) => s + (i.total_earnings ?? 0), 0);

  const TAB = (t: typeof tab, label: string, badge?: number) => (
    <button onClick={() => setTab(t)}
      className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
        tab === t
          ? "bg-indigo-600 text-white shadow"
          : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
      }`}>
      {label}{badge !== undefined ? ` (${badge})` : ""}
    </button>
  );

  if (pLoading || !canView) return null;

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <AdminShell
      breadcrumbs={[{ label: "Marketing", href: "/admin/marketing" }, { label: "Influencers" }]}
      title="Influencers"
      subtitle="Manage influencers, scripts, video approvals and revenue"
      doodleType="analytics"
    >
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Influencers", value: influencers.length,            icon: <Users className="h-5 w-5 text-indigo-500" /> },
          { label: "Total Signups",     value: totalSignups,                  icon: <Users className="h-5 w-5 text-cyan-500" /> },
          { label: "Total Purchases",   value: totalPurchases,                icon: <ShoppingBag className="h-5 w-5 text-purple-500" /> },
          { label: "Revenue Generated", value: `₹${totalEarnings.toFixed(0)}`, icon: <IndianRupee className="h-5 w-5 text-emerald-500" />, highlight: true },
        ].map(s => (
          <div key={s.label} className={`${adminCardCls} p-4`}>
            {s.icon}
            <p className={`mt-2 text-2xl font-bold tabular-nums ${s.highlight ? "text-emerald-600 dark:text-emerald-300" : "text-slate-800 dark:text-white"}`}>{s.value}</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${adminMutedCls}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs + actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TAB("influencers", "👥 Influencers", influencers.length)}
          {TAB("scripts", "📜 Scripts", scripts.length)}
          {TAB("videos", "🎬 Video Reviews", pendingVideos.length)}
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className={adminSecondaryBtnCls}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          {tab === "scripts" && (
            <button onClick={() => setShowScriptForm(true)} className={adminPrimaryBtnCls}>
              <Plus className="h-3.5 w-3.5" /> New Script
            </button>
          )}
        </div>
      </div>

      {/* ── Influencers Tab ── */}
      {tab === "influencers" && (
        <div className={`${adminCardCls} overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Ref Code</th>
                <th className="px-4 py-3">Niche</th>
                <th className="px-4 py-3 text-right">Signups</th>
                <th className="px-4 py-3 text-right">Purchases</th>
                <th className="px-4 py-3 text-right">Earnings</th>
                <th className="px-4 py-3 text-right">Videos</th>
                <th className="px-4 py-3">Dashboard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={9} className={`px-4 py-8 text-center text-sm ${adminMutedCls}`}>Loading…</td></tr>
              ) : influencers.length === 0 ? (
                <tr><td colSpan={9} className={`px-4 py-8 text-center text-sm ${adminMutedCls}`}>No influencers yet.</td></tr>
              ) : influencers.map(inf => (
                <tr key={inf.candidate_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800 dark:text-white">{inf.name ?? "—"}</p>
                    <p className={`text-[10px] ${adminMutedCls}`}>{fmt(inf.created_at)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-slate-600 dark:text-slate-300">{inf.email ?? "—"}</p>
                    <p className={`text-xs ${adminMutedCls}`}>{inf.mobile ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                      {inf.referral_code ?? "—"}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-xs ${adminMutedCls}`}>{inf.niche ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-200">{inf.total_signups ?? 0}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-200">{inf.total_purchases ?? 0}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-300">₹{(inf.total_earnings ?? 0).toFixed(0)}</td>
                  <td className={`px-4 py-3 text-right text-xs ${adminMutedCls}`}>{inf.videos_approved ?? 0}/{inf.videos_submitted ?? 0}</td>
                  <td className="px-4 py-3">
                    <a href={`/careers/influencer/dashboard?cid=${inf.candidate_id}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400">
                      <ExternalLink className="h-3 w-3" /> View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Scripts Tab ── */}
      {tab === "scripts" && (
        <div className="space-y-3">
          {showScriptForm && (
            <div className={`${adminCardCls} p-4 space-y-3`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700 dark:text-white">New Script</p>
                <button onClick={() => setShowScriptForm(false)} className={adminMutedCls}><X className="h-4 w-4" /></button>
              </div>
              <input className={adminInputCls} placeholder="Script Title *" value={scriptForm.title} onChange={e => setScriptForm(p => ({ ...p, title: e.target.value }))} />
              <input className={adminInputCls} placeholder="Short description (optional)" value={scriptForm.description} onChange={e => setScriptForm(p => ({ ...p, description: e.target.value }))} />
              <textarea className={`${adminInputCls} resize-none`} rows={8} placeholder="Full script text *" value={scriptForm.script_text} onChange={e => setScriptForm(p => ({ ...p, script_text: e.target.value }))} />
              <input className={adminInputCls} placeholder="Reference video URL (optional)" value={scriptForm.video_ref} onChange={e => setScriptForm(p => ({ ...p, video_ref: e.target.value }))} />
              <button onClick={saveScript} disabled={scriptSaving} className={adminPrimaryBtnCls}>
                {scriptSaving ? "Saving…" : "Publish Script →"}
              </button>
            </div>
          )}

          {loading ? (
            <p className={`py-8 text-center text-sm ${adminMutedCls}`}>Loading…</p>
          ) : scripts.length === 0 ? (
            <div className={`${adminCardCls} p-8 text-center text-sm ${adminMutedCls}`}>No scripts yet. Click "New Script" to create one.</div>
          ) : scripts.map(s => (
            <div key={s.id} className={`${adminCardCls} p-4`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-800 dark:text-white">{s.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      s.status === "active"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}>{s.status}</span>
                  </div>
                  {s.description && <p className={`mt-0.5 text-xs ${adminMutedCls}`}>{s.description}</p>}
                  <p className={`mt-1 text-[10px] ${adminMutedCls}`}>{fmt(s.created_at)}</p>
                  {s.video_ref && (
                    <a href={s.video_ref} target="_blank" rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 underline underline-offset-2 dark:text-indigo-300">
                      <ExternalLink className="h-3 w-3" /> Reference video
                    </a>
                  )}
                </div>
                {s.status === "active" && (
                  <button onClick={() => archiveScript(s.id)}
                    className="shrink-0 rounded border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-400 transition hover:border-rose-300 hover:text-rose-500 dark:border-slate-700">
                    Archive
                  </button>
                )}
              </div>
              <details className="mt-3">
                <summary className={`cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300`}>View Script Text</summary>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300" style={{ fontFamily: "inherit" }}>
                  {s.script_text}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}

      {/* ── Video Reviews Tab ── */}
      {tab === "videos" && (
        <div className="space-y-3">
          {loading ? (
            <p className={`py-8 text-center text-sm ${adminMutedCls}`}>Loading…</p>
          ) : pendingVideos.length === 0 ? (
            <div className={`${adminCardCls} p-8 text-center text-sm ${adminMutedCls}`}>No videos pending review. 🎉</div>
          ) : pendingVideos.map(v => (
            <div key={v.id} className={`${adminCardCls} p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">
                    {v.platform ? v.platform.charAt(0).toUpperCase() + v.platform.slice(1) : "Video"} submission
                  </p>
                  {v.caption && <p className={`mt-0.5 text-xs ${adminMutedCls}`}>{v.caption}</p>}
                  <p className={`mt-1 text-[10px] ${adminMutedCls}`}>{fmt(v.created_at)}</p>
                  <a href={v.video_url} target="_blank" rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 underline underline-offset-2 dark:text-indigo-300">
                    <ExternalLink className="h-3.5 w-3.5" /> View Video
                  </a>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">⏳ Pending</span>
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  className={`${adminInputCls} flex-1`}
                  placeholder="Note for influencer (optional)"
                  value={reviewNote[v.id] ?? ""}
                  onChange={e => setReviewNote(p => ({ ...p, [v.id]: e.target.value }))}
                />
                <button onClick={() => reviewVideo(v.id, "approved")} disabled={reviewing === v.id}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-emerald-500 disabled:opacity-50">
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button onClick={() => reviewVideo(v.id, "rejected")} disabled={reviewing === v.id}
                  className="flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-rose-500 disabled:opacity-50">
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
