"use client";

// ============================================================
// AI Social Publisher — shared UI + in-memory store (PREVIEW)
// Colours stay inside the AgentForge theme: cyan / blue / purple,
// slate for neutral, emerald only for "published". No orange/red.
// ============================================================

import React, { createContext, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { FaInstagram, FaFacebookF, FaYoutube, FaLinkedinIn, FaXTwitter, FaPinterestP } from "react-icons/fa6";
import { Info } from "lucide-react";
import { useTheme } from "@/app/components/ThemeProvider";
import { STATUS_META, SAMPLE_ACCOUNTS, buildSamplePosts, type PlatformId, type PostStatus, type Post, type Account } from "./data";

export function useStyles() {
  const { darkMode } = useTheme();
  return {
    darkMode,
    pageBg: darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]",
    card: darkMode ? "border-white/10 bg-white/[0.045]" : "border-black/10 bg-white/90",
    soft: darkMode ? "border-white/10 bg-white/[0.03]" : "border-black/[0.07] bg-white",
    muted: darkMode ? "text-white/55" : "text-black/55",
    line: darkMode ? "border-white/10" : "border-black/[0.07]",
    input: `w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-300/40 ${
      darkMode ? "border-white/10 bg-black/20 text-white placeholder:text-white/30" : "border-black/10 bg-white text-slate-900 placeholder:text-slate-400"
    }`,
    ghostBtn: darkMode
      ? "border border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/10"
      : "border border-black/10 bg-white text-slate-700 hover:border-cyan-300 hover:text-slate-900",
    primaryBtn:
      "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:brightness-105 disabled:opacity-40 disabled:shadow-none",
    selected: "border-cyan-400 bg-cyan-50 text-slate-900 ring-2 ring-cyan-300/50 dark:bg-cyan-400/10 dark:text-white",
  };
}

/** true only after hydration — keeps date text out of SSR. */
export function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

// ── Platform icon (theme-tinted, never brand red/orange) ─────
const ICON: Record<PlatformId, React.ComponentType<{ className?: string }>> = {
  instagram: FaInstagram,
  facebook: FaFacebookF,
  youtube: FaYoutube,
  linkedin: FaLinkedinIn,
  x: FaXTwitter,
  pinterest: FaPinterestP,
};

export function PlatformIcon({ id, size = "md" }: { id: PlatformId; size?: "xs" | "sm" | "md" | "lg" }) {
  const Icon = ICON[id];
  const box = { xs: "h-4 w-4 rounded", sm: "h-6 w-6 rounded-lg", md: "h-8 w-8 rounded-xl", lg: "h-11 w-11 rounded-2xl" }[size];
  const ic = { xs: "h-2.5 w-2.5", sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" }[size];
  return (
    <span className={`inline-flex shrink-0 items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white ${box}`}>
      <Icon className={ic} />
    </span>
  );
}

export function AccountAvatar({ account, size = "md" }: { account: Account; size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-xs";
  return (
    <span className="relative inline-flex shrink-0">
      <span className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 font-black text-white ${box}`}>
        {account.name.slice(0, 1).toUpperCase()}
      </span>
      <span className="absolute -bottom-1 -right-1 rounded ring-2 ring-white dark:ring-[#0b1220]">
        <PlatformIcon id={account.platform} size="xs" />
      </span>
    </span>
  );
}

export function StatusPill({ status }: { status: PostStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${m.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function PreviewBanner() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-2.5 text-xs font-semibold text-cyan-800 dark:text-cyan-200">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <span>Layout preview — sample data. Abhi kuch publish ya save nahi hoga.</span>
    </div>
  );
}

// ── In-memory store shared by Planner / Posts / Composer ─────
type Store = {
  posts: Post[];
  accounts: Account[];
  upsertPost: (p: Post) => void;
  setStatus: (id: string, status: PostStatus) => void;
  composer: { open: boolean; editing: Post | null; presetDate: Date | null };
  openComposer: (opts?: { editing?: Post | null; presetDate?: Date | null }) => void;
  closeComposer: () => void;
};

const StoreCtx = createContext<Store | null>(null);

export function PublisherStoreProvider({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [statusOverride, setStatusOverride] = useState<Record<string, PostStatus>>({});
  const [composer, setComposer] = useState<Store["composer"]>({ open: false, editing: null, presetDate: null });

  // Sample posts are built from the current date on the client only.
  const posts = useMemo(() => {
    const samples = mounted ? buildSamplePosts(new Date()) : [];
    const byId = new Map<string, Post>();
    [...samples, ...userPosts].forEach((p) => byId.set(p.id, p));
    return [...byId.values()].map((p) => (statusOverride[p.id] ? { ...p, status: statusOverride[p.id] } : p));
  }, [mounted, userPosts, statusOverride]);

  const store: Store = {
    posts,
    accounts: SAMPLE_ACCOUNTS,
    upsertPost: (p) => setUserPosts((prev) => [...prev.filter((x) => x.id !== p.id), p]),
    setStatus: (id, status) => setStatusOverride((prev) => ({ ...prev, [id]: status })),
    composer,
    openComposer: (opts) => setComposer({ open: true, editing: opts?.editing ?? null, presetDate: opts?.presetDate ?? null }),
    closeComposer: () => setComposer({ open: false, editing: null, presetDate: null }),
  };

  return <StoreCtx.Provider value={store}>{children}</StoreCtx.Provider>;
}

export function usePublisherStore() {
  const s = useContext(StoreCtx);
  if (!s) throw new Error("usePublisherStore must be used inside PublisherStoreProvider");
  return s;
}

// ── Date helpers ──────────────────────────────────────────────
export const fmtTime = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
export const fmtDay = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
export const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
export function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday
  return x;
}
export function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return { date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, time: `${p(d.getHours())}:${p(d.getMinutes())}` };
}
