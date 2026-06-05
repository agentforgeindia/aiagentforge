"use client";

// /admin/help — role-wise backend rules + AI help assistant.

import { useState } from "react";
import { ShieldCheck, Sparkles, BookOpen, Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell, { adminCardCls, adminMutedCls, adminInputCls } from "../AdminShell";
import { useAdminPermissions } from "../AdminPermissions";

const RULES: Record<string, { title: string; rules: string[] }> = {
  sales: {
    title: "Sales / Telecaller Rules",
    rules: [
      "Leads ko honestly handle karo — fake 'interested' mat mark karo.",
      "Har call ke baad CRM status update karo (Demo Sent / Hot Lead / etc.).",
      "Roz Caller Report bharo — calls, demos, hot leads, paid.",
      "Hot lead milte hi turant mark karo + team ko batao.",
      "Customer ki personal detail kisi ko mat do.",
      "Sales Command se calling queue follow karo, Caller GPT se reply lo.",
    ],
  },
  admin: {
    title: "Admin Rules",
    rules: [
      "Platform operate karo — tickets, content, credits, customers.",
      "Refund/discount bade ho to Approvals se founder approval lo.",
      "Team roles change karne ka access sirf Founder ke paas hai.",
      "Error Logs roz check karo — payment/webhook failures.",
      "Sensitive actions Audit Log mein record hote hain — careful raho.",
    ],
  },
  hr: {
    title: "HR Rules",
    rules: [
      "Employees add/manage karo HR module se.",
      "Salary records + leave requests time pe process karo.",
      "Hiring OS mein candidate pipeline aage badhao (stage dropdown).",
      "Attendance dekho — kaun kitne ghante online raha.",
      "Candidate ki details confidential rakho.",
    ],
  },
  founder: {
    title: "Founder",
    rules: [
      "Sab kuch access hai. Command Center se poori company 30 sec mein samjho.",
      "Targets/goals set karo, cash-in-bank update karo.",
      "Team members add karo + roles do (/admin/team).",
      "Daily report raat ko email aata hai.",
    ],
  },
};

export default function HelpPage() {
  const { loading: pLoading, isAdmin, role, email } = useAdminPermissions();

  const [q, setQ]         = useState("");
  const [ans, setAns]     = useState<{ q: string; a: string }[]>([]);
  const [busy, setBusy]   = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  async function ask(question?: string) {
    const s = (question ?? q).trim();
    if (s.length < 2) return;
    setBusy(true); setQ("");
    const { data: sess } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/ai/help", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token}` },
      body: JSON.stringify({ question: s, role }),
    });
    const json = await res.json();
    setBusy(false);
    setAns((p) => [{ q: s, a: json.ok ? json.answer : (json.error ?? "Error") }, ...p]);
  }

  if (pLoading) return <Loading />;
  if (!isAdmin)  return <Denied />;

  // Show the rule card matching the role (fallback to all)
  const roleKey = role === "sales" || role === "sales_manager" ? "sales"
    : role === "hr" || role === "hr-executive" ? "hr"
    : role === "founder" ? "founder" : "admin";
  const myRules = RULES[roleKey] ?? RULES.admin;

  const QUICK = [
    "Lead ko hot kaise mark karu?",
    "Daily report kahan bharu?",
    "Refund kaise process hota hai?",
    "Customer ko credits kaise du?",
    "Attendance check-in kaise karu?",
  ];

  return (
    <AdminShell
      breadcrumbs={[{ label: "Help" }]}
      title="Help & Rules"
      subtitle="Apne role ke rules + AI se kuch bhi pucho"
      email={email}
    >
      <div className="space-y-4">
        {/* My role rules */}
        <section className={`${adminCardCls} p-4`}>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <BookOpen className="h-3.5 w-3.5" />{myRules.title}
          </p>
          <ul className="mt-3 space-y-1.5">
            {myRules.rules.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 font-bold text-indigo-500">{i + 1}.</span>
                <span className="text-slate-700 dark:text-slate-300">{r}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* AI Help */}
        <section className={`${adminCardCls} p-4`}>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />AI Help — kuch samajh nahi aaya?
          </p>
          <div className="mt-2 flex gap-2">
            <input className={`${adminInputCls} flex-1`} placeholder="e.g. Hot lead kaise mark karu?" value={q}
              onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} />
            <button type="button" onClick={() => ask()} disabled={busy || q.trim().length < 2}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50">
              <Sparkles className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} />{busy ? "…" : "Ask"}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK.map((qq) => (
              <button key={qq} type="button" onClick={() => ask(qq)} disabled={busy}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-indigo-400 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300">
                {qq}
              </button>
            ))}
          </div>

          {ans.length > 0 && (
            <div className="mt-4 space-y-3">
              {ans.map((t, i) => (
                <div key={i} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                  <p className={`text-[11px] font-bold ${adminMutedCls}`}>❓ {t.q}</p>
                  <div className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">{t.a}</div>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(t.a); setCopied(i); setTimeout(() => setCopied(null), 1500); }}
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-300">
                    {copied === i ? <><Check className="h-3 w-3" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
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
