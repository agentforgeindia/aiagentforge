"use client";

// /careers — public careers landing. List open roles, apply CTA.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Role = { id: string; title: string; slug: string; description: string | null; is_open: boolean };

const ROLE_EMOJI: Record<string, string> = {
  telecaller: "📞", "sales-executive": "💼", "support-executive": "🎧",
  "marketing-executive": "📢", "content-creator": "🎬", "ai-operator": "🤖",
  designer: "🎨", developer: "💻",
};

export default function CareersPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("recruitment_roles").select("*").eq("is_open", true).order("title");
      setRoles((data as Role[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-[#0b0d12] dark:to-[#0e1117]">
      <div className="mx-auto max-w-4xl px-5 py-14">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            We're Hiring
          </span>
          <h1 className="mt-4 text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
            Join AgentForge
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            No resume needed. Apply, learn, take a quick test, and get hired on
            merit. We care about your skills — not your CV.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: "📝", label: "Apply" },
            { icon: "🎓", label: "Learn" },
            { icon: "🧠", label: "Take Test" },
            { icon: "🎉", label: "Get Hired" },
          ].map((s, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-[#11141a]">
              <div className="text-2xl">{s.icon}</div>
              <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-300">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Roles */}
        <h2 className="mt-12 text-lg font-bold text-slate-900 dark:text-white">Open Positions</h2>
        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Loading…</p>
        ) : roles.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No open positions right now. Check back soon!</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {roles.map((r) => (
              <Link key={r.id} href={`/careers/apply?role=${r.slug}`}
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-[#11141a] dark:hover:border-indigo-500">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ROLE_EMOJI[r.slug] ?? "🔹"}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{r.title}</p>
                    <p className="text-[11px] text-slate-500">Apply &amp; take assessment</p>
                  </div>
                </div>
                <span className="text-indigo-600 transition group-hover:translate-x-1 dark:text-indigo-300">→</span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/careers/apply" className="inline-flex rounded-lg bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500">
            Apply Now →
          </Link>
        </div>
      </div>
    </main>
  );
}
