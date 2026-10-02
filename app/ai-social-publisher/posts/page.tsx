"use client";

// /ai-social-publisher/posts — simple list of posts by status (PREVIEW)

import React, { useMemo, useState } from "react";
import type { Post, PostStatus } from "../_components/data";
import { useStyles, useMounted, usePublisherStore, PlatformIcon, StatusPill, fmtDay, fmtTime } from "../_components/ui";
import PostSheet from "../_components/PostSheet";

const TABS: { key: string; label: string; match: PostStatus[] }[] = [
  { key: "scheduled", label: "Scheduled", match: ["scheduled"] },
  { key: "published", label: "Published", match: ["published", "partially_published"] },
  { key: "drafts", label: "Drafts", match: ["draft"] },
  { key: "attention", label: "Needs attention", match: ["failed", "partially_published"] },
];

export default function PostsPage() {
  const { card, soft, muted, ghostBtn, line } = useStyles();
  const mounted = useMounted();
  const { posts, accounts, openComposer } = usePublisherStore();
  const [tab, setTab] = useState("scheduled");
  const [open, setOpen] = useState<Post | null>(null);

  const t = TABS.find((x) => x.key === tab)!;
  const list = useMemo(() => {
    const rows = posts.filter((p) => t.match.includes(p.status));
    const dir = tab === "scheduled" || tab === "drafts" ? 1 : -1;
    return rows.sort((a, b) => dir * ((a.at ? +new Date(a.at) : 0) - (b.at ? +new Date(b.at) : 0)));
  }, [posts, t, tab]);

  const count = (k: string) => posts.filter((p) => TABS.find((x) => x.key === k)!.match.includes(p.status)).length;

  return (
    <section className={`rounded-3xl border p-3 shadow-xl shadow-cyan-900/5 backdrop-blur-xl sm:p-5 ${card}`}>
      <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1">
        {TABS.map((x) => (
          <button
            key={x.key}
            type="button"
            onClick={() => setTab(x.key)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${tab === x.key ? "bg-blue-600 text-white" : ghostBtn}`}
          >
            {x.label}
            {mounted && <span className={`rounded-full px-1.5 text-[11px] ${tab === x.key ? "bg-white/25" : "bg-black/5 dark:bg-white/10"}`}>{count(x.key)}</span>}
          </button>
        ))}
      </div>

      {!mounted ? (
        <div className="mt-5 h-64 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
      ) : list.length === 0 ? (
        <div className={`mt-5 rounded-2xl border border-dashed p-10 text-center text-sm ${line} ${muted}`}>
          Yahan abhi kuch nahi.
          <button type="button" onClick={() => openComposer()} className="mt-2 block w-full font-black text-blue-600">
            + Schedule post
          </button>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-black/[0.06] dark:divide-white/10">
          {list.map((p) => {
            const at = p.at ? new Date(p.at) : null;
            const accs = p.accountIds.map((id) => accounts.find((a) => a.id === id)).filter(Boolean);
            return (
              <button key={p.id} type="button" onClick={() => setOpen(p)} className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                <img src={p.media[0]?.url} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{p.caption || "No caption"}</span>
                  <span className={`mt-0.5 block text-xs ${muted}`}>{at ? `${fmtDay(at)} · ${fmtTime(at)}` : "No time set"}</span>
                  <span className="mt-1.5 flex items-center gap-1.5 sm:hidden">
                    <StatusPill status={p.status} />
                  </span>
                </span>
                <span className="hidden items-center gap-1 sm:flex">
                  {accs.map((a) => (
                    <span key={a!.id} className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-bold ${soft}`}>
                      <PlatformIcon id={a!.platform} size="xs" /> {a!.name}
                    </span>
                  ))}
                </span>
                <span className="hidden w-36 justify-end sm:flex">
                  <StatusPill status={p.status} />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {open && <PostSheet post={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
