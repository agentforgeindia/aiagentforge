"use client";

// /admin/automation — Automation Center: if-then rules engine.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Zap, Plus, Power, Trash2, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, {
  adminCardCls, adminMutedCls, adminSecondaryBtnCls,
  adminPrimaryBtnCls, adminInputCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Rule = {
  id: string;
  name: string;
  trigger_event: string;
  conditions: any[];
  actions: any[];
  enabled: boolean;
  run_count: number;
  last_run_at: string | null;
  created_at: string;
};

const TRIGGERS = [
  { value: "lead_created",    label: "Lead Created",        icon: "🎯" },
  { value: "demo_done",       label: "Demo Done",           icon: "📞" },
  { value: "payment_success", label: "Payment Success",     icon: "💰" },
  { value: "credits_low",     label: "Credits Low",         icon: "💎" },
  { value: "plan_expiring",   label: "Plan Expiring",       icon: "⏰" },
  { value: "signup",          label: "New Signup",          icon: "👤" },
  { value: "support_ticket",  label: "Support Ticket",      icon: "🎫" },
  { value: "task_overdue",    label: "Task Overdue",        icon: "📋" },
  { value: "manual",          label: "Manual Trigger",      icon: "▶️" },
];

const ACTION_TYPES = [
  { value: "send_email",         label: "Send Email" },
  { value: "create_task",        label: "Create Task" },
  { value: "assign_lead",        label: "Assign Lead" },
  { value: "update_lead_status", label: "Update Lead Status" },
  { value: "notify_admin",       label: "Notify Admin" },
];

export default function AutomationPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView   = has("settings.view");
  const canManage = has("settings.manage");

  const [rules, setRules]           = useState<Rule[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showNew, setShowNew]       = useState(false);

  // New rule form
  const [fName,    setFName]    = useState("");
  const [fTrigger, setFTrigger] = useState("lead_created");
  const [fActions, setFActions] = useState([{ type: "create_task", value: "" }]);
  const [fSaving,  setFSaving]  = useState(false);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase.from("automation_rules").select("*").order("created_at");
      setRules((data as Rule[]) ?? []);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  async function saveRule(e: React.FormEvent) {
    e.preventDefault();
    if (!fName) return;
    setFSaving(true);
    const { data: sess } = await supabase.auth.getSession();
    await supabase.from("automation_rules").insert({
      name: fName, trigger_event: fTrigger,
      actions: fActions, conditions: [],
      created_by: sess.session?.user?.id,
    });
    setFName(""); setFTrigger("lead_created"); setFActions([{ type: "create_task", value: "" }]);
    setShowNew(false); setFSaving(false);
    setRefreshKey((k) => k + 1);
  }

  async function toggleRule(id: string, enabled: boolean) {
    await supabase.from("automation_rules").update({ enabled: !enabled }).eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  async function deleteRule(id: string) {
    if (!confirm("Delete this rule?")) return;
    await supabase.from("automation_rules").delete().eq("id", id);
    setRefreshKey((k) => k + 1);
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  const enabledCount = rules.filter((r) => r.enabled).length;

  return (
    <AdminShell
      breadcrumbs={[{ label: "Automation" }]}
      title="Automation Center"
      subtitle="If-then rules — trigger actions automatically"
      email={email}
      actions={
        <div className="flex gap-2">
          {canManage && (
            <button type="button" onClick={() => setShowNew((s) => !s)} className={adminPrimaryBtnCls}>
              <Plus className="h-3.5 w-3.5" />New Rule
            </button>
          )}
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
            <RefreshCw className="h-3.5 w-3.5" />Refresh
          </button>
        </div>
      }
    >
      {/* Stats */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total Rules",   val: rules.length },
          { label: "Active",        val: enabledCount,              tone: "emerald" },
          { label: "Inactive",      val: rules.length - enabledCount, tone: undefined },
        ].map((s) => (
          <div key={s.label} className={`${adminCardCls} p-4`}>
            <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.tone === "emerald" ? "text-emerald-600 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200"}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* New rule form */}
      {showNew && canManage && (
        <section className={`${adminCardCls} mb-4 p-4`}>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">New Rule</p>
          <form onSubmit={saveRule} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-[0.14em] ${adminMutedCls}`}>Rule Name</label>
                <input className={`${adminInputCls} mt-1`} placeholder="e.g. Assign new leads" value={fName} onChange={(e) => setFName(e.target.value)} required />
              </div>
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-[0.14em] ${adminMutedCls}`}>When (Trigger)</label>
                <select className={`${adminInputCls} mt-1`} value={fTrigger} onChange={(e) => setFTrigger(e.target.value)}>
                  {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-[0.14em] ${adminMutedCls}`}>Then (Actions)</label>
              {fActions.map((a, i) => (
                <div key={i} className="mt-1.5 flex gap-2">
                  <select className={`${adminInputCls} flex-1`} value={a.type} onChange={(e) => setFActions((prev) => prev.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}>
                    {ACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <input className={`${adminInputCls} flex-1`} placeholder="Value (email, message, etc.)" value={a.value} onChange={(e) => setFActions((prev) => prev.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} />
                  {i > 0 && <button type="button" onClick={() => setFActions((prev) => prev.filter((_, j) => j !== i))} className="text-rose-500 hover:text-rose-700">✕</button>}
                </div>
              ))}
              <button type="button" onClick={() => setFActions((prev) => [...prev, { type: "create_task", value: "" }])} className={`mt-2 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-300`}>+ Add Action</button>
            </div>
            <button type="submit" disabled={fSaving} className={adminPrimaryBtnCls}>
              <Save className="h-3.5 w-3.5" />{fSaving ? "Saving…" : "Create Rule"}
            </button>
          </form>
        </section>
      )}

      {/* Rules list */}
      {loading ? (
        <p className={`py-8 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : rules.length === 0 ? (
        <div className={`${adminCardCls} p-12 text-center`}>
          <Zap className="mx-auto h-8 w-8 text-slate-300" />
          <p className={`mt-2 text-sm ${adminMutedCls}`}>No automation rules yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((r) => {
            const trigger = TRIGGERS.find((t) => t.value === r.trigger_event);
            return (
              <div key={r.id} className={`${adminCardCls} p-4 ${!r.enabled ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{trigger?.icon ?? "⚡"}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">{r.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.enabled ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>
                          {r.enabled ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className={`text-xs ${adminMutedCls}`}>
                        When: <span className="font-medium">{trigger?.label ?? r.trigger_event}</span>
                        {r.run_count > 0 && ` · Ran ${r.run_count} times`}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(r.actions as any[]).map((a, i) => (
                          <span key={i} className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                            → {ACTION_TYPES.find((t) => t.value === a.type)?.label ?? a.type}
                            {a.value ? `: ${String(a.value).slice(0, 30)}` : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => toggleRule(r.id, r.enabled)}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-bold transition ${r.enabled ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900" : "bg-emerald-600 text-white hover:bg-emerald-500"}`}>
                        <Power className="h-3.5 w-3.5" />{r.enabled ? "Disable" : "Enable"}
                      </button>
                      <button type="button" onClick={() => deleteRule(r.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-500/10 dark:text-rose-300">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
        <h1 className="mt-3 text-base font-bold">Access denied</h1>
      </div>
    </main>
  );
}
