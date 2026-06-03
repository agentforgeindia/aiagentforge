"use client";

// ============================================================
// /admin/email — Email automation console.
// ============================================================
// Three sections:
//   1. Templates — list + inline editor (subject + HTML + plain)
//   2. Queue     — last 50 email_events, filterable by status
//   3. Test send — synchronously fires a single email
//
// Permissions:
//   email.view  → read templates + queue
//   email.edit  → save template changes
//   email.send  → use the test-send form
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Mail,
  Pencil,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
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

type Template = {
  slug: string;
  subject: string;
  html_body: string;
  plain_body: string | null;
  variables: Record<string, string> | null;
  enabled: boolean;
  updated_at: string | null;
  updated_by_email: string | null;
};

type EmailEvent = {
  id: string;
  recipient_email: string;
  template_slug: string;
  payload: Record<string, unknown> | null;
  scheduled_at: string;
  sent_at: string | null;
  status: string;
  error_text: string | null;
  provider_message_id: string | null;
  retry_count: number;
  dedupe_key: string | null;
  created_at: string;
};

const STATUSES = ["all", "queued", "sent", "dry_run", "failed", "skipped"] as const;

export default function AdminEmailPage() {
  const { loading: pLoading, has, email } = useAdminPermissions();
  const canView = has("email.view");
  const canEdit = has("email.edit");
  const canSend = has("email.send");

  const [templates, setTemplates] = useState<Template[]>([]);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUSES)[number]>("all");

  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);

  // Test send form
  const [testSlug, setTestSlug] = useState<string>("");
  const [testRecipient, setTestRecipient] = useState<string>("");
  const [testPayload, setTestPayload] = useState<string>("{}");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    (async () => {
      const [{ data: tpl }, { data: evs }] = await Promise.all([
        supabase
          .from("email_templates")
          .select(
            "slug, subject, html_body, plain_body, variables, enabled, updated_at, updated_by_email",
          )
          .order("slug"),
        supabase
          .from("email_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      setTemplates((tpl ?? []) as Template[]);
      setEvents((evs ?? []) as EmailEvent[]);
      if (!testSlug && tpl && tpl.length > 0)
        setTestSlug((tpl[0] as Template).slug);
      setLoading(false);
    })();
  }, [canView, refreshKey, testSlug]);

  const filteredEvents = useMemo(() => {
    if (statusFilter === "all") return events;
    return events.filter((e) => e.status === statusFilter);
  }, [events, statusFilter]);

  function startEdit(t: Template) {
    setEditingSlug(t.slug);
    setDraft({ ...t });
  }

  function cancelEdit() {
    setEditingSlug(null);
    setDraft(null);
  }

  async function saveDraft() {
    if (!draft) return;
    setSaving(true);
    const { error } = await supabase
      .from("email_templates")
      .update({
        subject: draft.subject,
        html_body: draft.html_body,
        plain_body: draft.plain_body,
        enabled: draft.enabled,
        updated_at: new Date().toISOString(),
        updated_by_email: email ?? null,
      })
      .eq("slug", draft.slug);
    setSaving(false);
    if (error) {
      alert(`Save failed: ${error.message}`);
      return;
    }
    setEditingSlug(null);
    setDraft(null);
    setRefreshKey((k) => k + 1);
  }

  async function sendTest() {
    if (!testSlug || !testRecipient) return;
    setTestSending(true);
    setTestResult(null);

    let payload: Record<string, unknown> = {};
    try {
      const parsed = testPayload.trim().length ? JSON.parse(testPayload) : {};
      if (parsed && typeof parsed === "object") {
        payload = parsed as Record<string, unknown>;
      }
    } catch {
      setTestSending(false);
      setTestResult({ ok: false, msg: "Sample payload is not valid JSON" });
      return;
    }

    const { data: sess } = await supabase.auth.getSession();
    const jwt = sess.session?.access_token ?? "";

    try {
      const r = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          template_slug: testSlug,
          recipient_email: testRecipient,
          sample_payload: payload,
        }),
      });
      const body = await r.json().catch(() => null);
      if (!r.ok) {
        setTestResult({
          ok: false,
          msg: body?.error ?? `HTTP ${r.status}`,
        });
      } else {
        const status = body?.status ?? "unknown";
        const dry = body?.dry_run ? " (dry-run)" : "";
        const id = body?.provider_message_id
          ? ` · id ${body.provider_message_id}`
          : "";
        setTestResult({ ok: true, msg: `Status: ${status}${dry}${id}` });
        setRefreshKey((k) => k + 1);
      }
    } catch (e) {
      setTestResult({
        ok: false,
        msg: e instanceof Error ? e.message : "Network error",
      });
    } finally {
      setTestSending(false);
    }
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
            Your role does not include the <code>email.view</code> permission.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      breadcrumbs={[{ label: "Email" }]}
      title="Email automation"
      subtitle={`${templates.length} templates · last ${events.length} events`}
      email={email}
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
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : (
        <div className="space-y-4">
          {/* Templates */}
          <section className={`${adminCardCls} p-4`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Templates
                </p>
                <p className={`mt-1 text-xs ${adminMutedCls}`}>
                  Edit subject, HTML, and plain-text bodies. Variables use{" "}
                  <code>{"{{var}}"}</code> (HTML-escaped) or{" "}
                  <code>{"{{{var}}}"}</code> (raw).
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {templates.map((t) => {
                const isOpen = editingSlug === t.slug;
                return (
                  <div
                    key={t.slug}
                    className="rounded-md border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-bold">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <code className="font-mono text-xs">{t.slug}</code>
                          {!t.enabled && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">
                              disabled
                            </span>
                          )}
                        </p>
                        <p
                          className={`mt-0.5 truncate text-[11px] ${adminMutedCls}`}
                        >
                          {t.subject}
                        </p>
                      </div>
                      {canEdit && !isOpen && (
                        <button
                          type="button"
                          onClick={() => startEdit(t)}
                          className={adminSecondaryBtnCls}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      )}
                      {isOpen && (
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className={adminSecondaryBtnCls}
                        >
                          <X className="h-3.5 w-3.5" />
                          Close
                        </button>
                      )}
                    </div>

                    {isOpen && draft && (
                      <div className="space-y-3 border-t border-slate-200 px-3 py-3 dark:border-slate-800">
                        <Field
                          label="Subject"
                          value={draft.subject}
                          onChange={(v) =>
                            setDraft({ ...draft, subject: v })
                          }
                        />
                        <Field
                          label="HTML body"
                          textarea
                          rows={12}
                          value={draft.html_body}
                          onChange={(v) =>
                            setDraft({ ...draft, html_body: v })
                          }
                        />
                        <Field
                          label="Plain body (optional)"
                          textarea
                          rows={6}
                          value={draft.plain_body ?? ""}
                          onChange={(v) =>
                            setDraft({ ...draft, plain_body: v })
                          }
                        />

                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={draft.enabled}
                            onChange={(e) =>
                              setDraft({ ...draft, enabled: e.target.checked })
                            }
                          />
                          Enabled — when off, the queue and triggers skip this
                          template
                        </label>

                        {draft.variables &&
                          Object.keys(draft.variables).length > 0 && (
                            <div className="rounded-md bg-slate-50 p-3 text-[11px] dark:bg-slate-800/50">
                              <p
                                className={`mb-1 font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}
                              >
                                Variables
                              </p>
                              <ul className="space-y-0.5">
                                {Object.entries(draft.variables).map(
                                  ([k, v]) => (
                                    <li key={k}>
                                      <code className="font-mono">
                                        {`{{${k}}}`}
                                      </code>{" "}
                                      — {v}
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={saveDraft}
                            disabled={saving}
                            className={adminPrimaryBtnCls}
                          >
                            <Save className="h-3.5 w-3.5" />
                            {saving ? "Saving…" : "Save"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {templates.length === 0 && (
                <p className={`text-sm ${adminMutedCls}`}>
                  No templates yet — run <code>sql/email.sql</code> to seed.
                </p>
              )}
            </div>
          </section>

          {/* Test send */}
          {canSend && (
            <section className={`${adminCardCls} p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Send a test
              </p>
              <p className={`mt-1 text-xs ${adminMutedCls}`}>
                Renders the chosen template with the sample payload and sends
                it. While <code>EMAIL_DRY_RUN=true</code> the message is
                logged but not transmitted.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs">
                  <span className={`mb-1 inline-block ${adminMutedCls}`}>
                    Template
                  </span>
                  <select
                    value={testSlug}
                    onChange={(e) => setTestSlug(e.target.value)}
                    className={adminInputCls}
                  >
                    {templates.map((t) => (
                      <option key={t.slug} value={t.slug}>
                        {t.slug}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs">
                  <span className={`mb-1 inline-block ${adminMutedCls}`}>
                    Recipient
                  </span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    className={adminInputCls}
                  />
                </label>
                <label className="block text-xs sm:col-span-2">
                  <span className={`mb-1 inline-block ${adminMutedCls}`}>
                    Sample payload (JSON)
                  </span>
                  <textarea
                    rows={4}
                    value={testPayload}
                    onChange={(e) => setTestPayload(e.target.value)}
                    className={`${adminInputCls} font-mono`}
                    placeholder='{ "full_name": "Asha", "plan": "starter" }'
                  />
                </label>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                {testResult && (
                  <p
                    className={`text-xs ${
                      testResult.ok ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {testResult.msg}
                  </p>
                )}
                <button
                  type="button"
                  onClick={sendTest}
                  disabled={testSending || !testRecipient || !testSlug}
                  className={`${adminPrimaryBtnCls} ml-auto`}
                >
                  <Send className="h-3.5 w-3.5" />
                  {testSending ? "Sending…" : "Send test"}
                </button>
              </div>
            </section>
          )}

          {/* Queue / log */}
          <section className={`${adminCardCls} p-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Queue · last 50 events
                </p>
                <p className={`mt-1 text-xs ${adminMutedCls}`}>
                  Status flips from <code>queued</code> →{" "}
                  <code>sent</code> / <code>dry_run</code> /{" "}
                  <code>failed</code> when the cron tick runs.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-md border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] transition ${
                      statusFilter === s
                        ? "border-slate-900 bg-slate-900 text-white dark:border-indigo-500 dark:bg-indigo-600"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  <tr className="text-left">
                    <th className="py-1.5">Status</th>
                    <th>Template</th>
                    <th>Recipient</th>
                    <th>Scheduled</th>
                    <th>Sent</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredEvents.map((e) => (
                    <tr key={e.id} className="align-top">
                      <td className="py-2">
                        <StatusChip status={e.status} />
                      </td>
                      <td className="font-mono text-[11px]">
                        {e.template_slug}
                      </td>
                      <td className="text-xs">{e.recipient_email}</td>
                      <td className="text-[11px] tabular-nums text-slate-500">
                        {formatTs(e.scheduled_at)}
                      </td>
                      <td className="text-[11px] tabular-nums text-slate-500">
                        {e.sent_at ? formatTs(e.sent_at) : "—"}
                      </td>
                      <td className="max-w-[260px] truncate text-[11px] text-slate-500">
                        {e.error_text
                          ? e.error_text
                          : e.provider_message_id
                            ? `id ${e.provider_message_id}`
                            : ""}
                      </td>
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs">
                        <span className={adminMutedCls}>
                          No events match this filter.
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <label className="block text-xs">
      <span className={`mb-1 inline-block ${adminMutedCls}`}>{label}</span>
      {textarea ? (
        <textarea
          rows={rows ?? 6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${adminInputCls} font-mono text-[12px] leading-5`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={adminInputCls}
        />
      )}
    </label>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    queued:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    sent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
    dry_run:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200",
    failed: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
    skipped:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  };
  const cls = map[status] ?? map.queued;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${cls}`}
    >
      {status}
    </span>
  );
}

function formatTs(iso: string): string {
  try {
    const d = new Date(iso);
    return d
      .toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(",", "");
  } catch {
    return iso;
  }
}
