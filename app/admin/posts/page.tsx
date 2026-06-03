"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeProvider";
import { supabase } from "@/lib/supabase";
import {
  ALL_TYPES,
  POST_CATEGORY_LABEL,
  POST_TYPE_LABEL,
  type DbPost,
  type PostStatus,
  type PostType,
} from "@/lib/posts";
import {
  Eye,
  EyeOff,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useAdminPermissions } from "../AdminPermissions";

type StatusFilter = PostStatus | "all";
type TypeFilter = PostType | "all";

export default function AdminPostsPage() {
  const router = useRouter();
  const { darkMode } = useTheme();

  // RBAC-driven access — uses admin_roles / admin_users, not a
  // hard-coded email allowlist.
  const {
    loading: loadingAuth,
    isAdmin,
    email: authEmail,
    has,
  } = useAdminPermissions();
  const canViewContent = has("content.view");

  const [items, setItems] = useState<DbPost[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  // Load posts (admin-side; RLS lets admins see drafts too)
  useEffect(() => {
    if (!canViewContent) return;
    setLoadingItems(true);
    (async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("updated_at", { ascending: false });
      if (!error && data) setItems(data as DbPost[]);
      setLoadingItems(false);
    })();
  }, [canViewContent, refreshKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (q) {
        const hay = `${p.title} ${p.slug} ${p.author} ${p.keywords.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, typeFilter, statusFilter, search]);

  async function togglePublish(p: DbPost) {
    const next: Partial<DbPost> =
      p.status === "published"
        ? { status: "draft" }
        : { status: "published", published_at: p.published_at ?? new Date().toISOString() };
    const { error } = await supabase.from("posts").update(next).eq("id", p.id);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  async function deletePost(p: DbPost) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("posts").delete().eq("id", p.id);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.06]"
    : "border-black/10 bg-white/85";
  const muted = darkMode ? "text-white/60" : "text-black/55";

  if (loadingAuth) {
    return (
      <main className={`flex min-h-screen items-center justify-center ${bg}`}>
        <p className={muted}>Checking access…</p>
      </main>
    );
  }

  if (!authEmail) {
    return (
      <main className={`flex min-h-screen items-center justify-center px-6 ${bg}`}>
        <div className={`max-w-md rounded-3xl border p-8 text-center ${card}`}>
          <ShieldCheck className="mx-auto h-10 w-10 text-cyan-500" />
          <h1 className="mt-3 text-xl font-black">Admin login required</h1>
          <p className={`mt-2 text-sm ${muted}`}>
            Sign in with an admin email to manage posts.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2.5 text-sm font-black text-white"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  if (!isAdmin || !canViewContent) {
    return (
      <main className={`flex min-h-screen items-center justify-center px-6 ${bg}`}>
        <div className={`max-w-md rounded-3xl border p-8 text-center ${card}`}>
          <ShieldCheck className="mx-auto h-10 w-10 text-rose-500" />
          <h1 className="mt-3 text-xl font-black">Access denied</h1>
          <p className={`mt-2 text-sm ${muted}`}>
            Your role ({authEmail}) does not include the{" "}
            <code className="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">
              content.view
            </code>{" "}
            permission. Ask a founder/admin to grant it via{" "}
            <code className="text-xs">/admin/team</code>.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={`relative min-h-screen ${bg}`}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-600">
              Admin · Content
            </p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">
              Posts (Blog + News + Updates)
            </h1>
            <p className={`mt-1 text-sm ${muted}`}>
              Manage every post that appears on /news and /blog.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${card}`}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <Link
              href="/admin/posts/new"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/30"
            >
              <Plus className="h-4 w-4" />
              New post
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className={`mt-6 grid gap-3 rounded-2xl border p-3 sm:grid-cols-[1fr_auto_auto] sm:p-4 ${card}`}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, slug, author, keyword…"
              className="w-full rounded-xl border border-black/10 bg-white/80 py-2.5 pl-9 pr-3 text-sm dark:border-white/10 dark:bg-white/[0.06]"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.06]"
          >
            <option value="all">All types</option>
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>
                {POST_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.06]"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Table */}
        <div className={`mt-5 rounded-2xl border ${card}`}>
          {loadingItems ? (
            <p className={`p-8 text-center text-sm ${muted}`}>Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-3xl">📭</p>
              <p className={`mt-2 text-sm ${muted}`}>
                {items.length === 0
                  ? "No posts yet. Click “New post” to create one."
                  : "No posts match your filters."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-black/5 dark:divide-white/5">
              {filtered.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] ${
                          p.status === "published"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {p.status}
                      </span>
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] dark:bg-white/10">
                        {POST_TYPE_LABEL[p.type]}
                      </span>
                      <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
                        {POST_CATEGORY_LABEL[p.category]}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-sm font-black sm:text-base">
                      {p.title}
                    </p>
                    <p className={`mt-0.5 truncate text-xs ${muted}`}>
                      /{p.slug} · {p.author} ·{" "}
                      {p.published_at
                        ? new Date(p.published_at).toLocaleDateString("en-IN")
                        : "not published"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => togglePublish(p)}
                      title={p.status === "published" ? "Unpublish" : "Publish"}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/80 text-black/65 transition hover:border-cyan-400 hover:text-cyan-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/65"
                    >
                      {p.status === "published" ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <Link
                      href={`/admin/posts/${p.id}/edit`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/80 text-black/65 transition hover:border-cyan-400 hover:text-cyan-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/65"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    {p.status === "published" && (
                      <Link
                        href={`/blog/${p.slug}`}
                        target="_blank"
                        className="hidden h-9 items-center rounded-full border border-black/10 bg-white/80 px-3 text-xs font-bold text-black/65 transition hover:border-cyan-400 hover:text-cyan-600 sm:inline-flex dark:border-white/10 dark:bg-white/[0.06] dark:text-white/65"
                      >
                        View ↗
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => deletePost(p)}
                      title="Delete"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-500 transition hover:bg-rose-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className={`mt-6 text-center text-xs ${muted}`}>
          Signed in as <span className="font-black">{authEmail}</span>
        </p>
      </div>
    </main>
  );
}
