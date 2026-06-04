"use client";

// /admin/sales — Sales Command Center: calling queue, followups, hot leads.

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Phone, Flame, AlertCircle, Clock, CheckCircle, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import AdminShell, { adminCardCls, adminMutedCls, adminSecondaryBtnCls, adminPrimaryBtnCls, adminInputCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Lead = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  business_name: string | null;
  source: string;
  status: string;
  score: number;
  score_reasons: string[];
  notes: string | null;
  tags: string[];
  created_at: string;
  assigned_to: string | null;
};

type CallLog = {
  lead_id: string;
  note: string;
  outcome: string;
  called_at: string;
  called_by: string;
};

const OUTCOME_COLORS: Record<string, string> = {
  interested:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  not_interested:"bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  callback:      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  no_answer:     "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  demo_scheduled:"bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
};

function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-300";
  if (score >= 50) return "text-amber-600 dark:text-amber-300";
  return "text-slate-400";
}

function scoreLabel(score: number): string {
  if (score >= 75) return "🔥 Hot";
  if (score >= 50) return "⚡ Warm";
  if (score >= 25) return "❄️ Cold";
  return "💀 Dead";
}

export default function SalesCommandPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView = has("leads.view");

  const [hotLeads, setHotLeads]         = useState<Lead[]>([]);
  const [todayFollowups, setTodayFollowups] = useState<Lead[]>([]);
  const [missedLeads, setMissedLeads]   = useState<Lead[]>([]);
  const [newLeads, setNewLeads]         = useState<Lead[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshKey, setRefreshKey]     = useState(0);

  // Call log modal
  const [calling, setCalling]           = useState<Lead | null>(null);
  const [callNote, setCallNote]         = useState("");
  const [callOutcome, setCallOutcome]   = useState("interested");
  const [callLogs, setCallLogs]         = useState<CallLog[]>([]);
  const [savingCall, setSavingCall]     = useState(false);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

      const [hot, followups, missed, fresh] = await Promise.all([
        // Hot leads (score >= 60, not converted/lost)
        supabase.from("leads").select("*").gte("score", 60).not("status", "in", '("converted","lost")').order("score", { ascending: false }).limit(20),
        // Today's followups — tasks due today linked to leads
        supabase.from("leads").select("*").eq("status", "contacted").gte("created_at", weekAgo).order("score", { ascending: false }).limit(20),
        // New leads not yet contacted (older than 6h)
        supabase.from("leads").select("*").eq("status", "new").lt("created_at", new Date(Date.now() - 6 * 3600000).toISOString()).order("created_at", { ascending: false }).limit(20),
        // Fresh new leads today
        supabase.from("leads").select("*").eq("status", "new").gte("created_at", today).order("created_at", { ascending: false }).limit(10),
      ]);

      setHotLeads((hot.data as Lead[]) ?? []);
      setTodayFollowups((followups.data as Lead[]) ?? []);
      setMissedLeads((missed.data as Lead[]) ?? []);
      setNewLeads((fresh.data as Lead[]) ?? []);
      setLoading(false);
    })();
  }, [canView, refreshKey]);

  async function openCallModal(lead: Lead) {
    setCalling(lead);
    setCallNote(""); setCallOutcome("interested");
    // Load call history from notes
    const { data } = await supabase.from("lead_notes").select("*").eq("user_id", lead.id).order("created_at", { ascending: false }).limit(10);
    setCallLogs((data as unknown as CallLog[]) ?? []);
  }

  async function saveCallLog() {
    if (!calling || !callNote.trim()) return;
    setSavingCall(true);
    const tag = `[${callOutcome.toUpperCase().replace("_", " ")}]`;
    await supabase.from("lead_notes").insert({
      user_id: calling.id,
      note:    `📞 ${tag} ${callNote}`,
      tag:     callOutcome,
    });
    // Update lead status if demo scheduled
    if (callOutcome === "demo_scheduled") {
      await supabase.from("leads").update({ status: "demo" }).eq("id", calling.id);
    } else if (callOutcome === "interested" && calling.status === "new") {
      await supabase.from("leads").update({ status: "contacted" }).eq("id", calling.id);
    } else if (callOutcome === "not_interested") {
      await supabase.from("leads").update({ status: "lost" }).eq("id", calling.id);
    }
    setSavingCall(false);
    setCalling(null);
    setRefreshKey((k) => k + 1);
  }

  if (pLoading) return <Loading />;
  if (!canView)  return <Denied />;

  return (
    <AdminShell
      breadcrumbs={[{ label: "Sales" }]}
      title="Sales Command Center"
      subtitle="Calling queue, hot leads, followups, missed leads"
      email={email}
      actions={
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className={adminSecondaryBtnCls}>
          <RefreshCw className="h-3.5 w-3.5" />Refresh
        </button>
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : (
        <div className="space-y-4">
          {/* Stats strip */}
          <section className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "Hot Leads",       val: hotLeads.length,       icon: <Flame className="h-4 w-4" />,        tone: "text-rose-600 dark:text-rose-300" },
              { label: "New Today",       val: newLeads.length,       icon: <Clock className="h-4 w-4" />,         tone: "text-sky-600 dark:text-sky-300" },
              { label: "Pending Followup",val: todayFollowups.length, icon: <MessageSquare className="h-4 w-4" />, tone: "text-amber-600 dark:text-amber-300" },
              { label: "Missed (6h+)",    val: missedLeads.length,    icon: <AlertCircle className="h-4 w-4" />,   tone: missedLeads.length > 0 ? "text-rose-600 dark:text-rose-300" : "text-slate-400" },
            ].map((s) => (
              <div key={s.label} className={`${adminCardCls} p-4`}>
                <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${adminMutedCls}`}>{s.icon}{s.label}</p>
                <p className={`mt-1 text-2xl font-bold tabular-nums ${s.tone}`}>{s.val}</p>
              </div>
            ))}
          </section>

          {/* Two columns: Hot + Missed */}
          <section className="grid gap-4 lg:grid-cols-2">
            <LeadQueue title="🔥 Hot Leads — Call Now" leads={hotLeads} onCall={openCallModal} showScore />
            <LeadQueue title="🚨 Missed — Not Contacted 6h+" leads={missedLeads} onCall={openCallModal} tone="rose" />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <LeadQueue title="📞 Followup Queue" leads={todayFollowups} onCall={openCallModal} />
            <LeadQueue title="🆕 New Today" leads={newLeads} onCall={openCallModal} />
          </section>
        </div>
      )}

      {/* Call Modal */}
      {calling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#11141a]">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{calling.name}</p>
                  <p className={`text-xs ${adminMutedCls}`}>{calling.phone ?? calling.email ?? "No contact"}</p>
                </div>
                {calling.phone && (
                  <a href={`tel:${calling.phone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500">
                    <Phone className="h-4 w-4" />Call
                  </a>
                )}
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>Outcome</label>
                <select className={`${adminInputCls} mt-1`} value={callOutcome} onChange={(e) => setCallOutcome(e.target.value)}>
                  <option value="interested">Interested</option>
                  <option value="demo_scheduled">Demo Scheduled</option>
                  <option value="callback">Callback Later</option>
                  <option value="no_answer">No Answer</option>
                  <option value="not_interested">Not Interested</option>
                </select>
              </div>
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>Call Notes</label>
                <textarea className={`${adminInputCls} mt-1`} rows={3} placeholder="What did they say?" value={callNote} onChange={(e) => setCallNote(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-200 px-5 py-3 dark:border-slate-800">
              <button type="button" onClick={() => setCalling(null)} className={`${adminSecondaryBtnCls} flex-1 justify-center`}>Cancel</button>
              <button type="button" onClick={saveCallLog} disabled={savingCall || !callNote.trim()} className={`${adminPrimaryBtnCls} flex-1 justify-center`}>
                <CheckCircle className="h-3.5 w-3.5" />
                {savingCall ? "Saving…" : "Save Call"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function LeadQueue({ title, leads, onCall, showScore, tone }: {
  title: string; leads: Lead[]; onCall: (l: Lead) => void; showScore?: boolean; tone?: "rose";
}) {
  return (
    <div className={adminCardCls}>
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tone === "rose" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
          {leads.length}
        </span>
      </div>
      {leads.length === 0 ? (
        <p className={`p-6 text-center text-xs ${adminMutedCls}`}>All clear!</p>
      ) : (
        <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
          {leads.map((l) => (
            <li key={l.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs font-bold">{l.name}</p>
                  {showScore && <span className={`text-[10px] font-bold ${scoreColor(l.score)}`}>{scoreLabel(l.score)}</span>}
                </div>
                <p className={`text-[11px] ${adminMutedCls}`}>{l.business_name ?? l.phone ?? l.email ?? l.source}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Link href={`/admin/leads/${l.id}`} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                  View
                </Link>
                <button type="button" onClick={() => onCall(l)} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-500">
                  <Phone className="h-3 w-3" />Call
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
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
