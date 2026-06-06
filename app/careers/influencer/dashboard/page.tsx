"use client";

// /careers/influencer/dashboard?cid=UUID
// Influencer's personal dashboard: referral link, stats, scripts, video submissions

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, Check, Users, ShoppingBag, IndianRupee, Video, FileText, ChevronDown, ChevronUp, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";

type DashData = {
  candidate: { id: string; name: string; email: string; stage: string };
  social: { referral_code: string; referral_status: string; niche?: string; instagram_url?: string; youtube_url?: string };
  referral_link: string;
  stats: { signups: number; purchases: number; earnings: number };
  signup_list: { full_name: string; email: string; created_at: string }[];
  purchase_list: { commission_amount: number; purchase_amount: number; status: string; created_at: string; order_id: string }[];
  scripts: { id: string; title: string; description: string; script_text: string; video_ref?: string; created_at: string }[];
  videos: { id: string; script_id?: string; video_url: string; platform?: string; caption?: string; status: string; admin_note?: string; created_at: string }[];
};

function Dashboard() {
  const params = useSearchParams();
  const cid = params.get("cid") ?? "";
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedScript, setExpandedScript] = useState<string | null>(null);
  const [expandedTab, setExpandedTab] = useState<"scripts" | "signups" | "purchases" | "videos" | "howto">("scripts");

  // Video upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadScriptId, setUploadScriptId] = useState<string>("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState("instagram");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!cid) { setError("Invalid link — cid missing."); setLoading(false); return; }
    fetch(`/api/careers/influencer/dashboard?cid=${cid}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d); else setError(d.error ?? "Failed to load."); })
      .catch(() => setError("Network error."))
      .finally(() => setLoading(false));
  }, [cid]);

  function copyLink() {
    if (data?.referral_link) {
      navigator.clipboard.writeText(data.referral_link);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  }

  async function submitVideo() {
    if (!videoFile || !cid) return;
    setUploading(true);
    try {
      // Upload to Supabase Storage
      const ext = videoFile.name.split(".").pop() ?? "mp4";
      const path = `${cid}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("cc-demo-videos")
        .upload(path, videoFile, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("cc-demo-videos").getPublicUrl(path);
      const videoUrl = urlData?.publicUrl ?? path;

      // Submit to DB
      const res = await fetch("/api/careers/influencer/video-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: cid, script_id: uploadScriptId || null, video_url: videoUrl, platform, caption }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setUploadDone(true);
      setUploadOpen(false);
      setVideoFile(null);
      setCaption("");
      // Refresh data
      const refreshRes = await fetch(`/api/careers/influencer/dashboard?cid=${cid}`);
      const refreshData = await refreshRes.json();
      if (refreshData.ok) setData(refreshData);
    } catch (e: any) {
      alert("Upload failed: " + (e?.message ?? "Unknown error"));
    }
    setUploading(false);
  }

  const input = "w-full rounded-xl border border-cyan-200/50 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 dark:border-white/10 dark:bg-[#0f1a2e] dark:text-white";

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#070b14] text-white"><p className="text-sm opacity-60">Loading your dashboard…</p></main>;
  if (error)   return <main className="flex min-h-screen items-center justify-center bg-[#070b14] text-white"><p className="text-sm text-rose-400">{error}</p></main>;
  if (!data)   return null;

  const { candidate, social, referral_link, stats, scripts, videos, signup_list, purchase_list } = data;

  const TAB_BTN = (tab: typeof expandedTab, label: string, count?: number) => (
    <button
      onClick={() => setExpandedTab(tab)}
      className={`rounded-full px-4 py-1.5 text-xs font-black transition ${expandedTab === tab ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow" : "border border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"}`}
    >
      {label}{count !== undefined ? ` (${count})` : ""}
    </button>
  );

  return (
    <main className="relative min-h-screen bg-[#070b14] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#a855f744,transparent_50%),radial-gradient(circle_at_bottom_right,#ec489933,transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-purple-300">
              🌟 Influencer Dashboard
            </span>
            <h1 className="mt-2 text-2xl font-black">
              Welcome, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{candidate.name}</span>
            </h1>
            <p className="mt-1 text-sm text-white/50">Your referral programme — scripts, stats and earnings</p>
          </div>
          {uploadDone && (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300">
              ✅ Video submitted for review!
            </div>
          )}
        </div>

        {/* Referral Link card */}
        <div className="mb-6 rounded-3xl border border-purple-400/30 bg-white/[0.04] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">Your Referral Link</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-white/5 px-3 py-2.5 font-mono text-xs text-white/80">
              {referral_link ?? "—"}
            </code>
            <button
              onClick={copyLink}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-300 transition hover:bg-purple-500/20"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-[11px] font-bold text-white/40">
            Code: <span className="font-mono text-purple-300">{social.referral_code}</span>
            {" "}· Share this link everywhere. You earn <b className="text-emerald-300">10% commission</b> on every purchase.
          </p>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
            <Users className="mx-auto h-5 w-5 text-cyan-400" />
            <p className="mt-2 text-2xl font-black tabular-nums">{stats.signups}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Signups</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
            <ShoppingBag className="mx-auto h-5 w-5 text-purple-400" />
            <p className="mt-2 text-2xl font-black tabular-nums">{stats.purchases}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Purchases</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4 text-center">
            <IndianRupee className="mx-auto h-5 w-5 text-emerald-400" />
            <p className="mt-2 text-2xl font-black tabular-nums text-emerald-300">₹{stats.earnings.toFixed(0)}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Earned</p>
          </div>
        </div>

        {/* Upload video button */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {TAB_BTN("scripts", "📜 Scripts", scripts.length)}
            {TAB_BTN("videos", "🎬 My Videos", videos.length)}
            {TAB_BTN("signups", "👤 Signups", stats.signups)}
            {TAB_BTN("purchases", "💳 Purchases", stats.purchases)}
            {TAB_BTN("howto", "❓ How It Works")}
          </div>
          <button
            onClick={() => { setUploadOpen(true); setUploadDone(false); }}
            className="ml-2 shrink-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-purple-500/20 transition hover:scale-105"
          >
            <Upload className="mr-1.5 inline h-3.5 w-3.5" />Upload Video
          </button>
        </div>

        {/* ── Tab: Scripts ── */}
        {expandedTab === "scripts" && (
          <div className="space-y-3">
            {scripts.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/40">
                No scripts available yet. Check back soon — our team will upload your first script.
              </div>
            ) : scripts.map(s => (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-white">{s.title}</p>
                    {s.description && <p className="mt-0.5 text-xs text-white/50">{s.description}</p>}
                    <p className="mt-1 text-[10px] text-white/30">
                      {new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <button
                    onClick={() => setExpandedScript(expandedScript === s.id ? null : s.id)}
                    className="shrink-0 rounded-lg border border-white/10 p-2 text-white/40 transition hover:border-white/30 hover:text-white/70"
                  >
                    {expandedScript === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {expandedScript === s.id && (
                  <div className="mt-3 space-y-3">
                    {s.video_ref && (
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-cyan-400">Reference Video</p>
                        <a href={s.video_ref} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-bold text-cyan-300 underline underline-offset-2">
                          Watch reference →
                        </a>
                      </div>
                    )}
                    <div className="rounded-xl border border-purple-400/20 bg-purple-500/5 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">📜 Script</p>
                        <button
                          onClick={() => { navigator.clipboard.writeText(s.script_text); }}
                          className="rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-[10px] font-black text-purple-300 transition hover:bg-purple-500/20"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap text-xs leading-relaxed text-white/75" style={{ fontFamily: "inherit" }}>
                        {s.script_text}
                      </pre>
                    </div>
                    <button
                      onClick={() => { setUploadScriptId(s.id); setUploadOpen(true); setUploadDone(false); }}
                      className="w-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 text-xs font-black text-white shadow transition hover:scale-[1.02]"
                    >
                      🎬 Upload My Video for This Script →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: My Videos ── */}
        {expandedTab === "videos" && (
          <div className="space-y-3">
            {videos.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/40">
                You haven't uploaded any videos yet. Pick a script above and upload your ad!
              </div>
            ) : videos.map(v => (
              <div key={v.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Video className="h-5 w-5 text-purple-400 shrink-0" />
                    <div>
                      <p className="text-sm font-black text-white">
                        {v.platform ? v.platform.charAt(0).toUpperCase() + v.platform.slice(1) : "Video"}
                        {v.caption && <span className="ml-2 font-medium text-white/50">— {v.caption.slice(0, 50)}</span>}
                      </p>
                      <p className="text-[10px] text-white/30">{new Date(v.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black ${
                    v.status === "approved" ? "bg-emerald-500/20 text-emerald-300" :
                    v.status === "rejected" ? "bg-rose-500/20 text-rose-300" :
                    "bg-amber-500/20 text-amber-300"
                  }`}>
                    {v.status === "approved" ? "✅ Approved" : v.status === "rejected" ? "❌ Rejected" : "⏳ Under Review"}
                  </span>
                </div>
                {v.status === "approved" && (
                  <div className="mt-2 rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-2 text-xs text-emerald-300">
                    🎉 Approved! Share this on your social media and start earning commissions.
                  </div>
                )}
                {v.status === "rejected" && v.admin_note && (
                  <div className="mt-2 rounded-lg border border-rose-400/20 bg-rose-500/5 p-2 text-xs text-rose-300">
                    Note: {v.admin_note}
                  </div>
                )}
                <a href={v.video_url} target="_blank" rel="noopener noreferrer"
                  className="mt-2 inline-block text-[11px] font-bold text-cyan-400 underline underline-offset-2">
                  View uploaded video →
                </a>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Signups ── */}
        {expandedTab === "signups" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
            {signup_list.length === 0 ? (
              <p className="p-6 text-center text-sm text-white/40">No signups yet. Share your referral link to start!</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-[10px] font-black uppercase tracking-wider text-white/40">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {signup_list.map((s, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-medium text-white">{s.full_name ?? "—"}</td>
                      <td className="px-4 py-3 text-white/60">{s.email}</td>
                      <td className="px-4 py-3 text-white/40 text-xs">
                        {new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Tab: Purchases ── */}
        {expandedTab === "purchases" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
            {purchase_list.length === 0 ? (
              <p className="p-6 text-center text-sm text-white/40">No purchases yet. Keep sharing your link!</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-[10px] font-black uppercase tracking-wider text-white/40">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Purchase</th>
                    <th className="px-4 py-3">Your Commission</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchase_list.map((p, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="px-4 py-3 text-white/40 text-xs">
                        {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">₹{p.purchase_amount?.toFixed(0) ?? "—"}</td>
                      <td className="px-4 py-3 font-black text-emerald-300">₹{p.commission_amount?.toFixed(0) ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${p.status === "paid" ? "bg-emerald-500/20 text-emerald-300" : p.status === "cleared" ? "bg-cyan-500/20 text-cyan-300" : "bg-amber-500/20 text-amber-300"}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Tab: How It Works ── */}
        {expandedTab === "howto" && (
          <div className="space-y-3">
            {[
              { step: "1", icon: "🔗", title: "Share Your Referral Link", desc: "Copy your referral link above and share it on Instagram, YouTube, WhatsApp, Facebook — everywhere. When someone clicks your link and signs up, they are linked to you permanently." },
              { step: "2", icon: "💰", title: "Earn 10% on Every Purchase", desc: "When anyone who signed up through your link buys a plan on AgentForge, you earn 10% commission. Plans range from ₹1,999 to ₹39,999 — that's ₹200 to ₹4,000 per sale." },
              { step: "3", icon: "📜", title: "Pick a Script — Make a Video", desc: "We send you scripts from time to time. Pick a script, make a short video or reel using it, and upload it here. We review it and approve it. Once approved, you can post it on your social media." },
              { step: "4", icon: "📊", title: "Track in Real Time", desc: "Your dashboard shows every signup and every purchase made through your link — with dates, amounts and commission earned. Payments are settled monthly." },
              { step: "5", icon: "📱", title: "Where to Share", desc: "Instagram Reels and Stories, YouTube Shorts, WhatsApp Business groups (textile / jewellery dealers), LinkedIn posts. Before/after AI photo comparisons perform best." },
            ].map(item => (
              <div key={item.step} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-black text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-white/55 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Upload Modal */}
        {uploadOpen && (
          <div className="fixed inset-0 z-[999] flex items-end justify-center p-4 sm:items-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setUploadOpen(false)} />
            <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl">
              <h3 className="mb-4 text-lg font-black text-white">🎬 Upload Your Video Ad</h3>
              <p className="mb-4 text-xs text-white/50">
                Create a short video based on a script we gave you. Upload it here. Once we approve it, share it on your social media.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-white/40">Script (optional)</label>
                  <select value={uploadScriptId} onChange={e => setUploadScriptId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400">
                    <option value="">— No specific script —</option>
                    {scripts.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-white/40">Platform</label>
                  <select value={platform} onChange={e => setPlatform(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400">
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="facebook">Facebook</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-white/40">Caption / Description</label>
                  <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={2}
                    placeholder="What is this video about?"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-purple-400 resize-none" />
                </div>

                <div className="rounded-xl border border-dashed border-purple-400/30 bg-purple-500/5 p-4">
                  <input ref={fileRef} type="file" accept="video/*" className="hidden"
                    onChange={e => setVideoFile(e.target.files?.[0] ?? null)} />
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-1.5 text-xs font-black text-purple-300 transition hover:bg-purple-500/20">
                    📂 Choose Video File
                  </button>
                  {videoFile && (
                    <p className="mt-2 text-xs font-bold text-emerald-400">
                      ✅ {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-white/30">Max 200 MB · MP4 / MOV preferred</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setUploadOpen(false)}
                    className="flex-1 rounded-full border border-white/10 py-2.5 text-sm font-medium text-white/50 hover:text-white/80">
                    Cancel
                  </button>
                  <button onClick={submitVideo} disabled={uploading || !videoFile}
                    className="flex-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 text-sm font-black text-white shadow transition hover:scale-[1.02] disabled:opacity-50">
                    {uploading ? "Uploading…" : "Submit Video →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function InfluencerDashboardPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#070b14] text-white"><p className="text-sm opacity-60">Loading…</p></main>}>
      <Dashboard />
    </Suspense>
  );
}
