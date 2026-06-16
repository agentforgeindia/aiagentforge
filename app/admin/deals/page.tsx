"use client";

// /admin/deals — Deals pipeline: formal deal tracking.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Plus, DollarSign, TrendingUp, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, {
  adminCardCls, adminMutedCls, adminSecondaryBtnCls,
  adminPrimaryBtnCls, adminInputCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Deal = {
  id: string;
  title: string;
  company: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  value_inr: number;
  stage: string;
  probability: number;
  assigned_to: string | null;
  close_date: string | null;
  notes: string | null;
  created_at: string;
};

const STAGES = [
  { value: "prospecting",   label: "Prospecting",   color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",         bar: "bg-slate-400" },
  { value: "qualification", label: "Qualification", color: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",              bar: "bg-sky-400" },
  { value: "proposal",      label: "Proposal",      color: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",          bar: "bg-blue-500" },
  { value: "negotiation",   label: "Negotiation",   color: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",      bar: "bg-amber-500" },
  { value: "closed_won",    label: "Closed Won ✓",  color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300", bar: "bg-emerald-500" },
  { value: "closed_lost",   label: "Closed Lost",   color: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",          bar: "bg-rose-400" },
];

export default function DealsPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView   = has("leads.view");
  const canManage = has("leads.add");

  const [deals, setDeals]           = useState<Deal[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stageFilter, setStageFilter] = useState("all");
  const [showNew, setShowNew]       = useState(false);

  // Form
  const [fTitle,    setFTitle]    = useState("");
  const [fCompany,  setFCompany]  = useState("");
  const [fContact,  setFContact]  = useState("");
  const [fPhone,    setFPhone]    = useState("");
  const [fValue,    setFValue]    = useState("");
  const [fStage,    setFStage]    = useState("prospecting");
  const [fProb,     setFProb]     = useState("20");
  const [fAssigned, setFAssigned] = useState("");
  const [fClose,    setFClose]    = useState("");
  const [fNotes,    setFNotes]    = useState("");
  const [fSaving,   setFSaving]   = useState(false);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase.from("deals").select("*").order("created_at", { ascending: false });
      setDeals((data as Deal[]) ?? []);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  async function saveDeal(e: React.FormEvent) {
    e.preventDefault();
    if (!fTitle) return;
    setFSaving(true);
    const { data: sess } = await supabase.auth.getSession();
    await supabase.from("deals").insert({
      title: fTitle, company: fCompany || null, contact_name: fContact || null,
      contact_phone: fPhone || null, value_inr: parseFloat(fValue) || 0,
      stage: fStage, probability: parseInt(fProb) || 20,
      assigned_to: fAssigned || null, close_date: fClose || null,
      notes: fNotes || null, created_by: sess.session?.user?.id,
    });
    setFTitle(""); setFCompany(""); setFContact(""); setFPhone("");
    setFValue(""); setFStage("prospecting"); setFProb("20");
    setFAssigned(""); setFClose(""); setFNotes("");
    setShowNew(false); setFSaving(false);
    setRefreshKey((k) => k + 1);
  }

  async function moveStage(id: string, stage: string) {
    const prob = { prospecting: 10, qualification: 25, proposal: 50, negotiation: 75, closed_won: 100, closed_lost: 0 }[stage] ?? 20;
    await supabase.from("deals").update({ stage, probability: prob, updated_at: new Date().toISOString() }).eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  const filtered = stageFilter === "all" ? deals : deals.filter((d) => d.stage === stageFilter);
  const pipelineValue = deals.filter((d) => !["closed_won","closed_lost"].includes(d.stage)).reduce((s, d) => s + d.value_inr * (d.probability / 100), 0);
  const wonValue = deals.filter((d) => d.stage === "closed_won").reduce((s, d) => s + d.value_inr, 0);

  return (
    <AdminShell
      doodleType="leads"
      breadcrumbs={[{ label: "Deals" }]}
      title="Deals Pipeline"
      subtitle="Formal deal tracking — proposals, negotiations, closures"
      email={email}
      actions={
        <div className="flex gap-2">
          {canManage && <button type="button" onClick={() => setShowNew((s) => !s)} className={adminPrimaryBtnCls}><Plus className="h-3.5 w-3.5" />New Deal</button>}
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      }
    >
      {/* Stats */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className={`${adminCardCls} p-4`}>
          <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}><TrendingUp className="h-3.5 w-3.5"/>Pipeline Value (Weighted)</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600 dark:text-indigo-300 tabular-nums">₹{Math.round(pipelineValue).toLocaleString("en-IN")}</p>
        </div>
        <div className={`${adminCardCls} p-4`}>
          <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}><DollarSign className="h-3.5 w-3.5"/>Won</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-300 tabular-nums">₹{wonValue.toLocaleString("en-IN")}</p>
        </div>
        <div className={`${adminCardCls} p-4`}>
          <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>Total Deals</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{deals.length}</p>
        </div>
      </div>

      {/* New deal form */}
      {showNew && canManage && (
        <section className={`${adminCardCls} mb-4 p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">New Deal</p>
            <button type="button" onClick={() => setShowNew(false)}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          <form onSubmit={saveDeal} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input className={adminInputCls} placeholder="Deal title *" value={fTitle} onChange={(e) => setFTitle(e.target.value)} required />
            <input className={adminInputCls} placeholder="Company" value={fCompany} onChange={(e) => setFCompany(e.target.value)} />
            <input className={adminInputCls} placeholder="Contact name" value={fContact} onChange={(e) => setFContact(e.target.value)} />
            <input className={adminInputCls} placeholder="Phone" value={fPhone} onChange={(e) => setFPhone(e.target.value)} />
            <input className={adminInputCls} placeholder="Deal value (₹)" type="number" value={fValue} onChange={(e) => setFValue(e.target.value)} />
            <select className={adminInputCls} value={fStage} onChange={(e) => setFStage(e.target.value)}>
              {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <input className={adminInputCls} placeholder="Probability %" type="number" value={fProb} onChange={(e) => setFProb(e.target.value)} />
            <input className={adminInputCls} placeholder="Assigned to" value={fAssigned} onChange={(e) => setFAssigned(e.target.value)} />
            <input className={adminInputCls} type="date" value={fClose} onChange={(e) => setFClose(e.target.value)} />
            <textarea className={`${adminInputCls} sm:col-span-2 lg:col-span-3`} placeholder="Notes" rows={2} value={fNotes} onChange={(e) => setFNotes(e.target.value)} />
            <button type="submit" disabled={fSaving} className={`${adminPrimaryBtnCls} lg:col-span-3 justify-center`}>{fSaving ? "Saving…" : "Create Deal"}</button>
          </form>
        </section>
      )}

      {/* Stage filter */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {[{ value: "all", label: "All", color: "" }, ...STAGES].map((s) => (
          <button key={s.value} type="button" onClick={() => setStageFilter(s.value)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${stageFilter === s.value ? "bg-slate-900 text-white dark:bg-indigo-600" : `border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800`}`}>
            {s.label} {s.value !== "all" && `(${deals.filter((d) => d.stage === s.value).length})`}
          </button>
        ))}
      </div>

      {/* Deals table */}
      {loading ? (
        <p className={`py-8 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className={`${adminCardCls} p-12 text-center`}>
          <p className={`text-sm ${adminMutedCls}`}>No deals yet. Create your first deal!</p>
        </div>
      ) : (
        <section className={`${adminCardCls} overflow-hidden`}>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {["Deal", "Company", "Value", "Stage", "Prob", "Assigned", "Close Date", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((d) => {
                const stage = STAGES.find((s) => s.value === d.stage);
                return (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-bold">{d.title}</p>
                      {d.contact_name && <p className={`text-[11px] ${adminMutedCls}`}>{d.contact_name} {d.contact_phone && `· ${d.contact_phone}`}</p>}
                    </td>
                    <td className={`px-4 py-2.5 text-xs ${adminMutedCls}`}>{d.company ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-300 tabular-nums">₹{d.value_inr.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5">
                      {canManage ? (
                        <select className={`rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] dark:border-slate-700 dark:bg-slate-900`} value={d.stage} onChange={(e) => moveStage(d.id, e.target.value)}>
                          {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      ) : (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${stage?.color ?? ""}`}>{stage?.label ?? d.stage}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className={`h-full rounded-full ${stage?.bar ?? "bg-slate-400"}`} style={{ width: `${d.probability}%` }} />
                        </div>
                        <span className={`text-[11px] ${adminMutedCls}`}>{d.probability}%</span>
                      </div>
                    </td>
                    <td className={`px-4 py-2.5 text-xs ${adminMutedCls}`}>{d.assigned_to ?? "—"}</td>
                    <td className={`px-4 py-2.5 text-xs ${adminMutedCls}`}>{d.close_date ? new Date(d.close_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</td>
                    <td className="px-4 py-2.5" />
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </section>
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



