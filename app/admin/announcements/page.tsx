"use client";

// ============================================================
// /admin/announcements — post updates that show in the user
// notification bell.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Megaphone, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
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
  is_active: boolean;
  created_at: string;
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
  const [posting, setPosting] = useState(false);

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
    })();
  }, [canView, refreshKey, token]);

  const post = async () => {
    if (!title.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await token()}`,
        },
        body: JSON.stringify({ title, body, link }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Could not post.");
        return;
      }
      setTitle("");
      setBody("");
      setLink("");
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
            {rows.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-4 px-4 py-3"
              >
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
                  onClick={() => remove(a.id)}
                  className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
