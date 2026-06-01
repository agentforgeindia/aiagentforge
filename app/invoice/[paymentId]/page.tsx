"use client";

// ============================================================
// /invoice/[paymentId]
// ============================================================
// Bill / receipt page that the user opens from their billing
// page. Renders a clean, single-page layout designed to look
// good when the browser's "Save as PDF" / "Print" is used.
//
// No GST math — this is a plain receipt for AgentForge plan
// purchases. Once the customer adds their GSTIN, we'll switch
// to a proper tax invoice flow in a separate route.
//
// Security: relies on Supabase RLS for "payments". The base
// policy only lets the row owner SELECT — so this URL only
// surfaces a bill to the user who actually paid for it.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

type Payment = {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  credits_added: number;
  status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
};

export default function InvoicePage() {
  const params = useParams<{ paymentId: string }>();
  const router = useRouter();
  const paymentId = params?.paymentId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!paymentId) return;
    (async () => {
      // 1. Require auth — RLS will block anonymous reads anyway
      //    but a quick check gives a friendlier UX.
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session?.user) {
        setError("Login required to view this bill.");
        setLoading(false);
        return;
      }

      // 2. Read payment + buyer profile in parallel.
      const [pRes, prRes] = await Promise.all([
        supabase
          .from("payments")
          .select(
            "id, user_id, plan, amount, credits_added, status, razorpay_order_id, razorpay_payment_id, created_at",
          )
          .eq("id", paymentId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("id, email, full_name")
          .eq("id", sess.session.user.id)
          .maybeSingle(),
      ]);

      if (pRes.error) {
        setError(pRes.error.message);
        setLoading(false);
        return;
      }
      if (!pRes.data) {
        setError("Bill not found, or you don't have access to it.");
        setLoading(false);
        return;
      }
      // RLS should already prevent foreign access, but verify
      // for clarity in the error message.
      if (pRes.data.user_id !== sess.session.user.id) {
        setError("This bill belongs to a different account.");
        setLoading(false);
        return;
      }
      setPayment(pRes.data as Payment);
      setProfile((prRes.data ?? null) as Profile | null);
      setLoading(false);
    })();
  }, [paymentId]);

  // Auto-trigger the browser print dialog once the bill renders.
  // The user can then choose "Save as PDF" or print on paper.
  useEffect(() => {
    if (!loading && payment) {
      const t = window.setTimeout(() => window.print(), 500);
      return () => window.clearTimeout(t);
    }
  }, [loading, payment]);

  const billNumber = useMemo(() => {
    if (!payment) return "";
    // Stable, short bill number derived from the payment uuid.
    const head = payment.id.slice(0, 8).toUpperCase();
    const dt = new Date(payment.created_at);
    return `AF-${dt.getFullYear()}-${head}`;
  }, [payment]);

  return (
    <main className="min-h-screen bg-white text-[#111827]">
      {/* Print stylesheet — when the user saves as PDF, the
          page background is white and the buttons are hidden. */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>

      {loading ? (
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-black/55">Loading your bill…</p>
        </div>
      ) : error ? (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-4xl">⚠️</p>
          <p className="text-sm text-black/70">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/billing")}
            className="no-print mt-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2 text-sm font-black text-white"
          >
            Back to billing
          </button>
        </div>
      ) : payment ? (
        <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
          {/* Action bar — hidden when printing */}
          <div className="no-print mb-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push("/billing")}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold text-black/70 hover:border-cyan-400 hover:text-cyan-600"
            >
              ← Back to billing
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2 text-sm font-black text-white shadow"
            >
              Download / Print bill
            </button>
          </div>

          {/* Bill card */}
          <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-xl sm:p-10">
            {/* Header */}
            <header className="flex items-start justify-between gap-4 border-b border-black/10 pb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md">
                  <Image
                    src="/af-logo.png"
                    alt="AgentForge AI"
                    width={48}
                    height={48}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-lg font-black tracking-tight">AgentForge AI</p>
                  <p className="text-xs text-black/60">www.aiagentforge.in</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-600">
                  Bill / Receipt
                </p>
                <p className="mt-1 text-sm font-black">{billNumber}</p>
                <p className="text-xs text-black/55">
                  {formatDate(payment.created_at)}
                </p>
              </div>
            </header>

            {/* Buyer + meta */}
            <section className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/45">
                  Billed to
                </p>
                <p className="mt-1 text-sm font-black">
                  {profile?.full_name?.trim() || "(unnamed)"}
                </p>
                <p className="text-xs text-black/60">{profile?.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/45">
                  Payment
                </p>
                <p className="mt-1 text-xs">
                  <span className="text-black/55">Status: </span>
                  <span className="font-bold uppercase tracking-wider text-emerald-600">
                    {payment.status}
                  </span>
                </p>
                <p className="text-xs">
                  <span className="text-black/55">Razorpay ID: </span>
                  <span className="font-mono text-[11px] text-black/80">
                    {payment.razorpay_payment_id ?? "—"}
                  </span>
                </p>
                <p className="text-xs">
                  <span className="text-black/55">Order ID: </span>
                  <span className="font-mono text-[11px] text-black/80">
                    {payment.razorpay_order_id ?? "—"}
                  </span>
                </p>
              </div>
            </section>

            {/* Line item */}
            <section className="mt-8 overflow-hidden rounded-2xl border border-black/10">
              <table className="w-full text-sm">
                <thead className="bg-black/5">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-black uppercase tracking-[0.18em] text-black/55">
                      Description
                    </th>
                    <th className="px-4 py-2 text-right text-[10px] font-black uppercase tracking-[0.18em] text-black/55">
                      Credits
                    </th>
                    <th className="px-4 py-2 text-right text-[10px] font-black uppercase tracking-[0.18em] text-black/55">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-black/5">
                    <td className="px-4 py-3">
                      <p className="font-black">
                        AgentForge {payment.plan} plan
                      </p>
                      <p className="text-xs text-black/55">
                        AI catalogue credits — one-time purchase
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {Number(payment.credits_added).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right font-black tabular-nums">
                      ₹{Number(payment.amount).toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-black/5">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-right text-xs font-black uppercase tracking-[0.18em] text-black/55">
                      Total paid
                    </td>
                    <td className="px-4 py-3 text-right text-base font-black tabular-nums">
                      ₹{Number(payment.amount).toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </section>

            {/* Notes */}
            <section className="mt-8 rounded-2xl border border-cyan-200/60 bg-cyan-50/60 p-4 text-xs leading-6 text-black/65">
              <p>
                Thank you for your purchase. Credits have been added to your
                AgentForge account and are usable immediately at{" "}
                <span className="font-bold">www.aiagentforge.in</span>.
              </p>
              <p className="mt-2">
                This is a system-generated bill and does not require a
                signature. For any billing query, write to{" "}
                <span className="font-bold">info@aiagentforge.in</span>.
              </p>
            </section>

            {/* Footer */}
            <footer className="mt-10 border-t border-black/10 pt-4 text-center text-[11px] text-black/45">
              AgentForge AI · India's AI visual studio for textile, jewellery &amp;
              D2C brands · www.aiagentforge.in
            </footer>
          </article>
        </div>
      ) : null}
    </main>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
