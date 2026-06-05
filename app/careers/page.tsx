"use client";

// /careers — public careers landing (website theme: cyan/blue/purple).

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
    <main className="relative min-h-screen bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      {/* Decorative glows */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee44,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf633,transparent_35%)]" />

      <div className="relative z-10 mx-auto max-w-4xl px-5 py-16">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-white/80 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-700 shadow-md shadow-cyan-300/30 backdrop-blur dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200 sm:text-[11px]">
            🚀 We're Hiring
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
            Build the future of{" "}
            <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              AI at AgentForge
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-black/60 dark:text-white/60 sm:text-base">
            No resume needed. Apply, learn, take a quick skill test, and get
            hired on merit. Hum aapki skills dekhte hain — CV nahi.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: "📝", label: "Apply" },
            { icon: "🎓", label: "Learn" },
            { icon: "🧠", label: "Take Test" },
            { icon: "🎉", label: "Get Hired" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-cyan-200/40 bg-white/80 p-5 text-center shadow-md shadow-cyan-200/20 backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.05]">
              <div className="text-3xl">{s.icon}</div>
              <p className="mt-2 text-xs font-black uppercase tracking-wider text-black/70 dark:text-white/70">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Roles */}
        <div className="mt-16 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">Open Positions</p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Find your role</h2>
        </div>

        {loading ? (
          <p className="mt-6 text-center text-sm text-black/50 dark:text-white/50">Loading…</p>
        ) : roles.length === 0 ? (
          <p className="mt-6 text-center text-sm text-black/50 dark:text-white/50">No open positions right now. Check back soon!</p>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {roles.map((r) => (
              <Link key={r.id} href={`/careers/apply?role=${r.slug}`}
                className="group flex items-center justify-between rounded-2xl border border-cyan-200/40 bg-white/80 p-5 shadow-md shadow-cyan-200/10 backdrop-blur transition hover:scale-[1.02] hover:border-cyan-400 hover:shadow-cyan-300/30 dark:border-cyan-400/20 dark:bg-white/[0.05] dark:hover:border-cyan-400">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-2xl shadow-md">{ROLE_EMOJI[r.slug] ?? "🔹"}</span>
                  <div>
                    <p className="text-sm font-black">{r.title}</p>
                    <p className="text-[11px] font-bold text-black/50 dark:text-white/50">Apply &amp; take assessment</p>
                  </div>
                </div>
                <span className="text-xl font-black text-cyan-600 transition group-hover:translate-x-1 dark:text-cyan-300">→</span>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 text-center">
          <Link href="/careers/apply"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-9 py-4 text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-105 active:scale-95 sm:text-base">
            Apply Now →
          </Link>
          <p className="mt-3 text-[11px] font-bold text-black/40 dark:text-white/40">
            ⏱️ Quick skill test · 🏠 Work-from-home roles available · 💯 Merit-based
          </p>
        </div>
      </div>
    </main>
  );
}
