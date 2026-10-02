"use client";

// ============================================================
// /ai-social-publisher — Planner (LAYOUT PREVIEW)
// Meta-planner style: Week / Month calendar of scheduled posts.
// No content creation here — only scheduling existing content.
// ============================================================

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Post } from "./_components/data";
import {
  useStyles,
  useMounted,
  usePublisherStore,
  PlatformIcon,
  fmtTime,
  sameDay,
  startOfWeek,
} from "./_components/ui";
import { STATUS_META } from "./_components/data";
import PostSheet from "./_components/PostSheet";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function PlannerPage() {
  const { darkMode, card, muted, ghostBtn, line } = useStyles();
  const mounted = useMounted();
  const { posts, accounts, openComposer } = usePublisherStore();
  const [view, setView] = useState<"week" | "month">("week");
  const [shift, setShift] = useState(0);
  const [accountFilter, setAccountFilter] = useState("all");
  const [open, setOpen] = useState<Post | null>(null);
  const [mobileDay, setMobileDay] = useState<number | null>(null);

  const today = useMemo(() => (mounted ? new Date() : null), [mounted]);

  const visible = useMemo(
    () =>
      posts
        .filter((p) => p.at && p.status !== "cancelled")
        .filter((p) => accountFilter === "all" || p.accountIds.includes(accountFilter))
        .sort((a, b) => +new Date(a.at!) - +new Date(b.at!)),
    [posts, accountFilter],
  );
  const postsOn = (d: Date) => visible.filter((p) => sameDay(new Date(p.at!), d));

  const range = useMemo(() => {
    if (!today) return null;
    if (view === "week") {
      const start = startOfWeek(today);
      start.setDate(start.getDate() + shift * 7);
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
      const label = `${days[0].toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
      return { days, label };
    }
    const first = new Date(today.getFullYear(), today.getMonth() + shift, 1);
    const start = startOfWeek(first);
    const days = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
    return { days, label: first.toLocaleDateString("en-IN", { month: "long", year: "numeric" }), month: first.getMonth() };
  }, [today, view, shift]);

  const isPastDay = (d: Date) => !!today && d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedMobileIdx = mobileDay ?? (range && today ? Math.max(0, range.days.findIndex((d) => sameDay(d, today))) : 0);

  return (
    <section className={`rounded-3xl border p-3 shadow-xl shadow-cyan-900/5 backdrop-blur-xl sm:p-5 ${card}`}>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setShift(0); setMobileDay(null); }} className={`rounded-full px-3.5 py-2 text-sm font-bold ${ghostBtn}`}>
            Today
          </button>
          <button type="button" onClick={() => { setShift((s) => s - 1); setMobileDay(0); }} className={`rounded-full p-2 ${ghostBtn}`} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => { setShift((s) => s + 1); setMobileDay(0); }} className={`rounded-full p-2 ${ghostBtn}`} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </button>
          <h2 className="ml-1 text-base font-black sm:text-lg">{range?.label ?? "—"}</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className={`min-w-0 flex-1 rounded-full px-3.5 py-2 text-sm font-bold outline-none md:flex-none ${ghostBtn}`}
          >
            <option value="all">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <div className={`inline-flex rounded-full p-0.5 ${darkMode ? "bg-white/10" : "bg-black/5"}`}>
            {(["week", "month"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => { setView(v); setShift(0); setMobileDay(null); }}
                className={`rounded-full px-3.5 py-1.5 text-sm font-bold capitalize ${view === v ? (darkMode ? "bg-white/15" : "bg-white shadow-sm") : muted}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!range || !today ? (
        <div className="mt-5 h-[420px] animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
      ) : view === "week" ? (
        <>
          {/* Desktop / tablet: 7 columns */}
          <div className="mt-5 hidden grid-cols-7 gap-2 md:grid">
            {range.days.map((d, i) => {
              const items = postsOn(d);
              const isToday = sameDay(d, today);
              const past = isPastDay(d);
              return (
                <div key={i} className={`group flex min-h-[460px] flex-col rounded-2xl border p-2 ${line} ${isToday ? "bg-cyan-50/60 dark:bg-cyan-400/5" : ""}`}>
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className={`text-xs font-bold ${muted}`}>{DAYS[i]}</span>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-black ${isToday ? "bg-blue-600 text-white" : ""}`}>{d.getDate()}</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    {items.map((p) => (
                      <PostCard key={p.id} post={p} onClick={() => setOpen(p)} />
                    ))}
                  </div>
                  {!past && (
                    <button
                      type="button"
                      onClick={() => openComposer({ presetDate: d })}
                      className={`mt-2 flex items-center justify-center gap-1 rounded-xl border border-dashed py-2 text-xs font-bold opacity-0 transition group-hover:opacity-100 focus:opacity-100 ${line} ${muted}`}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile: day strip + list */}
          <div className="mt-4 md:hidden">
            <div className="grid grid-cols-7 gap-1">
              {range.days.map((d, i) => {
                const active = i === selectedMobileIdx;
                const has = postsOn(d).length > 0;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMobileDay(i)}
                    className={`flex flex-col items-center rounded-2xl py-2 ${active ? "bg-blue-600 text-white" : ""}`}
                  >
                    <span className={`text-[10px] font-bold ${active ? "text-white/80" : muted}`}>{DAYS[i].slice(0, 2)}</span>
                    <span className="text-base font-black">{d.getDate()}</span>
                    <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${has ? (active ? "bg-white" : "bg-cyan-500") : "bg-transparent"}`} />
                  </button>
                );
              })}
            </div>
            <div className="mt-3 space-y-2">
              {(() => {
                const d = range.days[selectedMobileIdx];
                const items = postsOn(d);
                if (items.length === 0)
                  return (
                    <div className={`rounded-2xl border border-dashed p-6 text-center text-sm ${line} ${muted}`}>
                      Is din koi post nahi.
                      {!isPastDay(d) && (
                        <button type="button" onClick={() => openComposer({ presetDate: d })} className="mt-2 block w-full font-black text-blue-600">
                          + Post schedule karo
                        </button>
                      )}
                    </div>
                  );
                return items.map((p) => <PostRow key={p.id} post={p} onClick={() => setOpen(p)} />);
              })()}
            </div>
          </div>
        </>
      ) : (
        /* Month view */
        <div className="mt-5">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {DAYS.map((d) => (
              <div key={d} className={`pb-1 text-center text-[11px] font-bold ${muted}`}>
                <span className="sm:hidden">{d.slice(0, 1)}</span>
                <span className="hidden sm:inline">{d}</span>
              </div>
            ))}
            {range.days.map((d, i) => {
              const items = postsOn(d);
              const inMonth = d.getMonth() === range.month;
              const isToday = sameDay(d, today);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => (items[0] ? setOpen(items[0]) : !isPastDay(d) && openComposer({ presetDate: d }))}
                  className={`flex min-h-[64px] flex-col rounded-xl border p-1 text-left transition hover:border-cyan-300 sm:min-h-[104px] sm:p-1.5 ${line} ${inMonth ? "" : "opacity-40"}`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${isToday ? "bg-blue-600 text-white" : ""}`}>{d.getDate()}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {items.slice(0, 3).map((p) => (
                      <img key={p.id} src={p.media[0]?.url} alt="" className="h-5 w-5 rounded object-cover sm:h-8 sm:w-8 sm:rounded-md" />
                    ))}
                    {items.length > 3 && <span className={`text-[10px] font-bold ${muted}`}>+{items.length - 3}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className={`mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold ${muted}`}>
        {(["scheduled", "published", "draft", "failed"] as const).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`} /> {STATUS_META[s].label}
          </span>
        ))}
      </div>

      {open && <PostSheet post={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  const { soft, muted } = useStyles();
  const { accounts } = usePublisherStore();
  const platforms = Array.from(new Set(post.accountIds.map((id) => accounts.find((a) => a.id === id)?.platform).filter(Boolean)));
  return (
    <button type="button" onClick={onClick} className={`block w-full overflow-hidden rounded-xl border text-left transition hover:-translate-y-0.5 hover:shadow-md ${soft}`}>
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-[11px] font-black">{fmtTime(new Date(post.at!))}</span>
        <span className={`h-2 w-2 rounded-full ${STATUS_META[post.status].dot}`} title={STATUS_META[post.status].label} />
      </div>
      <img src={post.media[0]?.url} alt="" className="aspect-square w-full object-cover" />
      <div className="flex items-center gap-1 px-2 py-1.5">
        {platforms.map((p) => (
          <PlatformIcon key={p} id={p!} size="xs" />
        ))}
        <span className={`ml-auto truncate text-[10px] ${muted}`}>{post.media.length > 1 ? `${post.media.length} photos` : ""}</span>
      </div>
    </button>
  );
}

function PostRow({ post, onClick }: { post: Post; onClick: () => void }) {
  const { soft, muted } = useStyles();
  const { accounts } = usePublisherStore();
  const platforms = Array.from(new Set(post.accountIds.map((id) => accounts.find((a) => a.id === id)?.platform).filter(Boolean)));
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left ${soft}`}>
      <img src={post.media[0]?.url} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-black">
          {fmtTime(new Date(post.at!))}
          <span className={`h-2 w-2 rounded-full ${STATUS_META[post.status].dot}`} />
        </span>
        <span className={`block truncate text-xs ${muted}`}>{post.caption}</span>
      </span>
      <span className="flex gap-1">
        {platforms.map((p) => (
          <PlatformIcon key={p} id={p!} size="sm" />
        ))}
      </span>
    </button>
  );
}
