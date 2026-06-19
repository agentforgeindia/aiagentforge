"use client";

// ============================================================
// /admin/announcements — post updates that show in the user
// notification bell.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ChevronDown,
  Eye,
  Image as ImageIcon,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import AdminShell, {
  adminCardCls,
  adminInputCls,
  adminMutedCls,
  adminSecondaryBtnCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Ann = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

type SeenSummary = { seen_count: number; paid_count: number };
type SeenRow = {
  email: string | null;
  seen_at: string;
  is_paid: boolean;
  is_lead: boolean;
};

export default function AdminAnnouncementsPage() {
  const { loading: loadingAuth, isAdmin, email: authEmail, has } =
    useAdminPermissions();
  const canView = has("customers.view");

  const [rows, setRows] = useState<Ann[]>([]);
  const [welcomeStats, setWelcomeStats] = useState<{
    signups: number;
    sent: number;
    seen: number;
  } | null>(null);
  const [loadingRows, setLoadingRows] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  // Per-announcement seen tracking.
  const [summary, setSummary] = useState<Record<string, SeenSummary>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, SeenRow[]>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!detail[id]) {
      setLoadingDetailId(id);
      const { data } = await supabase.rpc("announcement_seen_detail", {
        p_announcement_id: id,
      });
      setDetail((d) => ({ ...d, [id]: (data as SeenRow[]) ?? [] }));
      setLoadingDetailId(null);
    }
  };

  const token = useMemo(
    () => async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? "";
    },
    [],
  );

  useEffect(() => {
    if (!canView) return;
    setLoadingRows(true);
    (async () => {
      const res = await fetch("/api/admin/announcements", {
        headers: { Authorization: `Bearer ${await token()}` },
      });
      const json = await res.json();
      if (json.ok) setRows(json.announcements as Ann[]);
      if (json.welcomeStats) setWelcomeStats(json.welcomeStats);
      setLoadingRows(false);

      // Per-announcement seen counts (admin-only RPC).
      const { data: sum } = await supabase.rpc("announcement_seen_summary");
      if (Array.isArray(sum)) {
        const map: Record<string, SeenSummary> = {};
        for (const r of sum as Array<{
          announcement_id: string;
          seen_count: number;
          paid_count: number;
        }>) {
          map[r.announcement_id] = {
            seen_count: Number(r.seen_count) || 0,
            paid_count: Number(r.paid_count) || 0,
          };
        }
        setSummary(map);
      }
    })();
  }, [canView, refreshKey, token]);

  const post = async () => {
    if (!title.trim()) return;
    setPosting(true);
    try {
      // FormData so the image rides along; the browser sets the
      // multipart boundary — do NOT set Content-Type manually.
      const fd = new FormData();
      fd.append("title", title);
      fd.append("body", body);
      fd.append("link", link);
      if (image) fd.append("image", image);

      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { Authorization: `Bearer ${await token()}` },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Could not post.");
        return;
      }
      setTitle("");
      setBody("");
      setLink("");
      setImage(null);
      setImagePreview(null);
      setRefreshKey((k) => k + 1);
    } finally {
      setPosting(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    await fetch(`/api/admin/announcements?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${await token()}` },
    });
    setRefreshKey((k) => k + 1);
  };

  if (loadingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">
        Checking access...
      </main>
    );
  }
  if (!authEmail || !isAdmin || !canView) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
          <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
          <h1 className="mt-3 text-base font-bold">Access denied</h1>
          <p className="mt-1 text-xs text-slate-500">
            Your role does not include the <code>customers.view</code>{" "}
            permission.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      doodleType="customers"
      breadcrumbs={[{ label: "Announcements" }]}
      title="Announcements"
      subtitle="Post updates that appear in every user's notification bell"
      email={authEmail}
      actions={
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          className={adminSecondaryBtnCls}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      }
    >
      {/* Welcome-notification reach */}
      {welcomeStats && (
        <div className={`${adminCardCls} mb-4 p-4`}>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Welcome notification reach
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-100 p-3 text-center dark:bg-white/[0.04]">
              <p className="text-2xl font-black">{welcomeStats.sent}</p>
              <p className={`mt-0.5 text-[11px] ${adminMutedCls}`}>Sent · of {welcomeStats.signups} signups</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 text-center dark:bg-emerald-500/10">
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{welcomeStats.seen}</p>
              <p className={`mt-0.5 text-[11px] ${adminMutedCls}`}>Seen (opened bell)</p>
            </div>
            <div className="rounded-lg bg-slate-100 p-3 text-center dark:bg-white/[0.04]">
              <p className="text-2xl font-black">
                {welcomeStats.sent > 0
                  ? Math.round((welcomeStats.seen / welcomeStats.sent) * 100)
                  : 0}
                %
              </p>
              <p className={`mt-0.5 text-[11px] ${adminMutedCls}`}>Seen rate</p>
            </div>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className={`${adminCardCls} space-y-3 p-4`}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (e.g. New: Bulk generation on Pro plan!)"
          maxLength={160}
          className={adminInputCls}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Details (optional)"
          rows={3}
          className={`${adminInputCls} resize-none`}
        />
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Link (optional) — e.g. /pricing"
          className={adminInputCls}
        />
        {/* Image (optional) — rides along with the notification */}
        <div>
          {imagePreview ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="preview"
                className="h-32 w-auto rounded-lg border border-slate-200 object-cover dark:border-slate-700"
              />
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
                className="absolute -right-2 -top-2 rounded-full bg-rose-600 p-1 text-white shadow"
                aria-label="Remove image"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <ImageIcon className="h-4 w-4" />
              Add image (optional) — max 5 MB
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  if (f && f.size > 5 * 1024 * 1024) {
                    alert("Image must be under 5 MB.");
                    return;
                  }
                  setImage(f);
                  setImagePreview(f ? URL.createObjectURL(f) : null);
                }}
              />
            </label>
          )}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={post}
            disabled={!title.trim() || posting}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow disabled:opacity-50"
          >
            <Megaphone className="h-4 w-4" />
            {posting ? "Posting..." : "Post update"}
          </button>
        </div>
      </div>

      {/* List */}
      <div className={`${adminCardCls} mt-4`}>
        {loadingRows ? (
          <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading...</p>
        ) : rows.length === 0 ? (
          <p className={`p-8 text-center text-sm ${adminMutedCls}`}>
            No announcements yet. Post your first update above.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {rows.map((a) => {
              const s = summary[a.id];
              const seen = s?.seen_count ?? 0;
              const paid = s?.paid_count ?? 0;
              const isOpen = expandedId === a.id;
              const list = detail[a.id];
              return (
                <li key={a.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    {a.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.image_url}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{a.title}</p>
                      {a.body && (
                        <p className={`mt-0.5 text-xs ${adminMutedCls}`}>{a.body}</p>
                      )}
                      <p className={`mt-1 text-[11px] ${adminMutedCls}`}>
                        {new Date(a.created_at).toLocaleString("en-IN")}
                        {a.link ? ` · ${a.link}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleExpand(a.id)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      title="See who opened this"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {seen} seen
                      {paid > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          · {paid} paid
                        </span>
                      )}
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(a.id)}
                      className="shrink-0 rounded-lg p-2 text-rose-500 hover:bg-rose-500/10"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {isOpen && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-2 dark:border-slate-800 dark:bg-white/[0.02]">
                      {loadingDetailId === a.id ? (
                        <p className={`p-3 text-center text-xs ${adminMutedCls}`}>
                          Loading…
                        </p>
                      ) : !list || list.length === 0 ? (
                        <p className={`p-3 text-center text-xs ${adminMutedCls}`}>
                          No one has opened this yet.
                        </p>
                      ) : (
                        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                          {list.map((r, i) => (
                            <li
                              key={i}
                              className="flex items-center justify-between gap-3 px-2 py-1.5"
                            >
                              <span className="min-w-0 flex-1 truncate text-xs font-medium">
                                {r.email || "—"}
                              </span>
                              <div className="flex shrink-0 items-center gap-1.5">
                                {r.is_paid ? (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                    Paid
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                                    Free
                                  </span>
                                )}
                                {r.is_lead && (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                    Lead
                                  </span>
                                )}
                                <span className={`text-[10px] ${adminMutedCls}`}>
                                  {new Date(r.seen_at).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
