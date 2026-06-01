"use client";

// ============================================================
// AddPastPaymentModal — admin-side recording of a past purchase
// for backfilling pre-bugfix buyers.
// ============================================================
// Hits POST /api/admin/payments/manual which validates the
// caller is an admin and inserts a row into public.payments.
// ============================================================

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

const labelCls =
  "mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400";

const PLAN_PRESETS = [
  { value: "Starter",       amount: 1999,  credits: 1800 },
  { value: "Pro Creator",   amount: 9999,  credits: 12000 },
  { value: "Empire",        amount: 39999, credits: 50000 },
];

export type PastPaymentForm = {
  plan: string;
  amount: number;
  credits_added: number;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  created_at: string;
  billing_name: string;
  billing_phone: string;
  billing_email: string;
  billing_company: string;
  billing_address: string;
  billing_gstin: string;
  credit_user: boolean;
};

export default function AddPastPaymentModal({
  open,
  onClose,
  onSaved,
  userId,
  defaultName,
  defaultEmail,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
  defaultName?: string | null;
  defaultEmail?: string | null;
}) {
  const todayLocal = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState<PastPaymentForm>(() => ({
    plan: "Pro Creator",
    amount: 9999,
    credits_added: 12000,
    razorpay_payment_id: "",
    razorpay_order_id: "",
    created_at: todayLocal,
    billing_name: defaultName ?? "",
    billing_phone: "",
    billing_email: defaultEmail ?? "",
    billing_company: "",
    billing_address: "",
    billing_gstin: "",
    credit_user: false,
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        plan: "Pro Creator",
        amount: 9999,
        credits_added: 12000,
        razorpay_payment_id: "",
        razorpay_order_id: "",
        created_at: todayLocal,
        billing_name: defaultName ?? "",
        billing_phone: "",
        billing_email: defaultEmail ?? "",
        billing_company: "",
        billing_address: "",
        billing_gstin: "",
        credit_user: false,
      });
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  function patch<K extends keyof PastPaymentForm>(key: K, value: PastPaymentForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onPlanChange(planValue: string) {
    const preset = PLAN_PRESETS.find((p) => p.value === planValue);
    if (preset) {
      setForm((f) => ({
        ...f,
        plan: preset.value,
        amount: preset.amount,
        credits_added: preset.credits,
      }));
    } else {
      patch("plan", planValue);
    }
  }

  async function submit() {
    if (!form.plan.trim()) {
      setError("Plan name is required.");
      return;
    }
    if (!form.amount || form.amount <= 0) {
      setError("Amount must be positive.");
      return;
    }
    if (!form.credits_added || form.credits_added <= 0) {
      setError("Credits added must be positive.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) {
      setError("Login required.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/admin/payments/manual", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: userId,
        plan: form.plan.trim(),
        amount: Number(form.amount),
        credits_added: Number(form.credits_added),
        razorpay_payment_id: form.razorpay_payment_id.trim() || undefined,
        razorpay_order_id:   form.razorpay_order_id.trim()   || undefined,
        created_at: form.created_at
          ? new Date(form.created_at).toISOString()
          : undefined,
        billing_name:    form.billing_name.trim()    || undefined,
        billing_phone:   form.billing_phone.trim()   || undefined,
        billing_email:   form.billing_email.trim()   || undefined,
        billing_company: form.billing_company.trim() || undefined,
        billing_address: form.billing_address.trim() || undefined,
        billing_gstin:   form.billing_gstin.trim().toUpperCase() || undefined,
        credit_user: form.credit_user,
      }),
    });
    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(json?.error ?? "Save failed.");
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 px-2 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-[#0f1218]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-[#0f1218]">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Record past payment
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-100">
              Backfill billing entry
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
            Use this for purchases made before the payment bugfix
            (where credits were granted but no payment row exists).
            Inserts into <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">payments</code> only;
            does not re-charge the customer.
          </p>

          {/* Plan + money */}
          <section className="mt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Plan &amp; amount
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className={labelCls}>Plan</span>
                <select
                  value={
                    PLAN_PRESETS.find((p) => p.value === form.plan)
                      ? form.plan
                      : "custom"
                  }
                  onChange={(e) => onPlanChange(e.target.value)}
                  className={inputCls}
                >
                  {PLAN_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.value}
                    </option>
                  ))}
                  <option value="custom">Custom…</option>
                </select>
                {!PLAN_PRESETS.find((p) => p.value === form.plan) && (
                  <input
                    type="text"
                    value={form.plan}
                    onChange={(e) => patch("plan", e.target.value)}
                    placeholder="Custom plan name"
                    className={`${inputCls} mt-1.5`}
                  />
                )}
              </label>
              <label className="block">
                <span className={labelCls}>Amount (₹)</span>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => patch("amount", Number(e.target.value))}
                  className={inputCls}
                  min={1}
                />
              </label>
              <label className="block">
                <span className={labelCls}>Credits</span>
                <input
                  type="number"
                  value={form.credits_added}
                  onChange={(e) => patch("credits_added", Number(e.target.value))}
                  className={inputCls}
                  min={1}
                />
              </label>
            </div>
          </section>

          {/* Razorpay */}
          <section className="mt-5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Razorpay reference (optional)
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={labelCls}>Payment ID</span>
                <input
                  type="text"
                  value={form.razorpay_payment_id}
                  onChange={(e) => patch("razorpay_payment_id", e.target.value)}
                  placeholder="pay_XXXXXXXXXXXX"
                  className={`${inputCls} font-mono`}
                />
              </label>
              <label className="block">
                <span className={labelCls}>Order ID</span>
                <input
                  type="text"
                  value={form.razorpay_order_id}
                  onChange={(e) => patch("razorpay_order_id", e.target.value)}
                  placeholder="order_XXXXXXXXXXXX"
                  className={`${inputCls} font-mono`}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className={labelCls}>Purchase date</span>
                <input
                  type="date"
                  value={form.created_at}
                  onChange={(e) => patch("created_at", e.target.value)}
                  className={inputCls}
                />
              </label>
            </div>
          </section>

          {/* Billing snapshot */}
          <section className="mt-5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Bill details (optional)
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={labelCls}>Name</span>
                <input
                  type="text"
                  value={form.billing_name}
                  onChange={(e) => patch("billing_name", e.target.value)}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className={labelCls}>Phone</span>
                <input
                  type="tel"
                  value={form.billing_phone}
                  onChange={(e) => patch("billing_phone", e.target.value)}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className={labelCls}>Email</span>
                <input
                  type="email"
                  value={form.billing_email}
                  onChange={(e) => patch("billing_email", e.target.value)}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className={labelCls}>Company</span>
                <input
                  type="text"
                  value={form.billing_company}
                  onChange={(e) => patch("billing_company", e.target.value)}
                  className={inputCls}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className={labelCls}>Address</span>
                <textarea
                  rows={2}
                  value={form.billing_address}
                  onChange={(e) => patch("billing_address", e.target.value)}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className={labelCls}>GSTIN</span>
                <input
                  type="text"
                  value={form.billing_gstin}
                  maxLength={15}
                  onChange={(e) =>
                    patch("billing_gstin", e.target.value.toUpperCase().replace(/\s+/g, ""))
                  }
                  className={`${inputCls} font-mono uppercase`}
                />
              </label>
            </div>
          </section>

          {/* Credit toggle */}
          <label className="mt-5 flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/40">
            <input
              type="checkbox"
              checked={form.credit_user}
              onChange={(e) => patch("credit_user", e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              Also credit the user's wallet by{" "}
              <b>{Number(form.credits_added).toLocaleString("en-IN")}</b>{" "}
              credits. Leave unchecked for pure bill backfill (credits were
              already added at the time of the original purchase).
            </span>
          </label>

          {error && (
            <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3 dark:border-slate-800 dark:bg-[#0f1218]">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            {submitting ? "Recording…" : "Record payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
