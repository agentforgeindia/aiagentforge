"use client";

// /influencer-hub — Public page: browse all active influencer profiles, follow, comment

import { useEffect, useState } from "react";
import Link from "next/link";
import { Instagram, Youtube, Twitter, Globe, MessageCircle, Send, ExternalLink, Star, Users } from "lucide-react";
import { useTheme } from "@/app/components/ThemeProvider";

type Influencer = {
  candidate_id: string; name: string; niche?: string; bio?: string;
  profile_photo_url?: string; instagram_url?: string; youtube_url?: string;
  twitter_url?: string; tiktok_url?: string; website_url?: string;
  followers_count?: string; referral_code: string; created_at: string;
};

type Comment = {
  id: string; influencer_candidate_id: string; commenter_name: string;
  comment_text: string; created_at: string;
};

export default function InfluencerHubPage() {
  const { darkMode } = useTheme();
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Comment form state per influencer
  const [commentForm, setCommentForm] = useState<Record<string, { name: string; text: string; sending: boolean; sent: boolean }>>({});

  useEffect(() => {
    fetch("/api/influencer-hub")
      .then(r => r.json())
      .then(d => {
        if (d.ok) { setInfluencers(d.influencers); setComments(d.comments); }
      })
      .finally(() => setLoading(false));
  }, []);

  function getForm(id: string) {
    return commentForm[id] ?? { name: "", text: "", sending: false, sent: false };
  }
  function setForm(id: string, patch: Partial<typeof commentForm[string]>) {
    setCommentForm(prev => ({ ...prev, [id]: { ...getForm(id), ...patch } }));
  }

  async function postComment(influencer_candidate_id: string) {
    const f = getForm(influencer_candidate_id);
    if (!f.name.trim() || !f.text.trim()) return;
    setForm(influencer_candidate_id, { sending: true });
    try {
      const res = await fetch("/api/influencer-hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ influencer_candidate_id, commenter_name: f.name, comment_text: f.text }),
      });
      const d = await res.json();
      if (d.ok) {
        setForm(influencer_candidate_id, { name: "", text: "", sent: true, sending: false });
        setComments(prev => [...prev, {
          id: Date.now().toString(), influencer_candidate_id,
          commenter_name: f.name, comment_text: f.text,
          created_at: new Date().toISOString(),
        }]);
        setTimeout(() => setForm(influencer_candidate_id, { sent: false }), 3000);
      } else {
        alert(d.error ?? "Could not post comment.");
        setForm(influencer_candidate_id, { sending: false });
      }
    } catch {
      alert("Network error.");
      setForm(influencer_candidate_id, { sending: false });
    }
  }

  const card = darkMode ? "border-white/10 bg-[#111827]" : "border-slate-200 bg-white";
  const mutedCls = darkMode ? "text-slate-400" : "text-slate-500";
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  function Initials({ name }: { name: string }) {
    const parts = name.trim().split(" ");
    const init = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-xl font-black text-white shadow-lg">
        {init.toUpperCase()}
      </div>
    );
  }

  const NICHE_COLORS: Record<string, string> = {
    fashion: "from-pink-400 to-rose-500",
    jewellery: "from-amber-400 to-orange-500",
    textile: "from-emerald-400 to-teal-500",
    tech: "from-blue-400 to-indigo-500",
    fitness: "from-green-400 to-emerald-600",
    food: "from-orange-400 to-red-500",
    beauty: "from-pink-400 to-fuchsia-500",
  };
  const nicheColor = (n?: string) => NICHE_COLORS[n?.toLowerCase() ?? ""] ?? "from-purple-400 to-pink-500";

  return (
    <main className={`min-h-screen ${darkMode ? "bg-[#0a0d14] text-white" : "bg-[#f8f9fc] text-slate-900"}`}>

      {/* ── Hero ── */}
      <div className={`relative overflow-hidden ${darkMode ? "bg-[#0d1017]" : "bg-white"} border-b ${darkMode ? "border-white/10" : "border-slate-100"}`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,#a855f722,transparent_55%),radial-gradient(circle_at_bottom_left,#ec489915,transparent_55%)]" />
        <div className="relative mx-auto max-w-5xl px-5 py-16 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-400/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-purple-400">
            🌟 Influencer Hub
          </div>
          <h1 className="text-4xl font-black sm:text-5xl">
            Meet Our{" "}
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Creator Community
            </span>
          </h1>
          <p className={`mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed ${mutedCls}`}>
            These are the content creators and influencers who partner with AgentForge AI.
            Follow them on their platforms, leave a comment, and support their work.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/careers/influencer" className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2.5 text-xs font-black text-white shadow-lg transition hover:scale-[1.02]">
              <Star className="mr-1.5 inline h-3.5 w-3.5" /> Join as Influencer
            </Link>
            <Link href="/" className={`rounded-full border px-6 py-2.5 text-xs font-black transition hover:scale-[1.02] ${card}`}>
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* ── Influencer Grid ── */}
      <div className="mx-auto max-w-5xl px-5 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className={`text-sm ${mutedCls}`}>Loading creators…</div>
          </div>
        ) : influencers.length === 0 ? (
          <div className={`rounded-3xl border p-16 text-center ${card}`}>
            <Users className={`mx-auto h-12 w-12 ${mutedCls}`} />
            <h2 className="mt-4 text-xl font-black">No creators yet</h2>
            <p className={`mt-2 text-sm ${mutedCls}`}>Be the first to join our influencer programme!</p>
            <Link href="/careers/influencer" className="mt-5 inline-block rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2.5 text-xs font-black text-white shadow">Apply Now →</Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {influencers.map(inf => {
              const infComments = comments.filter(c => c.influencer_candidate_id === inf.candidate_id);
              const isExpanded = expandedId === inf.candidate_id;
              const f = getForm(inf.candidate_id);

              return (
                <div key={inf.candidate_id} className={`flex flex-col overflow-hidden rounded-3xl border transition ${card} ${isExpanded ? "sm:col-span-2 lg:col-span-3" : ""}`}>
                  {/* Card header */}
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {inf.profile_photo_url ? (
                        <img src={inf.profile_photo_url} alt={inf.name}
                          className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-lg" />
                      ) : (
                        <Initials name={inf.name} />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start gap-2">
                          <h2 className="text-base font-black">{inf.name}</h2>
                          {inf.niche && (
                            <span className={`rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[10px] font-black text-white ${nicheColor(inf.niche)}`}>
                              {inf.niche}
                            </span>
                          )}
                        </div>
                        {inf.followers_count && (
                          <p className={`mt-0.5 text-[11px] font-bold ${mutedCls}`}>
                            <Users className="mr-0.5 inline h-3 w-3" /> {Number(inf.followers_count).toLocaleString("en-IN")} followers
                          </p>
                        )}
                        {inf.bio && (
                          <p className={`mt-1.5 text-xs leading-relaxed ${mutedCls} line-clamp-2`}>{inf.bio}</p>
                        )}
                      </div>
                    </div>

                    {/* Social links */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {inf.instagram_url && (
                        <a href={inf.instagram_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-1.5 text-[11px] font-black text-white shadow transition hover:scale-[1.04]">
                          <Instagram className="h-3.5 w-3.5" /> Instagram
                        </a>
                      )}
                      {inf.youtube_url && (
                        <a href={inf.youtube_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-3 py-1.5 text-[11px] font-black text-white shadow transition hover:scale-[1.04]">
                          <Youtube className="h-3.5 w-3.5" /> YouTube
                        </a>
                      )}
                      {inf.twitter_url && (
                        <a href={inf.twitter_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#1d9bf0] px-3 py-1.5 text-[11px] font-black text-white shadow transition hover:scale-[1.04]">
                          <Twitter className="h-3.5 w-3.5" /> Twitter / X
                        </a>
                      )}
                      {inf.tiktok_url && (
                        <a href={inf.tiktok_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#010101] px-3 py-1.5 text-[11px] font-black text-white shadow transition hover:scale-[1.04]">
                          🎵 TikTok
                        </a>
                      )}
                      {inf.website_url && (
                        <a href={inf.website_url} target="_blank" rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black transition hover:scale-[1.04] ${card}`}>
                          <Globe className="h-3.5 w-3.5" /> Website
                        </a>
                      )}
                    </div>

                    {/* Expand / Comments toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : inf.candidate_id)}
                      className={`mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold transition ${mutedCls} hover:text-purple-400`}>
                      <MessageCircle className="h-3.5 w-3.5" />
                      {infComments.length > 0 ? `${infComments.length} comment${infComments.length !== 1 ? "s" : ""}` : "Leave a comment"}
                      {isExpanded ? " ↑" : " ↓"}
                    </button>
                  </div>

                  {/* Expanded: comments + form */}
                  {isExpanded && (
                    <div className={`border-t px-5 pb-5 pt-4 ${darkMode ? "border-white/10" : "border-slate-100"}`}>
                      {inf.bio && (
                        <div className={`mb-4 rounded-xl border p-3 text-xs leading-relaxed ${mutedCls} ${darkMode ? "border-white/10 bg-white/[0.03]" : "border-slate-100 bg-slate-50"}`}>
                          {inf.bio}
                        </div>
                      )}

                      {/* Comments list */}
                      {infComments.length > 0 && (
                        <div className="mb-4 space-y-2">
                          {infComments.map(c => (
                            <div key={c.id} className={`rounded-xl border p-3 ${darkMode ? "border-white/10 bg-white/[0.03]" : "border-slate-100 bg-slate-50"}`}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-black">{c.commenter_name}</span>
                                <span className={`text-[10px] ${mutedCls}`}>{fmt(c.created_at)}</span>
                              </div>
                              <p className={`mt-1 text-xs leading-relaxed ${mutedCls}`}>{c.comment_text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comment form */}
                      {f.sent ? (
                        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-500">
                          ✅ Comment posted! Thank you.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            value={f.name}
                            onChange={e => setForm(inf.candidate_id, { name: e.target.value })}
                            placeholder="Your name"
                            className={`w-full rounded-xl border px-3 py-2 text-xs font-medium placeholder-slate-400 focus:outline-none ${darkMode ? "border-white/10 bg-white/5 text-white placeholder-white/30 focus:border-purple-400" : "border-slate-200 bg-white text-slate-700 focus:border-purple-400"}`}
                          />
                          <div className="flex gap-2">
                            <input
                              value={f.text}
                              onChange={e => setForm(inf.candidate_id, { text: e.target.value })}
                              placeholder="Leave a comment…"
                              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); postComment(inf.candidate_id); } }}
                              className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium placeholder-slate-400 focus:outline-none ${darkMode ? "border-white/10 bg-white/5 text-white placeholder-white/30 focus:border-purple-400" : "border-slate-200 bg-white text-slate-700 focus:border-purple-400"}`}
                            />
                            <button
                              onClick={() => postComment(inf.candidate_id)}
                              disabled={f.sending || !f.name.trim() || !f.text.trim()}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white transition hover:bg-purple-500 disabled:opacity-40">
                              <Send className="h-3.5 w-3.5" />
                            </button>
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

        {/* Join CTA */}
        {!loading && influencers.length > 0 && (
          <div className={`mt-12 rounded-3xl border p-8 text-center ${card}`}>
            <h2 className="text-xl font-black">Want to be featured here?</h2>
            <p className={`mt-2 text-sm ${mutedCls}`}>Apply to join the AgentForge Influencer Programme. Create content, share your link, and earn commission on every sale.</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/careers/influencer" className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-xs font-black text-white shadow-lg transition hover:scale-[1.02]">
                <Star className="mr-1.5 inline h-3.5 w-3.5" /> Apply Now
              </Link>
              <Link href="/careers/influencer" className={`rounded-full border px-5 py-3 text-xs font-black transition hover:scale-[1.02] ${card}`}>
                Already a partner? Access Dashboard →
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
