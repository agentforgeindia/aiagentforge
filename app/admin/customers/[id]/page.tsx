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
import { Plus, Send, ShieldCheck, Tag, Trash2 } from "lucide-react";
import AdminShell, {
  adminCardCls,
  adminInputCls,
  adminMutedCls,
  adminPrimaryBtnCls,
  adminSecondaryBtnCls,
} from "../../AdminShell";
import AddPastPaymentModal from "./AddPastPaymentModal";

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
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [newNote, setNewNote] = useState("");
  const [newTagsCsv, setNewTagsCsv] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // "Record past payment" modal — backfill helper for old buyers
  // whose payment row never got inserted before the bugfix.
  const [showAddPayment, setShowAddPayment] = useState(false);

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
      const [{ data: pr }, { data: nt }, { data: py }, { data: ct }] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, email, full_name, credits, plan, updated_at, created_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, landing_path, first_seen_at",
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
          .select("id, plan, amount, credits_added, status, razorpay_payment_id, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("credit_transactions")
          .select("id, delta, reason, balance_after, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      setProfile(pr as Profile | null);
      setNotes((nt ?? []) as Note[]);
      setPayments((py ?? []) as Payment[]);
      setCredits((ct ?? []) as CreditTx[]);
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
                {payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{p.plan}</p>
                      <p className={`text-xs ${adminMutedCls}`}>
                        {formatDateTime(p.created_at)} · {maskId(p.razorpay_payment_id)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">
                        ₹{Number(p.amount).toLocaleString("en-IN")}
                      </p>
                      <p className={`text-[10px] uppercase tracking-[0.16em] ${adminMutedCls}`}>
                        {p.status}
                      </p>
                    </div>
                  </li>
                ))}
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
