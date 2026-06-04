"use client";

// /admin/ai-assistant — 2026 AI features:
//   • Meeting Summary  — transcript → structured summary
//   • Sales Coach      — call notes → coaching feedback
//   • WhatsApp Assistant — customer message → AI reply draft

import { useState } from "react";
import { ShieldCheck, FileText, GraduationCap, MessageCircle, Sparkles, Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, { adminCardCls, adminMutedCls, adminPrimaryBtnCls, adminInputCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

type Tab = "summary" | "coach" | "whatsapp";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "summary",  label: "Meeting Summary",     icon: <FileText className="h-4 w-4" /> },
  { key: "coach",    label: "Sales Coach",         icon: <GraduationCap className="h-4 w-4" /> },
  { key: "whatsapp", label: "WhatsApp Assistant",  icon: <MessageCircle className="h-4 w-4" /> },
];

export default function AiAssistantPage() {
  const { loading: pLoading, isAdmin, email } = useAdminPermissions();
  const [tab, setTab] = useState<Tab>("summary");

  if (pLoading) return <Loading />;
  if (!isAdmin)  return <Denied />;

  return (
    <AdminShell
      breadcrumbs={[{ label: "AI Assistant" }]}
      title="AI Assistant"
      subtitle="Meeting summaries, sales coaching, WhatsApp replies — powered by AI"
      email={email}
    >
      <div className="mb-4 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-bold transition ${tab === t.key ? "bg-slate-900 text-white dark:bg-indigo-600" : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === "summary"  && <AiTool key="summary"
        endpoint="/api/admin/ai/summary"  field="transcript" resultKey="summary"
        placeholder="Paste the call/meeting transcript or rough notes here…"
        label="Meeting / Call Transcript"
        cta="Generate Summary"
        blurb="Call ya meeting ka transcript paste karo — AI structured summary dega: customer need, objections, next steps aur ready follow-up message." />}

      {tab === "coach"    && <AiTool key="coach"
        endpoint="/api/admin/ai/coach"    field="transcript" resultKey="feedback"
        placeholder="Paste the sales call transcript or notes here…"
        label="Sales Call Transcript / Notes"
        cta="Coach Me"
        extraField="rep" extraPlaceholder="Sales rep name (optional)"
        blurb="Call ka transcript daalo — AI Sales Coach score dega aur batayega closing/objection handling kaise improve karein." />}

      {tab === "whatsapp" && <AiTool key="whatsapp"
        endpoint="/api/admin/ai/whatsapp-reply" field="message" resultKey="reply"
        placeholder="Paste the customer's WhatsApp message here…"
        label="Customer's WhatsApp Message"
        cta="Draft Reply"
        extraField="context" extraPlaceholder="Context (optional) — e.g. 'Pro plan user, asked about refund'"
        blurb="Customer ka message paste karo — AI usi language mein ready-to-send WhatsApp reply banayega." />}
    </AdminShell>
  );
}

function AiTool({
  endpoint, field, resultKey, placeholder, label, cta, blurb, extraField, extraPlaceholder,
}: {
  endpoint: string; field: string; resultKey: string; placeholder: string;
  label: string; cta: string; blurb: string; extraField?: string; extraPlaceholder?: string;
}) {
  const [input, setInput]   = useState("");
  const [extra, setExtra]   = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function run() {
    if (input.trim().length < 2) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const body: Record<string, string> = { [field]: input };
      if (extraField && extra) body[extraField] = extra;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.ok) setResult(json[resultKey]);
      else setError(json.error ?? "Failed.");
    } catch {
      setError("Network error.");
    }
    setLoading(false);
  }

  function copyResult() {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Input */}
      <section className={`${adminCardCls} p-4`}>
        <p className={`mb-2 text-[11px] ${adminMutedCls}`}>{blurb}</p>
        {extraField && (
          <input className={`${adminInputCls} mb-2`} placeholder={extraPlaceholder} value={extra} onChange={(e) => setExtra(e.target.value)} />
        )}
        <label className={`text-[10px] font-bold uppercase tracking-[0.16em] ${adminMutedCls}`}>{label}</label>
        <textarea
          className={`${adminInputCls} mt-1 font-mono text-xs`}
          rows={12}
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="button" onClick={run} disabled={loading || input.trim().length < 2} className={`${adminPrimaryBtnCls} mt-3 w-full justify-center`}>
          <Sparkles className={`h-3.5 w-3.5 ${loading ? "animate-pulse" : ""}`} />
          {loading ? "Thinking…" : cta}
        </button>
      </section>

      {/* Output */}
      <section className={`${adminCardCls} p-4`}>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">AI Result</p>
          {result && (
            <button type="button" onClick={copyResult} className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-300">
              {copied ? <><Check className="h-3 w-3" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
            </button>
          )}
        </div>
        {error ? (
          <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
        ) : result ? (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">{result}</div>
        ) : (
          <p className={`py-12 text-center text-sm ${adminMutedCls}`}>Result yahan dikhega…</p>
        )}
      </section>
    </div>
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
