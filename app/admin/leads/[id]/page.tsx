"use client";

// ============================================================
// /admin/leads/[id] — single lead view with status, contact,
// activity timeline and raw payload from the source webhook.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Phone, ShieldCheck, Send, Trash2 } from "lucide-react";
import AdminShell, {
  adminCardCls,
  adminInputCls,
  adminMutedCls,
  adminPrimaryBtnCls,
} from "../../AdminShell";
import { useAdminPermissions } from "../../AdminPermissions";

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  business_name: string | null;
  city: string | null;
  source: string;
  source_detail: string | null;
  status: string;
  lost_reason: string | null;
  notes: string | null;
  tags: string[];
  next_action_at: string | null;
  expected_revenue: number | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  external_lead_id: string | null;
  raw_payload: unknown;
  created_at: string;
  updated_at: string;
};

type Activity = {
  id: string;
  type: string;
  direction: string | null;
  summary: string;
  outcome: string | null;
  duration_seconds: number | null;
  created_at: string;
};

const STATUSES = [
  { value: "new",       label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "demo",      label: "Demo" },
  { value: "trial",     label: "Trial" },
  { value: "converted", label: "Converted" },
  { value: "lost",      label: "Lost" },
];

const ACTIVITY_TYPES = [
  { value: "call",     label: "Call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email",    label: "Email" },
  { value: "meeting",  label: "Meeting" },
  { value: "dm",       label: "DM" },
  { value: "note",     label: "Note" },
];

export default function AdminLeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const leadId = params?.id;
  const { loading: pLoading, has, email } = useAdminPermissions();

  const canView = has("leads.view");
  const canEdit = has("leads.edit");
  const canDelete = has("leads.delete");

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    due_at: string | null;
    assigned_to_email: string | null;
  }>>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [savingTask, setSavingTask] = useState(false);
  const canCreateTask = has("tasks.create");
  const canEditTask = has("tasks.edit");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // New-activity form
  const [actType, setActType] = useState("note");
  const [actDirection, setActDirection] = useState<"inbound" | "outbound" | "">("");
  const [actSummary, setActSummary] = useState("");
  const [actOutcome, setActOutcome] = useState("");
  const [savingAct, setSavingAct] = useState(false);

  useEffect(() => {
    if (!canView || !leadId) return;
    setLoading(true);
    (async () => {
      const [{ data: l }, { data: a }, { data: tk }] = await Promise.all([
        supabase.from("leads").select("*").eq("id", leadId).maybeSingle(),
        supabase
          .from("lead_activities")
          .select(
            "id, type, direction, summary, outcome, duration_seconds, created_at",
          )
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false }),
        supabase
          .from("tasks")
          .select("id, title, status, priority, due_at, assigned_to_email")
          .eq("related_lead_id", leadId)
          .order("due_at", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false }),
      ]);
      setLead(l as Lead | null);
      setActivities((a ?? []) as Activity[]);
      setTasks((tk ?? []) as typeof tasks);
      setLoading(false);
    })();
  }, [canView, leadId, refreshKey]);

  async function patchLead(patch: Partial<Lead>) {
    if (!leadId || !canEdit) return;
    const { error } = await supabase.from("leads").update(patch).eq("id", leadId);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  async function addActivity() {
    if (!leadId || !canEdit) return;
    if (!actSummary.trim()) return;
    setSavingAct(true);
    const { data: sess } = await supabase.auth.getSession();
    const created_by = sess.session?.user?.id ?? null;
    const { error } = await supabase.from("lead_activities").insert({
      lead_id: leadId,
      type: actType,
      direction: actDirection || null,
      summary: actSummary.trim(),
      outcome: actOutcome.trim() || null,
      created_by,
    });
    setSavingAct(false);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    setActType("note");
    setActDirection("");
    setActSummary("");
    setActOutcome("");
    setRefreshKey((k) => k + 1);
  }

  async function addTask() {
    if (!leadId || !newTaskTitle.trim()) return;
    setSavingTask(true);
    const { data: sess } = await supabase.auth.getSession();
    const created_by = sess.session?.user?.id ?? null;
    const { error } = await supabase.from("tasks").insert({
      title: newTaskTitle.trim(),
      type: "follow_up",
      status: "pending",
      priority: "normal",
      related_lead_id: leadId,
      due_at: newTaskDue ? new Date(newTaskDue).toISOString() : null,
      created_by,
    });
    setSavingTask(false);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    setNewTaskTitle("");
    setNewTaskDue("");
    setRefreshKey((k) => k + 1);
  }

  async function toggleTask(id: string, current: string) {
    const next = current === "completed" ? "pending" : "completed";
    const { error } = await supabase.from("tasks").update({ status: next }).eq("id", id);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  async function deleteWholeLead() {
    if (!leadId || !lead) return;
    const ok = confirm(
      `Permanently delete "${lead.name}"?\n\nThis removes the lead row and its activity log. There is no undo.`,
    );
    if (!ok) return;
    const { error } = await supabase.from("leads").delete().eq("id", leadId);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    await supabase.rpc("log_admin_action", {
      p_action: "leads.delete",
      p_target_type: "lead",
      p_target_id: leadId,
      p_details: { name: lead.name, source: lead.source },
    });
    router.push("/admin/leads");
  }

  async function deleteActivity(id: string) {
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase
      .from("lead_activities")
      .delete()
      .eq("id", id);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  const subtitle = useMemo(() => {
    if (!lead) return undefined;
    const parts = [
      STATUSES.find((s) => s.value === lead.status)?.label ?? lead.status,
      sourceLabel(lead.source),
      lead.business_name,
    ].filter(Boolean);
    return parts.join(" · ");
  }, [lead]);

  if (pLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">
        Checking access…
      </main>
    );
  }
  if (!canView) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
          <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
          <h1 className="mt-3 text-base font-bold">Access denied</h1>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      breadcrumbs={[
        { label: "Leads", href: "/admin/leads" },
        { label: lead?.name ?? "—" },
      ]}
      title={lead?.name ?? "Loading…"}
      subtitle={subtitle}
      email={email}
      actions={
        canDelete && lead ? (
          <button
            type="button"
            onClick={deleteWholeLead}
            className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-700/40 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete lead
          </button>
        ) : null
      }
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : !lead ? (
        <div className={`${adminCardCls} p-6 text-center`}>
          <p className={`text-sm ${adminMutedCls}`}>Lead not found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Identity row */}
          <section className={`${adminCardCls} p-4`}>
            <dl className="grid gap-3 sm:grid-cols-4">
              <Field label="Phone" value={lead.phone ?? "—"} />
              <Field label="Email" value={lead.email ?? "—"} />
              <Field label="City"  value={lead.city  ?? "—"} />
              <Field label="Created" value={formatDate(lead.created_at)} />
            </dl>
            {lead.phone && (
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={`tel:${lead.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Phone className="h-3 w-3" />
                  Call
                </a>
                <a
                  href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-600/40 dark:bg-emerald-500/15 dark:text-emerald-200"
                >
                  WhatsApp
                </a>
              </div>
            )}
          </section>

          {/* Status / pipeline controls */}
          {canEdit && (
            <section className={`${adminCardCls} p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Pipeline
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Status
                  </span>
                  <select
                    value={lead.status}
                    onChange={(e) => patchLead({ status: e.target.value })}
                    className={adminInputCls}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Next action
                  </span>
                  <input
                    type="date"
                    value={
                      lead.next_action_at
                        ? lead.next_action_at.slice(0, 10)
                        : ""
                    }
                    onChange={(e) =>
                      patchLead({
                        next_action_at: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      })
                    }
                    className={adminInputCls}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Expected revenue (₹)
                  </span>
                  <input
                    type="number"
                    value={lead.expected_revenue ?? ""}
                    onChange={(e) =>
                      patchLead({
                        expected_revenue: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className={adminInputCls}
                  />
                </label>
              </div>
              {lead.status === "lost" && (
                <label className="mt-3 block">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Why lost?
                  </span>
                  <input
                    type="text"
                    value={lead.lost_reason ?? ""}
                    onChange={(e) => patchLead({ lost_reason: e.target.value })}
                    placeholder="e.g. budget, competitor, no response"
                    className={adminInputCls}
                  />
                </label>
              )}
            </section>
          )}

          {/* Activity timeline */}
          <section className={`${adminCardCls} p-4`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Activity timeline
            </p>

            {canEdit && (
              <div className="mt-3 grid gap-2 sm:grid-cols-[120px_120px_1fr_180px_auto]">
                <select
                  value={actType}
                  onChange={(e) => setActType(e.target.value)}
                  className={adminInputCls}
                >
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <select
                  value={actDirection}
                  onChange={(e) =>
                    setActDirection(e.target.value as "inbound" | "outbound" | "")
                  }
                  className={adminInputCls}
                >
                  <option value="">Direction…</option>
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                </select>
                <input
                  type="text"
                  value={actSummary}
                  onChange={(e) => setActSummary(e.target.value)}
                  placeholder="What happened?"
                  className={adminInputCls}
                />
                <input
                  type="text"
                  value={actOutcome}
                  onChange={(e) => setActOutcome(e.target.value)}
                  placeholder="Outcome (optional)"
                  className={adminInputCls}
                />
                <button
                  type="button"
                  onClick={addActivity}
                  disabled={savingAct || !actSummary.trim()}
                  className={adminPrimaryBtnCls}
                >
                  <Send className="h-3.5 w-3.5" />
                  {savingAct ? "Saving…" : "Log"}
                </button>
              </div>
            )}

            <ul className="mt-4 space-y-2">
              {activities.length === 0 ? (
                <li className={`rounded-md border border-dashed border-slate-200 p-4 text-center text-sm dark:border-slate-700 ${adminMutedCls}`}>
                  No activity logged yet.
                </li>
              ) : (
                activities.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-md border border-slate-200 bg-slate-50/50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                            {ACTIVITY_TYPES.find((t) => t.value === a.type)?.label ?? a.type}
                          </span>
                          {a.direction && (
                            <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${adminMutedCls}`}>
                              {a.direction}
                            </span>
                          )}
                          <span className={`text-[11px] ${adminMutedCls}`}>
                            {formatDateTime(a.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap leading-6">
                          {a.summary}
                        </p>
                        {a.outcome && (
                          <p className={`mt-1 text-xs ${adminMutedCls}`}>
                            Outcome: {a.outcome}
                          </p>
                        )}
                      </div>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => deleteActivity(a.id)}
                          title="Delete"
                          className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* Tasks linked to this lead */}
          <section className={`${adminCardCls} p-4`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Tasks
            </p>

            {canCreateTask && (
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_180px_auto]">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="What needs doing for this lead?"
                  className={adminInputCls}
                />
                <input
                  type="date"
                  value={newTaskDue}
                  onChange={(e) => setNewTaskDue(e.target.value)}
                  className={adminInputCls}
                />
                <button
                  type="button"
                  onClick={addTask}
                  disabled={savingTask || !newTaskTitle.trim()}
                  className={adminPrimaryBtnCls}
                >
                  <Send className="h-3.5 w-3.5" />
                  {savingTask ? "Saving…" : "Add"}
                </button>
              </div>
            )}

            <ul className="mt-4 space-y-2">
              {tasks.length === 0 ? (
                <li className={`rounded-md border border-dashed border-slate-200 p-4 text-center text-sm dark:border-slate-700 ${adminMutedCls}`}>
                  No tasks linked to this lead yet.
                </li>
              ) : (
                tasks.map((t) => {
                  const done = t.status === "completed";
                  return (
                    <li
                      key={t.id}
                      className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50/50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/40"
                    >
                      {canEditTask ? (
                        <button
                          type="button"
                          onClick={() => toggleTask(t.id, t.status)}
                          className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                            done
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 hover:border-emerald-500 dark:border-slate-600"
                          }`}
                        >
                          {done && <CheckCircle2 className="h-3 w-3" />}
                        </button>
                      ) : (
                        <span
                          className={`mt-1 inline-block h-3 w-3 shrink-0 rounded-full ${
                            done ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p
                          className={
                            done
                              ? "text-slate-500 line-through dark:text-slate-500"
                              : "font-bold"
                          }
                        >
                          {t.title}
                        </p>
                        <div className={`mt-0.5 flex flex-wrap items-center gap-2 text-[11px] ${adminMutedCls}`}>
                          <span className="uppercase tracking-[0.14em]">
                            {t.priority}
                          </span>
                          {t.due_at && (
                            <span>
                              Due {formatDate(t.due_at)}
                            </span>
                          )}
                          {t.assigned_to_email && (
                            <span>👤 {t.assigned_to_email}</span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          {/* Source / attribution */}
          <section className={`${adminCardCls} p-4`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Source
            </p>
            <dl className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="Channel" value={sourceLabel(lead.source)} />
              <Field label="Detail" value={lead.source_detail ?? "—"} />
              <Field
                label="External ID"
                value={lead.external_lead_id ?? "—"}
                mono
              />
              {(lead.utm_source || lead.utm_campaign) && (
                <>
                  <Field label="UTM source" value={lead.utm_source ?? "—"} />
                  <Field label="UTM medium" value={lead.utm_medium ?? "—"} />
                  <Field label="UTM campaign" value={lead.utm_campaign ?? "—"} />
                </>
              )}
            </dl>
            {Boolean(lead.raw_payload) && (
              <details className="mt-3">
                <summary className={`cursor-pointer text-[11px] font-bold uppercase tracking-[0.14em] ${adminMutedCls}`}>
                  Raw webhook payload
                </summary>
                <pre className="mt-2 max-h-72 overflow-auto rounded-md bg-slate-900 p-3 text-[11px] leading-5 text-slate-100">
                  {JSON.stringify(lead.raw_payload, null, 2)}
                </pre>
              </details>
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd
        className={`mt-0.5 truncate text-sm ${
          mono ? "font-mono text-xs" : "font-bold"
        } text-slate-800 dark:text-slate-100`}
      >
        {value}
      </dd>
    </div>
  );
}

function sourceLabel(src: string) {
  const labels: Record<string, string> = {
    instagram: "Instagram",
    facebook:  "Facebook",
    whatsapp:  "WhatsApp",
    google:    "Google",
    call:      "Phone",
    referral:  "Referral",
    website:   "Website",
    event:     "Event",
    other:     "Other",
  };
  return labels[src] ?? src;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
