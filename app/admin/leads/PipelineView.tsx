"use client";

// Sales Pipeline — Kanban view for /admin/leads

import { supabase } from "@/lib/supabase";
import { adminCardCls, adminMutedCls } from "../AdminShell";

type LeadRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  business_name: string | null;
  source: string;
  status: string;
  created_at: string;
};

const PIPELINE_COLS = [
  { status: "new",       label: "New Lead",         color: "border-t-slate-400",   dot: "bg-slate-400" },
  { status: "contacted", label: "Contacted",         color: "border-t-sky-400",     dot: "bg-sky-400" },
  { status: "qualified", label: "Qualified",         color: "border-t-blue-500",    dot: "bg-blue-500" },
  { status: "demo",      label: "Demo Scheduled",    color: "border-t-indigo-500",  dot: "bg-indigo-500" },
  { status: "trial",     label: "Demo Done",         color: "border-t-violet-500",  dot: "bg-violet-500" },
  { status: "converted", label: "Won ✓",             color: "border-t-emerald-500", dot: "bg-emerald-500" },
  { status: "lost",      label: "Lost",              color: "border-t-rose-400",    dot: "bg-rose-400" },
];

const NEXT_STATUS: Record<string, string> = {
  new:       "contacted",
  contacted: "qualified",
  qualified: "demo",
  demo:      "trial",
  trial:     "converted",
};

const PREV_STATUS: Record<string, string> = {
  contacted: "new",
  qualified: "contacted",
  demo:      "qualified",
  trial:     "demo",
  converted: "trial",
};

export default function PipelineView({
  leads,
  canManage,
  onStatusChange,
}: {
  leads: LeadRow[];
  canManage: boolean;
  onStatusChange: () => void;
}) {
  async function moveCard(id: string, newStatus: string) {
    await supabase.from("leads").update({ status: newStatus }).eq("id", id);
    onStatusChange();
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3" style={{ minWidth: `${PIPELINE_COLS.length * 220}px` }}>
        {PIPELINE_COLS.map((col) => {
          const cards = leads.filter((l) => l.status === col.status);
          return (
            <div key={col.status} className="flex w-52 shrink-0 flex-col gap-2">
              {/* Column header */}
              <div className={`rounded-lg border-t-4 ${col.color} ${adminCardCls} px-3 py-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{col.label}</span>
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${col.dot}`}>
                    {cards.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {cards.map((lead) => (
                  <div key={lead.id} className={`${adminCardCls} p-3`}>
                    <p className="truncate text-xs font-bold">{lead.name}</p>
                    {lead.business_name && (
                      <p className={`truncate text-[11px] ${adminMutedCls}`}>{lead.business_name}</p>
                    )}
                    {lead.phone && (
                      <p className={`text-[11px] ${adminMutedCls}`}>{lead.phone}</p>
                    )}
                    <p className={`mt-1 text-[10px] uppercase tracking-[0.14em] ${adminMutedCls}`}>
                      {lead.source} · {new Date(lead.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>

                    {canManage && (
                      <div className="mt-2 flex gap-1">
                        {PREV_STATUS[col.status] && (
                          <button
                            type="button"
                            onClick={() => moveCard(lead.id, PREV_STATUS[col.status])}
                            className="flex-1 rounded border border-slate-200 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                          >
                            ← Back
                          </button>
                        )}
                        {NEXT_STATUS[col.status] && (
                          <button
                            type="button"
                            onClick={() => moveCard(lead.id, NEXT_STATUS[col.status])}
                            className="flex-1 rounded bg-indigo-600 py-0.5 text-[10px] font-bold text-white hover:bg-indigo-500"
                          >
                            Next →
                          </button>
                        )}
                        {col.status !== "lost" && col.status !== "converted" && (
                          <button
                            type="button"
                            onClick={() => moveCard(lead.id, "lost")}
                            className="rounded border border-rose-200 px-1.5 py-0.5 text-[10px] font-medium text-rose-500 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-500/10"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {cards.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center dark:border-slate-800">
                    <p className={`text-[11px] ${adminMutedCls}`}>Empty</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
