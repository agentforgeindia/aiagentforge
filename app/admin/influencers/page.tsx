"use client";

// /admin/influencers — Full influencer management panel (standalone, not under Marketing)

import { useEffect, useState } from "react";
import {
  RefreshCw, Plus, X, Check, ExternalLink, Trash2,
  Pin, PinOff, Users, ShoppingBag, IndianRupee, Video,
  ThumbsUp, MessageCircle, Eye, FileText, ChevronDown, ChevronUp,
} from "lucide-react";
import AdminShell, {
  adminCardCls, adminMutedCls, adminInputCls,
  adminPrimaryBtnCls, adminSecondaryBtnCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";
import { supabase } from "@/lib/supabase";

// ── Types ────────────────────────────────────────────────────────────────────
type Influencer = {
  candidate_id: string; name: string; email: string; mobile: string;
  referral_code: string; referral_status: string; stage: string;
  instagram_url?: string; youtube_url?: string; twitter_url?: string;
  niche?: string; bio?: string; followers_count?: string;
  total_signups: number; total_purchases: number; total_earnings: number;
  videos_submitted: number; videos_approved: number; created_at: string;
};

type VideoRow = {
  id: string; candidate_id: string; script_id?: string;
  video_url: string; platform?: string; caption?: string;
  status: string; admin_note?: string; is_pinned: boolean;
  view_count: number; created_at: string;
  // joined from candidates
  influencer_name?: string;
};

type Script = {
  id: string; title: string; description?: string; script_text: string;
  video_ref?: string; status: string; created_at: string;
};

type HubComment = {
  id: string; influencer_candidate_id: string; commenter_name: string;
  comment_text: string; created_at: string;
};

type VideoComment = {
  id: string; video_id: string; commenter_name: string;
  comment_text: string; created_at: string;
};

type ReactionRow = { video_id: string; reaction_type: string };

// ── Page ─────────────────────────────────────────────────────────────────────
export default function InfluencerAdminPage() {
  const { loading: pLoading, has } = useAdminPermissions();
  const canView = has("marketing.view");

  const [tab, setTab] = useState<"influencers" | "videos" | "scripts" | "comments">("influencers");
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [videos, setVideos]           = useState<VideoRow[]>([]);
  const [scripts, setScripts]         = useState<Script[]>([]);
  const [hubComments, setHubComments] = useState<HubComment[]>([]);
  const [vidComments, setVidComments] = useState<VideoComment[]>([]);
  const [reactions, setReactions]     = useState<ReactionRow[]>([]);
  const [loading, setLoading]         = useState(true);

  const [showScriptForm, setShowScriptForm] = useState(false);
  const [scriptForm, setScriptForm] = useState({ title: "", description: "", script_text: "", video_ref: "" });
  const [scriptSaving, setScriptSaving] = useState(false);

  const [reviewNote, setReviewNote]   = useState<Record<string, string>>({});
  const [acting, setActing]           = useState<string | null>(null);

  const [expandedInf, setExpandedInf] = useState<string | null>(null);
  const [videoFilter, setVideoFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  }

  async function load() {
    setLoading(true);
    const token = await getToken();

    // Influencers
    const infRes = await fetch("/api/admin/influencers", { headers: { Authorization: `Bearer ${token}` } });
    const infData = await infRes.json();

    // All videos (all statuses) — query directly
    const { data: vids } = await supabase
      .from("influencer_video_submissions")
      .select("*, candidates(name)")
      .order("created_at", { ascending: false });

    // Scripts
    const { data: scr } = await supabase.from("influencer_scripts").select("*").order("created_at", { ascending: false });

    // Comments
    const { data: hc } = await supabase.from("influencer_hub_comments").select("*").order("created_at", { ascending: false });
    const { data: vc } = await supabase.from("influencer_video_comments").select("*").order("created_at", { ascending: false });

    // Reactions
    const { data: rx } = await supabase.from("influencer_video_reactions").select("video_id, reaction_type");

    if (infData.ok) setInfluencers(infData.influencers ?? []);

    setVideos((vids ?? []).map((v: any) => ({
      ...v,
      influencer_name: v.candidates?.name ?? "—",
    })));
    setScripts(scr ?? []);
    setHubComments(hc ?? []);
    setVidComments(vc ?? []);
    setReactions(rx ?? []);
    setLoading(false);
  }

  useEffect(() => { if (canView) load(); }, [canView]);

  // ── Video actions ──────────────────────────────────────────────
  async function reviewVideo(id: string, status: "approved" | "rejected") {
    setActing(id);
    const token = await getToken();
    await fetch("/api/admin/influencer-videos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status, admin_note: reviewNote[id] ?? "" }),
    });
    setVideos(p => p.map(v => v.id === id ? { ...v, status, admin_note: reviewNote[id] ?? v.admin_note } : v));
    setActing(null);
  }

  async function pinVideo(id: string, pin: boolean) {
    setActing(id);
    await supabase.from("influencer_video_submissions").update({ is_pinned: pin }).eq("id", id);
    setVideos(p => p.map(v => v.id === id ? { ...v, is_pinned: pin } : v));
    setActing(null);
  }

  async function deleteVideo(id: string) {
    if (!confirm("Permanently delete this video submission? This cannot be undone.")) return;
    setActing(id);
    await supabase.from("influencer_video_submissions").delete().eq("id", id);
    setVideos(p => p.filter(v => v.id !== id));
    setActing(null);
  }

  async function deleteComment(table: "influencer_hub_comments" | "influencer_video_comments", id: string) {
    if (!confirm("Delete this comment?")) return;
    await supabase.from(table).delete().eq("id", id);
    if (table === "influencer_hub_comments") setHubComments(p => p.filter(c => c.id !== id));
    else setVidComments(p => p.filter(c => c.id !== id));
  }

  async function saveScript() {
    if (!scriptForm.title || !scriptForm.script_text) return alert("Title and script are required.");
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
    if (!confirm("Archive this script?")) return;
    const token = await getToken();
    await fetch(`/api/admin/influencer-scripts?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setScripts(p => p.map(s => s.id === id ? { ...s, status: "archived" } : s));
  }

  // ── Derived stats ──────────────────────────────────────────────
  const totalSignups   = influencers.reduce((s, i) => s + (i.total_signups ?? 0), 0);
  const totalPurchases = influencers.reduce((s, i) => s + (i.total_purchases ?? 0), 0);
  const totalEarnings  = influencers.reduce((s, i) => s + (i.total_earnings ?? 0), 0);
  const totalReactions = reactions.length;
  const totalComments  = hubComments.length + vidComments.length;

  const filteredVideos = videoFilter === "all" ? videos : videos.filter(v => v.status === videoFilter);

  const fmt   = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const fmtDT = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

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

  return (
    <AdminShell
      breadcrumbs={[{ label: "Influencers" }]}
      title="Influencers"
      subtitle="Creator profiles, video management, scripts, comments and revenue"
      doodleType="analytics"
    >
      {/* ── Stats row ── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Influencers",  value: influencers.length,              icon: <Users className="h-5 w-5 text-indigo-500" /> },
          { label: "Signups",      value: totalSignups,                    icon: <Users className="h-5 w-5 text-cyan-500" /> },
          { label: "Purchases",    value: totalPurchases,                  icon: <ShoppingBag className="h-5 w-5 text-purple-500" /> },
          { label: "Reactions",    value: totalReactions,                  icon: <ThumbsUp className="h-5 w-5 text-pink-500" /> },
          { label: "Revenue",      value: `₹${totalEarnings.toFixed(0)}`,  icon: <IndianRupee className="h-5 w-5 text-emerald-500" />, hi: true },
        ].map(s => (
          <div key={s.label} className={`${adminCardCls} p-4`}>
            {s.icon}
            <p className={`mt-2 text-xl font-bold tabular-nums ${s.hi ? "text-emerald-600 dark:text-emerald-300" : "text-slate-800 dark:text-white"}`}>{s.value}</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${adminMutedCls}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs + actions ── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TAB("influencers", "👥 Influencers", influencers.length)}
          {TAB("videos", "🎬 Videos", videos.length)}
          {TAB("scripts", "📜 Scripts", scripts.length)}
          {TAB("comments", "💬 Comments", totalComments)}
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

      {/* ════════ Influencers Tab ════════ */}
      {tab === "influencers" && (
        <div className="space-y-3">
          {loading ? (
            <p className={`py-8 text-center text-sm ${adminMutedCls}`}>Loading…</p>
          ) : influencers.length === 0 ? (
            <div className={`${adminCardCls} p-8 text-center text-sm ${adminMutedCls}`}>No influencers yet.</div>
          ) : influencers.map(inf => {
            const infVids    = videos.filter(v => v.candidate_id === inf.candidate_id);
            const infRx      = reactions.filter(r => infVids.some(v => v.id === r.video_id));
            const infVidCmts = vidComments.filter(c => infVids.some(v => v.id === c.video_id));
            const infHubCmts = hubComments.filter(c => c.influencer_candidate_id === inf.candidate_id);
            const isExpanded = expandedInf === inf.candidate_id;

            return (
              <div key={inf.candidate_id} className={`${adminCardCls} overflow-hidden`}>
                {/* Header row */}
                <div className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-black text-white">
                    {inf.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-800 dark:text-white">{inf.name}</p>
                      {inf.niche && <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">{inf.niche}</span>}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${inf.referral_status === "active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>{inf.referral_status}</span>
                    </div>
                    <p className={`text-xs ${adminMutedCls}`}>{inf.email} · {inf.mobile ?? "—"}</p>
                  </div>
                  {/* Quick stats */}
                  <div className="hidden items-center gap-4 sm:flex">
                    <span className={`flex items-center gap-1 text-xs ${adminMutedCls}`}><Users className="h-3.5 w-3.5" /> {inf.total_signups}</span>
                    <span className={`flex items-center gap-1 text-xs ${adminMutedCls}`}><ShoppingBag className="h-3.5 w-3.5" /> {inf.total_purchases}</span>
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-300"><IndianRupee className="h-3.5 w-3.5" /> {(inf.total_earnings ?? 0).toFixed(0)}</span>
                    <span className={`flex items-center gap-1 text-xs ${adminMutedCls}`}><ThumbsUp className="h-3.5 w-3.5" /> {infRx.length}</span>
                    <span className={`flex items-center gap-1 text-xs ${adminMutedCls}`}><MessageCircle className="h-3.5 w-3.5" /> {infVidCmts.length + infHubCmts.length}</span>
                    <span className={`flex items-center gap-1 text-xs ${adminMutedCls}`}><Video className="h-3.5 w-3.5" /> {inf.videos_approved}/{inf.videos_submitted}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`/careers/influencer/dashboard?cid=${inf.candidate_id}`} target="_blank" rel="noopener noreferrer"
                      className={`rounded border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 dark:border-slate-700`}>
                      <ExternalLink className="inline h-3 w-3" /> Dashboard
                    </a>
                    <button onClick={() => setExpandedInf(isExpanded ? null : inf.candidate_id)}
                      className={`rounded border border-slate-200 p-1 text-slate-400 dark:border-slate-700`}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className={`border-t px-4 pb-4 pt-3 dark:border-slate-800 border-slate-100`}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Social links */}
                      <div>
                        <p className={`mb-2 text-[10px] font-bold uppercase tracking-wider ${adminMutedCls}`}>Social Links</p>
                        <div className="space-y-1">
                          {[["Instagram", inf.instagram_url], ["YouTube", inf.youtube_url], ["Twitter", inf.twitter_url]].map(([label, url]) =>
                            url ? (
                              <a key={label} href={url as string} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-indigo-600 underline underline-offset-2 dark:text-indigo-300">
                                <ExternalLink className="h-3 w-3" /> {label}
                              </a>
                            ) : null
                          )}
                          {!inf.instagram_url && !inf.youtube_url && !inf.twitter_url && <p className={`text-xs ${adminMutedCls}`}>No social links added.</p>}
                        </div>
                      </div>
                      {/* Bio */}
                      <div>
                        <p className={`mb-2 text-[10px] font-bold uppercase tracking-wider ${adminMutedCls}`}>Bio</p>
                        <p className={`text-xs leading-relaxed ${adminMutedCls}`}>{inf.bio || "—"}</p>
                      </div>
                    </div>
                    {/* Their videos */}
                    {infVids.length > 0 && (
                      <div className="mt-3">
                        <p className={`mb-2 text-[10px] font-bold uppercase tracking-wider ${adminMutedCls}`}>Their Videos</p>
                        <div className="flex flex-wrap gap-2">
                          {infVids.map(v => (
                            <a key={v.id} href={v.video_url} target="_blank" rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-bold transition
                                ${v.status === "approved" ? "border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300"
                                  : v.status === "rejected" ? "border-rose-200 text-rose-600 dark:border-rose-500/30 dark:text-rose-300"
                                  : "border-amber-200 text-amber-700 dark:border-amber-500/30 dark:text-amber-300"}`}>
                              {v.status === "approved" ? "✅" : v.status === "rejected" ? "❌" : "⏳"} {v.platform ?? "Video"}
                              {v.is_pinned && " 📌"}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ════════ Videos Tab ════════ */}
      {tab === "videos" && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "approved", "rejected"] as const).map(f => (
              <button key={f} onClick={() => setVideoFilter(f)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold capitalize transition ${
                  videoFilter === f
                    ? "bg-indigo-600 text-white shadow"
                    : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
                }`}>{f === "all" ? `All (${videos.length})` : f === "pending" ? `⏳ Pending (${videos.filter(v=>v.status==="pending").length})` : f === "approved" ? `✅ Approved (${videos.filter(v=>v.status==="approved").length})` : `❌ Rejected (${videos.filter(v=>v.status==="rejected").length})`}</button>
            ))}
          </div>

          {loading ? (
            <p className={`py-8 text-center text-sm ${adminMutedCls}`}>Loading…</p>
          ) : filteredVideos.length === 0 ? (
            <div className={`${adminCardCls} p-8 text-center text-sm ${adminMutedCls}`}>No videos in this filter.</div>
          ) : filteredVideos.map(v => {
            const vRx  = reactions.filter(r => r.video_id === v.id);
            const vCmt = vidComments.filter(c => c.video_id === v.id);
            const likeCount  = vRx.filter(r => r.reaction_type === "like").length;
            const loveCount  = vRx.filter(r => r.reaction_type === "love").length;
            const fireCount  = vRx.filter(r => r.reaction_type === "fire").length;
            const wowCount   = vRx.filter(r => r.reaction_type === "wow").length;

            return (
              <div key={v.id} className={`${adminCardCls} p-4`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-white">{v.influencer_name}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black
                        ${v.status === "approved" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : v.status === "rejected" ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}>
                        {v.status === "approved" ? "✅ Approved" : v.status === "rejected" ? "❌ Rejected" : "⏳ Pending"}
                      </span>
                      {v.is_pinned && <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">📌 Pinned</span>}
                      {v.platform && <span className={`rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300`}>{v.platform}</span>}
                    </div>
                    {v.caption && <p className={`mt-1 text-xs ${adminMutedCls}`}>{v.caption}</p>}
                    <p className={`mt-1 text-[10px] ${adminMutedCls}`}>{fmtDT(v.created_at)}</p>

                    {/* Engagement stats */}
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className={`flex items-center gap-1 text-xs ${adminMutedCls}`}><Eye className="h-3.5 w-3.5" /> {v.view_count} views</span>
                      {likeCount  > 0 && <span className="text-xs">👍 {likeCount}</span>}
                      {loveCount  > 0 && <span className="text-xs">❤️ {loveCount}</span>}
                      {fireCount  > 0 && <span className="text-xs">🔥 {fireCount}</span>}
                      {wowCount   > 0 && <span className="text-xs">😮 {wowCount}</span>}
                      <span className={`flex items-center gap-1 text-xs ${adminMutedCls}`}><MessageCircle className="h-3.5 w-3.5" /> {vCmt.length} comments</span>
                    </div>

                    {/* Comments list */}
                    {vCmt.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {vCmt.map(c => (
                          <div key={c.id} className="flex items-start justify-between gap-2">
                            <p className={`text-[11px] ${adminMutedCls}`}><span className="font-bold text-slate-700 dark:text-slate-300">{c.commenter_name}:</span> {c.comment_text}</p>
                            <button onClick={() => deleteComment("influencer_video_comments", c.id)} className="shrink-0 text-rose-400 hover:text-rose-600">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {v.admin_note && <p className={`mt-1 text-xs italic ${adminMutedCls}`}>Note: {v.admin_note}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <a href={v.video_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300">
                      <ExternalLink className="h-3.5 w-3.5" /> Watch
                    </a>
                    {v.status === "pending" && (
                      <>
                        <div className="flex gap-1.5">
                          <button onClick={() => reviewVideo(v.id, "approved")} disabled={acting === v.id}
                            className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                            <Check className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button onClick={() => reviewVideo(v.id, "rejected")} disabled={acting === v.id}
                            className="flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rose-500 disabled:opacity-50">
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                        <input value={reviewNote[v.id] ?? ""} onChange={e => setReviewNote(p => ({ ...p, [v.id]: e.target.value }))}
                          placeholder="Note (optional)" className={`${adminInputCls} text-xs py-1.5`} />
                      </>
                    )}
                    <div className="flex gap-1.5">
                      <button onClick={() => pinVideo(v.id, !v.is_pinned)} disabled={acting === v.id}
                        title={v.is_pinned ? "Unpin" : "Pin to top"}
                        className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-bold transition disabled:opacity-50
                          ${v.is_pinned ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300" : "border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700"}`}>
                        {v.is_pinned ? <><PinOff className="h-3.5 w-3.5" /> Unpin</> : <><Pin className="h-3.5 w-3.5" /> Pin</>}
                      </button>
                      <button onClick={() => deleteVideo(v.id)} disabled={acting === v.id}
                        title="Delete permanently"
                        className="flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1.5 text-[11px] font-bold text-rose-500 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════ Scripts Tab ════════ */}
      {tab === "scripts" && (
        <div className="space-y-3">
          {showScriptForm && (
            <div className={`${adminCardCls} space-y-3 p-4`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700 dark:text-white">New Script</p>
                <button onClick={() => setShowScriptForm(false)} className={adminMutedCls}><X className="h-4 w-4" /></button>
              </div>
              <input className={adminInputCls} placeholder="Title *" value={scriptForm.title} onChange={e => setScriptForm(p => ({ ...p, title: e.target.value }))} />
              <input className={adminInputCls} placeholder="Short description (optional)" value={scriptForm.description} onChange={e => setScriptForm(p => ({ ...p, description: e.target.value }))} />
              <textarea className={`${adminInputCls} resize-none`} rows={8} placeholder="Full script text *" value={scriptForm.script_text} onChange={e => setScriptForm(p => ({ ...p, script_text: e.target.value }))} />
              <input className={adminInputCls} placeholder="Reference video URL (optional)" value={scriptForm.video_ref} onChange={e => setScriptForm(p => ({ ...p, video_ref: e.target.value }))} />
              <button onClick={saveScript} disabled={scriptSaving} className={adminPrimaryBtnCls}>
                {scriptSaving ? "Saving…" : "Publish Script →"}
              </button>
            </div>
          )}
          {scripts.length === 0 && !showScriptForm ? (
            <div className={`${adminCardCls} p-8 text-center text-sm ${adminMutedCls}`}>No scripts yet. Click "New Script".</div>
          ) : scripts.map(s => (
            <div key={s.id} className={`${adminCardCls} p-4`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-800 dark:text-white">{s.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.status === "active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>{s.status}</span>
                  </div>
                  {s.description && <p className={`mt-0.5 text-xs ${adminMutedCls}`}>{s.description}</p>}
                  <p className={`mt-1 text-[10px] ${adminMutedCls}`}>{fmt(s.created_at)}</p>
                  {s.video_ref && (
                    <a href={s.video_ref} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 underline underline-offset-2 dark:text-indigo-300">
                      <ExternalLink className="h-3 w-3" /> Reference video
                    </a>
                  )}
                </div>
                {s.status === "active" && (
                  <button onClick={() => archiveScript(s.id)} className="shrink-0 rounded border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:border-rose-300 hover:text-rose-500 dark:border-slate-700">Archive</button>
                )}
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300">View Script Text</summary>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300" style={{ fontFamily: "inherit" }}>
                  {s.script_text}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}

      {/* ════════ Comments Tab ════════ */}
      {tab === "comments" && (
        <div className="space-y-4">
          {/* Video comments */}
          <div>
            <p className={`mb-3 text-[10px] font-bold uppercase tracking-wider ${adminMutedCls}`}>Video Comments ({vidComments.length})</p>
            {vidComments.length === 0 ? (
              <p className={`text-sm ${adminMutedCls}`}>No video comments yet.</p>
            ) : (
              <div className="space-y-2">
                {vidComments.map(c => (
                  <div key={c.id} className={`${adminCardCls} flex items-start justify-between gap-3 p-3`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-white">{c.commenter_name}</span>
                        <span className={`text-[10px] ${adminMutedCls}`}>{fmtDT(c.created_at)}</span>
                      </div>
                      <p className={`mt-0.5 text-xs ${adminMutedCls}`}>{c.comment_text}</p>
                    </div>
                    <button onClick={() => deleteComment("influencer_video_comments", c.id)} className="shrink-0 text-rose-400 hover:text-rose-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profile / Hub comments */}
          <div className="mt-6">
            <p className={`mb-3 text-[10px] font-bold uppercase tracking-wider ${adminMutedCls}`}>Profile Comments ({hubComments.length})</p>
            {hubComments.length === 0 ? (
              <p className={`text-sm ${adminMutedCls}`}>No profile comments yet.</p>
            ) : (
              <div className="space-y-2">
                {hubComments.map(c => {
                  const inf = influencers.find(i => i.candidate_id === c.influencer_candidate_id);
                  return (
                    <div key={c.id} className={`${adminCardCls} flex items-start justify-between gap-3 p-3`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-white">{c.commenter_name}</span>
                          {inf && <span className={`text-[10px] ${adminMutedCls}`}>→ {inf.name}</span>}
                          <span className={`text-[10px] ${adminMutedCls}`}>{fmtDT(c.created_at)}</span>
                        </div>
                        <p className={`mt-0.5 text-xs ${adminMutedCls}`}>{c.comment_text}</p>
                      </div>
                      <button onClick={() => deleteComment("influencer_hub_comments", c.id)} className="shrink-0 text-rose-400 hover:text-rose-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
