"use client";

// /careers/apply — candidate application form (website theme).

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

  const input = "w-full rounded-xl border border-cyan-200/50 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 dark:border-white/10 dark:bg-white/5 dark:text-white";

  return (
    <main className="relative min-h-screen bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee44,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf633,transparent_35%)]" />

      <div className="relative z-10 mx-auto max-w-lg px-5 py-14">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">Apply</p>
        <h1 className="mt-2 text-3xl font-black">
          Join{" "}
          <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">AgentForge</span>
        </h1>
        <p className="mt-1 text-sm font-medium text-black/55 dark:text-white/55">Fill this in 1 minute. Then a short skill test.</p>

        <form onSubmit={submit} className="mt-7 space-y-3">
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

          {error && <p className="text-sm font-bold text-rose-600">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 py-3.5 text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50">
            {loading ? "Submitting…" : "Continue to Assessment →"}
          </button>
          <p className="text-center text-[11px] font-bold text-black/40 dark:text-white/40">
            ⏱️ Test has a timer and anti-cheat. Max 3 attempts. Find a quiet place.
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
