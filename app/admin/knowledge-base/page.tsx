"use client";

// /admin/knowledge-base — SOPs, scripts, training docs.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Plus, X, Save, ChevronDown, ChevronUp, Pin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, {
  adminCardCls, adminMutedCls, adminSecondaryBtnCls,
  adminPrimaryBtnCls, adminInputCls, adminGhostBtnCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Article = {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

const CATEGORIES = [
  { value: "sales",      label: "Sales",      color: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300" },
  { value: "support",    label: "Support",    color: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
  { value: "operations", label: "Operations", color: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300" },
  { value: "training",   label: "Training",   color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
  { value: "sop",        label: "SOP",        color: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" },
  { value: "other",      label: "Other",      color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
];

export default function KnowledgeBasePage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView   = has("kb.view");
  const canManage = has("kb.manage");

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterCat, setFilterCat]   = useState("all");
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [showNew, setShowNew]       = useState(false);

  // New article form
  const [fCat,     setFCat]     = useState("sales");
  const [fTitle,   setFTitle]   = useState("");
  const [fContent, setFContent] = useState("");
  const [fTags,    setFTags]    = useState("");
  const [fPinned,  setFPinned]  = useState(false);
  const [fSaving,  setFSaving]  = useState(false);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("kb_articles")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });
      setArticles((data as Article[]) ?? []);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  async function saveArticle(e: React.FormEvent) {
    e.preventDefault();
    if (!fTitle || !fContent) return;
    setFSaving(true);
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user?.id;
    await supabase.from("kb_articles").insert({
      category: fCat, title: fTitle, content: fContent,
      tags: fTags ? fTags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      is_pinned: fPinned, created_by: userId, updated_by: userId,
    });
    setFTitle(""); setFContent(""); setFTags(""); setFCat("sales"); setFPinned(false);
    setShowNew(false);
    setRefreshKey((k) => k + 1);
    setFSaving(false);
  }

  async function deleteArticle(id: string) {
    await supabase.from("kb_articles").delete().eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  async function togglePin(id: string, current: boolean) {
    await supabase.from("kb_articles").update({ is_pinned: !current }).eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  const filtered = articles.filter((a) => filterCat === "all" || a.category === filterCat);

  return (
    <AdminShell
      breadcrumbs={[{ label: "Knowledge Base" }]}
      title="Knowledge Base"
      subtitle="SOPs, sales scripts, training docs"
      email={email}
      actions={
        <div className="flex gap-2">
          {canManage && (
            <button type="button" onClick={() => setShowNew((s) => !s)} className={adminPrimaryBtnCls}>
              <Plus className="h-3.5 w-3.5" />
              New Article
            </button>
          )}
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : (
        <div className="space-y-4">
          {/* New article form */}
          {showNew && canManage && (
            <section className={`${adminCardCls} p-4`}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">New Article</p>
                <button type="button" onClick={() => setShowNew(false)}><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <form onSubmit={saveArticle} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <select className={adminInputCls} value={fCat} onChange={(e) => setFCat(e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <input className={adminInputCls} placeholder="Title *" value={fTitle} onChange={(e) => setFTitle(e.target.value)} required />
                </div>
                <textarea
                  className={adminInputCls}
                  placeholder="Content (markdown supported)"
                  rows={8}
                  value={fContent}
                  onChange={(e) => setFContent(e.target.value)}
                  required
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={adminInputCls} placeholder="Tags (comma separated)" value={fTags} onChange={(e) => setFTags(e.target.value)} />
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" checked={fPinned} onChange={(e) => setFPinned(e.target.checked)} />
                    Pin to top
                  </label>
                </div>
                <button type="submit" disabled={fSaving} className={`${adminPrimaryBtnCls} w-full justify-center`}>
                  {fSaving ? "Saving…" : "Save Article"}
                </button>
              </form>
            </section>
          )}

          {/* Filter */}
          <div className="flex flex-wrap gap-1.5">
            {["all", ...CATEGORIES.map((c) => c.value)].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCat(cat)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  filterCat === cat
                    ? "bg-slate-900 text-white dark:bg-indigo-600"
                    : "border border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                }`}
              >
                {cat === "all" ? "All" : CATEGORIES.find((c) => c.value === cat)?.label ?? cat}
                {cat !== "all" && ` (${articles.filter((a) => a.category === cat).length})`}
              </button>
            ))}
          </div>

          {/* Articles */}
          {filtered.length === 0 ? (
            <p className={`p-8 text-center text-sm ${adminMutedCls}`}>No articles yet.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((a) => {
                const cat     = CATEGORIES.find((c) => c.value === a.category);
                const isOpen  = expanded === a.id;
                return (
                  <div key={a.id} className={adminCardCls}>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : a.id)}
                      className="flex w-full items-start justify-between gap-3 p-4 text-left"
                    >
                      <div className="flex min-w-0 items-start gap-2">
                        {a.is_pinned && <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cat?.color ?? ""}`}>
                              {cat?.label ?? a.category}
                            </span>
                            <h3 className="text-sm font-bold">{a.title}</h3>
                          </div>
                          <p className={`mt-0.5 text-[11px] ${adminMutedCls}`}>
                            Updated {new Date(a.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                            {a.tags.length > 0 && ` · ${a.tags.join(", ")}`}
                          </p>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" /> : <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />}
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-100 px-4 pb-4 dark:border-slate-800">
                        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                          {a.content}
                        </pre>
                        {canManage && (
                          <div className="mt-3 flex gap-2">
                            <button type="button" onClick={() => togglePin(a.id, a.is_pinned)} className={adminSecondaryBtnCls}>
                              <Pin className="h-3.5 w-3.5" />
                              {a.is_pinned ? "Unpin" : "Pin"}
                            </button>
                            <button type="button" onClick={() => deleteArticle(a.id)} className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-500/10">
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}

function Loading() {
  return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">Checking access…</main>;
}
function Denied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
        <h1 className="mt-3 text-base font-bold">Access denied</h1>
      </div>
    </main>
  );
}
