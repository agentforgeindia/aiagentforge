"use client";

// ============================================================
// BillingDetailsModal
// ============================================================
// Shown to the user right after they click "Buy [plan]" on the
// /billing or /pricing page, and BEFORE Razorpay checkout opens.
//
// We collect what we want on the printed bill:
//   • Full name      (required, pre-filled)
//   • Phone          (required)
//   • Email          (read-only, pre-filled)
//   • Company name   (optional)
//   • Address        (optional, multi-line)
//   • GSTIN          (optional)
//
// The parent passes onSubmit(details) — it receives the snapshot
// and then proceeds with order creation + Razorpay open.
// ============================================================

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export type BillingDetails = {
  name: string;
  phone: string;
  email: string;
  company: string;
  address: string;
  gstin: string;
};

export type BillingDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (details: BillingDetails) => void | Promise<void>;
  /** Pre-filled values (from profile + auth session). */
  initial?: Partial<BillingDetails>;
  /** Plan label for the modal heading. */
  planName: string;
  /** Amount in INR for the CTA. */
  amount: number;
  /** Disable Submit while parent is creating the Razorpay order. */
  submitting?: boolean;
};

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

const labelCls =
  "mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400";

export default function BillingDetailsModal({
  open,
  onClose,
  onSubmit,
  initial,
  planName,
  amount,
  submitting,
}: BillingDetailsModalProps) {
  const [form, setForm] = useState<BillingDetails>({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    company: initial?.company ?? "",
    address: initial?.address ?? "",
    gstin: initial?.gstin ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  // Reset form whenever the modal opens with fresh defaults.
  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? "",
        phone: initial?.phone ?? "",
        email: initial?.email ?? "",
        company: initial?.company ?? "",
        address: initial?.address ?? "",
        gstin: initial?.gstin ?? "",
      });
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  function patch<K extends keyof BillingDetails>(key: K, value: BillingDetails[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): string | null {
    if (!form.name.trim()) return "Please enter your full name.";
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10)
      return "Please enter a valid phone number (10 digits).";
    if (form.gstin && form.gstin.trim().length !== 15)
      return "GSTIN must be exactly 15 characters (or leave it blank).";
    return null;
  }

  async function handleSubmit() {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    await onSubmit({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      company: form.company.trim(),
      address: form.address.trim(),
      gstin: form.gstin.trim().toUpperCase(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 px-2 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-[#0f1218]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-[#0f1218]">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Billing details for invoice
            </p>
            <h2 className="mt-0.5 truncate text-lg font-bold text-slate-900 dark:text-slate-100">
              {planName} · ₹{Number(amount).toLocaleString("en-IN")}
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

        {/* Body */}
        <div className="px-5 py-5">
          <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
            Yeh details aapki bill mein print honge. Ek baar fill karo, agle
            purchase pe automatic dikh jaayenge.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelCls}>
                Full name <span className="text-rose-500">*</span>
              </span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => patch("name", e.target.value)}
                placeholder="Bhavin Joshi"
                className={inputCls}
                autoComplete="name"
              />
            </label>

            <label className="block">
              <span className={labelCls}>
                Phone <span className="text-rose-500">*</span>
              </span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => patch("phone", e.target.value)}
                placeholder="98XXXXXXXX"
                inputMode="tel"
                className={inputCls}
                autoComplete="tel"
              />
            </label>

            <label className="block">
              <span className={labelCls}>Email (account)</span>
              <input
                type="email"
                value={form.email}
                readOnly
                className={`${inputCls} cursor-not-allowed bg-slate-100 dark:bg-slate-800/60`}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className={labelCls}>Company / business name (optional)</span>
              <input
                type="text"
                value={form.company}
                onChange={(e) => patch("company", e.target.value)}
                placeholder="Shree Ganesh Textile"
                className={inputCls}
                autoComplete="organization"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className={labelCls}>Billing address (optional)</span>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => patch("address", e.target.value)}
                placeholder="Shop no, street, city, state, PIN"
                className={inputCls}
                autoComplete="street-address"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className={labelCls}>GSTIN (optional)</span>
              <input
                type="text"
                value={form.gstin}
                onChange={(e) =>
                  patch("gstin", e.target.value.toUpperCase().replace(/\s+/g, ""))
                }
                placeholder="27AAACI1234A1Z5"
                maxLength={15}
                className={`${inputCls} font-mono uppercase`}
              />
            </label>
          </div>

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
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            {submitting ? "Opening checkout…" : "Continue to payment →"}
          </button>
        </div>
      </div>
    </div>
  );
}
