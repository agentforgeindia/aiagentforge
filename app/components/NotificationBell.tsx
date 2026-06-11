"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { supabase } from "@/lib/supabase";

type Item = {
  id: string;
  title: string;
  body?: string | null;
  link?: string | null;
  created_at: string;
  kind: "broadcast" | "user";
  is_read?: boolean;
};

const SEEN_KEY = "af_announce_last_seen";

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const { darkMode } = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState(0);
  const tokenRef = useRef<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token ?? null;
    tokenRef.current = token;

    const [annRes, userRes] = await Promise.all([
      fetch("/api/announcements", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => ({})),
      token
        ? fetch("/api/user-notifications", {
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.json())
            .catch(() => ({}))
        : Promise.resolve({}),
    ]);

    const ann: Item[] = (annRes?.announcements ?? []).map((a: any) => ({
      ...a,
      kind: "broadcast" as const,
    }));
    const usr: Item[] = (userRes?.notifications ?? []).map((n: any) => ({
      ...n,
      kind: "user" as const,
    }));
    const merged = [...ann, ...usr].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    setItems(merged);
  };

  useEffect(() => {
    setLastSeen(Number(localStorage.getItem(SEEN_KEY) || 0));
    load();
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = items.filter((a) =>
    a.kind === "user"
      ? !a.is_read
      : new Date(a.created_at).getTime() > lastSeen,
  ).length;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const now = Date.now();
      localStorage.setItem(SEEN_KEY, String(now));
      setLastSeen(now);
      // Mark personal notifications read.
      if (tokenRef.current) {
        fetch("/api/user-notifications", {
          method: "POST",
          headers: { Authorization: `Bearer ${tokenRef.current}` },
        }).catch(() => {});
        setItems((prev) =>
          prev.map((i) => (i.kind === "user" ? { ...i, is_read: true } : i)),
        );
      }
    }
  };

  const muted = darkMode ? "text-white/55" : "text-black/55";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition ${
          darkMode
            ? "bg-white/10 text-white hover:bg-white/15"
            : "bg-black/5 text-black hover:bg-black/10"
        }`}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 top-12 z-[9999] w-80 overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-2xl ${
            darkMode
              ? "border-white/10 bg-[#0b1220]/98 text-white"
              : "border-black/10 bg-white/98 text-black"
          }`}
        >
          <div
            className={`border-b px-4 py-3 text-sm font-black ${
              darkMode ? "border-white/10" : "border-black/10"
            }`}
          >
            Notifications
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className={`px-4 py-8 text-center text-sm ${muted}`}>
                No notifications yet.
              </p>
            ) : (
              items.map((a) => (
                <div
                  key={`${a.kind}-${a.id}`}
                  className={`border-b px-4 py-3 last:border-b-0 ${
                    darkMode ? "border-white/5" : "border-black/5"
                  }`}
                >
                  <p className="text-sm font-bold">{a.title}</p>
                  {a.body && (
                    <p className={`mt-1 text-xs leading-5 ${muted}`}>{a.body}</p>
                  )}
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className={`text-[10px] ${muted}`}>
                      {timeAgo(a.created_at)}
                    </span>
                    {a.link && (
                      <a
                        href={a.link}
                        className="text-[11px] font-bold text-cyan-500 hover:underline"
                      >
                        View →
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
