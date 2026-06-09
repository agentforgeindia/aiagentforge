"use client";

// /admin/team-assistant — AgentForge Team Assistant.
// Universal AI helper for the whole team: answers any question, helps with
// training, drafts message replies, Q&A. Never shares internal financials.

import { useState } from "react";
import { ShieldCheck, Sparkles, Copy, Check, Send, Bot, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, { adminCardCls, adminMutedCls, adminInputCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

const QUICK = [
  "Is feature ko use kaise karein?",
  "Naye member ko ye kaam samjhao",
  "Customer ko WhatsApp reply draft karo",
  "Lead ko follow-up message likho",
  "Ye status ka matlab kya hai?",
  "Mujhe is page pe kaam train karwao",
];

type Turn = { q: string; a: string };

export default function TeamAssistantPage() {
  const { loading: pLoading, isAdmin, email } = useAdminPermissions();
  const canUse = isAdmin; // available to the whole team (any admin user)

  const [input, setInput]   = useState("");
  const [turns, setTurns]   = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  async function ask(text?: string) {
    const s = (text ?? input).trim();
    if (s.length < 2 || loading) return;
    setLoading(true); setInput("");
    const { data: sess } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/ai/team-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token}` },
      body: JSON.stringify({ message: s, history: turns.slice(0, 4) }),
    });
    const json = await res.json();
    setLoading(false);
    setTurns(prev => [{ q: s, a: json.ok ? json.answer : (json.error ?? "Error") }, ...prev]);
  }

  function copy(i: number, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(i); setTimeout(() => setCopied(null), 1500);
  }

  if (pLoading) return <Loading />;
  if (!canUse)  return <Denied />;

  return (
    <AdminShell
      doodleType="general"
      breadcrumbs={[{ label: "Team Assistant" }]}
      title="AgentForge Team Assistant"
      subtitle="Har sawaal ka jawab · training · message reply — sab ek jagah"
      email={email}
      actions={
        turns.length > 0 ? (
          <button type="button" onClick={() => setTurns([])}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
        ) : undefined
      }
    >
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Input */}
        <section className={`${adminCardCls} p-4`}>
          <label className={`text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>Apna sawaal ya request likho</label>
          <div className="mt-1.5 flex gap-2">
            <input
              className={`${adminInputCls} flex-1`}
              placeholder="e.g. Customer ko demo bhejne ka reply banao…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask()}
            />
            <button type="button" onClick={() => ask()} disabled={loading || input.trim().length < 2}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50">
              <Send className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />{loading ? "…" : "Ask"}
            </button>
          </div>

          {/* Quick prompts */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button key={q} type="button" onClick={() => ask(q)} disabled={loading}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-indigo-400 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500">
                {q}
              </button>
            ))}
          </div>

          <p className={`mt-3 text-[11px] ${adminMutedCls}`}>
            🔒 Note: Ye assistant company ki internal financial details (revenue, kharcha, salary) share nahi karta.
          </p>
        </section>

        {/* Answers */}
        {turns.length === 0 ? (
          <div className={`${adminCardCls} p-10 text-center`}>
            <Bot className="mx-auto h-8 w-8 text-indigo-300" />
            <p className={`mt-2 text-sm ${adminMutedCls}`}>
              Kuch bhi poocho — kaam samjhao, training do, ya customer/teammate ke liye reply banao.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {turns.map((t, i) => (
              <div key={i} className={`${adminCardCls} p-4`}>
                <p className={`text-[11px] font-bold ${adminMutedCls}`}>🙋 You: {t.q}</p>
                <div className="mt-2 rounded-lg bg-indigo-50 p-3 dark:bg-indigo-500/10">
                  <p className="whitespace-pre-wrap text-sm font-medium text-slate-800 dark:text-slate-100">{t.a}</p>
                </div>
                <button type="button" onClick={() => copy(i, t.a)} className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-300">
                  {copied === i ? <><Check className="h-3 w-3" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
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
