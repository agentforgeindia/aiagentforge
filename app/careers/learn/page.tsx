"use client";

// /careers/learn — Academy. Candidate learns BEFORE applying.
// Role-wise + common training modules, then "I'm Ready → Apply".

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookOpen, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Module = { id: string; role_slug: string | null; module_order: number; title: string; content: string };

const ROLE_LABEL: Record<string, string> = {
  telecaller: "Telecaller", "sales-executive": "Sales Executive",
  "support-executive": "Support Executive", "marketing-executive": "Marketing Executive",
  "content-creator": "Content Creator", "ai-operator": "AI Operator",
  designer: "Designer", developer: "Developer",
};

function LearnInner() {
  const params = useSearchParams();
  const role = params.get("role") ?? "telecaller";

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState<string | null>(null);
  const [read, setRead]       = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("recruitment_training")
        .select("*")
        .or(`role_slug.eq.${role},role_slug.is.null`)
        .order("role_slug", { ascending: true })
        .order("module_order", { ascending: true });
      const list = (data as Module[]) ?? [];
      // common first, then role-specific
      list.sort((a, b) => {
        if ((a.role_slug === null) !== (b.role_slug === null)) return a.role_slug === null ? -1 : 1;
        return a.module_order - b.module_order;
      });
      setModules(list);
      if (list.length) setOpen(list[0].id);
      setLoading(false);
    })();
  }, [role]);

  function toggle(id: string) {
    setOpen((o) => (o === id ? null : id));
    setRead((r) => new Set(r).add(id));
  }

  const allRead = modules.length > 0 && read.size >= modules.length;

  return (
    <main className="relative min-h-screen bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee44,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf633,transparent_35%)]" />

      <div className="relative z-10 mx-auto max-w-2xl px-5 py-14">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">Academy · Learn First</p>
        <h1 className="mt-2 text-3xl font-black">
          {ROLE_LABEL[role] ?? "Role"}{" "}
          <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">Training</span>
        </h1>
        <p className="mt-1 text-sm font-medium text-black/55 dark:text-white/55">
          Apply karne se pehle ye short modules padho. Phir aapka skill test aasaan lagega.
        </p>

        {/* Progress */}
        {modules.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-[11px] font-bold text-black/50 dark:text-white/50">
              <span>{read.size}/{modules.length} modules read</span>
              <span>{Math.round((read.size / modules.length) * 100)}%</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all" style={{ width: `${(read.size / modules.length) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Modules */}
        {loading ? (
          <p className="mt-8 text-center text-sm text-black/50 dark:text-white/50">Loading…</p>
        ) : modules.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-cyan-200/40 bg-white/80 p-8 text-center dark:border-cyan-400/20 dark:bg-white/[0.05]">
            <BookOpen className="mx-auto h-8 w-8 text-cyan-400" />
            <p className="mt-2 text-sm font-medium text-black/60 dark:text-white/60">No training yet for this role — aap directly apply kar sakte ho.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-2">
            {modules.map((m, i) => {
              const isOpen = open === m.id;
              const isRead = read.has(m.id);
              return (
                <div key={m.id} className="overflow-hidden rounded-2xl border border-cyan-200/40 bg-white/85 backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.05]">
                  <button type="button" onClick={() => toggle(m.id)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${isRead ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white" : "bg-gradient-to-br from-cyan-400 to-blue-600 text-white"}`}>
                        {isRead ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </span>
                      <span className="text-sm font-black">{m.title}</span>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-black/40 dark:text-white/40" /> : <ChevronDown className="h-4 w-4 text-black/40 dark:text-white/40" />}
                  </button>
                  {isOpen && (
                    <div className="border-t border-cyan-200/30 px-4 pb-4 dark:border-white/10">
                      <div className="prose-sm mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-black/75 dark:text-white/75">
                        {m.content}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Apply CTA */}
        <div className="mt-10 text-center">
          <Link href={`/careers/apply?role=${role}`}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-9 py-4 text-sm font-black text-white shadow-xl transition hover:scale-105 active:scale-95 sm:text-base ${allRead ? "bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-emerald-500/30" : "bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/30"}`}>
            {allRead ? "✅ I'm Ready — Apply Now →" : "Skip & Apply →"}
          </Link>
          {!allRead && modules.length > 0 && (
            <p className="mt-3 text-[11px] font-bold text-black/40 dark:text-white/40">Tip: saare modules padhne se test aasaan lagega.</p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">Loading…</div>}>
      <LearnInner />
    </Suspense>
  );
}
