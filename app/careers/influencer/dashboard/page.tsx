"use client";

// /careers/influencer/dashboard?cid=UUID
// Influencer's personal dashboard: referral link, stats, scripts, video submissions, profile edit

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, Check, Users, ShoppingBag, IndianRupee, Video, ChevronDown, ChevronUp, Upload, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import PageDoodles from "@/app/components/PageDoodles";

type DashData = {
  candidate: { id: string; name: string; email: string; stage: string };
  social: {
    referral_code: string; referral_status: string; niche?: string;
    instagram_url?: string; youtube_url?: string; twitter_url?: string;
    tiktok_url?: string; website_url?: string; bio?: string;
    profile_photo_url?: string;
  };
  referral_link: string;
  stats: { signups: number; purchases: number; earnings: number };
  available_balance?: number;
  pending_withdrawal?: { id: string; amount: number; status: string; requested_at: string } | null;
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
  const [activeTab, setActiveTab] = useState<"scripts" | "signups" | "purchases" | "videos" | "profile" | "howto">("scripts");

  // Video upload
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadScriptId, setUploadScriptId] = useState<string>("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState("instagram");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Profile edit
  const [profileForm, setProfileForm] = useState({ bio: "", instagram_url: "", youtube_url: "", twitter_url: "", tiktok_url: "", website_url: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Withdraw application (leave programme)
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);

  // Withdraw earnings (payout)
  const [upiInput, setUpiInput] = useState("");
  const [showUpiForm, setShowUpiForm] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [payingOut, setPayingOut] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState<string | null>(null);
  const [payoutErr, setPayoutErr] = useState<string | null>(null);

  function isValidUpiClient(u: string) {
    return /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(u.trim());
  }
  function openPayoutConfirm() {
    if (!data) return;
    const avail = data.available_balance ?? 0;
    if (avail <= 0) { setPayoutErr("No balance available to withdraw yet."); return; }
    if (!isValidUpiClient(upiInput)) { setPayoutErr("Please enter a valid UPI ID (e.g. yourname@okhdfc)."); return; }
    setPayoutErr(null);
    setConfirmOpen(true);
  }
  async function doPayout() {
    if (!data || !cid) return;
    setConfirmOpen(false);
    setPayingOut(true);
    setPayoutErr(null);
    setPayoutMsg(null);
    try {
      const r = await fetch("/api/careers/influencer/withdraw-earnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cid, upi: upiInput.trim() }),
      });
      const d = await r.json();
      if (d.ok) {
        setPayoutMsg(d.message || "Withdrawal requested! Transfer within 24 hours.");
        setShowUpiForm(false);
        setUpiInput("");
        const refresh = await fetch(`/api/careers/influencer/dashboard?cid=${cid}`);
        const rd = await refresh.json();
        if (rd.ok) setData(rd);
      } else {
        setPayoutErr(d.error || "Could not request withdrawal.");
      }
    } catch {
      setPayoutErr("Network error. Please try again.");
    }
    setPayingOut(false);
  }

  useEffect(() => {
    if (!cid) { setError("Invalid link — dashboard ID missing."); setLoading(false); return; }
    // Auto-save cid so Influencer Hub can auto-login
    if (typeof window !== "undefined") localStorage.setItem("__inf_cid", cid);
    fetch(`/api/careers/influencer/dashboard?cid=${cid}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setData(d);
          setProfileForm({
            bio: d.social?.bio ?? "",
            instagram_url: d.social?.instagram_url ?? "",
            youtube_url: d.social?.youtube_url ?? "",
            twitter_url: d.social?.twitter_url ?? "",
            tiktok_url: d.social?.tiktok_url ?? "",
            website_url: d.social?.website_url ?? "",
          });
          if (d.candidate?.stage === "withdrawn") setWithdrawn(true);
        } else {
          setError(d.error ?? "Failed to load dashboard.");
        }
      })
      .catch(() => setError("Network error. Please try again."))
      .finally(() => setLoading(false));
  }, [cid]);

  function copyLink() {
    if (data?.referral_link) {
      navigator.clipboard.writeText(data.referral_link);
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    }
  }

  async function submitVideo() {
    if (!videoFile || !cid) return;
    setUploading(true);
    try {
      const ext = videoFile.name.split(".").pop() ?? "mp4";
      const path = `${cid}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("cc-demo-videos").upload(path, videoFile, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("cc-demo-videos").getPublicUrl(path);
      const videoUrl = urlData?.publicUrl ?? path;

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
      const refreshRes = await fetch(`/api/careers/influencer/dashboard?cid=${cid}`);
      const refreshData = await refreshRes.json();
      if (refreshData.ok) setData(refreshData);
    } catch (e: any) {
      const msg = e?.message ?? "Unknown error";
      const isBucketError = msg.toLowerCase().includes("bucket") || msg.toLowerCase().includes("not found");
      alert(isBucketError
        ? "Storage not configured yet — please try again in a few minutes or contact hr@aiagentforge.in"
        : "Upload failed: " + msg);
    }
    setUploading(false);
  }

  async function saveProfile() {
    if (!cid) return;
    setProfileSaving(true);
    try {
      const res = await fetch("/api/careers/influencer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cid, ...profileForm }),
      });
      const d = await res.json();
      if (d.ok) { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000); }
      else alert(d.error ?? "Save failed.");
    } catch { alert("Network error."); }
    setProfileSaving(false);
  }

  async function withdrawApplication() {
    if (!cid) return;
    const confirmed = window.confirm("Are you sure you want to withdraw your application?\n\nThis will deactivate your referral link and remove you from the influencer programme. This action cannot be undone.");
    if (!confirmed) return;
    setWithdrawing(true);
    try {
      const res = await fetch("/api/careers/influencer/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cid }),
      });
      const d = await res.json();
      if (d.ok) setWithdrawn(true);
      else alert(d.error ?? "Could not withdraw.");
    } catch { alert("Network error."); }
    setWithdrawing(false);
  }

  const selCls = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400";
  const inpCls = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white placeholder-white/25 focus:border-purple-400 focus:outline-none";

  const TAB = (t: typeof activeTab, label: string, badge?: number) => (
    <button onClick={() => setActiveTab(t)}
      className={`rounded-full px-4 py-1.5 text-xs font-black transition ${activeTab === t ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow" : "border border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"}`}>
      {label}{badge !== undefined ? ` (${badge})` : ""}
    </button>
  );

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#070b14] text-white"><p className="text-sm opacity-60">Loading your dashboard…</p></main>;
  if (error)   return <main className="flex min-h-screen items-center justify-center bg-[#070b14] px-4 text-white"><div className="max-w-sm text-center"><p className="text-sm text-rose-400">{error}</p><Link href="/careers/influencer" className="mt-4 inline-block text-xs text-purple-300 underline">← Try email lookup</Link></div></main>;
  if (!data)   return null;

  const { candidate, social, referral_link, stats, scripts, videos, signup_list, purchase_list } = data;
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const fmtDT = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (withdrawn) return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#070b14] px-4 text-white">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center max-w-sm">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-400" />
        <h1 className="mt-4 text-xl font-black">Application Withdrawn</h1>
        <p className="mt-2 text-sm text-white/50">Your referral link has been deactivated. If you change your mind, feel free to apply again.</p>
        <Link href="/careers/apply?role=content_creator" className="mt-5 inline-block rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-xs font-black text-white shadow">Apply Again →</Link>
      </div>
    </main>
  );

  return (
    <main className="relative min-h-screen bg-[#070b14] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#a855f744,transparent_50%),radial-gradient(circle_at_bottom_right,#ec489933,transparent_50%)]" />
      <PageDoodles variant="influencer" glow={false} grid />

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
          <div className="flex flex-col items-end gap-2">
            {uploadDone && (
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300">
                ✅ Video submitted for review!
              </div>
            )}
            <Link href="/influencer-hub" className="text-[11px] font-bold text-purple-300 underline underline-offset-2 hover:text-purple-200">
              View Influencer Hub →
            </Link>
          </div>
        </div>

        {/* Referral Link card */}
        <div className="mb-6 rounded-3xl border border-purple-400/30 bg-white/[0.04] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">Your Referral Link</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-white/5 px-3 py-2.5 font-mono text-xs text-white/80">
              {referral_link ?? "—"}
            </code>
            <button onClick={copyLink}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-300 transition hover:bg-purple-500/20">
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-[11px] font-bold text-white/40">
            Code: <span className="font-mono text-purple-300">{social.referral_code}</span>
            {" "}· Share this link on all your platforms to start earning.
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
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Sales</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4 text-center">
            <IndianRupee className="mx-auto h-5 w-5 text-emerald-400" />
            <p className="mt-2 text-2xl font-black tabular-nums text-emerald-300">₹{stats.earnings.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Your Earnings</p>
          </div>
        </div>

        {/* ── Withdraw earnings card ── */}
        <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.04] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Available to withdraw</p>
              <p className="mt-0.5 text-3xl font-black text-emerald-300">
                ₹{(data.available_balance ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </p>
              <p className="mt-1 text-[11px] text-white/40">💸 Payouts are transferred to your UPI within 24 hours.</p>
            </div>
            <div className="shrink-0">
              {data.pending_withdrawal ? (
                <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-center">
                  <p className="text-xs font-black text-amber-300">⏳ ₹{data.pending_withdrawal.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })} requested</p>
                  <p className="mt-0.5 text-[10px] font-bold text-amber-400">Transferring within 24 hours</p>
                </div>
              ) : showUpiForm ? (
                <div className="w-full sm:w-72">
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-white/40">Your UPI ID</label>
                  <input value={upiInput} onChange={e => setUpiInput(e.target.value)} placeholder="yourname@okhdfc" autoFocus className={inpCls} />
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={openPayoutConfirm} disabled={payingOut}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] disabled:opacity-40">
                      <IndianRupee className="h-4 w-4" />{payingOut ? "Processing…" : "Continue"}
                    </button>
                    <button type="button" onClick={() => { setShowUpiForm(false); setPayoutErr(null); }}
                      className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-bold text-white/60">Cancel</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => { setShowUpiForm(true); setPayoutErr(null); setPayoutMsg(null); }}
                  disabled={(data.available_balance ?? 0) <= 0}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40">
                  <IndianRupee className="h-4 w-4" /> Withdraw Earnings
                </button>
              )}
            </div>
          </div>
          {payoutMsg && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-300">
              <Check className="mt-0.5 h-4 w-4 shrink-0" /><span>{payoutMsg}</span>
            </div>
          )}
          {payoutErr && (
            <p className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-300">{payoutErr}</p>
          )}
        </div>

        {/* ── Withdraw confirm modal ── */}
        {confirmOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmOpen(false)} />
            <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
                  <IndianRupee className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-black">Confirm Withdrawal</h3>
                <p className="mt-1 text-sm text-white/50">You're about to withdraw</p>
                <p className="mt-1 text-3xl font-black text-emerald-300">₹{(data.available_balance ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Transfer to UPI</p>
                <p className="mt-0.5 font-mono text-sm font-bold">{upiInput.trim()}</p>
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-2.5 text-[11px] font-bold text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>The amount will be transferred to this UPI within 24 hours.</span>
              </div>
              <div className="mt-5 flex gap-2">
                <button type="button" onClick={() => setConfirmOpen(false)}
                  className="flex-1 rounded-full border border-white/10 py-3 text-sm font-bold text-white/70">Cancel</button>
                <button type="button" onClick={doPayout}
                  className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02]">Yes, Withdraw</button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs + upload */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {TAB("scripts", "📜 Scripts", scripts.length)}
            {TAB("videos", "🎬 My Videos", videos.length)}
            {TAB("signups", "👤 Signups", stats.signups)}
            {TAB("purchases", "💰 My Earnings", stats.purchases)}
            {TAB("profile", "✏️ My Profile")}
            {TAB("howto", "❓ How It Works")}
          </div>
          <button onClick={() => { setUploadOpen(true); setUploadDone(false); }}
            className="ml-2 shrink-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-purple-500/20 transition hover:scale-105">
            <Upload className="mr-1.5 inline h-3.5 w-3.5" />Upload Video
          </button>
        </div>

        {/* ── Tab: Scripts ── */}
        {activeTab === "scripts" && (
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
                    <p className="mt-1 text-[10px] text-white/30">{fmt(s.created_at)}</p>
                  </div>
                  <button onClick={() => setExpandedScript(expandedScript === s.id ? null : s.id)}
                    className="shrink-0 rounded-lg border border-white/10 p-2 text-white/40 transition hover:border-white/30 hover:text-white/70">
                    {expandedScript === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
                {expandedScript === s.id && (
                  <div className="mt-3 space-y-3">
                    {s.video_ref && (
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-cyan-400">Reference Video</p>
                        <a href={s.video_ref} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-cyan-300 underline underline-offset-2">Watch reference →</a>
                      </div>
                    )}
                    <div className="rounded-xl border border-purple-400/20 bg-purple-500/5 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">📜 Script</p>
                        <button onClick={() => navigator.clipboard.writeText(s.script_text)}
                          className="rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-[10px] font-black text-purple-300 transition hover:bg-purple-500/20">📋 Copy</button>
                      </div>
                      <pre className="whitespace-pre-wrap text-xs leading-relaxed text-white/75" style={{ fontFamily: "inherit" }}>{s.script_text}</pre>
                    </div>
                    <button onClick={() => { setUploadScriptId(s.id); setUploadOpen(true); setUploadDone(false); }}
                      className="w-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 text-xs font-black text-white shadow transition hover:scale-[1.02]">
                      🎬 Upload My Video for This Script →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: My Videos ── */}
        {activeTab === "videos" && (
          <div className="space-y-3">
            {videos.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/40">
                You haven't uploaded any videos yet. Pick a script and upload your ad!
              </div>
            ) : videos.map(v => (
              <div key={v.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Video className="h-5 w-5 shrink-0 text-purple-400" />
                    <div>
                      <p className="text-sm font-black text-white">
                        {v.platform ? v.platform.charAt(0).toUpperCase() + v.platform.slice(1) : "Video"}
                        {v.caption && <span className="ml-2 font-medium text-white/50">— {v.caption.slice(0, 50)}</span>}
                      </p>
                      <p className="text-[10px] text-white/30">{fmt(v.created_at)}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black ${v.status === "approved" ? "bg-emerald-500/20 text-emerald-300" : v.status === "rejected" ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300"}`}>
                    {v.status === "approved" ? "✅ Approved" : v.status === "rejected" ? "❌ Rejected" : "⏳ Under Review"}
                  </span>
                </div>
                {v.status === "approved" && (
                  <div className="mt-2 rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-2 text-xs text-emerald-300">
                    🎉 Approved! Share this on your social media and start earning.
                  </div>
                )}
                {v.status === "rejected" && v.admin_note && (
                  <div className="mt-2 rounded-lg border border-rose-400/20 bg-rose-500/5 p-2 text-xs text-rose-300">Note: {v.admin_note}</div>
                )}
                <a href={v.video_url} target="_blank" rel="noopener noreferrer"
                  className="mt-2 inline-block text-[11px] font-bold text-cyan-400 underline underline-offset-2">View uploaded video →</a>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Signups ── */}
        {activeTab === "signups" && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
            {signup_list.length === 0 ? (
              <p className="p-6 text-center text-sm text-white/40">No signups yet. Share your referral link to start!</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-[10px] font-black uppercase tracking-wider text-white/40">
                    <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {signup_list.map((s, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-medium text-white">{s.full_name ?? "—"}</td>
                      <td className="px-4 py-3 text-white/60">{s.email}</td>
                      <td className="px-4 py-3 text-xs text-white/40">{fmtDT(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Tab: Sales (influencer earnings only — no company revenue) ── */}
        {activeTab === "purchases" && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
            {purchase_list.length === 0 ? (
              <p className="p-6 text-center text-sm text-white/40">No sales yet. Keep sharing your link!</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-[10px] font-black uppercase tracking-wider text-white/40">
                    <th className="px-4 py-3">Date</th><th className="px-4 py-3">Sale</th><th className="px-4 py-3">Your Reward (10%)</th><th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchase_list.map((p, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="px-4 py-3 text-xs text-white/40">{fmt(p.created_at)}</td>
                      <td className="px-4 py-3 font-medium text-white">✅ Sale via your link</td>
                      <td className="px-4 py-3 font-black text-emerald-300">+₹{p.commission_amount?.toLocaleString("en-IN", { maximumFractionDigits: 2 }) ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${p.status === "paid" ? "bg-emerald-500/20 text-emerald-300" : p.status === "cleared" ? "bg-cyan-500/20 text-cyan-300" : "bg-amber-500/20 text-amber-300"}`}>{p.status === "paid" ? "Paid out" : p.status === "cleared" ? "Cleared" : "Pending"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Tab: My Profile ── */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-purple-300">Your Public Profile</p>
              <p className="mb-4 text-xs text-white/50">This info is shown on the public Influencer Hub page. Add your bio and social links so users can follow you.</p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-white/40">Short Bio</label>
                  <textarea value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} rows={3}
                    placeholder="Tell the world about your content, niche and why people should follow you…"
                    className={`${inpCls} resize-none`} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { key: "instagram_url", label: "Instagram URL", ph: "https://instagram.com/yourhandle" },
                    { key: "youtube_url",   label: "YouTube URL",   ph: "https://youtube.com/@yourchannel" },
                    { key: "twitter_url",   label: "Twitter / X URL", ph: "https://twitter.com/yourhandle" },
                    { key: "tiktok_url",    label: "TikTok URL",    ph: "https://tiktok.com/@yourhandle" },
                    { key: "website_url",   label: "Website / Blog", ph: "https://yourwebsite.com" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-white/40">{f.label}</label>
                      <input value={(profileForm as any)[f.key]} placeholder={f.ph}
                        onChange={e => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className={inpCls} />
                    </div>
                  ))}
                </div>
                <button onClick={saveProfile} disabled={profileSaving}
                  className="w-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 py-3 text-xs font-black text-white shadow transition hover:scale-[1.02] disabled:opacity-50">
                  {profileSaving ? "Saving…" : profileSaved ? "✅ Saved!" : "Save Profile →"}
                </button>
              </div>
            </div>

            {/* Withdraw section */}
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/5 p-5">
              <p className="text-sm font-black text-rose-300">Withdraw Application</p>
              <p className="mt-1 text-xs text-white/50">This will deactivate your referral link and remove you from the influencer programme. Your existing earnings are not affected.</p>
              <button onClick={withdrawApplication} disabled={withdrawing}
                className="mt-3 rounded-full border border-rose-400/30 bg-rose-500/10 px-5 py-2 text-xs font-black text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50">
                {withdrawing ? "Withdrawing…" : "Withdraw My Application"}
              </button>
            </div>
          </div>
        )}

        {/* ── Tab: How It Works ── */}
        {activeTab === "howto" && (
          <div className="space-y-3">
            {[
              { icon: "🔗", title: "Share Your Referral Link", desc: "Copy your referral link above and share it on Instagram, YouTube, WhatsApp, Facebook — everywhere. When someone clicks your link and signs up, they are linked to you permanently." },
              { icon: "💰", title: "Earn on Every Sale",   desc: "When anyone who signed up through your link buys a plan on AgentForge, you earn a 10% reward. Your dashboard shows your exact earnings in real time." },
              { icon: "📜", title: "Pick a Script — Make a Video", desc: "We send you scripts from time to time. Pick a script, make a short video or reel using it, and upload it here. We review and approve it. Once approved, post it on your social media." },
              { icon: "📊", title: "Track in Real Time",       desc: "Your dashboard shows every signup and every purchase made through your link — with dates, amounts and earnings. Payments are settled monthly." },
              { icon: "📱", title: "Where to Share",           desc: "Instagram Reels and Stories, YouTube Shorts, WhatsApp Business groups (textile / jewellery dealers), LinkedIn posts. Before/after AI photo comparisons perform best." },
              { icon: "✏️",  title: "Update Your Hub Profile", desc: "Go to 'My Profile' tab to add your bio and social media links. This appears on the public Influencer Hub page — helps you gain more followers." },
            ].map(item => (
              <div key={item.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-black text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/55">{item.desc}</p>
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
              <p className="mb-4 text-xs text-white/50">Create a short video based on a script. Upload here. Once we approve it, share on your social media.</p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-white/40">Script (optional)</label>
                  <select value={uploadScriptId} onChange={e => setUploadScriptId(e.target.value)} className={selCls}>
                    <option value="">— No specific script —</option>
                    {scripts.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-white/40">Platform</label>
                  <select value={platform} onChange={e => setPlatform(e.target.value)} className={selCls}>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="facebook">Facebook</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-white/40">Caption / Description</label>
                  <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={2}
                    placeholder="What is this video about?" className={`${inpCls} resize-none`} />
                </div>
                <div className="rounded-xl border border-dashed border-purple-400/30 bg-purple-500/5 p-4">
                  <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={e => setVideoFile(e.target.files?.[0] ?? null)} />
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-1.5 text-xs font-black text-purple-300 transition hover:bg-purple-500/20">📂 Choose Video File</button>
                  {videoFile && <p className="mt-2 text-xs font-bold text-emerald-400">✅ {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)</p>}
                  <p className="mt-1 text-[10px] text-white/30">Max 200 MB · MP4 / MOV preferred</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setUploadOpen(false)} className="flex-1 rounded-full border border-white/10 py-2.5 text-sm font-medium text-white/50 hover:text-white/80">Cancel</button>
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
