"use client";

// /careers/payment/[id] — ₹500 Security Deposit page.
// HR sends candidate this link after approval.
// On success: shows login credentials.

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shield, CheckCircle2, Copy, Eye, EyeOff, Lock } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RazorpayInstance = any;

type Creds = { candidate_code: string; login_email: string; login_password: string };

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [creds, setCreds]       = useState<Creds | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied]     = useState<string | null>(null);

  // Load Razorpay SDK
  useEffect(() => {
    if ((window as any).Razorpay) return;
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(s);
  }, []);

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  async function startPayment() {
    setLoading(true); setError(null);
    const res  = await fetch("/api/careers/payment/create-order", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_id: id }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) { setError(json.error ?? "Could not start payment."); return; }

    const options = {
      key:      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? json.key_id,
      amount:   json.amount * 100,
      currency: "INR",
      name:     "AgentForge",
      description: "Security Deposit — Refundable",
      order_id: json.order_id,
      prefill:  { name: json.candidate_name, email: json.candidate_email },
      theme:    { color: "#06b6d4" },
      handler: async (response: any) => {
        setLoading(true);
        const verifyRes = await fetch("/api/careers/payment/verify", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidate_id: id,
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
          }),
        });
        const verifyJson = await verifyRes.json();
        setLoading(false);
        if (verifyJson.ok) { setCreds(verifyJson); setDone(true); }
        else { setError(verifyJson.error ?? "Payment verification failed."); }
      },
      modal: { ondismiss: () => setLoading(false) },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rzp: RazorpayInstance = new (window as any).Razorpay(options);
    rzp.open();
  }

  return (
    <main className="relative min-h-screen bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee44,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf633,transparent_35%)]" />

      <div className="relative z-10 mx-auto max-w-md px-5 py-14">
        <div className="rounded-3xl border border-cyan-200/40 bg-white/85 p-8 shadow-xl shadow-cyan-200/20 backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.05]">
          {done && creds ? (
            /* ── Success: Show Credentials ── */
            <div>
              <div className="text-center">
                <p className="text-5xl">🎉</p>
                <h1 className="mt-3 text-2xl font-black">Welcome to <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">AgentForge!</span></h1>
                <p className="mt-1 text-sm font-medium text-black/60 dark:text-white/60">
                  Payment successful. Your login credentials have been generated.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-xl border border-cyan-200/50 bg-cyan-50/60 p-4 dark:border-cyan-400/20 dark:bg-cyan-500/5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-300">Candidate ID</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-lg font-black tracking-widest">{creds.candidate_code}</p>
                    <button onClick={() => copyToClipboard(creds.candidate_code, "id")}
                      className="rounded-lg bg-cyan-100 p-1.5 text-cyan-700 transition hover:bg-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300">
                      {copied === "id" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-black/50 dark:text-white/50">Login Email</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-sm font-bold">{creds.login_email}</p>
                    <button onClick={() => copyToClipboard(creds.login_email, "email")}
                      className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white/60">
                      {copied === "email" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-black/50 dark:text-white/50">Password</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-sm font-bold tracking-widest">{showPass ? creds.login_password : "••••••••••"}</p>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setShowPass(s => !s)}
                        className="rounded-lg bg-slate-100 p-1.5 text-slate-600 dark:bg-white/10 dark:text-white/60">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button onClick={() => copyToClipboard(creds.login_password, "pass")}
                        className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white/60">
                        {copied === "pass" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-amber-200/60 bg-amber-50/60 p-4 dark:border-amber-400/20 dark:bg-amber-500/5">
                <p className="text-xs font-black text-amber-800 dark:text-amber-200">⚠️ Save your credentials!</p>
                <p className="mt-1 text-[11px] font-medium text-black/60 dark:text-white/50">
                  Screenshot or note down these details. Our support team will contact you soon on Zoom/WhatsApp for training.
                </p>
              </div>

              <a href="/admin" className="mt-5 block w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 py-3.5 text-center text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-[1.02]">
                Go to Dashboard →
              </a>
            </div>
          ) : (
            /* ── Payment Prompt ── */
            <div>
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-xl shadow-cyan-500/30">
                  <Shield className="h-8 w-8" />
                </div>
                <h1 className="mt-4 text-2xl font-black">Security Deposit</h1>
                <p className="mt-1 text-sm font-medium text-black/55 dark:text-white/55">
                  To join AgentForge, submit a one-time refundable security deposit of ₹500.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                  <p className="text-sm font-medium text-black/70 dark:text-white/70">100% Refundable — returned if you leave.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <p className="text-sm font-medium text-black/70 dark:text-white/70">Login credentials are generated instantly after payment.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <p className="text-sm font-medium text-black/70 dark:text-white/70">Our support team will contact you soon for training.</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-cyan-200/50 bg-cyan-50/60 py-4 text-center dark:border-cyan-400/20 dark:bg-cyan-500/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-700 dark:text-cyan-300">Amount</p>
                <p className="mt-1 text-4xl font-black">₹500</p>
                <p className="text-[11px] font-bold text-black/40 dark:text-white/40">Refundable Security Deposit</p>
              </div>

              {error && <p className="mt-3 text-sm font-bold text-rose-600">{error}</p>}

              <button onClick={startPayment} disabled={loading}
                className="mt-5 w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 py-3.5 text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                {loading ? "Processing…" : "Pay ₹500 Securely →"}
              </button>
              <p className="mt-3 text-center text-[11px] font-bold text-black/40 dark:text-white/40">
                🔒 Secured by Razorpay · UPI, Cards, Net Banking accepted
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
