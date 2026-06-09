"use client";

// /influencer-hub — Social media style: Feed | Creators | My Dashboard

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MessageCircle, Send, Star, Users, Heart, Flame, ThumbsUp, Smile,
  Globe, ExternalLink, ChevronDown, ChevronUp, TrendingUp, IndianRupee,
  Clock, CheckCircle2, Copy, Share2, Edit3, X, BarChart2, Eye,
} from "lucide-react";
import { useTheme } from "@/app/components/ThemeProvider";
import PageDoodles from "@/app/components/PageDoodles";

// ── Types ──────────────────────────────────────────────────────────────────
type Influencer = {
  candidate_id: string; name: string; niche?: string; bio?: string;
  profile_photo_url?: string; instagram_url?: string; youtube_url?: string;
  twitter_url?: string; tiktok_url?: string; website_url?: string;
  followers_count?: string; referral_code: string; created_at: string;
};
type FeedItem = {
  video_id: string; candidate_id: string; video_url: string;
  platform?: string; caption?: string; created_at: string;
  influencer_name: string; niche?: string; bio?: string;
  profile_photo_url?: string; instagram_url?: string; youtube_url?: string;
  twitter_url?: string; tiktok_url?: string; website_url?: string;
  referral_code: string;
};
type Reaction = { video_id: string; reaction_type: string; user_key: string };
type VComment = { id: string; video_id: string; commenter_name: string; comment_text: string; created_at: string };
type PComment = { id: string; influencer_candidate_id: string; commenter_name: string; comment_text: string; created_at: string };

type DashVideo = {
  id: string; script_id?: string; video_url: string; platform?: string;
  caption?: string; status: string; admin_note?: string;
  created_at: string; is_pinned?: boolean; view_count?: number;
};
type Earning = {
  id?: string; order_id?: string; purchase_amount: number;
  commission_amount: number; status: string; created_at: string;
};
type DashData = {
  candidate: { id: string; name: string; email: string; stage: string };
  social: { referral_code: string; referral_status: string; niche?: string; followers_count?: string; instagram_url?: string; youtube_url?: string } | null;
  referral_link: string | null;
  stats: { signups: number; purchases: number; earnings: number };
  available_balance?: number;
  pending_withdrawal?: { id: string; amount: number; status: string; requested_at: string } | null;
  signup_list: { full_name: string; email: string; created_at: string }[];
  purchase_list: Earning[];
  scripts: { id: string; title: string; description?: string; script_text?: string }[];
  videos: DashVideo[];
  video_engagement: Record<string, { reactions: Record<string, number>; comments: number; views: number }>;
};

const REACTIONS = [
  { type: "like", emoji: "👍", label: "Like",  Icon: ThumbsUp },
  { type: "love", emoji: "❤️", label: "Love",  Icon: Heart },
  { type: "fire", emoji: "🔥", label: "Fire",  Icon: Flame },
  { type: "wow",  emoji: "😮", label: "Wow",   Icon: Smile },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function getUserKey(): string {
  if (typeof window === "undefined") return "anon";
  let k = localStorage.getItem("__hub_uk");
  if (!k) { k = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("__hub_uk", k); }
  return k;
}
function getStoredCid(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("__inf_cid");
}
function storeCid(cid: string) {
  if (typeof window !== "undefined") localStorage.setItem("__inf_cid", cid);
}
function clearCid() {
  if (typeof window !== "undefined") localStorage.removeItem("__inf_cid");
}

function Initials({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const parts = name.trim().split(" ");
  const init = ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  const s = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-xl" : "h-10 w-10 text-sm";
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 font-black text-white shadow ${s}`}>
      {init}
    </div>
  );
}
function Avatar({ name, url, size = "md" }: { name: string; url?: string; size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-14 w-14" : "h-10 w-10";
  if (url) return <img src={url} alt={name} className={`${s} shrink-0 rounded-full object-cover shadow`} />;
  return <Initials name={name} size={size} />;
}
function PlatformBadge({ platform }: { platform?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    instagram: { label: "📸 Instagram", cls: "bg-gradient-to-r from-pink-500 to-rose-500" },
    youtube:   { label: "▶ YouTube",    cls: "bg-gradient-to-r from-rose-600 to-red-600" },
    facebook:  { label: "👥 Facebook",  cls: "bg-blue-600" },
    tiktok:    { label: "🎵 TikTok",    cls: "bg-[#010101]" },
    other:     { label: "🔗 Other",     cls: "bg-slate-600" },
  };
  const p = map[platform?.toLowerCase() ?? ""] ?? map["other"];
  return <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black text-white ${p.cls}`}>{p.label}</span>;
}
function SocialLinks({ inf }: { inf: Influencer | FeedItem }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {inf.instagram_url && <a href={inf.instagram_url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-1 text-[11px] font-black text-white transition hover:scale-105">📸 Instagram</a>}
      {inf.youtube_url   && <a href={inf.youtube_url}   target="_blank" rel="noopener noreferrer" className="rounded-full bg-gradient-to-r from-rose-600 to-red-600 px-3 py-1 text-[11px] font-black text-white transition hover:scale-105">▶ YouTube</a>}
      {inf.twitter_url   && <a href={inf.twitter_url}   target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#1d9bf0] px-3 py-1 text-[11px] font-black text-white transition hover:scale-105">𝕏 Twitter</a>}
      {inf.tiktok_url    && <a href={inf.tiktok_url}    target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#010101] border border-white/20 px-3 py-1 text-[11px] font-black text-white transition hover:scale-105">🎵 TikTok</a>}
      {inf.website_url   && <a href={inf.website_url}   target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-black text-slate-700 transition hover:scale-105 dark:border-white/20 dark:bg-white/10 dark:text-white"><Globe className="h-3 w-3" /> Website</a>}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function InfluencerHubPage() {
  const { darkMode } = useTheme();

  // Hub data
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [feed, setFeed]               = useState<FeedItem[]>([]);
  const [reactions, setReactions]     = useState<Reaction[]>([]);
  const [vComments, setVComments]     = useState<VComment[]>([]);
  const [pComments, setPComments]     = useState<PComment[]>([]);
  const [hubLoading, setHubLoading]   = useState(true);

  // Active tab — default from localStorage or "feed"
  const [activeTab, setActiveTab] = useState<"feed" | "creators" | "dashboard">("feed");

  // Dashboard
  const [dashCid, setDashCid]       = useState<string>("");
  const [dashEmail, setDashEmail]   = useState<string>("");
  const [dashData, setDashData]     = useState<DashData | null>(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [dashError, setDashError]   = useState<string | null>(null);
  const [dashCopied, setDashCopied] = useState(false);
  const [dashLoginMode, setDashLoginMode] = useState(false);

  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [expandedProfile,  setExpandedProfile]  = useState<string | null>(null);
  const [vcForms, setVcForms] = useState<Record<string, { name: string; text: string; sending: boolean }>>({});
  const [pcForms, setPcForms] = useState<Record<string, { name: string; text: string; sending: boolean }>>({});

  const userKey = typeof window !== "undefined" ? getUserKey() : "anon";

  // ── Load hub data ──
  async function loadHub() {
    setHubLoading(true);
    const r = await fetch("/api/influencer-hub");
    const d = await r.json();
    if (d.ok) {
      setInfluencers(d.influencers);
      setFeed(d.feed);
      setReactions(d.reactions);
      setVComments(d.video_comments);
      setPComments(d.profile_comments);
    }
    setHubLoading(false);
  }

  // ── Auto-login from localStorage ──
  useEffect(() => {
    loadHub();
    const stored = getStoredCid();
    if (stored) {
      setDashCid(stored);
      loadDashboard(stored);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load dashboard ──
  async function loadDashboard(cid: string) {
    if (!cid.trim()) return;
    setDashLoading(true);
    setDashError(null);
    const r = await fetch(`/api/careers/influencer/dashboard?cid=${cid.trim()}`);
    const d = await r.json();
    setDashLoading(false);
    if (d.ok) {
      setDashData(d);
      storeCid(cid.trim());
      setActiveTab("dashboard");
    } else {
      setDashError(d.error ?? "Not found");
    }
  }

  async function loginByEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!dashEmail.trim()) return;
    setDashLoading(true);
    setDashError(null);
    const r = await fetch("/api/careers/influencer/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: dashEmail.trim() }),
    });
    const d = await r.json();
    setDashLoading(false);
    if (d.ok) {
      setDashCid(d.cid);
      await loadDashboard(d.cid);
    } else {
      setDashError(d.error ?? "Not found. Check your email.");
    }
  }

  function logoutDashboard() {
    clearCid();
    setDashData(null);
    setDashCid("");
    setDashEmail("");
    setActiveTab("feed");
    setDashLoginMode(false);
  }

  // ── Reactions ──
  async function react(video_id: string, reaction_type: string) {
    setReactions(prev => {
      const existing = prev.find(r => r.video_id === video_id && r.user_key === userKey);
      if (existing) {
        if (existing.reaction_type === reaction_type) return prev.filter(r => !(r.video_id === video_id && r.user_key === userKey));
        return prev.map(r => r.video_id === video_id && r.user_key === userKey ? { ...r, reaction_type } : r);
      }
      return [...prev, { video_id, user_key: userKey, reaction_type }];
    });
    await fetch("/api/influencer-hub", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "video_reaction", video_id, user_key: userKey, reaction_type }),
    });
  }

  // ── Video comment ──
  async function postVideoComment(video_id: string) {
    const f = vcForms[video_id] ?? { name: "", text: "", sending: false };
    if (!f.name.trim() || !f.text.trim()) return;
    setVcForms(p => ({ ...p, [video_id]: { ...f, sending: true } }));
    const res = await fetch("/api/influencer-hub", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "video_comment", video_id, commenter_name: f.name, comment_text: f.text }),
    });
    const d = await res.json();
    if (d.ok) {
      setVComments(p => [...p, { id: Date.now().toString(), video_id, commenter_name: f.name, comment_text: f.text, created_at: new Date().toISOString() }]);
      setVcForms(p => ({ ...p, [video_id]: { name: f.name, text: "", sending: false } }));
    } else {
      setVcForms(p => ({ ...p, [video_id]: { ...f, sending: false } }));
    }
  }

  // ── Profile comment ──
  async function postProfileComment(influencer_candidate_id: string) {
    const f = pcForms[influencer_candidate_id] ?? { name: "", text: "", sending: false };
    if (!f.name.trim() || !f.text.trim()) return;
    setPcForms(p => ({ ...p, [influencer_candidate_id]: { ...f, sending: true } }));
    const res = await fetch("/api/influencer-hub", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "profile_comment", influencer_candidate_id, commenter_name: f.name, comment_text: f.text }),
    });
    const d = await res.json();
    if (d.ok) {
      setPComments(p => [...p, { id: Date.now().toString(), influencer_candidate_id, commenter_name: f.name, comment_text: f.text, created_at: new Date().toISOString() }]);
      setPcForms(p => ({ ...p, [influencer_candidate_id]: { name: f.name, text: "", sending: false } }));
    } else {
      setPcForms(p => ({ ...p, [influencer_candidate_id]: { ...f, sending: false } }));
    }
  }

  // ── Styles ──
  const bg      = darkMode ? "bg-[#0a0d14]" : "bg-[#f1f3f8]";
  const card    = darkMode ? "bg-[#111827] border-white/10" : "bg-white border-slate-200";
  const muted   = darkMode ? "text-slate-400" : "text-slate-500";
  const inputCls = `w-full rounded-full border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/30 ${darkMode ? "border-white/10 bg-white/5 text-white placeholder-white/30" : "border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400"}`;
  const fmtAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  // ── Video player ──
  function VideoPlayer({ url, platform }: { url: string; platform?: string }) {
    const isVideo = /\.(mp4|mov|webm|ogg)(\?|$)/i.test(url);
    const isYouTube = /youtube\.com|youtu\.be/.test(url);
    if (isVideo) return (
      <video controls className="max-h-96 w-full rounded-xl bg-black object-contain" preload="metadata">
        <source src={url} />
      </video>
    );
    if (isYouTube) {
      const videoId = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1];
      if (videoId) return (
        <iframe className="aspect-video w-full rounded-xl" src={`https://www.youtube.com/embed/${videoId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      );
    }
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className={`flex items-center justify-center gap-3 rounded-xl border p-6 transition hover:border-purple-400 ${card}`}>
        <ExternalLink className="h-6 w-6 text-purple-500" />
        <span className="text-sm font-bold">Watch on {platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "Platform"} →</span>
      </a>
    );
  }

  // ── Reaction Bar ──
  function ReactionBar({ video_id }: { video_id: string }) {
    const myReaction = reactions.find(r => r.video_id === video_id && r.user_key === userKey)?.reaction_type;
    const counts = REACTIONS.reduce((acc, r) => {
      acc[r.type] = reactions.filter(x => x.video_id === video_id && x.reaction_type === r.type).length;
      return acc;
    }, {} as Record<string, number>);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {REACTIONS.map(r => (
            <button key={r.type} onClick={() => react(video_id, r.type)} title={r.label}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition hover:scale-110 ${
                myReaction === r.type
                  ? "bg-purple-500/20 text-purple-400 ring-1 ring-purple-400/40"
                  : darkMode ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}>
              <span>{r.emoji}</span>
              {counts[r.type] > 0 && <span className="tabular-nums">{counts[r.type]}</span>}
            </button>
          ))}
        </div>
        {total > 0 && <span className={`text-xs ${muted}`}>{total} reaction{total !== 1 ? "s" : ""}</span>}
      </div>
    );
  }

  // ── Feed Post ──
  function FeedPost({ item }: { item: FeedItem }) {
    const videoComments = vComments.filter(c => c.video_id === item.video_id);
    const showComments = expandedComments[item.video_id];
    const f = vcForms[item.video_id] ?? { name: "", text: "", sending: false };
    return (
      <article className={`overflow-hidden rounded-2xl border ${card} shadow-sm`}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <Avatar name={item.influencer_name} url={item.profile_photo_url} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-sm">{item.influencer_name}</span>
              {item.niche && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-black text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">{item.niche}</span>}
              <PlatformBadge platform={item.platform} />
            </div>
            <p className={`text-[11px] ${muted}`}>{fmtAgo(item.created_at)}</p>
          </div>
        </div>
        <div className="px-4"><VideoPlayer url={item.video_url} platform={item.platform} /></div>
        {item.caption && (
          <div className="px-4 pt-3">
            <p className="text-sm leading-relaxed"><span className="font-black">{item.influencer_name}</span> <span className={muted}>{item.caption}</span></p>
          </div>
        )}
        <div className="px-4 pt-3"><SocialLinks inf={item} /></div>
        <div className={`border-t px-4 py-3 ${darkMode ? "border-white/10" : "border-slate-100"}`}>
          <ReactionBar video_id={item.video_id} />
        </div>
        <div className={`border-t ${darkMode ? "border-white/10" : "border-slate-100"}`}>
          <button onClick={() => setExpandedComments(p => ({ ...p, [item.video_id]: !showComments }))}
            className={`flex w-full items-center gap-2 px-4 py-2.5 text-xs font-bold transition ${muted} hover:text-purple-500`}>
            <MessageCircle className="h-4 w-4" />
            {videoComments.length > 0 ? `${videoComments.length} comment${videoComments.length !== 1 ? "s" : ""}` : "Add a comment"}
            {showComments ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />}
          </button>
          {showComments && (
            <div className={`border-t px-4 pb-4 pt-3 ${darkMode ? "border-white/10" : "border-slate-100"}`}>
              {videoComments.length > 0 && (
                <div className="mb-3 space-y-2.5 max-h-48 overflow-y-auto">
                  {videoComments.map(c => (
                    <div key={c.id} className="flex gap-2.5">
                      <Initials name={c.commenter_name} size="sm" />
                      <div className={`rounded-2xl px-3 py-2 text-xs flex-1 ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
                        <span className="font-black">{c.commenter_name}</span>
                        <span className={`ml-1.5 ${muted}`}>{c.comment_text}</span>
                        <p className={`mt-0.5 text-[10px] ${muted}`}>{fmtAgo(c.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <div className="flex-1 space-y-1.5">
                  <input value={f.name} placeholder="Your name" onChange={e => setVcForms(p => ({ ...p, [item.video_id]: { ...f, name: e.target.value } }))} className={inputCls} />
                  <div className="flex gap-2">
                    <input value={f.text} placeholder="Write a comment…" onChange={e => setVcForms(p => ({ ...p, [item.video_id]: { ...f, text: e.target.value } }))} onKeyDown={e => { if (e.key === "Enter") postVideoComment(item.video_id); }} className={`${inputCls} flex-1`} />
                    <button onClick={() => postVideoComment(item.video_id)} disabled={f.sending || !f.name.trim() || !f.text.trim()}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white transition hover:bg-purple-500 disabled:opacity-40">
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </article>
    );
  }

  // ── Creator Card ──
  function CreatorCard({ inf }: { inf: Influencer }) {
    const infComments = pComments.filter(c => c.influencer_candidate_id === inf.candidate_id);
    const isExpanded = expandedProfile === inf.candidate_id;
    const f = pcForms[inf.candidate_id] ?? { name: "", text: "", sending: false };
    return (
      <div className={`overflow-hidden rounded-2xl border ${card} shadow-sm`}>
        <div className="p-4">
          <div className="flex gap-3">
            <Avatar name={inf.name} url={inf.profile_photo_url} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start gap-1.5">
                <h3 className="font-black">{inf.name}</h3>
                {inf.niche && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-black text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">{inf.niche}</span>}
              </div>
              {inf.followers_count && <p className={`mt-0.5 text-[11px] font-bold ${muted}`}>👥 {Number(inf.followers_count).toLocaleString("en-IN")} followers</p>}
              {inf.bio && <p className={`mt-1 text-xs leading-relaxed ${muted} line-clamp-2`}>{inf.bio}</p>}
            </div>
          </div>
          <div className="mt-3"><SocialLinks inf={inf} /></div>
          <button onClick={() => setExpandedProfile(isExpanded ? null : inf.candidate_id)}
            className={`mt-3 flex items-center gap-1.5 text-xs font-bold transition ${muted} hover:text-purple-500`}>
            <MessageCircle className="h-3.5 w-3.5" />
            {infComments.length > 0 ? `${infComments.length} comment${infComments.length !== 1 ? "s" : ""}` : "Say something…"}
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
        {isExpanded && (
          <div className={`border-t px-4 pb-4 pt-3 ${darkMode ? "border-white/10" : "border-slate-100"}`}>
            {infComments.length > 0 && (
              <div className="mb-3 space-y-2">
                {infComments.slice(-5).map(c => (
                  <div key={c.id} className="flex gap-2">
                    <Initials name={c.commenter_name} size="sm" />
                    <div className={`rounded-2xl px-3 py-2 text-xs flex-1 ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
                      <span className="font-black">{c.commenter_name}</span>
                      <span className={`ml-1.5 ${muted}`}>{c.comment_text}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-1.5">
              <input value={f.name} placeholder="Your name" onChange={e => setPcForms(p => ({ ...p, [inf.candidate_id]: { ...f, name: e.target.value } }))} className={inputCls} />
              <div className="flex gap-2">
                <input value={f.text} placeholder="Leave a comment…" onChange={e => setPcForms(p => ({ ...p, [inf.candidate_id]: { ...f, text: e.target.value } }))} onKeyDown={e => { if (e.key === "Enter") postProfileComment(inf.candidate_id); }} className={`${inputCls} flex-1`} />
                <button onClick={() => postProfileComment(inf.candidate_id)} disabled={f.sending || !f.name.trim() || !f.text.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white transition hover:bg-purple-500 disabled:opacity-40">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Dashboard Tab ──
  function DashboardTab() {
    const [copied, setCopied] = useState(false);

    // Withdraw flow
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawMsg, setWithdrawMsg] = useState<string | null>(null);
    const [withdrawErr, setWithdrawErr] = useState<string | null>(null);
    const [upiInput, setUpiInput] = useState("");
    const [showUpiForm, setShowUpiForm] = useState(false);

    function copyLink() {
      if (!dashData?.referral_link) return;
      navigator.clipboard.writeText(dashData.referral_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    function isValidUpiClient(u: string) {
      return /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(u.trim());
    }

    async function requestWithdraw() {
      if (!dashData) return;
      const cid = dashData.candidate.id;
      const avail = dashData.available_balance ?? 0;
      if (avail <= 0) {
        setWithdrawErr("No balance available to withdraw yet.");
        return;
      }
      if (!isValidUpiClient(upiInput)) {
        setWithdrawErr("Please enter a valid UPI ID (e.g. yourname@okhdfc).");
        return;
      }
      if (!window.confirm(`Withdraw ₹${avail.toLocaleString("en-IN")} to ${upiInput.trim()}?\n\nThe amount will be transferred to this UPI within 24 hours.`)) {
        return;
      }
      setWithdrawing(true);
      setWithdrawErr(null);
      setWithdrawMsg(null);
      try {
        const r = await fetch("/api/careers/influencer/withdraw-earnings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cid, upi: upiInput.trim() }),
        });
        const d = await r.json();
        if (d.ok) {
          setWithdrawMsg(d.message || "Withdrawal requested! Transfer within 24 hours.");
          setShowUpiForm(false);
          setUpiInput("");
          // Refresh dashboard so the pending state shows.
          loadDashboard(cid);
        } else {
          setWithdrawErr(d.error || "Could not request withdrawal.");
        }
      } catch {
        setWithdrawErr("Network error. Please try again.");
      }
      setWithdrawing(false);
    }

    // Not logged in yet
    if (!dashData) {
      return (
        <div className="mx-auto max-w-md py-10">
          <div className={`rounded-3xl border p-8 shadow-xl ${card}`}>
            <div className="text-center">
              <p className="text-5xl">🌟</p>
              <h2 className="mt-3 text-xl font-black">Creator Dashboard</h2>
              <p className={`mt-1 text-sm ${muted}`}>Enter your registered email to access your dashboard.</p>
            </div>
            {dashError && <p className="mt-3 rounded-xl border border-rose-400/30 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{dashError}</p>}
            <form onSubmit={loginByEmail} className="mt-6 space-y-3">
              <input type="email" required value={dashEmail} onChange={e => setDashEmail(e.target.value)}
                placeholder="your@email.com" className={inputCls} />
              <button type="submit" disabled={dashLoading}
                className="w-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 py-3 text-sm font-black text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-50">
                {dashLoading ? "Checking…" : "Access My Dashboard →"}
              </button>
            </form>
            <p className={`mt-4 text-center text-xs ${muted}`}>
              Not yet a creator?{" "}
              <Link href="/careers/influencer" className="font-black text-purple-500 hover:underline">Apply here →</Link>
            </p>
          </div>
        </div>
      );
    }

    const { candidate, social, referral_link, stats, purchase_list, signup_list, videos, video_engagement } = dashData;
    const pending = purchase_list.filter(e => e.status === "pending").reduce((s, e) => s + e.commission_amount, 0);
    const paid    = purchase_list.filter(e => e.status === "paid").reduce((s, e) => s + e.commission_amount, 0);

    const videoStatusColor: Record<string, string> = {
      approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
      pending:  "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
      rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    };

    return (
      <div className="mx-auto max-w-2xl space-y-5 py-6">

        {/* Header card */}
        <div className={`rounded-2xl border p-5 ${card}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Initials name={candidate.name} size="lg" />
              <div>
                <p className="font-black text-lg">{candidate.name}</p>
                <p className={`text-xs ${muted}`}>{candidate.email}</p>
                {social?.niche && <span className="mt-1 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-black text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">{social.niche}</span>}
              </div>
            </div>
            <button onClick={logoutDashboard} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition hover:border-rose-400 hover:text-rose-500 ${muted} ${darkMode ? "border-white/10" : "border-slate-200"}`}>
              <X className="h-3.5 w-3.5" /> Logout
            </button>
          </div>

          {/* Referral Link */}
          {referral_link && (
            <div className="mt-4 rounded-xl border border-purple-200/50 bg-purple-50/60 p-3 dark:border-purple-400/20 dark:bg-purple-500/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-600">Your Referral Link</p>
              <div className="mt-1.5 flex items-center gap-2">
                <p className="flex-1 truncate rounded-lg bg-white px-3 py-1.5 text-xs font-mono font-bold text-slate-700 dark:bg-white/5 dark:text-white">{referral_link}</p>
                <button onClick={copyLink}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-purple-500 px-3 py-1.5 text-xs font-black text-white transition hover:bg-purple-600">
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Signups", value: stats.signups, icon: "👥", color: "from-blue-400 to-indigo-500" },
            { label: "Sales",   value: stats.purchases, icon: "🛒", color: "from-emerald-400 to-teal-500" },
            { label: "Earned",  value: `₹${stats.earnings.toLocaleString("en-IN")}`, icon: "💰", color: "from-purple-400 to-pink-500" },
            { label: "Pending", value: `₹${pending.toLocaleString("en-IN")}`, icon: "⏳", color: "from-amber-400 to-orange-500" },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border p-4 ${card}`}>
              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow text-sm`}>{s.icon}</div>
              <p className={`mt-2 text-[10px] font-black uppercase tracking-wider ${muted}`}>{s.label}</p>
              <p className="mt-0.5 text-xl font-black">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Withdraw card */}
        <div className={`rounded-2xl border p-5 ${card}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-wider ${muted}`}>Available to withdraw</p>
              <p className="mt-0.5 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{(dashData.available_balance ?? 0).toLocaleString("en-IN")}
              </p>
              <p className={`mt-1 text-[11px] ${muted}`}>
                💸 Payouts are transferred to your registered account within 24 hours.
              </p>
            </div>
            <div className="shrink-0">
              {dashData.pending_withdrawal ? (
                <div className="rounded-xl border border-amber-300/40 bg-amber-50 px-4 py-3 text-center dark:border-amber-400/20 dark:bg-amber-500/10">
                  <p className="text-xs font-black text-amber-700 dark:text-amber-300">
                    ⏳ ₹{dashData.pending_withdrawal.amount.toLocaleString("en-IN")} requested
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    Transferring within 24 hours
                  </p>
                </div>
              ) : showUpiForm ? (
                <div className="w-full sm:w-72">
                  <label className={`mb-1 block text-[10px] font-black uppercase tracking-wider ${muted}`}>
                    Your UPI ID
                  </label>
                  <input
                    value={upiInput}
                    onChange={e => setUpiInput(e.target.value)}
                    placeholder="yourname@okhdfc"
                    autoFocus
                    className={inputCls}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={requestWithdraw}
                      disabled={withdrawing}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <IndianRupee className="h-4 w-4" />
                      {withdrawing ? "Processing…" : "Confirm Withdraw"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowUpiForm(false); setWithdrawErr(null); }}
                      className={`rounded-full border px-4 py-2.5 text-sm font-bold ${darkMode ? "border-white/10 text-white/60" : "border-slate-200 text-slate-500"}`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setShowUpiForm(true); setWithdrawErr(null); setWithdrawMsg(null); }}
                  disabled={(dashData.available_balance ?? 0) <= 0}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <IndianRupee className="h-4 w-4" />
                  Withdraw Earnings
                </button>
              )}
            </div>
          </div>
          {withdrawMsg && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-300/40 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{withdrawMsg}</span>
            </div>
          )}
          {withdrawErr && (
            <p className="mt-3 rounded-xl border border-rose-300/40 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300">
              {withdrawErr}
            </p>
          )}
        </div>

        {/* Videos section */}
        <div className={`rounded-2xl border ${card}`}>
          <div className="flex items-center justify-between px-5 py-4">
            <p className="font-black">🎬 My Videos</p>
            <Link href={`/careers/influencer/dashboard?cid=${candidate.id}`}
              className="flex items-center gap-1.5 rounded-full bg-purple-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-purple-500">
              <Edit3 className="h-3 w-3" /> Full Dashboard
            </Link>
          </div>
          {videos.length === 0 ? (
            <p className={`px-5 pb-5 text-sm ${muted}`}>No videos submitted yet.</p>
          ) : (
            <div className="space-y-3 px-5 pb-5">
              {videos.map(v => {
                const eng = video_engagement[v.id] ?? { reactions: {}, comments: 0, views: 0 };
                const totalReactions = Object.values(eng.reactions).reduce((a, b) => a + b, 0);
                return (
                  <div key={v.id} className={`rounded-xl border p-4 ${darkMode ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {v.platform && <PlatformBadge platform={v.platform} />}
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${videoStatusColor[v.status] ?? videoStatusColor.pending}`}>
                            {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                          </span>
                          {v.is_pinned && <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-black text-yellow-700">📌 Pinned</span>}
                        </div>
                        {v.caption && <p className={`mt-1.5 text-xs ${muted} line-clamp-2`}>{v.caption}</p>}
                        {v.admin_note && v.status === "rejected" && (
                          <p className="mt-1 text-xs font-bold text-rose-500">Note: {v.admin_note}</p>
                        )}
                      </div>
                      <a href={v.video_url} target="_blank" rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1 rounded-lg bg-purple-600 px-2.5 py-1.5 text-[10px] font-black text-white transition hover:bg-purple-500">
                        <Eye className="h-3 w-3" /> View
                      </a>
                    </div>

                    {/* Engagement stats */}
                    <div className={`mt-3 flex items-center gap-4 text-xs font-bold ${muted}`}>
                      <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {eng.views} views</span>
                      <span>👍❤️🔥😮 {totalReactions} reactions</span>
                      <span><MessageCircle className="inline h-3.5 w-3.5" /> {eng.comments} comments</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Referral Signups ── */}
        <div className={`rounded-2xl border ${card}`}>
          <div className="flex items-center justify-between px-5 py-4">
            <p className="font-black">👥 Signups via Your Link</p>
            <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
              (signup_list?.length ?? 0) > 0
                ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                : darkMode ? "bg-white/5 text-white/40" : "bg-slate-100 text-slate-400"
            }`}>{signup_list?.length ?? 0} total</span>
          </div>
          {!signup_list || signup_list.length === 0 ? (
            <div className="px-5 pb-5">
              <p className={`text-sm ${muted}`}>No signups yet. Share your referral link to start tracking!</p>
              {referral_link && (
                <div className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 ${darkMode ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50"}`}>
                  <span className="text-xs font-mono font-bold truncate flex-1">{referral_link}</span>
                  <button onClick={copyLink} className="shrink-0 text-xs font-black text-purple-600 dark:text-purple-300 hover:underline">Copy</button>
                </div>
              )}
            </div>
          ) : (
            <div className="px-5 pb-5 space-y-2">
              {signup_list.map((s, i) => (
                <div key={i} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-white bg-gradient-to-br from-blue-400 to-indigo-500`}>
                      {(s.full_name || s.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{s.full_name || "User"}</p>
                      <p className={`text-[11px] ${muted}`}>{s.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[11px] font-bold ${muted}`}>
                      {new Date(s.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    <span className="text-[10px] font-black text-blue-500">✅ Signed up</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent earnings */}
        {purchase_list.length > 0 && (
          <div className={`rounded-2xl border ${card}`}>
            <p className="px-5 py-4 font-black">💰 Recent Earnings</p>
            <div className="space-y-2 px-5 pb-5">
              {purchase_list.slice(0, 5).map((e, i) => (
                <div key={i} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${darkMode ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50"}`}>
                  <div>
                    <p className="text-sm font-black">₹{e.purchase_amount.toLocaleString("en-IN")} purchase</p>
                    <p className={`text-[10px] ${muted}`}>{new Date(e.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600">+₹{e.commission_amount.toLocaleString("en-IN")}</p>
                    <span className={`text-[10px] font-black ${e.status === "paid" ? "text-emerald-500" : "text-amber-500"}`}>
                      {e.status === "paid" ? "✅ Paid" : "⏳ Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <Link href={`/careers/influencer/dashboard?cid=${candidate.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 text-sm font-black text-white shadow-xl transition hover:scale-[1.02]">
            View Full Dashboard →
          </Link>
        </div>
      </div>
    );
  }

  // ── Render ──
  const tabs = [
    { id: "feed",      label: "📽️ Feed" },
    { id: "creators",  label: "👥 Creators" },
    { id: "dashboard", label: dashData ? `🌟 ${dashData.candidate.name.split(" ")[0]}` : "🔐 My Dashboard" },
  ] as const;

  return (
    <div className={`relative min-h-screen ${bg}`}>
      <PageDoodles variant="influencer" glow grid />

      {/* Top bar */}
      <div className={`sticky top-[72px] z-30 border-b ${darkMode ? "bg-[#0a0d14]/95 border-white/10" : "bg-[#f1f3f8]/95 border-slate-200"} backdrop-blur`}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="hidden text-lg font-black sm:block">🌟 Influencer Hub</h1>
            {/* Tab bar */}
            <div className={`flex rounded-full border p-0.5 text-xs font-black overflow-hidden ${darkMode ? "border-white/10" : "border-slate-200"}`}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`rounded-full px-3 py-1.5 transition sm:px-4 ${activeTab === t.id ? "bg-purple-600 text-white shadow" : muted + " hover:text-purple-500"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <Link href="/careers/influencer"
            className="hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-xs font-black text-white shadow transition hover:scale-[1.02] sm:inline-flex">
            <Star className="h-3.5 w-3.5" /> Become a Creator
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Feed Tab */}
        {activeTab === "feed" && (
          hubLoading ? (
            <div className={`flex items-center justify-center py-24 text-sm ${muted}`}>Loading feed…</div>
          ) : (
            <div className="mx-auto max-w-xl space-y-5">
              {feed.length === 0 ? (
                <div className={`rounded-2xl border p-16 text-center ${card}`}>
                  <p className="text-4xl">🎬</p>
                  <h2 className="mt-4 text-xl font-black">No videos yet</h2>
                  <p className={`mt-2 text-sm ${muted}`}>When creators upload approved videos, they'll appear here.</p>
                  <Link href="/careers/influencer" className="mt-5 inline-block rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2.5 text-xs font-black text-white shadow">Join as Creator →</Link>
                </div>
              ) : (
                feed.map(item => <FeedPost key={item.video_id} item={item} />)
              )}
            </div>
          )
        )}

        {/* Creators Tab */}
        {activeTab === "creators" && (
          hubLoading ? (
            <div className={`flex items-center justify-center py-24 text-sm ${muted}`}>Loading creators…</div>
          ) : influencers.length === 0 ? (
            <div className={`rounded-2xl border p-16 text-center ${card}`}>
              <Users className={`mx-auto h-12 w-12 ${muted}`} />
              <h2 className="mt-4 text-xl font-black">No creators yet</h2>
              <p className={`mt-2 text-sm ${muted}`}>Be the first!</p>
              <Link href="/careers/influencer" className="mt-5 inline-block rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2.5 text-xs font-black text-white shadow">Apply Now →</Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {influencers.map(inf => <CreatorCard key={inf.candidate_id} inf={inf} />)}
            </div>
          )
        )}

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && <DashboardTab />}
      </div>
    </div>
  );
}
