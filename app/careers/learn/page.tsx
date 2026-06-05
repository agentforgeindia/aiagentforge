"use client";

// /careers/learn — "Learn & Earn" Academy.
// Candidate: (1) Know the company  (2) Role training  (3) Apply & Test.

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpen, CheckCircle2, ChevronDown, ChevronUp,
  Building2, Users, LifeBuoy, Sparkles, ArrowUpRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Module = { id: string; role_slug: string | null; module_order: number; title: string; content: string };

const ROLE_LABEL: Record<string, string> = {
  telecaller: "Telecaller", "sales-executive": "Sales Executive",
  "support-executive": "Support Executive", "marketing-executive": "Marketing Executive",
  "content-creator": "Content Creator", "ai-operator": "AI Operator",
  designer: "Designer", developer: "Developer", "hr-executive": "HR Executive",
};

// Company pages every candidate should read first.
const COMPANY_READS = [
  { href: "/about",    title: "About AgentForge", desc: "Company, mission aur hum kya banate hain", Icon: Building2 },
  { href: "/about",    title: "Meet the Founder",  desc: "Founder aur team ki kahani",               Icon: Users },
  { href: "/support",  title: "Support & Help",    desc: "Hum customers ki kaise help karte hain",   Icon: LifeBuoy },
];

function LearnInner() {
  const params = useSearchParams();
  const role = params.get("role") ?? "telecaller";

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState<string | null>(null);
  const [read, setRead]       = useState<Set<string>>(new Set());
  const [companyRead, setCompanyRead] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("recruitment_training")
        .select("*")
        .or(`role_slug.eq.${role},role_slug.is.null`);
      const list = (data as Module[]) ?? [];
      list.sort((a, b) => {
        if ((a.role_slug === null) !== (b.role_slug === null)) return a.role_slug === null ? -1 : 1;
        return a.module_order - b.module_order;
      });
      setModules(list);
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
        {/* Hero */}
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-white/80 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-700 shadow-md shadow-cyan-300/30 backdrop-blur dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200">
          🎓 Learn &amp; Earn
        </span>
        <h1 className="mt-4 text-3xl font-black sm:text-4xl">
          Learn first,{" "}
          <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">then earn</span>
        </h1>
        <p className="mt-2 text-sm font-medium text-black/55 dark:text-white/55">
          {ROLE_LABEL[role] ?? "Role"} ke liye apply karne se pehle company ko jaano aur
          training modules padho. Tayyari acchi hogi to test aur job dono aasaan.
        </p>

        {/* ── Step 1: Know the company ── */}
        <div className="mt-10">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">Step 1 · Know AgentForge</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {COMPANY_READS.map((c) => (
              <a key={c.title} href={c.href} target="_blank" rel="noopener noreferrer"
                onClick={() => setCompanyRead((r) => new Set(r).add(c.title))}
                className="group rounded-2xl border border-cyan-200/40 bg-white/85 p-4 shadow-md shadow-cyan-200/10 backdrop-blur transition hover:scale-[1.02] hover:border-cyan-400 dark:border-cyan-400/20 dark:bg-white/[0.05]">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow">
                    <c.Icon className="h-5 w-5" />
                  </span>
                  {companyRead.has(c.title)
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    : <ArrowUpRight className="h-4 w-4 text-black/30 transition group-hover:text-cyan-500 dark:text-white/30" />}
                </div>
                <p className="mt-2 text-xs font-black">{c.title}</p>
                <p className="mt-0.5 text-[11px] font-medium text-black/45 dark:text-white/45">{c.desc}</p>
              </a>
            ))}
          </div>
        </div>

        {/* ── Step 2: Role training ── */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">Step 2 · Role Training</p>
            {modules.length > 0 && (
              <span className="text-[11px] font-bold text-black/50 dark:text-white/50">{read.size}/{modules.length} read</span>
            )}
          </div>

          {modules.length > 0 && (
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all" style={{ width: `${(read.size / Math.max(modules.length,1)) * 100}%` }} />
            </div>
          )}

          {loading ? (
            <p className="mt-6 text-center text-sm text-black/50 dark:text-white/50">Loading…</p>
          ) : modules.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-cyan-200/40 bg-white/80 p-6 text-center dark:border-cyan-400/20 dark:bg-white/[0.05]">
              <BookOpen className="mx-auto h-7 w-7 text-cyan-400" />
              <p className="mt-2 text-sm font-medium text-black/60 dark:text-white/60">Is role ke liye training abhi nahi — directly apply kar sakte ho.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {modules.map((m, i) => {
                const isOpen = open === m.id;
                const isRead = read.has(m.id);
                return (
                  <div key={m.id} className="overflow-hidden rounded-2xl border border-cyan-200/40 bg-white/85 backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.05]">
                    <button type="button" onClick={() => toggle(m.id)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${isRead ? "bg-gradient-to-br from-emerald-400 to-emerald-600" : "bg-gradient-to-br from-cyan-400 to-blue-600"}`}>
                          {isRead ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                        </span>
                        <span className="text-sm font-black">{m.title}</span>
                      </div>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-black/40 dark:text-white/40" /> : <ChevronDown className="h-4 w-4 text-black/40 dark:text-white/40" />}
                    </button>
                    {isOpen && (
                      <div className="border-t border-cyan-200/30 px-4 pb-4 dark:border-white/10">
                        <div className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-black/75 dark:text-white/75">{m.content}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Step 3: Apply & Test ── */}
        <div className="mt-12 rounded-3xl border border-cyan-200/40 bg-gradient-to-br from-white/90 to-cyan-50/60 p-6 text-center shadow-xl shadow-cyan-200/20 backdrop-blur dark:border-cyan-400/20 dark:from-white/[0.06] dark:to-white/[0.02]">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">Step 3 · Apply &amp; Test</p>
          <h2 className="mt-2 text-xl font-black sm:text-2xl">Ready to start your career?</h2>
          <p className="mt-1 text-sm font-medium text-black/55 dark:text-white/55">Short application + skill test. Pass = our team contacts you.</p>
          <Link href={`/careers/apply?role=${role}`}
            className={`mt-5 inline-flex items-center justify-center gap-2 rounded-full px-9 py-4 text-sm font-black text-white shadow-xl transition hover:scale-105 active:scale-95 sm:text-base ${allRead ? "bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-emerald-500/30" : "bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/30"}`}>
            <Sparkles className="h-4 w-4" />
            {allRead ? "I'm Ready — Apply & Take Test →" : "Apply & Take Test →"}
          </Link>
          {!allRead && modules.length > 0 && (
            <p className="mt-3 text-[11px] font-bold text-black/40 dark:text-white/40">Tip: training padhne se test aasaan lagega.</p>
          )}
        </div>

        {/* After you join — full KB access */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200/50 bg-emerald-50/60 p-4 dark:border-emerald-400/20 dark:bg-emerald-500/5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
            <BookOpen className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-black text-emerald-800 dark:text-emerald-300">Aage kya milega?</p>
            <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-emerald-700/90 dark:text-emerald-400/80">
              Ye sirf shuruaat hai. Apply karke select hone ke baad, aapko AgentForge ki poori
              internal <b>Knowledge Base</b> ka access milega — detailed scripts, WhatsApp/email
              templates, objection handling, SOPs aur <b>AI Caller GPT</b> jo live call par instant
              jawab deta hai. Naya member bhi 1 din mein productive ho jaata hai.
            </p>
          </div>
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
