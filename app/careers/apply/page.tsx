"use client";

// /careers/apply — candidate application form.

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const ROLES = [
  { slug: "telecaller", label: "Telecaller" },
  { slug: "sales-executive", label: "Sales Executive" },
  { slug: "support-executive", label: "Support Executive" },
  { slug: "marketing-executive", label: "Marketing Executive" },
  { slug: "content-creator", label: "Content Creator" },
  { slug: "ai-operator", label: "AI Operator" },
  { slug: "designer", label: "Designer" },
  { slug: "developer", label: "Developer" },
];

function ApplyForm() {
  const params = useSearchParams();
  const router = useRouter();
  const preRole = params.get("role") ?? "";

  const [f, setF] = useState({
    name: "", mobile: "", email: "", city: "", state: "",
    linkedin: "", portfolio: "", role_slug: preRole || "telecaller",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function up(k: string, v: string) { setF((p) => ({ ...p, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name || f.mobile.length < 8) { setError("Name and valid mobile required."); return; }
    setLoading(true); setError(null);
    const res = await fetch("/api/careers/apply", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) { setError(json.error ?? "Something went wrong."); return; }
    if (json.locked) { setError("You've used all 3 attempts for this assessment."); return; }
    router.push(`/careers/test/${json.candidate_id}`);
  }

  const input = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-[#0b0d12] dark:to-[#0e1117]">
      <div className="mx-auto max-w-lg px-5 py-12">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Apply to AgentForge</h1>
        <p className="mt-1 text-sm text-slate-500">Fill this in 1 minute. Then a short skill test.</p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={input} placeholder="Full Name *" value={f.name} onChange={(e) => up("name", e.target.value)} required />
            <input className={input} placeholder="Mobile Number *" value={f.mobile} onChange={(e) => up("mobile", e.target.value)} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={input} placeholder="Email" type="email" value={f.email} onChange={(e) => up("email", e.target.value)} />
            <select className={input} value={f.role_slug} onChange={(e) => up("role_slug", e.target.value)}>
              {ROLES.map((r) => <option key={r.slug} value={r.slug}>{r.label}</option>)}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={input} placeholder="City" value={f.city} onChange={(e) => up("city", e.target.value)} />
            <input className={input} placeholder="State" value={f.state} onChange={(e) => up("state", e.target.value)} />
          </div>
          <input className={input} placeholder="LinkedIn (optional)" value={f.linkedin} onChange={(e) => up("linkedin", e.target.value)} />
          <input className={input} placeholder="Portfolio link (optional)" value={f.portfolio} onChange={(e) => up("portfolio", e.target.value)} />

          {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

          <button type="submit" disabled={loading} className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 disabled:opacity-50">
            {loading ? "Submitting…" : "Continue to Assessment →"}
          </button>
          <p className="text-center text-[11px] text-slate-400">
            ⏱️ The test has a timer and anti-cheat. Max 3 attempts. Find a quiet place.
          </p>
        </form>
      </div>
    </main>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">Loading…</div>}>
      <ApplyForm />
    </Suspense>
  );
}
