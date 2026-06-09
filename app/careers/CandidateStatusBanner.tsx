"use client";

// CandidateStatusBanner — polls for stage-change notifications every 30s.
// Drop anywhere in a candidate-facing career page.
// Reads candidate_id from localStorage key "__cc_id".
// Shows a slide-in notification toast when admin updates the stage.

import { useEffect, useState, useCallback } from "react";
import { X, Bell, CheckCircle2 } from "lucide-react";

type Notif = {
  id:         string;
  type:       string;
  title:      string;
  body?:      string;
  stage?:     string;
  is_read:    boolean;
  created_at: string;
};

const STAGE_COLOR: Record<string, { bar: string; icon: string }> = {
  hired:             { bar: "from-emerald-400 to-teal-500",   icon: "🚀" },
  selected:          { bar: "from-purple-500 to-pink-500",    icon: "🎉" },
  offer_sent:        { bar: "from-blue-400 to-indigo-500",    icon: "📨" },
  offer_accepted:    { bar: "from-emerald-400 to-emerald-600",icon: "✅" },
  interview_scheduled: { bar: "from-cyan-400 to-blue-500",   icon: "📅" },
  rejected:          { bar: "from-slate-400 to-slate-600",    icon: "💌" },
  talent_pool:       { bar: "from-amber-400 to-orange-500",   icon: "🌟" },
};

export default function CandidateStatusBanner() {
  const [cid, setCid]           = useState<string | null>(null);
  const [queue, setQueue]       = useState<Notif[]>([]);   // unread to show
  const [current, setCurrent]   = useState<Notif | null>(null);
  const [visible, setVisible]   = useState(false);

  // ── Read cid from localStorage ──
  useEffect(() => {
    const stored = localStorage.getItem("__cc_id");
    if (stored) setCid(stored);
  }, []);

  // ── Poll every 30s ──
  const poll = useCallback(async (id: string) => {
    try {
      const r = await fetch(`/api/careers/candidate/notifications?cid=${id}`);
      const d = await r.json();
      if (!d.ok) return;
      const unread = (d.notifications as Notif[]).filter(n => !n.is_read);
      if (unread.length > 0) {
        setQueue(prev => {
          // only add truly new ones (not already in queue or shown)
          const existingIds = new Set(prev.map(n => n.id));
          const fresh = unread.filter(n => !existingIds.has(n.id));
          return fresh.length > 0 ? [...prev, ...fresh] : prev;
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!cid) return;
    poll(cid);
    const iv = setInterval(() => poll(cid), 30_000);
    return () => clearInterval(iv);
  }, [cid, poll]);

  // ── Show next in queue ──
  useEffect(() => {
    if (current || queue.length === 0) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    setCurrent(next);
    // small delay → CSS transition in
    setTimeout(() => setVisible(true), 50);
  }, [queue, current]);

  async function dismiss() {
    setVisible(false);
    setTimeout(() => setCurrent(null), 400);
    if (current && cid) {
      await fetch("/api/careers/candidate/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cid, ids: [current.id] }),
      });
    }
  }

  if (!current) return null;

  const style = STAGE_COLOR[current.stage ?? ""] ?? { bar: "from-purple-500 to-pink-500", icon: "🔔" };

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-[9999] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 transition-all duration-400 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl shadow-2xl">
        {/* gradient top bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${style.bar}`} />

        <div className="bg-white px-5 py-4 dark:bg-[#111827]">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${style.bar} text-xl shadow`}>
              {style.icon}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="font-black text-slate-900 dark:text-white">{current.title}</p>
              {current.body && (
                <p className="mt-0.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {current.body}
                </p>
              )}
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                AgentForge Careers
              </p>
            </div>

            {/* Close */}
            <button
              onClick={dismiss}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-400 hover:text-slate-600 dark:border-white/10 dark:hover:border-white/30 dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={dismiss}
              className={`flex items-center gap-1.5 rounded-full bg-gradient-to-r ${style.bar} px-4 py-1.5 text-xs font-black text-white shadow transition hover:scale-[1.02]`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Got it!
            </button>
            {queue.length > 0 && (
              <span className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-500 dark:border-white/10 dark:text-slate-400">
                <Bell className="h-3 w-3" /> +{queue.length} more
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
