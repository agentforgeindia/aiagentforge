"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeProvider";
import { supabase } from "@/lib/supabase";
import {
  BadgeCheck,
  Calendar,
  Check,
  ChevronLeft,
  Filter,
  ImageIcon,
  MapPin,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  X as XIcon,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   ADMIN EMAILS — only these users can access this page.
   👉 Replace the placeholder below with your real login email.
   You can add multiple admins by adding more strings to this array.
   ──────────────────────────────────────────────────────────────── */
const ADMIN_EMAILS: string[] = [
  "info@aiagentforge.in",
  "info.agentforge@gmail.com", // 👈 REPLACE THIS with your admin email
];

type AgentType = "textile" | "jewellery" | "productography";
type Status = "pending" | "approved" | "rejected";

type AdminTestimonial = {
  id: string;
  user_id: string | null;
  agent_type: AgentType;
  name: string | null;
  city: string | null;
  message: string;
  image_url: string | null;
  rating: number | null;
  status: Status;
  source: string | null;
  created_at: string;
  approved_at: string | null;
};

const AGENT_LABEL: Record<AgentType, string> = {
  textile: "Textile",
  jewellery: "Jewellery",
  productography: "Productography",
};

const AGENT_ACCENT: Record<AgentType, string> = {
  textile: "from-cyan-400 to-blue-500",
  jewellery: "from-amber-400 to-orange-500",
  productography: "from-violet-400 to-fuchsia-500",
};

export default function AdminTestimonialsPage() {
  const router = useRouter();
  const { darkMode } = useTheme();

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const isAdmin = authEmail
    ? ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(authEmail.toLowerCase())
    : false;

  const [items, setItems] = useState<AdminTestimonial[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [agentFilter, setAgentFilter] = useState<AgentType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("pending");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  /* ─────────────── Auth check ─────────────── */
  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      const email = session?.user?.email ?? null;
      setAuthEmail(email);
      setLoadingAuth(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  /* ─────────────── Fetch testimonials ─────────────── */
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    setLoadingItems(true);
    (async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!active) return;
      if (error) {
        setToast({ type: "err", text: error.message });
        setItems([]);
      } else {
        setItems((data as AdminTestimonial[]) || []);
      }
      setLoadingItems(false);
    })();
    return () => {
      active = false;
    };
  }, [isAdmin, refreshKey]);

  /* ─────────────── Filters ─────────────── */
  const filtered = useMemo(() => {
    let list = items;
    if (agentFilter !== "all") list = list.filter((i) => i.agent_type === agentFilter);
    if (statusFilter !== "all") list = list.filter((i) => i.status === statusFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (i) =>
          (i.name || "").toLowerCase().includes(q) ||
          (i.city || "").toLowerCase().includes(q) ||
          (i.message || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [items, agentFilter, statusFilter, query]);

  /* ─────────────── Counts ─────────────── */
  const counts = useMemo(() => {
    const byAgent: Record<AgentType | "all", { pending: number; approved: number; rejected: number; total: number }> = {
      all: { pending: 0, approved: 0, rejected: 0, total: 0 },
      textile: { pending: 0, approved: 0, rejected: 0, total: 0 },
      jewellery: { pending: 0, approved: 0, rejected: 0, total: 0 },
      productography: { pending: 0, approved: 0, rejected: 0, total: 0 },
    };
    for (const t of items) {
      byAgent.all.total += 1;
      byAgent.all[t.status] += 1;
      const a = t.agent_type;
      byAgent[a].total += 1;
      byAgent[a][t.status] += 1;
    }
    return byAgent;
  }, [items]);

  /* ─────────────── Actions ─────────────── */
  const showToast = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 2400);
  };

  const setStatus = async (row: AdminTestimonial, status: Status) => {
    setBusyId(row.id);
    try {
      const payload: any = { status };
      if (status === "approved") payload.approved_at = new Date().toISOString();
      const { error } = await supabase.from("testimonials").update(payload).eq("id", row.id);
      if (error) throw error;
      setItems((prev) =>
        prev.map((p) =>
          p.id === row.id ? { ...p, status, approved_at: payload.approved_at ?? p.approved_at } : p,
        ),
      );
      showToast("ok", `Marked as ${status}.`);
    } catch (e: any) {
      showToast("err", e?.message || "Update failed.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteRow = async (row: AdminTestimonial) => {
    if (!window.confirm("Delete this testimonial permanently? This cannot be undone.")) return;
    setBusyId(row.id);
    try {
      // best-effort: also remove the screenshot from storage
      if (row.image_url) {
        try {
          const marker = "/storage/v1/object/public/testimonial-screenshots/";
          const idx = row.image_url.indexOf(marker);
          if (idx !== -1) {
            const path = row.image_url.slice(idx + marker.length);
            await supabase.storage.from("testimonial-screenshots").remove([path]);
          }
        } catch {
          /* ignore storage errors */
        }
      }
      const { error } = await supabase.from("testimonials").delete().eq("id", row.id);
      if (error) throw error;
      setItems((prev) => prev.filter((p) => p.id !== row.id));
      showToast("ok", "Testimonial deleted.");
    } catch (e: any) {
      showToast("err", e?.message || "Delete failed.");
    } finally {
      setBusyId(null);
    }
  };

  /* ─────────────── Render ─────────────── */
  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.07] shadow-black/40"
    : "border-black/10 bg-white/80 shadow-black/10";
  const softCard = darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white/70";
  const muted = darkMode ? "text-white/55" : "text-black/55";
  const input = darkMode
    ? "border-white/10 bg-black/25 text-white placeholder:text-white/35"
    : "border-black/10 bg-white text-black placeholder:text-black/35";

  if (loadingAuth) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${bg}`}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (!authEmail) {
    return (
      <div className={`flex min-h-screen items-center justify-center px-4 ${bg}`}>
        <div className={`max-w-md rounded-[1.75rem] border p-8 text-center shadow-xl ${card}`}>
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-cyan-500" />
          <h1 className="text-2xl font-black">Admin sign-in required</h1>
          <p className={`mt-2 text-sm ${muted}`}>Please log in to access the admin panel.</p>
          <Link
            href="/login?redirect=/admin/testimonials"
            className="mt-5 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/30"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={`flex min-h-screen items-center justify-center px-4 ${bg}`}>
        <div className={`max-w-md rounded-[1.75rem] border p-8 text-center shadow-xl ${card}`}>
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-rose-500" />
          <h1 className="text-2xl font-black">Access denied</h1>
          <p className={`mt-2 text-sm ${muted}`}>
            <span className="font-bold">{authEmail}</span> is not in the admin allow-list.
          </p>
          <p className={`mt-2 text-[11px] ${muted}`}>
            To grant access, add your email to <code>ADMIN_EMAILS</code> at the top of{" "}
            <code>app/admin/testimonials/page.tsx</code>.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-full bg-black px-6 py-3 text-sm font-black text-white dark:bg-white dark:text-black"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const agentTabs: Array<{ key: AgentType | "all"; label: string }> = [
    { key: "all", label: "All" },
    { key: "textile", label: "Textile" },
    { key: "jewellery", label: "Jewellery" },
    { key: "productography", label: "Productography" },
  ];

  const statusTabs: Array<{ key: Status | "all"; label: string; tone: string }> = [
    { key: "pending", label: "Pending", tone: "amber" },
    { key: "approved", label: "Approved", tone: "emerald" },
    { key: "rejected", label: "Rejected", tone: "rose" },
    { key: "all", label: "All", tone: "slate" },
  ];

  return (
    <div className={`relative min-h-screen ${bg}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%)]" />
      <div
        className={`fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.12]"}`}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-12">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className={`mb-2 inline-flex items-center gap-1 text-[11px] font-bold ${muted}`}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Home
            </button>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
              Admin · Testimonials
            </p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl md:text-4xl">
              <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                Review &amp; approve user reviews
              </span>
            </h1>
            <p className={`mt-1 text-xs ${muted}`}>
              Signed in as <span className="font-bold">{authEmail}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-black transition hover:scale-105 ${
              darkMode ? "border-white/15 bg-white/[0.06] text-white" : "border-black/10 bg-white text-black shadow-sm"
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingItems ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Agent tabs */}
        <div className={`mb-3 flex flex-wrap items-center gap-2 rounded-2xl border p-2 backdrop-blur ${
          darkMode ? "border-white/10 bg-white/[0.04]" : "border-black/10 bg-white/70"
        }`}>
          {agentTabs.map((tab) => {
            const c = tab.key === "all" ? counts.all : counts[tab.key];
            const isActive = agentFilter === tab.key;
            const accent =
              tab.key === "all"
                ? "from-cyan-400 to-blue-600"
                : AGENT_ACCENT[tab.key as AgentType];
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setAgentFilter(tab.key)}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-black transition ${
                  isActive
                    ? `bg-gradient-to-r ${accent} text-white shadow-md`
                    : darkMode
                    ? "bg-white/[0.05] text-white/75 hover:bg-white/[0.08]"
                    : "bg-white text-black/75 hover:bg-cyan-50"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                    isActive ? "bg-white/25 text-white" : "bg-black/10 text-black/60 dark:bg-white/10 dark:text-white/55"
                  }`}
                >
                  {c.total}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status tabs + search */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {statusTabs.map((tab) => {
              const c =
                tab.key === "all"
                  ? agentFilter === "all"
                    ? counts.all.total
                    : counts[agentFilter as AgentType].total
                  : agentFilter === "all"
                  ? counts.all[tab.key]
                  : counts[agentFilter as AgentType][tab.key];
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black transition ${
                    isActive
                      ? tab.tone === "amber"
                        ? "border-amber-400 bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
                        : tab.tone === "emerald"
                        ? "border-emerald-400 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
                        : tab.tone === "rose"
                        ? "border-rose-400 bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200"
                        : "border-cyan-400 bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200"
                      : darkMode
                      ? "border-white/10 bg-white/[0.04] text-white/65"
                      : "border-black/10 bg-white text-black/65"
                  }`}
                >
                  {tab.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                    darkMode ? "bg-white/10 text-white/65" : "bg-black/5 text-black/55"
                  }`}>
                    {c}
                  </span>
                </button>
              );
            })}
          </div>

          <div className={`ml-auto flex flex-1 items-center gap-2 rounded-full border px-3 py-1.5 sm:max-w-sm ${
            darkMode ? "border-white/10 bg-white/[0.04]" : "border-black/10 bg-white"
          }`}>
            <Search className={`h-4 w-4 ${muted}`} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, city, message…"
              className={`w-full bg-transparent text-sm outline-none ${darkMode ? "placeholder:text-white/35" : "placeholder:text-black/35"}`}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className={muted}>
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        {loadingItems ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className={`relative overflow-hidden rounded-2xl border p-10 text-center ${softCard}`}>
            {/* Decorative glow */}
            <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-blue-500/15 blur-3xl" />

            <div className="relative">
              <div className="relative mx-auto mb-4 inline-flex">
                <span className="absolute inset-0 -m-1 animate-ping rounded-2xl bg-cyan-400/20" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-xl shadow-cyan-500/30">
                  <MessageSquare className="h-7 w-7" />
                </div>
              </div>

              <p className="text-base font-black md:text-lg">
                Your inbox is{" "}
                <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  all caught up
                </span>{" "}
                🎉
              </p>
              <p className={`mx-auto mt-2 max-w-sm text-xs leading-5 ${muted}`}>
                Try a different filter or wait for new submissions — the moment a user submits one, it'll show up here.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((row) => {
              const initial = (row.name || "U")[0]?.toUpperCase();
              const accent = AGENT_ACCENT[row.agent_type] || "from-cyan-400 to-blue-600";
              const statusTone =
                row.status === "approved"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
                  : row.status === "rejected"
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200";
              const isBusy = busyId === row.id;
              return (
                <div
                  key={row.id}
                  className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm backdrop-blur-xl ${card}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {/* Avatar + meta */}
                    <div className="flex shrink-0 items-start gap-3 sm:w-56">
                      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-base font-black text-white shadow-md`}>
                        {initial}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="truncate text-sm font-black">{row.name || "Anonymous"}</p>
                          <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-cyan-500" />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          {row.city && (
                            <span className={`inline-flex items-center gap-1 text-[11px] ${muted}`}>
                              <MapPin className="h-3 w-3" />
                              {row.city}
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1 text-[11px] ${muted}`}>
                            <Calendar className="h-3 w-3" />
                            {new Date(row.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${accent} px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white`}>
                            {AGENT_LABEL[row.agent_type]}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${statusTone}`}>
                            {row.status}
                          </span>
                          {row.source && (
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                              darkMode ? "bg-white/10 text-white/65" : "bg-black/5 text-black/55"
                            }`}>
                              {row.source}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Message + image */}
                    <div className="min-w-0 flex-1">
                      <p className={`whitespace-pre-wrap text-sm leading-6 ${darkMode ? "text-white/85" : "text-black/80"}`}>
                        {row.message}
                      </p>

                      <div className="mt-2 flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`h-3.5 w-3.5 ${
                              n <= (row.rating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : darkMode
                                ? "text-white/15"
                                : "text-black/15"
                            }`}
                          />
                        ))}
                        <span className={`ml-2 text-[10px] font-bold uppercase tracking-wider ${muted}`}>
                          {row.rating ?? 0}/5
                        </span>
                      </div>

                      {row.image_url && (
                        <a
                          href={row.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 block overflow-hidden rounded-xl border border-black/10 transition hover:opacity-95 dark:border-white/10"
                        >
                          <img
                            src={row.image_url}
                            alt="Screenshot"
                            className="block max-h-56 w-full object-cover"
                          />
                        </a>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-row flex-wrap gap-2 sm:flex-col">
                      {row.status !== "approved" && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setStatus(row, "approved")}
                          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 px-3 py-2 text-[11px] font-black text-white shadow-md shadow-emerald-500/30 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </button>
                      )}
                      {row.status !== "rejected" && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setStatus(row, "rejected")}
                          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-rose-300/60 bg-rose-50 px-3 py-2 text-[11px] font-black text-rose-700 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200"
                        >
                          <XIcon className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      )}
                      {row.status === "approved" && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setStatus(row, "pending")}
                          className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 ${
                            darkMode ? "border-white/15 bg-white/[0.06] text-white/85" : "border-black/10 bg-white text-black/75"
                          }`}
                        >
                          <Filter className="h-3.5 w-3.5" />
                          Move to pending
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => deleteRow(row)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-2 text-[11px] font-black text-rose-600 transition hover:scale-105 hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-full border px-4 py-2 text-xs font-black shadow-xl backdrop-blur ${
              toast.type === "ok"
                ? "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                : "border-rose-300/60 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200"
            }`}
          >
            {toast.text}
          </div>
        )}
      </div>
    </div>
  );
}
