"use client";

// Post detail drawer (Planner + Posts). PREVIEW: actions only change sample state.

import React from "react";
import { X, Pencil, Ban, RotateCcw, CheckCircle2, AlertCircle, Clock3 } from "lucide-react";
import type { Post } from "./data";
import { useStyles, usePublisherStore, AccountAvatar, StatusPill, fmtDay, fmtTime } from "./ui";

export default function PostSheet({ post, onClose }: { post: Post; onClose: () => void }) {
  const { darkMode, muted, ghostBtn, primaryBtn, line } = useStyles();
  const { accounts, openComposer, setStatus } = usePublisherStore();
  const at = post.at ? new Date(post.at) : null;
  const editable = post.status === "scheduled" || post.status === "draft";

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-stretch sm:justify-end" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border shadow-2xl sm:max-h-none sm:rounded-none sm:rounded-l-3xl ${
          darkMode ? "border-white/10 bg-[#0b1220] text-white" : "border-black/10 bg-white text-slate-900"
        }`}
      >
        <div className={`flex items-center justify-between border-b px-5 py-4 ${line}`}>
          <StatusPill status={post.status} />
          <button type="button" onClick={onClose} className={`rounded-full p-2 ${ghostBtn}`} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="flex gap-2 overflow-x-auto">
            {post.media.map((m) => (
              <img key={m.id} src={m.url} alt="" className="h-40 w-32 shrink-0 rounded-xl object-cover" />
            ))}
          </div>

          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${muted}`}>When</p>
            <p className="mt-1 text-sm font-black">{at ? `${fmtDay(at)} · ${fmtTime(at)} IST` : "Time set nahi hai"}</p>
          </div>

          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${muted}`}>Caption</p>
            <p className="mt-1 whitespace-pre-line text-sm">{post.caption || <span className={muted}>—</span>}</p>
          </div>

          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${muted}`}>Accounts</p>
            <div className="mt-2 space-y-2">
              {post.accountIds.map((id) => {
                const a = accounts.find((x) => x.id === id);
                if (!a) return null;
                const r = post.results?.find((x) => x.accountId === id);
                return (
                  <div key={id} className={`rounded-xl border p-2.5 ${line}`}>
                    <div className="flex items-center gap-2.5">
                      <AccountAvatar account={a} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm font-bold">{a.name}</span>
                      {r ? (
                        r.ok ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Posted</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-violet-600"><AlertCircle className="h-4 w-4" /> Not posted</span>
                        )
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${muted}`}><Clock3 className="h-4 w-4" /> Waiting</span>
                      )}
                    </div>
                    {r?.error && <p className="mt-1.5 text-xs text-violet-700 dark:text-violet-300">{r.error}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`flex gap-2 border-t px-5 py-3.5 ${line}`}>
          {editable && (
            <>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openComposer({ editing: post });
                }}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-black ${primaryBtn}`}
              >
                <Pencil className="h-4 w-4" /> Edit / Reschedule
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus(post.id, "cancelled");
                  onClose();
                }}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold ${ghostBtn}`}
              >
                <Ban className="h-4 w-4" /> Cancel
              </button>
            </>
          )}
          {(post.status === "failed" || post.status === "partially_published") && (
            <button type="button" className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-black ${primaryBtn}`}>
              <RotateCcw className="h-4 w-4" /> Retry failed
            </button>
          )}
          {(post.status === "published" || post.status === "cancelled") && (
            <button type="button" onClick={onClose} className={`inline-flex flex-1 items-center justify-center rounded-full px-4 py-2.5 text-sm font-bold ${ghostBtn}`}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
