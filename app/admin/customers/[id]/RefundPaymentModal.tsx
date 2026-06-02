"use client";

// ============================================================
// RefundPaymentModal — issue a refund against a specific payment.
// ============================================================
// Fields:
//   • amount             (default = original payment amount)
//   • reason             (required, free-text)
//   • via_razorpay       (default true)
//   • deduct_credits     (default false)
//   • credit_amount      (default = payment.credits_added)
//
// Hits POST /api/admin/payments/refund.
// ============================================================

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export type RefundablePayment = {
  id: string;
  plan: string;
  amount: number;
  credits_added: number;
  razorpay_payment_id: string | null;
  status: string;
};

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

const labelCls =
  "mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400";

export default function RefundPaymentModal({
  open,
  onClose,
  onDone,
  payment,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  payment: RefundablePayment | null;
}) {
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [viaRazorpay, setViaRazorpay] = useState(true);
  const [deductCredits, setDeductCredits] = useState(false);
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && payment) {
      setAmount(Number(payment.amount));
      setReason("");
      setViaRazorpay(Boolean(payment.razorpay_payment_id));
      setDeductCredits(false);
      setCreditAmount(Number(payment.credits_added));
      setError(null);
    }
  }, [open, payment]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open || !payment) return null;

  async function submit() {
    if (!payment) return;
    setError(null);
    if (!reason.trim() || reason.trim().length < 3) {
      setError("A reason is required (min 3 characters).");
      return;
    }
    if (amount <= 0 || amount > Number(payment.amount)) {
      setError(`Amount must be between ₹1 and ₹${payment.amount}.`);
      return;
    }
    if (deductCredits && (creditAmount < 0 || creditAmount > 1_000_000_000)) {
      setError("Credit amount out of range.");
      return;
    }

    setSubmitting(true);
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) {
      setSubmitting(false);
      setError("Login required.");
      return;
    }

    const res = await fetch("/api/admin/payments/refund", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        payment_id: payment.id,
        amount,
        reason: reason.trim(),
        via_razorpay: viaRazorpay,
        deduct_credits: deductCredits,
        credit_amount: deductCredits ? creditAmount : undefined,
      }),
    });
    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(json?.error ?? "Refund failed.");
      return;
    }
    onDone();
    onClose();
  }

  const isPartial = amount > 0 && amount < Number(payment.amount);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 px-2 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-[#0f1218]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-[#0f1218]">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-600 dark:text-rose-400">
              Refund payment
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-100">
              {payment.plan} · ₹{Number(payment.amount).toLocaleString("en-IN")}
            </h2>
            {payment.razorpay_payment_id && (
              <p className="font-mono text-[11px] text-slate-500">
                {payment.razorpay_payment_id}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>Refund amount (₹)</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={1}
                max={Number(payment.amount)}
                className={inputCls}
              />
              {isPartial && (
                <p className="mt-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  Partial refund — payment will be marked as partially refunded.
                </p>
              )}
            </label>

            <label className="block">
              <span className={labelCls}>Method</span>
              <select
                value={viaRazorpay ? "razorpay" : "manual"}
                onChange={(e) => setViaRazorpay(e.target.value === "razorpay")}
                className={inputCls}
              >
                <option value="razorpay" disabled={!payment.razorpay_payment_id}>
                  Via Razorpay (real money back)
                </option>
                <option value="manual">Manual / out-of-band (just record)</option>
              </select>
              {!payment.razorpay_payment_id && (
                <p className="mt-1 text-[11px] text-slate-500">
                  No Razorpay id on this payment — must use Manual.
                </p>
              )}
            </label>

            <label className="block sm:col-span-2">
              <span className={labelCls}>
                Reason <span className="text-rose-500">*</span>
              </span>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Customer requested cancellation — never logged in"
                className={inputCls}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Stored permanently in the audit log.
              </p>
            </label>

            <label className="flex items-start gap-2 rounded-md border border-slate-200 p-3 sm:col-span-2 dark:border-slate-700">
              <input
                type="checkbox"
                checked={deductCredits}
                onChange={(e) => setDeductCredits(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span className="text-xs leading-5">
                Also deduct credits from the user's wallet (caps at current balance).
              </span>
            </label>

            {deductCredits && (
              <label className="block sm:col-span-2">
                <span className={labelCls}>Credits to deduct</span>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                  min={0}
                  className={inputCls}
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Defaults to the credits granted by this payment (
                  {Number(payment.credits_added).toLocaleString("en-IN")}).
                </p>
              </label>
            )}
          </div>

          {error && (
            <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </p>
          )}
        </div>

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
            className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-rose-500 disabled:opacity-50"
          >
            {submitting
              ? "Processing…"
              : `Refund ₹${amount.toLocaleString("en-IN")}`}
          </button>
        </div>
      </div>
    </div>
  );
}
