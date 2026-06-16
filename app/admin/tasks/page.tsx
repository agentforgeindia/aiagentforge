"use client";

// ============================================================
// /admin/tasks — work item tracker for the team.
// ============================================================
// Each task has a title, type, priority, status, due date,
// optional assignee, and optional link to a lead or customer.
//
// View modes:
//   • Open      — anything not completed or cancelled
//   • Mine      — open + assigned to me
//   • Overdue   — open + due_at < now
//   • Done      — completed
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  Download,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import AdminShell, {
  adminCardCls,
  adminInputCls,
  adminMutedCls,
  adminPrimaryBtnCls,
  adminSecondaryBtnCls,
} from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";
import { buildCsv, downloadCsv } from "@/lib/csv";

type Task = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  assigned_to_email: string | null;
  due_at: string | null;
  completed_at: string | null;
  related_lead_id: string | null;
  related_customer_id: string | null;
  created_at: string;
  updated_at: string;
};

type Member = { email: string; full_name: string | null };

const TYPES = [
  { value: "general",         label: "General" },
  { value: "follow_up",       label: "Follow-up" },
  { value: "call",            label: "Call" },
  { value: "demo",            label: "Demo" },
  { value: "payment_reminder",label: "Payment reminder" },
  { value: "content",         label: "Content" },
  { value: "onboarding",      label: "Onboarding" },
  { value: "refund",          label: "Refund" },
];

const STATUSES = [
  { value: "pending",     label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed",   label: "Completed" },
  { value: "cancelled",   label: "Cancelled" },
];

const PRIORITIES = [
  { value: "low",     label: "Low" },
  { value: "normal",  label: "Normal" },
  { value: "high",    label: "High" },
  { value: "urgent",  label: "Urgent" },
];

const STATUS_STYLES: Record<string, string> = {
  pending:     "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  completed:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  cancelled:   "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const PRIORITY_STYLES: Record<string, string> = {
  low:    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  normal: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  high:   "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  urgent: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

type ViewMode = "open" | "mine" | "overdue" | "done" | "all";

export default function AdminTasksPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView = has("tasks.view");
  const canCreate = has("tasks.create");
  const canEdit = has("tasks.edit");
  const canDelete = has("tasks.delete");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [view, setView] = useState<ViewMode>("open");
  const [search, setSearch] = useState("");

  // Inline create form
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Partial<Task>>({
    title: "",
    description: "",
    type: "general",
    priority: "normal",
    assigned_to_email: "",
    due_at: null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canView) return;
    setLoadingRows(true);
    (async () => {
      const [{ data: t }, { data: m }] = await Promise.all([
        supabase
          .from("tasks")
          .select("*")
          .order("due_at", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("admin_users")
          .select("email, full_name")
          .eq("active", true)
          .order("email"),
      ]);
      setTasks((t ?? []) as Task[]);
      setMembers((m ?? []) as Member[]);
      setLoadingRows(false);
    })();
  }, [canView, refreshKey]);

  const now = useMemo(() => new Date().toISOString(), []);

  const filtered = useMemo(() => {
    const me = (email ?? "").toLowerCase();
    const qs = search.trim().toLowerCase();
    return tasks.filter((t) => {
      // View buckets
      if (view === "open" && (t.status === "completed" || t.status === "cancelled")) return false;
      if (view === "done" && t.status !== "completed") return false;
      if (view === "overdue") {
        if (!t.due_at) return false;
        if (t.status === "completed" || t.status === "cancelled") return false;
        if (t.due_at >= now) return false;
      }
      if (view === "mine") {
        if ((t.assigned_to_email ?? "").toLowerCase() !== me) return false;
        if (t.status === "completed" || t.status === "cancelled") return false;
      }
      if (qs) {
        const hay = `${t.title} ${t.description ?? ""} ${t.assigned_to_email ?? ""} ${t.type}`.toLowerCase();
        if (!hay.includes(qs)) return false;
      }
      return true;
    });
  }, [tasks, view, search, email, now]);

  const stats = useMemo(() => {
    const me = (email ?? "").toLowerCase();
    const open = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
    const overdue = open.filter((t) => t.due_at && t.due_at < now);
    const mine = open.filter((t) => (t.assigned_to_email ?? "").toLowerCase() === me);
    return { open: open.length, overdue: overdue.length, mine: mine.length, total: tasks.length };
  }, [tasks, email, now]);

  async function saveTask() {
    if (!draft.title?.trim()) {
      alert("Title is required.");
      return;
    }
    setSaving(true);
    const { data: sess } = await supabase.auth.getSession();
    const created_by = sess.session?.user?.id ?? null;
    const payload = {
      title: draft.title!.trim(),
      description: draft.description?.trim() || null,
      type: draft.type || "general",
      priority: draft.priority || "normal",
      status: "pending",
      assigned_to_email: draft.assigned_to_email?.trim() || null,
      due_at: draft.due_at || null,
      created_by,
    };
    const { error } = await supabase.from("tasks").insert(payload);
    setSaving(false);
    if (error) {
      alert(`Could not save: ${error.message}`);
      return;
    }
    setShowForm(false);
    setDraft({
      title: "",
      description: "",
      type: "general",
      priority: "normal",
      assigned_to_email: "",
      due_at: null,
    });
    setRefreshKey((k) => k + 1);
  }

  async function toggleStatus(id: string, status: string) {
    const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  async function deleteTask(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

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
          <p className="mt-1 text-xs text-slate-500">
            Your role does not include the <code>tasks.view</code> permission.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      doodleType="tasks"
      breadcrumbs={[{ label: "Tasks" }]}
      title="Tasks"
      subtitle={`${stats.open} open · ${stats.overdue} overdue · ${stats.mine} mine`}
      email={email}
      actions={
        <>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className={adminSecondaryBtnCls}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={() => {
              const headers = [
                "created_at","title","type","priority","status",
                "assigned_to","due_at","completed_at","notes",
              ];
              const csvRows = filtered.map((r) => [
                r.created_at, r.title, r.type, r.priority, r.status,
                r.assigned_to_email, r.due_at, r.completed_at, r.description,
              ]);
              const ts = new Date().toISOString().slice(0, 10);
              downloadCsv(`agentforge-tasks-${ts}.csv`, buildCsv(headers, csvRows));
            }}
            className={adminSecondaryBtnCls}
            title="Download the filtered tasks as a CSV"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={() => setShowForm((s) => !s)}
              className={adminPrimaryBtnCls}
            >
              {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showForm ? "Close" : "New task"}
            </button>
          )}
        </>
      }
    >
      {/* Add form */}
      {showForm && canCreate && (
        <section className={`${adminCardCls} mb-4 p-4`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            New task
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Title <span className="text-rose-500">*</span>
              </span>
              <input
                type="text"
                value={draft.title ?? ""}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Follow up with Bhavin about bulk plan pricing"
                className={adminInputCls}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Notes
              </span>
              <textarea
                rows={2}
                value={draft.description ?? ""}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className={adminInputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Type
              </span>
              <select
                value={draft.type ?? "general"}
                onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                className={adminInputCls}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Priority
              </span>
              <select
                value={draft.priority ?? "normal"}
                onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
                className={adminInputCls}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Assign to
              </span>
              <select
                value={draft.assigned_to_email ?? ""}
                onChange={(e) => setDraft({ ...draft, assigned_to_email: e.target.value })}
                className={adminInputCls}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.email} value={m.email}>
                    {m.full_name || m.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Due date
              </span>
              <input
                type="date"
                value={draft.due_at ? draft.due_at.slice(0, 10) : ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    due_at: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  })
                }
                className={adminInputCls}
              />
            </label>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className={adminSecondaryBtnCls}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveTask}
              disabled={saving}
              className={adminPrimaryBtnCls}
            >
              {saving ? "Saving…" : "Save task"}
            </button>
          </div>
        </section>
      )}

      {/* View tabs */}
      <div className={`${adminCardCls} flex flex-col gap-2 p-3 sm:flex-row sm:items-center`}>
        <div className="flex flex-wrap gap-1.5">
          {(["open","mine","overdue","done","all"] as ViewMode[]).map((v) => {
            const count =
              v === "open" ? stats.open :
              v === "mine" ? stats.mine :
              v === "overdue" ? stats.overdue :
              v === "all" ? stats.total : 0;
            const label =
              v === "open" ? "Open" :
              v === "mine" ? "Mine" :
              v === "overdue" ? "Overdue" :
              v === "done" ? "Done" : "All";
            const active = view === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition ${
                  active
                    ? "bg-slate-900 text-white dark:bg-indigo-600"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {label}
                {v !== "done" && v !== "all" && count > 0 && (
                  <span className={`rounded px-1 text-[10px] tabular-nums ${
                    active ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task or assignee"
            className={`${adminInputCls} pl-9`}
          />
        </div>
      </div>

      {/* List */}
      <div className={`${adminCardCls} mt-4`}>
        {loadingRows ? (
          <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p className={`p-8 text-center text-sm ${adminMutedCls}`}>
            {tasks.length === 0
              ? "No tasks yet. Click “New task” to add one."
              : "Nothing matches the current view."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                me={email}
                canEdit={canEdit}
                canDelete={canDelete}
                onToggle={toggleStatus}
                onDelete={deleteTask}
                now={now}
              />
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}

function TaskRow({
  task,
  me,
  canEdit,
  canDelete,
  onToggle,
  onDelete,
  now,
}: {
  task: Task;
  me: string | null;
  canEdit: boolean;
  canDelete: boolean;
  onToggle: (id: string, status: string) => void;
  onDelete: (id: string, title: string) => void;
  now: string;
}) {
  const overdue =
    task.due_at &&
    task.status !== "completed" &&
    task.status !== "cancelled" &&
    task.due_at < now;

  const completed = task.status === "completed";

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      {/* Checkbox */}
      {canEdit ? (
        <button
          type="button"
          onClick={() =>
            onToggle(task.id, completed ? "pending" : "completed")
          }
          title={completed ? "Mark as pending" : "Mark complete"}
          className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
            completed
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-slate-300 hover:border-emerald-500 dark:border-slate-600"
          }`}
        >
          {completed && <CheckCircle2 className="h-3 w-3" />}
        </button>
      ) : (
        <span
          className={`mt-1 inline-block h-3 w-3 shrink-0 rounded-full ${
            completed
              ? "bg-emerald-500"
              : "bg-slate-200 dark:bg-slate-700"
          }`}
        />
      )}

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${PRIORITY_STYLES[task.priority]}`}
          >
            {task.priority}
          </span>
          <span
            className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${STATUS_STYLES[task.status]}`}
          >
            {task.status.replace("_", " ")}
          </span>
          {task.type !== "general" && (
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              {task.type.replace("_", " ")}
            </span>
          )}
          {overdue && (
            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
              Overdue
            </span>
          )}
        </div>
        <p
          className={`mt-1 text-sm ${
            completed
              ? "text-slate-500 line-through dark:text-slate-500"
              : "font-bold"
          }`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className={`mt-0.5 line-clamp-2 text-xs ${
            completed ? "text-slate-500" : "text-slate-600 dark:text-slate-400"
          }`}>
            {task.description}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          {task.assigned_to_email && (
            <span>
              ðŸ‘¤ {task.assigned_to_email}
              {task.assigned_to_email.toLowerCase() === (me ?? "").toLowerCase() && (
                <span className="ml-1 rounded bg-indigo-100 px-1 text-[9px] font-bold uppercase tracking-[0.12em] text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                  you
                </span>
              )}
            </span>
          )}
          {task.due_at && (
            <span className={overdue ? "font-bold text-rose-600 dark:text-rose-400" : ""}>
              Due {formatDate(task.due_at)}
            </span>
          )}
        </div>
      </div>

      {/* Action: delete */}
      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete(task.id, task.title)}
          title="Delete"
          className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

