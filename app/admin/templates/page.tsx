"use client";

// /admin/templates — Sales resource hub: WhatsApp templates + links.
// Copy-paste ready, with "how to use" notes.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Copy, Check, MessageCircle, LinkIcon, Plus, X, Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls, adminPrimaryBtnCls, adminInputCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Res = { id: string; category: string; title: string; content: string; how_to: string | null; sort_order: number };

const TABS = [
  { key: "whatsapp", label: "WhatsApp Templates", icon: <MessageCircle className="h-4 w-4" /> },
  { key: "link",     label: "Important Links",    icon: <LinkIcon className="h-4 w-4" /> },
];

export default function TemplatesPage() {
  const { loading: pLoading, has, isAdmin, email } = useAdminPermissions();
  const canView   = has("leads.view") || has("kb.view") || isAdmin;
  const canManage = has("hr.manage") || isAdmin;

  const [rows, setRows]       = useState<Res[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("whatsapp");
  const [copied, setCopied]   = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showNew, setShowNew] = useState(false);

  // form
  const [fCat, setFCat] = useState("whatsapp");
  const [fTitle, setFTitle] = useState("");
  const [fContent, setFContent] = useState("");
  const [fHow, setFHow] = useState("");
  const [fSaving, setFSaving] = useState(false);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase.from("sales_resources").select("*").order("sort_order");
      setRows((data as Res[]) ?? []);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  function copy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(id); setTimeout(() => setCopied(null), 1500);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!fTitle || !fContent) return;
    setFSaving(true);
    await supabase.from("sales_resources").insert({ category: fCat, title: fTitle, content: fContent, how_to: fHow || null });
    setFTitle(""); setFContent(""); setFHow(""); setShowNew(false); setFSaving(false);
    setRefreshKey((k) => k + 1);
  }

  async function del(id: string) {
    if (!confirm("Delete this template?")) return;
    await supabase.from("sales_resources").delete().eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  const filtered = rows.filter((r) => r.category === tab);

  return (
    <AdminShell
      breadcrumbs={[{ label: "Templates" }]}
      title="Templates & Links"
      subtitle="Ready WhatsApp messages + all page/social links — copy & send"
      email={email}
      actions={
        <div className="flex gap-2">
          {canManage && <button type="button" onClick={() => setShowNew((s) => !s)} className={adminPrimaryBtnCls}><Plus className="h-3.5 w-3.5" />Add</button>}
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      }
    >
      {/* New form */}
      {showNew && canManage && (
        <section className={`${adminCardCls} mb-4 p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Add Template / Link</p>
            <button type="button" onClick={() => setShowNew(false)}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          <form onSubmit={add} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <select className={adminInputCls} value={fCat} onChange={(e) => setFCat(e.target.value)}>
                <option value="whatsapp">WhatsApp Template</option>
                <option value="link">Link</option>
              </select>
              <input className={adminInputCls} placeholder="Title *" value={fTitle} onChange={(e) => setFTitle(e.target.value)} required />
            </div>
            <textarea className={adminInputCls} rows={fCat === "link" ? 1 : 4} placeholder={fCat === "link" ? "https://…" : "Message text…"} value={fContent} onChange={(e) => setFContent(e.target.value)} required />
            <input className={adminInputCls} placeholder="How to use (optional)" value={fHow} onChange={(e) => setFHow(e.target.value)} />
            <button type="submit" disabled={fSaving} className={adminPrimaryBtnCls}>{fSaving ? "Saving…" : "Save"}</button>
          </form>
        </section>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-bold transition ${tab === t.key ? "bg-slate-900 text-white dark:bg-indigo-600" : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className={`py-8 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className={`${adminCardCls} p-10 text-center`}><p className={`text-sm ${adminMutedCls}`}>No items yet.</p></div>
      ) : tab === "link" ? (
        /* Links grid */
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <div key={r.id} className={`${adminCardCls} flex items-center justify-between gap-2 p-3`}>
              <div className="min-w-0">
                <p className="text-sm font-bold">{r.title}</p>
                <p className={`truncate text-[11px] ${adminMutedCls}`}>{r.content}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <a href={r.content} target="_blank" rel="noopener noreferrer" className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800"><ExternalLink className="h-3.5 w-3.5" /></a>
                <button type="button" onClick={() => copy(r.id, r.content)} className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300">
                  {copied === r.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                {canManage && <button type="button" onClick={() => del(r.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" /></button>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* WhatsApp templates */
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className={`${adminCardCls} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black">{r.title}</p>
                  {r.how_to && <p className={`mt-0.5 text-[11px] ${adminMutedCls}`}>💡 {r.how_to}</p>}
                  <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-emerald-50/60 p-3 font-sans text-sm text-slate-700 dark:bg-emerald-500/5 dark:text-slate-200">{r.content}</pre>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button type="button" onClick={() => copy(r.id, r.content)} className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-500">
                    {copied === r.id ? <><Check className="h-3.5 w-3.5" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
                  </button>
                  {canManage && <button type="button" onClick={() => del(r.id)} className="inline-flex items-center justify-center rounded-md border border-rose-200 px-2 py-1 text-rose-500 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" /></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function Loading() { return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">Checking access…</main>; }
function Denied()  {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" /><h1 className="mt-3 text-base font-bold">Access denied</h1>
      </div>
    </main>
  );
}
