"use client";

// ============================================================
// /admin/customers/[id] — single user view with:
//   • profile snapshot (plan, credits, join date)
//   • notes + tags (add / list)
//   • payments
//   • credit_transactions (last 30)
// ============================================================

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "@/app/components/ThemeProvider";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Send,
  ShieldCheck,
  Tag,
  Trash2,
} from "lucide-react";

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
  const router = useRouter();
  const { darkMode } = useTheme();
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

  // New-note form
  const [newNote, setNewNote] = useState("");
  const [newTagsCsv, setNewTagsCsv] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setAuthEmail(data.session?.user?.email ?? null);
      setLoadingAuth(false);
    })();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setAuthEmail(session?.user?.email ?? null),
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
          .limit(30),
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
    const tags = newTagsCsv
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
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

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.06]"
    : "border-black/10 bg-white/85";
  const muted = darkMode ? "text-white/60" : "text-black/55";
  const inputCls =
    "w-full rounded-xl border border-black/10 bg-white/90 px-3 py-2 text-sm transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 dark:border-white/10 dark:bg-white/[0.06] dark:text-white";

  if (loadingAuth) {
    return (
      <main className={`flex min-h-screen items-center justify-center ${bg}`}>
        <p className={muted}>Checking access…</p>
      </main>
    );
  }
  if (!isAdmin) {
    return (
      <main className={`flex min-h-screen items-center justify-center px-6 ${bg}`}>
        <div className={`max-w-md rounded-3xl border p-8 text-center ${card}`}>
          <ShieldCheck className="mx-auto h-10 w-10 text-rose-500" />
          <h1 className="mt-3 text-xl font-black">Access denied</h1>
        </div>
      </main>
    );
  }

  return (
    <main className={`relative min-h-screen ${bg}`}>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-12">
        {/* Header */}
        <button
          type="button"
          onClick={() => router.push("/admin/customers")}
          className={`inline-flex items-center gap-2 text-xs font-bold ${muted}`}
        >
          <ArrowLeft className="h-4 w-4" /> All customers
        </button>

        {loading ? (
          <p className={`mt-6 text-sm ${muted}`}>Loading…</p>
        ) : !profile ? (
          <div className={`mt-6 rounded-2xl border p-8 text-center ${card}`}>
            <p className="text-3xl">😶</p>
            <p className={`mt-2 text-sm ${muted}`}>
              No profile found for this id.
            </p>
          </div>
        ) : (
          <>
            {/* Profile card */}
            <section className={`mt-4 rounded-3xl border p-5 sm:p-6 ${card}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-600">
                    Customer
                  </p>
                  <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                    {profile.full_name?.trim() || profile.email || profile.id}
                  </h1>
                  <p className={`mt-1 text-sm ${muted}`}>
                    {profile.email ?? "(no email)"} · joined{" "}
                    {profile.created_at ? formatDate(profile.created_at) : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black tabular-nums text-cyan-600">
                    {Number(profile.credits).toLocaleString("en-IN")}
                  </p>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${muted}`}>
                    credits in wallet
                  </p>
                  <p className="mt-1 text-xs font-black">
                    Plan: <span className="text-violet-600">{profile.plan ?? "Free"}</span>
                  </p>
                  <p className={`mt-0.5 text-xs ${muted}`}>
                    Lifetime spent: ₹{totalSpent.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </section>

            {/* Attribution — where did this user come from? */}
            {(profile.utm_source ||
              profile.utm_campaign ||
              profile.referrer ||
              profile.landing_path) && (
              <section className={`mt-5 rounded-3xl border p-5 sm:p-6 ${card}`}>
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-cyan-600">
                  Attribution — where they came from
                </h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Attr label="Source"    value={profile.utm_source}   muted={muted} />
                  <Attr label="Medium"    value={profile.utm_medium}   muted={muted} />
                  <Attr label="Campaign"  value={profile.utm_campaign} muted={muted} />
                  <Attr label="Content"   value={profile.utm_content}  muted={muted} />
                  <Attr label="Term"      value={profile.utm_term}     muted={muted} />
                  <Attr label="Referrer"  value={profile.referrer}     muted={muted} mono />
                  <Attr label="Landing page" value={profile.landing_path} muted={muted} mono />
                  <Attr
                    label="First seen"
                    value={profile.first_seen_at ? formatDateTime(profile.first_seen_at) : null}
                    muted={muted}
                  />
                </div>
              </section>
            )}

            {/* Notes */}
            <section className={`mt-5 rounded-3xl border p-5 sm:p-6 ${card}`}>
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-cyan-600">
                Notes
              </h2>

              {/* Add */}
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_220px_auto]">
                <textarea
                  rows={1}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note (e.g. spoke on WhatsApp, asked about bulk pricing)"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={newTagsCsv}
                  onChange={(e) => setNewTagsCsv(e.target.value)}
                  placeholder="tags: bulk, hot-lead"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={saveNote}
                  disabled={savingNote || !newNote.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2 text-sm font-black text-white shadow disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {savingNote ? "Saving…" : "Add"}
                </button>
              </div>

              {/* List */}
              <ul className="mt-4 space-y-3">
                {notes.length === 0 ? (
                  <li className={`rounded-xl border border-dashed p-4 text-center text-sm ${muted} border-black/10 dark:border-white/10`}>
                    No notes yet.
                  </li>
                ) : (
                  notes.map((n) => (
                    <li
                      key={n.id}
                      className="rounded-xl border border-black/10 bg-white/70 p-3 text-sm dark:border-white/10 dark:bg-white/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="whitespace-pre-wrap leading-6">{n.note}</p>
                        <button
                          type="button"
                          onClick={() => deleteNote(n.id)}
                          title="Delete"
                          className="shrink-0 rounded-full border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-500 hover:bg-rose-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className={`mt-2 flex flex-wrap items-center gap-2 text-[11px] ${muted}`}>
                        <span>{formatDateTime(n.created_at)}</span>
                        {n.tags.length > 0 && (
                          <span className="flex flex-wrap items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {n.tags.map((t) => (
                              <span
                                key={t}
                                className="rounded-full bg-cyan-500/10 px-2 py-0.5 font-bold text-cyan-700 dark:text-cyan-300"
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
            <section className={`mt-5 rounded-3xl border p-5 sm:p-6 ${card}`}>
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-cyan-600">
                Payments
              </h2>
              {payments.length === 0 ? (
                <p className={`mt-3 text-sm ${muted}`}>No payments yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-black/5 dark:divide-white/5">
                  {payments.map((p) => (
                    <li key={p.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-black">{p.plan}</p>
                        <p className={`text-xs ${muted}`}>
                          {formatDateTime(p.created_at)} ·{" "}
                          <span className="font-mono">{p.razorpay_payment_id ?? "—"}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                          {p.status}
                        </span>
                        <div>
                          <p className="text-sm font-black tabular-nums">
                            ₹{Number(p.amount).toLocaleString("en-IN")}
                          </p>
                          <p className={`text-[10px] ${muted}`}>
                            +{Number(p.credits_added).toLocaleString("en-IN")} credits
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Credit ledger */}
            <section className={`mt-5 rounded-3xl border p-5 sm:p-6 ${card}`}>
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-cyan-600">
                Credit history (last 30)
              </h2>
              {credits.length === 0 ? (
                <p className={`mt-3 text-sm ${muted}`}>No credit movement.</p>
              ) : (
                <ul className="mt-3 divide-y divide-black/5 dark:divide-white/5">
                  {credits.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-bold">{c.reason}</p>
                        <p className={`text-[11px] ${muted}`}>{formatDateTime(c.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`tabular-nums font-black ${c.delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {c.delta >= 0 ? "+" : ""}
                          {Number(c.delta).toLocaleString("en-IN")}
                        </p>
                        <p className={`text-[11px] ${muted}`}>
                          bal {Number(c.balance_after).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Attr({
  label,
  value,
  muted,
  mono,
}: {
  label: string;
  value: string | null;
  muted: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-black/5 bg-white/60 px-3 py-2 dark:border-white/5 dark:bg-white/[0.03]">
      <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${muted}`}>
        {label}
      </p>
      <p className={`mt-0.5 truncate text-sm ${mono ? "font-mono" : "font-bold"} ${
        value ? "" : muted
      }`}>
        {value ?? "—"}
      </p>
    </div>
  );
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
