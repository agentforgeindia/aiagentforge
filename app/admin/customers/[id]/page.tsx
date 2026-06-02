"use client";

// ============================================================
// /admin/customers/[id] — corporate single-customer view.
// ============================================================
// Sections shown (essential info only):
//   • Identity card     — name, email, plan, balance, joined
//   • Attribution       — source / campaign (collapsed if empty)
//   • Notes             — add + list with tags
//   • Payments          — short list, masked razorpay id
//   • Credit history    — last 10 movements only
//
// Long internal identifiers (full UUIDs, full razorpay IDs) are
// masked — staff only sees what they need.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, ExternalLink, Plus, Send, ShieldCheck, Tag, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useAdminPermissions } from "../../AdminPermissions";
import AdminShell, {
  adminCardCls,
  adminInputCls,
  adminMutedCls,
  adminPrimaryBtnCls,
  adminSecondaryBtnCls,
} from "../../AdminShell";
import AddPastPaymentModal from "./AddPastPaymentModal";
import RefundPaymentModal, { type RefundablePayment } from "./RefundPaymentModal";

const ADMIN_EMAILS: string[] = [
  "info@aiagentforge.in",
  "info.agentforge@gmail.com",
];

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  credits: number;
  plan: string | null;
  plan_purchased_at: string | null;
  plan_expires_at: string | null;
  updated_at: string | null;
  created_at: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  landing_path: string | null;
  first_seen_at: string | null;
};

type Health = {
  score: number;
  status: string;
  last_activity_at: string | null;
  last_payment_at: string | null;
  payment_count: number;
  days_since_activity: number | null;
  days_to_expire: number | null;
  breakdown: {
    subscription: number;
    activity: number;
    credits: number;
    loyalty: number;
    engagement: number;
  };
  maxes: {
    subscription: number;
    activity: number;
    credits: number;
    loyalty: number;
    engagement: number;
  };
};

type Note = {
  id: string;
  user_id: string;
  author_id: string | null;
  note: string;
  tags: string[];
  created_at: string;
};

type Payment = {
  id: string;
  plan: string;
  amount: number;
  credits_added: number;
  status: string;
  razorpay_payment_id: string | null;
  created_at: string;
  refund_amount: number | null;
  refund_reason: string | null;
  refunded_at: string | null;
};

type CreditTx = {
  id: string;
  delta: number;
  reason: string;
  balance_after: number;
  created_at: string;
};

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id;

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const isAdmin = authEmail
    ? ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(authEmail.toLowerCase())
    : false;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [credits, setCredits] = useState<CreditTx[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
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
  const { has } = useAdminPermissions();
  const canCreateTask = has("tasks.create");
  const canEditTask = has("tasks.edit");
  const canExtendSub = has("subscriptions.extend");
  const canAddLead = has("leads.add");

  // Lead linkage — populated from find_lead_for_profile RPC.
  // Null means "no lead yet, show promote button".
  const [linkedLeadId, setLinkedLeadId] = useState<string | null>(null);
  const [promotingLead, setPromotingLead] = useState(false);

  async function promoteToLead() {
    if (!profile) return;
    if (!confirm(`Promote ${profile.full_name?.trim() || profile.email} to a sales lead?`)) return;
    setPromotingLead(true);
    const { data: sess } = await supabase.auth.getSession();
    const created_by = sess.session?.user?.id ?? null;

    const payload: Record<string, unknown> = {
      name: profile.full_name?.trim() || profile.email || "Unknown",
      email: profile.email,
      source: profile.utm_source || "website",
      source_detail: profile.utm_campaign
        ? `campaign:${profile.utm_campaign}`
        : "Promoted from signup",
      status: "new",
      notes: `Promoted from signed-up customer.${
        profile.utm_source
          ? `\nLanded via ${profile.utm_source}` +
            (profile.utm_campaign ? ` · ${profile.utm_campaign}` : "")
          : ""
      }`,
      converted_user_id: profile.id,
      utm_source:   profile.utm_source   ?? null,
      utm_medium:   profile.utm_medium   ?? null,
      utm_campaign: profile.utm_campaign ?? null,
      utm_content:  profile.utm_content  ?? null,
      utm_term:     profile.utm_term     ?? null,
      created_by,
    };
    const { data, error } = await supabase
      .from("leads")
      .insert(payload)
      .select("id")
      .single();
    setPromotingLead(false);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    await supabase.rpc("log_admin_action", {
      p_action: "leads.add",
      p_target_type: "lead",
      p_target_id: data.id,
      p_details: { source: "promote_from_customer", user_id: profile.id },
    });
    setLinkedLeadId(data.id);
  }

  async function extendSubscription(days: number) {
    if (!userId) return;
    if (!confirm(`Extend this customer's plan by ${days} days?`)) return;
    const { data, error } = await supabase.rpc("extend_subscription", {
      p_user_id: userId,
      p_days: days,
    });
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    await supabase.rpc("log_admin_action", {
      p_action: "subscriptions.extend",
      p_target_type: "user",
      p_target_id: userId,
      p_details: { days, new_expiry: data },
    });
    setRefreshKey((k) => k + 1);
  }
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [newNote, setNewNote] = useState("");
  const [newTagsCsv, setNewTagsCsv] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // "Record past payment" modal — backfill helper for old buyers
  // whose payment row never got inserted before the bugfix.
  const [showAddPayment, setShowAddPayment] = useState(false);

  // Refund modal state.
  const [refundTarget, setRefundTarget] = useState<RefundablePayment | null>(null);
  const canRefund = has("invoices.refund");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setAuthEmail(data.session?.user?.email ?? null);
      setLoadingAuth(false);
    })();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_e, s) => setAuthEmail(s?.user?.email ?? null),
    );
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAdmin || !userId) return;
    setLoading(true);
    (async () => {
      const [{ data: pr }, { data: nt }, { data: py }, { data: ct }, { data: tk }] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, email, full_name, credits, plan, plan_purchased_at, plan_expires_at, updated_at, created_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, landing_path, first_seen_at",
          )
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("customer_notes")
          .select("id, user_id, author_id, note, tags, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("payments")
          .select(
            "id, plan, amount, credits_added, status, razorpay_payment_id, created_at, refund_amount, refund_reason, refunded_at",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("credit_transactions")
          .select("id, delta, reason, balance_after, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("tasks")
          .select("id, title, status, priority, due_at, assigned_to_email")
          .eq("related_customer_id", userId)
          .order("due_at", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false }),
      ]);
      setProfile(pr as Profile | null);
      setNotes((nt ?? []) as Note[]);
      setPayments((py ?? []) as Payment[]);
      setCredits((ct ?? []) as CreditTx[]);
      setTasks((tk ?? []) as typeof tasks);

      // Refresh + read the customer health score in one round-trip.
      // refresh_customer_health() recomputes + caches on profiles.
      if (userId) {
        const { data: h } = await supabase.rpc(
          "refresh_customer_health",
          { p_user_id: userId },
        );
        if (h && typeof h === "object" && !("error" in (h as object))) {
          setHealth(h as Health);
        }

        // Check for an existing lead row that maps to this customer
        // (either via converted_user_id or matching email). Drives
        // the Promote-to-lead button visibility.
        const { data: leadId } = await supabase.rpc(
          "find_lead_for_profile",
          { p_user_id: userId },
        );
        setLinkedLeadId((leadId as string | null) ?? null);
      }

      setLoading(false);
    })();
  }, [isAdmin, userId, refreshKey]);

  const totalSpent = useMemo(
    () => payments.filter((p) => p.status === "paid").reduce((a, p) => a + Number(p.amount), 0),
    [payments],
  );

  async function saveNote() {
    if (!userId || !newNote.trim()) return;
    setSavingNote(true);
    const tags = newTagsCsv.split(",").map((t) => t.trim()).filter(Boolean);
    const { data: sess } = await supabase.auth.getSession();
    const authorId = sess.session?.user?.id ?? null;
    const { error } = await supabase.from("customer_notes").insert({
      user_id: userId,
      author_id: authorId,
      note: newNote.trim(),
      tags,
    });
    setSavingNote(false);
    if (error) {
      alert(`Could not save note: ${error.message}`);
      return;
    }
    setNewNote("");
    setNewTagsCsv("");
    setRefreshKey((k) => k + 1);
  }

  async function addTask() {
    if (!userId || !newTaskTitle.trim()) return;
    setSavingTask(true);
    const { data: sess } = await supabase.auth.getSession();
    const created_by = sess.session?.user?.id ?? null;
    const { error } = await supabase.from("tasks").insert({
      title: newTaskTitle.trim(),
      type: "follow_up",
      status: "pending",
      priority: "normal",
      related_customer_id: userId,
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

  async function deleteNote(id: string) {
    if (!confirm("Delete this note?")) return;
    const { error } = await supabase.from("customer_notes").delete().eq("id", id);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  if (loadingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">
        Checking access…
      </main>
    );
  }
  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
          <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" />
          <h1 className="mt-3 text-base font-bold">Access denied</h1>
        </div>
      </main>
    );
  }

  const displayName =
    profile?.full_name?.trim() || profile?.email || "Customer";
  const subtitle = profile
    ? `${profile.plan ?? "Free"} · ${Number(profile.credits).toLocaleString("en-IN")} credits · ₹${totalSpent.toLocaleString("en-IN")} lifetime`
    : undefined;

  return (
    <AdminShell
      breadcrumbs={[
        { label: "Customers", href: "/admin/customers" },
        { label: displayName },
      ]}
      title={displayName}
      subtitle={subtitle}
      email={authEmail}
    >
      {loading ? (
        <p className={`p-6 text-center text-sm ${adminMutedCls}`}>Loading…</p>
      ) : !profile ? (
        <div className={`${adminCardCls} p-6 text-center`}>
          <p className={`text-sm ${adminMutedCls}`}>
            No profile found for this id.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Identity row */}
          <section className={`${adminCardCls} p-4`}>
            <dl className="grid gap-3 sm:grid-cols-4">
              <Field label="Email" value={profile.email ?? "—"} />
              <Field
                label="Plan"
                value={profile.plan ?? "Free"}
              />
              <Field
                label="Credit balance"
                value={Number(profile.credits).toLocaleString("en-IN")}
              />
              <Field
                label="Joined"
                value={profile.created_at ? formatDate(profile.created_at) : "—"}
              />
            </dl>
          </section>

          {/* Lead linkage — Promote to lead button OR View linked lead */}
          {canAddLead && (
            <section className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#11141a]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Sales lead
                  </p>
                  <p className={`mt-0.5 text-xs ${adminMutedCls}`}>
                    {linkedLeadId
                      ? "This customer is already tracked as a lead."
                      : "Add this customer to the sales pipeline."}
                  </p>
                </div>
                {linkedLeadId ? (
                  <Link
                    href={`/admin/leads/${linkedLeadId}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View lead
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={promoteToLead}
                    disabled={promotingLead}
                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {promotingLead ? "Promoting…" : "Promote to lead"}
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Customer health */}
          {health && <HealthPanel h={health} />}

          {/* Subscription — plan + validity window */}
          {(profile.plan_purchased_at || profile.plan_expires_at) && (
            <SubscriptionPanel
              profile={profile}
              canExtend={canExtendSub}
              onExtend={extendSubscription}
            />
          )}

          {/* Attribution — only when something was captured */}
          {(profile.utm_source || profile.utm_campaign || profile.referrer) && (
            <section className={`${adminCardCls} p-4`}>
              <SectionTitle>Acquisition source</SectionTitle>
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="Source" value={profile.utm_source ?? "—"} />
                <Field label="Medium" value={profile.utm_medium ?? "—"} />
                <Field label="Campaign" value={profile.utm_campaign ?? "—"} />
                {profile.referrer && (
                  <Field
                    label="Referrer"
                    value={profile.referrer}
                    mono
                    full
                  />
                )}
              </dl>
            </section>
          )}

          {/* Tasks linked to this customer */}
          <section className={`${adminCardCls} p-4`}>
            <SectionTitle>Tasks</SectionTitle>

            {canCreateTask && (
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_180px_auto]">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Plan renewal call, upsell follow-up, etc."
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
                  No tasks linked to this customer yet.
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
                          {t.due_at && <span>Due {formatDate(t.due_at)}</span>}
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

          {/* Notes */}
          <section className={`${adminCardCls} p-4`}>
            <SectionTitle>Internal notes</SectionTitle>

            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_180px_auto]">
              <textarea
                rows={1}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note for the team"
                className={adminInputCls}
              />
              <input
                type="text"
                value={newTagsCsv}
                onChange={(e) => setNewTagsCsv(e.target.value)}
                placeholder="tags, comma, separated"
                className={adminInputCls}
              />
              <button
                type="button"
                onClick={saveNote}
                disabled={savingNote || !newNote.trim()}
                className={adminPrimaryBtnCls}
              >
                <Send className="h-3.5 w-3.5" />
                {savingNote ? "Saving…" : "Add"}
              </button>
            </div>

            <ul className="mt-4 space-y-2">
              {notes.length === 0 ? (
                <li className={`rounded-md border border-dashed border-slate-200 p-4 text-center text-sm dark:border-slate-700 ${adminMutedCls}`}>
                  No notes recorded yet.
                </li>
              ) : (
                notes.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-md border border-slate-200 bg-slate-50/50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="whitespace-pre-wrap leading-6">{n.note}</p>
                      <button
                        type="button"
                        onClick={() => deleteNote(n.id)}
                        title="Delete"
                        className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className={`mt-2 flex flex-wrap items-center gap-2 text-[11px] ${adminMutedCls}`}>
                      <span>{formatDateTime(n.created_at)}</span>
                      {n.tags.length > 0 && (
                        <span className="flex flex-wrap items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {n.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded bg-slate-200 px-1.5 py-0.5 font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                            >
                              {t}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* Payments */}
          <section className={`${adminCardCls} p-4`}>
            <div className="flex items-center justify-between gap-3">
              <SectionTitle>Payments</SectionTitle>
              <button
                type="button"
                onClick={() => setShowAddPayment(true)}
                className={adminSecondaryBtnCls}
              >
                <Plus className="h-3.5 w-3.5" />
                Record past payment
              </button>
            </div>
            {payments.length === 0 ? (
              <p className={`mt-3 text-sm ${adminMutedCls}`}>No payments recorded.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
                {payments.map((p) => {
                  const refunded = p.status === "refunded" || p.status === "partially_refunded";
                  return (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold">{p.plan}</p>
                          {refunded && (
                            <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                              {p.status === "refunded" ? "Refunded" : "Partial refund"}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${adminMutedCls}`}>
                          {formatDateTime(p.created_at)} · {maskId(p.razorpay_payment_id)}
                        </p>
                        {refunded && p.refunded_at && (
                          <p className={`text-[11px] ${adminMutedCls}`}>
                            ₹{Number(p.refund_amount ?? 0).toLocaleString("en-IN")} refunded on {formatDate(p.refunded_at)}
                            {p.refund_reason ? ` — ${p.refund_reason}` : ""}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        <div>
                          <p className="text-sm font-bold tabular-nums">
                            ₹{Number(p.amount).toLocaleString("en-IN")}
                          </p>
                          <p className={`text-[10px] uppercase tracking-[0.16em] ${adminMutedCls}`}>
                            {p.status}
                          </p>
                        </div>
                        {canRefund && !refunded && p.status === "paid" && (
                          <button
                            type="button"
                            onClick={() =>
                              setRefundTarget({
                                id: p.id,
                                plan: p.plan,
                                amount: Number(p.amount),
                                credits_added: Number(p.credits_added),
                                razorpay_payment_id: p.razorpay_payment_id,
                                status: p.status,
                              })
                            }
                            className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-700/40 dark:bg-rose-500/15 dark:text-rose-300"
                            title="Refund this payment"
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Credit history — last 10 */}
          <section className={`${adminCardCls} p-4`}>
            <SectionTitle>Recent credit movement</SectionTitle>
            {credits.length === 0 ? (
              <p className={`mt-3 text-sm ${adminMutedCls}`}>No movement recorded.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
                {credits.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.reason}</p>
                      <p className={`text-[11px] ${adminMutedCls}`}>{formatDateTime(c.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`tabular-nums font-bold ${
                          c.delta >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                        }`}
                      >
                        {c.delta >= 0 ? "+" : ""}
                        {Number(c.delta).toLocaleString("en-IN")}
                      </p>
                      <p className={`text-[10px] ${adminMutedCls}`}>
                        bal {Number(c.balance_after).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* Backfill modal — only renders when admin clicks the button */}
      {profile && (
        <AddPastPaymentModal
          open={showAddPayment}
          onClose={() => setShowAddPayment(false)}
          onSaved={() => setRefreshKey((k) => k + 1)}
          userId={profile.id}
          defaultName={profile.full_name}
          defaultEmail={profile.email}
        />
      )}

      {/* Refund modal — opens when the admin clicks "Refund" on a row */}
      <RefundPaymentModal
        open={Boolean(refundTarget)}
        onClose={() => setRefundTarget(null)}
        onDone={() => setRefreshKey((k) => k + 1)}
        payment={refundTarget}
      />
    </AdminShell>
  );
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
      {children}
    </h2>
  );
}

function Field({
  label,
  value,
  mono,
  full,
}: {
  label: string;
  value: string;
  mono?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-3" : undefined}>
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

const HEALTH_STYLES: Record<string, string> = {
  healthy:    "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-700/40 dark:text-emerald-200",
  active:     "bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-500/10 dark:border-sky-700/40 dark:text-sky-200",
  at_risk:    "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-700/40 dark:text-amber-200",
  churn_risk: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-700/40 dark:text-rose-200",
  churned:    "bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300",
};

const HEALTH_LABELS: Record<string, string> = {
  healthy:    "Healthy",
  active:     "Active",
  at_risk:    "At risk",
  churn_risk: "Churn risk",
  churned:    "Churned",
};

const HEALTH_HINTS: Record<string, string> = {
  healthy:    "Engaged + paying. Consider upsell opportunities.",
  active:     "Using product steadily. Keep them happy.",
  at_risk:    "Activity slowing. Reach out before they churn.",
  churn_risk: "About to leave. Schedule a save call now.",
  churned:    "No activity / expired. Win-back offer needed.",
};

function HealthPanel({ h }: { h: Health }) {
  const cls = HEALTH_STYLES[h.status] ?? HEALTH_STYLES.churned;
  const label = HEALTH_LABELS[h.status] ?? h.status;
  const hint = HEALTH_HINTS[h.status] ?? "";

  const bars: { label: string; value: number; max: number }[] = [
    { label: "Subscription", value: h.breakdown.subscription, max: h.maxes.subscription },
    { label: "Recent activity", value: h.breakdown.activity, max: h.maxes.activity },
    { label: "Credit balance", value: h.breakdown.credits, max: h.maxes.credits },
    { label: "Loyalty", value: h.breakdown.loyalty, max: h.maxes.loyalty },
    { label: "Engagement", value: h.breakdown.engagement, max: h.maxes.engagement },
  ];

  return (
    <section className={`rounded-lg border p-4 ${cls}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">
            Customer health
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-3xl font-bold tabular-nums">{h.score}</p>
            <p className="text-xs opacity-80">/ 100</p>
            <span className="ml-1 rounded-md bg-white/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] dark:bg-black/20">
              {label}
            </span>
          </div>
          {hint && <p className="mt-1 text-xs opacity-80">{hint}</p>}
        </div>
        <div className="text-right text-[11px] opacity-80">
          {h.last_activity_at && (
            <p>Last activity {formatDate(h.last_activity_at)}</p>
          )}
          {h.days_to_expire !== null && (
            <p>
              {h.days_to_expire > 0
                ? `${h.days_to_expire}d to expiry`
                : `Expired ${Math.abs(h.days_to_expire)}d ago`}
            </p>
          )}
          {h.payment_count > 0 && (
            <p>{h.payment_count} purchase{h.payment_count === 1 ? "" : "s"}</p>
          )}
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {bars.map((b) => {
          const pct = Math.round((b.value / b.max) * 100);
          return (
            <li key={b.label}>
              <div className="flex items-center justify-between text-[11px] font-medium">
                <span>{b.label}</span>
                <span className="tabular-nums opacity-80">
                  {b.value} / {b.max}
                </span>
              </div>
              <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-white/40 dark:bg-black/30">
                <div
                  className="h-full rounded-full bg-current"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SubscriptionPanel({
  profile,
  canExtend,
  onExtend,
}: {
  profile: Profile;
  canExtend: boolean;
  onExtend: (days: number) => void;
}) {
  const now = Date.now();
  const exp = profile.plan_expires_at
    ? new Date(profile.plan_expires_at).getTime()
    : null;
  const daysLeft =
    exp !== null ? Math.ceil((exp - now) / (24 * 60 * 60 * 1000)) : null;

  let bucket: "active" | "expiring" | "expired" | "unknown" = "unknown";
  if (exp !== null) {
    if (exp < now) bucket = "expired";
    else if (exp < now + 7 * 24 * 60 * 60 * 1000) bucket = "expiring";
    else bucket = "active";
  }

  const chip =
    bucket === "active"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      : bucket === "expiring"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
        : bucket === "expired"
          ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#11141a]">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle>Subscription</SectionTitle>
        {canExtend && (
          <button
            type="button"
            onClick={() => onExtend(30)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Extend +30 days
          </button>
        )}
      </div>
      <dl className="mt-3 grid gap-3 sm:grid-cols-4">
        <Field label="Plan" value={profile.plan ?? "Free"} />
        <Field
          label="Purchased"
          value={
            profile.plan_purchased_at
              ? formatDate(profile.plan_purchased_at)
              : "—"
          }
        />
        <Field
          label="Expires"
          value={
            profile.plan_expires_at ? formatDate(profile.plan_expires_at) : "—"
          }
        />
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Status
          </dt>
          <dd className="mt-0.5">
            <span
              className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${chip}`}
            >
              {bucket === "active"
                ? `Active${daysLeft !== null ? ` · ${daysLeft}d left` : ""}`
                : bucket === "expiring"
                  ? `Expiring${daysLeft !== null ? ` · ${daysLeft}d` : ""}`
                  : bucket === "expired"
                    ? `Expired${daysLeft !== null ? ` · ${Math.abs(daysLeft)}d ago` : ""}`
                    : "—"}
            </span>
          </dd>
        </div>
      </dl>
    </section>
  );
}

function maskId(id: string | null) {
  if (!id) return "—";
  if (id.length <= 8) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
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
