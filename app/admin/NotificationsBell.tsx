"use client";

// ============================================================
// NotificationsBell — top-bar inbox for the admin console.
// ============================================================
// • Polls admin_unread_count() every 60 s while the tab is
//   visible (pauses when hidden — saves DB load + battery).
// • Click bell → dropdown with last 20 entries from
//   list_admin_notifications().
// • Per-row click → mark_notification_read + navigate to target.
// • "Mark all read" button at the bottom.
// ============================================================

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Inbox,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Notification = {
  id: string;
  type: string;
  severity: "info" | "success" | "warning" | "critical";
  title: string;
  body: string | null;
  target_url: string | null;
  created_at: string;
  is_read: boolean;
};

const SEVERITY_DOT: Record<string, string> = {
  info:     "bg-sky-500",
  success:  "bg-emerald-500",
  warning:  "bg-amber-500",
  critical: "bg-rose-500",
};

const POLL_MS = 60_000;

export default function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function refreshCount() {
    const { data, error } = await supabase.rpc("admin_unread_count");
    if (!error && typeof data === "number") setUnread(data);
  }

  async function loadList() {
    setLoadingList(true);
    const { data, error } = await supabase.rpc("list_admin_notifications", {
      p_limit: 20,
    });
    if (!error && Array.isArray(data)) {
      setItems(data as Notification[]);
    }
    setLoadingList(false);
  }

  // First load + visibility-aware polling.
  useEffect(() => {
    let interval: number | null = null;
    refreshCount();

    function start() {
      if (interval !== null) return;
      interval = window.setInterval(refreshCount, POLL_MS);
    }
    function stop() {
      if (interval !== null) {
        window.clearInterval(interval);
        interval = null;
      }
    }
    function onVis() {
      if (document.visibilityState === "visible") {
        refreshCount();
        start();
      } else {
        stop();
      }
    }
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // When the dropdown opens, fetch the list AND treat "opening" as
  // seen — mark everything read so the badge clears. Only NEW
  // notifications arriving afterwards light the bell up again.
  useEffect(() => {
    if (!open) return;
    (async () => {
      await loadList();
      await supabase.rpc("mark_all_notifications_read");
      setUnread(0);
    })();
  }, [open]);

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleItemClick(n: Notification) {
    if (!n.is_read) {
      await supabase.rpc("mark_notification_read", { p_notification_id: n.id });
      setItems((prev) =>
        prev.map((i) => (i.id === n.id ? { ...i, is_read: true } : i)),
      );
      setUnread((u) => Math.max(0, u - 1));
    }
    setOpen(false);
    if (n.target_url) {
      router.push(n.target_url);
    }
  }

  async function markAllRead() {
    await supabase.rpc("mark_all_notifications_read");
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
    setUnread(0);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-[360px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-[#11141a]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Notifications {unread > 0 && `· ${unread} unread`}
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loadingList ? (
              <p className="p-6 text-center text-sm text-slate-500">Loading…</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Inbox className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">No notifications yet.</p>
                <p className="text-[11px] text-slate-400">
                  New leads, payments and refunds will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(n)}
                      className={`group flex w-full items-start gap-2 px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                        n.is_read ? "" : "bg-indigo-50/50 dark:bg-indigo-500/5"
                      }`}
                    >
                      <span
                        className={`mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOT[n.severity] ?? SEVERITY_DOT.info}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm ${
                            n.is_read
                              ? "text-slate-600 dark:text-slate-400"
                              : "font-bold text-slate-900 dark:text-slate-100"
                          }`}
                        >
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {n.body}
                          </p>
                        )}
                        <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                      {n.severity === "critical" && (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-slate-200 px-3 py-2 text-right dark:border-slate-800">
              <Link
                href="/admin/audit"
                onClick={() => setOpen(false)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-300"
              >
                View audit trail →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const sec = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
