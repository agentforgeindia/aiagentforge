"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BadgeCheck, Calendar, Check, Filter, MapPin,
  MessageSquare, RefreshCw, Search, Star, Trash2, X as XIcon,
} from "lucide-react";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type AgentType = "textile" | "jewellery" | "productography";
type Status    = "pending" | "approved" | "rejected";

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
  textile: "Textile", jewellery: "Jewellery", productography: "Productography",
};
const AGENT_COLOR: Record<AgentType, string> = {
  textile:       "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
  jewellery:     "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  productography:"bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
};

export default function AdminTestimonialsPage() {
  const { loading: pLoading, isAdmin, email, has } = useAdminPermissions();
  const canManage = has("testimonials.manage") || isAdmin;

  const [items, setItems]           = useState<AdminTestimonial[]>([]);
  const [loadingItems, setLoading]  = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("pending");
  const [agentFilter, setAgentFilter]   = useState<AgentType | "all">("all");
  const [query, setQuery]               = useState("");
  const [busyId, setBusyId]             = useState<string | null>(null);
  const [toast, setToast]               = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (pLoading) return;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) showToast(false, error.message);
      else setItems((data as AdminTestimonial[]) ?? []);
      setLoading(false);
    })();
  }, [pLoading, refreshKey]);

  function showToast(ok: boolean, text: string) {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 2500);
  }

  async function setStatus(row: AdminTestimonial, status: Status) {
    setBusyId(row.id);
    const payload: Record<string, unknown> = { status };
    if (status === "approved") payload.approved_at = new Date().toISOString();
    const { error } = await supabase.from("testimonials").update(payload).eq("id", row.id);
    if (error) showToast(false, error.message);
    else {
      setItems((prev) => prev.map((p) => p.id === row.id ? { ...p, status, approved_at: (payload.approved_at as string) ?? p.approved_at } : p));
      showToast(true, `Marked as ${status}.`);
    }
    setBusyId(null);
  }

  async function deleteRow(row: AdminTestimonial) {
    if (!confirm("Delete this testimonial permanently?")) return;
    setBusyId(row.id);
    if (row.image_url) {
      try {
        const marker = "/storage/v1/object/public/testimonial-screenshots/";
        const idx = row.image_url.indexOf(marker);
        if (idx !== -1) await supabase.storage.from("testimonial-screenshots").remove([row.image_url.slice(idx + marker.length)]);
      } catch { /* ignore */ }
    }
    const { error } = await supabase.from("testimonials").delete().eq("id", row.id);
    if (error) showToast(false, error.message);
    else { setItems((prev) => prev.filter((p) => p.id !== row.id)); showToast(true, "Deleted."); }
    setBusyId(null);
  }

  const counts = useMemo(() => ({
    pending:  items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length,
    all:      items.length,
  }), [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter !== "all") list = list.filter((i) => i.status === statusFilter);
    if (agentFilter  !== "all") list = list.filter((i) => i.agent_type === agentFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((i) => (i.name ?? "").toLowerCase().includes(q) || (i.city ?? "").toLowerCase().includes(q) || i.message.toLowerCase().includes(q));
    }
    return list;
  }, [items, statusFilter, agentFilter, query]);

  if (pLoading) return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">
      Checking access…
    </main>
  );

  return (
    <AdminShell
      breadcrumbs={[{ label: "Testimonials" }]}
      title="Testimonials"
      subtitle={`${counts.pending} pending approval · ${counts.approved} approved · ${counts.rejected} rejected`}
      email={email}
      actions={
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className={`h-3.5 w-3.5 ${loadingItems ? "animate-spin" : ""}`} />
          Refresh
        </button>
      }
    >
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* Status pills */}
        <div className="flex gap-1">
          {([
            { key: "pending",  label: "Pending",  count: counts.pending,  color: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-amber-300 dark:border-amber-700/40" },
            { key: "approved", label: "Approved", count: counts.approved, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/40" },
            { key: "rejected", label: "Rejected", count: counts.rejected, color: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border-rose-300 dark:border-rose-700/40" },
            { key: "all",      label: "All",      count: counts.all,      color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700" },
          ] as const).map((t) => (
            <button key={t.key} type="button" onClick={() => setStatusFilter(t.key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition ${statusFilter === t.key ? t.color : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"}`}>
              {t.label}
              <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] dark:bg-white/10">{t.count}</span>
            </button>
          ))}
        </div>

        {/* Agent filter */}
        <select
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value as AgentType | "all")}
        >
          <option value="all">All Agents</option>
          <option value="textile">Textile</option>
          <option value="jewellery">Jewellery</option>
          <option value="productography">Productography</option>
        </select>

        {/* Search */}
        <div className="ml-auto flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900 sm:w-64">
          <Search className={`h-3.5 w-3.5 ${adminMutedCls}`} />
          <input
            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
          />
          {query && <button type="button" onClick={() => setQuery("")}><XIcon className={`h-3.5 w-3.5 ${adminMutedCls}`} /></button>}
        </div>
      </div>

      {/* List */}
      {loadingItems ? (
        <p className={`py-12 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className={`${adminCardCls} flex flex-col items-center gap-2 py-14 text-center`}>
          <MessageSquare className="h-8 w-8 text-slate-300" />
          <p className={`text-sm ${adminMutedCls}`}>
            {statusFilter === "pending" ? "No pending testimonials — all caught up!" : "No testimonials match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const isBusy = busyId === row.id;
            return (
              <div key={row.id} className={`${adminCardCls} p-4`}>
                <div className="flex flex-col gap-4 sm:flex-row">
                  {/* Left — meta */}
                  <div className="flex shrink-0 items-start gap-3 sm:w-52">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-bold text-white dark:from-indigo-500 dark:to-indigo-700">
                      {(row.name ?? "U")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="truncate text-xs font-bold">{row.name ?? "Anonymous"}</p>
                        <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                      </div>
                      {row.city && (
                        <p className={`flex items-center gap-1 text-[11px] ${adminMutedCls}`}>
                          <MapPin className="h-3 w-3" />{row.city}
                        </p>
                      )}
                      <p className={`flex items-center gap-1 text-[11px] ${adminMutedCls}`}>
                        <Calendar className="h-3 w-3" />
                        {new Date(row.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${AGENT_COLOR[row.agent_type]}`}>
                          {AGENT_LABEL[row.agent_type]}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          row.status === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" :
                          row.status === "rejected" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" :
                          "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                        }`}>
                          {row.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center — message */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{row.message}</p>
                    <div className="mt-2 flex items-center gap-0.5">
                      {[1,2,3,4,5].map((n) => (
                        <Star key={n} className={`h-3.5 w-3.5 ${n <= (row.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700"}`} />
                      ))}
                      <span className={`ml-1.5 text-[10px] font-bold ${adminMutedCls}`}>{row.rating ?? 0}/5</span>
                    </div>
                    {row.image_url && (
                      <a href={row.image_url} target="_blank" rel="noopener noreferrer" className="mt-2 block overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                        <img src={row.image_url} alt="Screenshot" className="max-h-40 w-full object-cover" />
                      </a>
                    )}
                  </div>

                  {/* Right — actions */}
                  <div className="flex shrink-0 flex-row flex-wrap gap-2 sm:flex-col sm:justify-start">
                    {canManage && row.status !== "approved" && (
                      <button type="button" disabled={isBusy} onClick={() => setStatus(row, "approved")}
                        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                        <Check className="h-3.5 w-3.5" />Approve
                      </button>
                    )}
                    {canManage && row.status !== "rejected" && (
                      <button type="button" disabled={isBusy} onClick={() => setStatus(row, "rejected")}
                        className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-700/40 dark:bg-rose-500/10 dark:text-rose-300">
                        <XIcon className="h-3.5 w-3.5" />Reject
                      </button>
                    )}
                    {canManage && row.status === "approved" && (
                      <button type="button" disabled={isBusy} onClick={() => setStatus(row, "pending")}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        <Filter className="h-3.5 w-3.5" />Pending
                      </button>
                    )}
                    {canManage && (
                      <button type="button" disabled={isBusy} onClick={() => deleteRow(row)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:bg-rose-500/10 dark:text-rose-300">
                        <Trash2 className="h-3.5 w-3.5" />Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border px-4 py-2 text-xs font-bold shadow-xl ${
          toast.ok
            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-500/10 dark:text-emerald-300"
            : "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700/40 dark:bg-rose-500/10 dark:text-rose-300"
        }`}>
          {toast.text}
        </div>
      )}
    </AdminShell>
  );
}
