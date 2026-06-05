"use client";

// /admin/caller-gpt — AgentForge Caller GPT. Live coaching for callers.

import { useState } from "react";
import { ShieldCheck, Sparkles, Copy, Check, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, { adminCardCls, adminMutedCls, adminInputCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

const QUICK = [
  "Need nahi hai",
  "Already photographer hai",
  "AI quality achhi nahi hoti",
  "Price kya hai?",
  "Time nahi hai",
  "Free trial hai?",
  "Image kitni der mein banti hai?",
  "Jewellery customer hai, bridal shoot chahiye",
];

type Turn = { q: string; a: string };

export default function CallerGptPage() {
  const { loading: pLoading, isAdmin, has, email } = useAdminPermissions();
  const canUse = isAdmin || has("leads.view");

  const [input, setInput]   = useState("");
  const [turns, setTurns]   = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  async function ask(situation?: string) {
    const s = (situation ?? input).trim();
    if (s.length < 2) return;
    setLoading(true); setInput("");
    const { data: sess } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/ai/caller-gpt", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token}` },
      body: JSON.stringify({ situation: s }),
    });
    const json = await res.json();
    setLoading(false);
    setTurns((prev) => [{ q: s, a: json.ok ? json.answer : (json.error ?? "Error") }, ...prev]);
  }

  function copy(i: number, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(i); setTimeout(() => setCopied(null), 1500);
  }

  if (pLoading) return <Loading />;
  if (!canUse)  return <Denied />;

  return (
    <AdminShell
      breadcrumbs={[{ label: "Caller GPT" }]}
      title="AgentForge Caller GPT"
      subtitle="Live calling assistant — customer ne jo kaha type karo, instant reply paao"
      email={email}
    >
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Input */}
        <section className={`${adminCardCls} p-4`}>
          <label className={`text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>Customer ne kya kaha?</label>
          <div className="mt-1.5 flex gap-2">
            <input
              className={`${adminInputCls} flex-1`}
              placeholder="e.g. Sir bola already photographer hai…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask()}
            />
            <button type="button" onClick={() => ask()} disabled={loading || input.trim().length < 2}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50">
              <Sparkles className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />{loading ? "…" : "Ask"}
            </button>
          </div>

          {/* Quick objections */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button key={q} type="button" onClick={() => ask(q)} disabled={loading}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-indigo-400 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500">
                {q}
              </button>
            ))}
          </div>
        </section>

        {/* Answers */}
        {turns.length === 0 ? (
          <div className={`${adminCardCls} p-10 text-center`}>
            <Sparkles className="mx-auto h-8 w-8 text-indigo-300" />
            <p className={`mt-2 text-sm ${adminMutedCls}`}>Upar customer ki baat type karo ya quick button dabao — ready reply milega.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {turns.map((t, i) => (
              <div key={i} className={`${adminCardCls} p-4`}>
                <p className={`text-[11px] font-bold ${adminMutedCls}`}>🗣️ Customer: {t.q}</p>
                <div className="mt-2 rounded-lg bg-indigo-50 p-3 dark:bg-indigo-500/10">
                  <p className="whitespace-pre-wrap text-sm font-medium text-slate-800 dark:text-slate-100">{t.a}</p>
                </div>
                <button type="button" onClick={() => copy(i, t.a)} className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-300">
                  {copied === i ? <><Check className="h-3 w-3" />Copied</> : <><Copy className="h-3 w-3" />Copy reply</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function Loading() { return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-slate-500 dark:bg-[#0b0d12] dark:text-slate-400">Checking access…</main>; }
function Denied()  {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6 dark:bg-[#0b0d12]">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#11141a]">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-500" /><h1 className="mt-3 text-base font-bold">Access denied</h1>
      </div>
    </main>
  );
}
