"use client";

// /careers/learn — Step 2: Training + Website Tour + FAQ
// Requires cid (candidateId) from query params to unlock the Test button.
// Test button is DISABLED until all modules + all tour pages are visited.

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen, CheckCircle2, ChevronDown, ChevronUp,
  Building2, Users, LifeBuoy, Sparkles, ArrowUpRight, Globe, HelpCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Module = { id: string; role_slug: string | null; module_order: number; title: string; content: string };

const ROLE_LABEL: Record<string, string> = {
  telecaller:           "Telecaller",
  "support-executive":  "Support Executive",
  "marketing-executive":"Marketing Executive",
  "content-creator":    "Content Creator",
  "hr-executive":       "HR Executive",
  "office-executive":   "Office Executive",
};

// Company pages — every candidate must read these
const COMPANY_READS = [
  { key: "about",   href: "/about",   title: "About AgentForge", desc: "Company, mission aur hum kya banate hain",  Icon: Building2 },
  { key: "founder", href: "/about",   title: "Meet the Team",    desc: "Founder aur team ki kahani",                Icon: Users },
  { key: "support", href: "/support", title: "Support & Help",   desc: "Hum customers ki kaise help karte hain",    Icon: LifeBuoy },
];

// Website Tour — candidate must visit these pages
const TOUR_PAGES = [
  { key: "home",    href: "/",         title: "Home Page",       desc: "AgentForge ka homepage dekho" },
  { key: "agents",  href: "/agents",   title: "Our AI Agents",   desc: "Hamare AI products samjho" },
  { key: "academy", href: "/academy",  title: "Academy",         desc: "Learning platform dekho" },
  { key: "pricing", href: "/pricing",  title: "Pricing",         desc: "Plans aur pricing samjho" },
  { key: "blog",    href: "/blog",     title: "Blog",            desc: "Company ke updates padho" },
];

const FAQ: { q: string; a: string }[] = [
  { q: "Kya experience chahiye?", a: "Nahi, koi bhi apply kar sakta hai. Training hum dete hain." },
  { q: "Salary kab milegi?", a: "Monthly salary bank transfer se milegi. Incentive performance ke hisaab se milta hai." },
  { q: "Kaam ke hours kya hain?", a: "8 ghante daily, timing flexible hai. Overtime karo to extra incentive milta hai." },
  { q: "Security deposit kyun?", a: "Select hone ke baad sirf ₹500 security deposit hoga — refundable. Ye serious candidates ke liye hai." },
  { q: "Test mein fail ho gaye to?", a: "3 attempts milte hain. Thoda study karo, ek baar aur try karo." },
  { q: "WFH mein kya equipment chahiye?", a: "Ek smartphone ya laptop aur accha internet connection — bas itna hi." },
  { q: "HR ke baad ka process kya hai?", a: "HR call ke baad, agree karne pe salary confirm hogi. ₹500 security deposit ke baad login credentials milega aur training start hogi." },
  { q: "Content Creator ke liye kya hoga?", a: "Social media profile AI se analyse hogi. Good reach hai to referral link milega — har purchase pe 10% commission." },
];

function LearnInner() {
  const params = useSearchParams();
  const role   = params.get("role") ?? "telecaller";
  const cid    = params.get("cid") ?? "";

  const [modules, setModules]     = useState<Module[]>([]);
  const [loading, setLoading]     = useState(true);
  const [open, setOpen]           = useState<string | null>(null);
  const [openFaq, setOpenFaq]     = useState<number | null>(null);
  const [readMods, setReadMods]   = useState<Set<string>>(new Set());
  const [readComp, setReadComp]   = useState<Set<string>>(new Set());
  const [readTour, setReadTour]   = useState<Set<string>>(new Set());

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

  // Update stage to training_started when page opens (if cid provided)
  useEffect(() => {
    if (!cid) return;
    fetch("/api/careers/training-start", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_id: cid }),
    }).catch(() => {});
  }, [cid]);

  function toggleMod(id: string) {
    setOpen((o) => (o === id ? null : id));
    setReadMods((r) => new Set(r).add(id));
  }

  // All required content consumed?
  const allModsRead  = modules.length === 0 || readMods.size >= modules.length;
  const allCompRead  = readComp.size >= COMPANY_READS.length;
  const allTourDone  = readTour.size >= TOUR_PAGES.length;
  const allDone      = allModsRead && allCompRead && allTourDone;

  const totalItems   = COMPANY_READS.length + modules.length + TOUR_PAGES.length;
  const doneItems    = readComp.size + readMods.size + readTour.size;
  const progressPct  = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <main className="relative min-h-screen bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee44,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf633,transparent_35%)]" />

      <div className="relative z-10 mx-auto max-w-2xl px-5 py-14">
        {/* Step indicator */}
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-black text-white">2</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-black/30 dark:text-white/30">{progressPct}% done</span>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-white/80 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-700 shadow-md shadow-cyan-300/30 backdrop-blur dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200">
          📚 Training Module
        </span>
        <h1 className="mt-4 text-3xl font-black sm:text-4xl">
          Learn first,{" "}
          <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">then test</span>
        </h1>
        <p className="mt-2 text-sm font-medium text-black/55 dark:text-white/55">
          <b>{ROLE_LABEL[role] ?? role}</b> ke liye — sabse pahle company ko jaano, fir role training lo, website ka tour karo, aur tab test do.
          Sab kuch padh loge to test aasaan lagega.
        </p>

        {/* ── SECTION 1: Know the Company ── */}
        <SectionHeader step={1} title="Know AgentForge" done={allCompRead} />
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {COMPANY_READS.map((c) => {
            const isDone = readComp.has(c.key);
            return (
              <a key={c.key} href={c.href} target="_blank" rel="noopener noreferrer"
                onClick={() => setReadComp((r) => new Set(r).add(c.key))}
                className="group rounded-2xl border border-cyan-200/40 bg-white/85 p-4 shadow-md shadow-cyan-200/10 backdrop-blur transition hover:scale-[1.02] hover:border-cyan-400 dark:border-cyan-400/20 dark:bg-white/[0.05]">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow">
                    <c.Icon className="h-5 w-5" />
                  </span>
                  {isDone
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    : <ArrowUpRight className="h-4 w-4 text-black/30 transition group-hover:text-cyan-500 dark:text-white/30" />}
                </div>
                <p className="mt-2 text-xs font-black">{c.title}</p>
                <p className="mt-0.5 text-[11px] font-medium text-black/45 dark:text-white/45">{c.desc}</p>
              </a>
            );
          })}
        </div>
        {!allCompRead && (
          <p className="mt-2 text-[11px] font-bold text-amber-600 dark:text-amber-400">⚠️ Teeno links kholne ke baad hi aage badho.</p>
        )}

        {/* ── SECTION 2: Role Training ── */}
        <SectionHeader step={2} title="Role Training" done={allModsRead} extraLabel={`${readMods.size}/${modules.length} read`} />
        {modules.length > 0 && (
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all" style={{ width: `${(readMods.size / Math.max(modules.length,1)) * 100}%` }} />
          </div>
        )}
        {loading ? (
          <p className="mt-6 text-center text-sm text-black/50 dark:text-white/50">Loading…</p>
        ) : modules.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-cyan-200/40 bg-white/80 p-6 text-center dark:border-cyan-400/20 dark:bg-white/[0.05]">
            <BookOpen className="mx-auto h-7 w-7 text-cyan-400" />
            <p className="mt-2 text-sm font-medium text-black/60 dark:text-white/60">Is role ke liye training material jald aa raha hai. Website tour aur test dono complete karo.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {modules.map((m, i) => {
              const isOpen = open === m.id;
              const isRead = readMods.has(m.id);
              return (
                <div key={m.id} className="overflow-hidden rounded-2xl border border-cyan-200/40 bg-white/85 backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.05]">
                  <button type="button" onClick={() => toggleMod(m.id)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
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

        {/* ── SECTION 3: Website Tour ── */}
        <SectionHeader step={3} title="Website Tour" done={allTourDone} />
        <p className="mt-1 text-[11px] font-medium text-black/50 dark:text-white/50">
          Haari website ko samjho — test mein website-related questions bhi aate hain.
        </p>
        <div className="mt-3 space-y-2">
          {TOUR_PAGES.map((p) => {
            const visited = readTour.has(p.key);
            return (
              <a key={p.key} href={p.href} target="_blank" rel="noopener noreferrer"
                onClick={() => setReadTour((r) => new Set(r).add(p.key))}
                className="group flex items-center gap-3 rounded-xl border border-cyan-200/40 bg-white/85 px-4 py-3 shadow-sm backdrop-blur transition hover:border-cyan-400 dark:border-cyan-400/20 dark:bg-white/[0.05]">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-xs ${visited ? "bg-emerald-500" : "bg-gradient-to-br from-cyan-400 to-blue-600"}`}>
                  {visited ? <CheckCircle2 className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-black">{p.title}</p>
                  <p className="text-[11px] font-medium text-black/45 dark:text-white/45">{p.desc}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-black/30 transition group-hover:text-cyan-500 dark:text-white/30" />
              </a>
            );
          })}
        </div>
        {!allTourDone && (
          <p className="mt-2 text-[11px] font-bold text-amber-600 dark:text-amber-400">⚠️ Saare pages visit karne ke baad test button unlock hoga.</p>
        )}

        {/* ── SECTION 4: FAQ ── */}
        <div className="mt-12">
          <SectionHeader step={4} title="FAQ — Frequently Asked Questions" done />
          <div className="mt-3 space-y-2">
            {FAQ.map((faq, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-cyan-200/40 bg-white/85 backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.05]">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 shrink-0 text-cyan-500" />
                    <span className="text-sm font-black">{faq.q}</span>
                  </div>
                  {openFaq === i ? <ChevronUp className="h-4 w-4 text-black/40 dark:text-white/40" /> : <ChevronDown className="h-4 w-4 text-black/40 dark:text-white/40" />}
                </button>
                {openFaq === i && (
                  <div className="border-t border-cyan-200/30 px-4 pb-4 dark:border-white/10">
                    <p className="mt-3 text-sm font-medium leading-relaxed text-black/70 dark:text-white/70">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA: Start Test ── */}
        <div className="mt-12 rounded-3xl border border-cyan-200/40 bg-gradient-to-br from-white/90 to-cyan-50/60 p-6 text-center shadow-xl shadow-cyan-200/20 backdrop-blur dark:border-cyan-400/20 dark:from-white/[0.06] dark:to-white/[0.02]">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">Step 3 · Assessment</p>
          <h2 className="mt-2 text-xl font-black sm:text-2xl">
            {allDone ? "🎉 Sab padh liya! Test ke liye tayyar ho?" : "Pehle training poori karo"}
          </h2>
          <p className="mt-1 text-sm font-medium text-black/55 dark:text-white/55">
            {allDone
              ? "Ab ek short skill test do. Paas karo to hamari team contact karegi."
              : `Abhi baki hai: ${!allCompRead ? "Company pages" : ""} ${!allModsRead && modules.length > 0 ? "Training modules" : ""} ${!allTourDone ? "Website tour" : ""}`.trim().replace(/\s+/g, ", ")}
          </p>

          {cid ? (
            allDone ? (
              <a href={`/careers/test/${cid}`}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 px-9 py-4 text-sm font-black text-white shadow-xl shadow-emerald-500/30 transition hover:scale-105 active:scale-95 sm:text-base">
                <Sparkles className="h-4 w-4" />
                Start Assessment →
              </a>
            ) : (
              <button disabled
                className="mt-5 inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-full bg-gradient-to-r from-slate-300 to-slate-400 px-9 py-4 text-sm font-black text-white opacity-60 sm:text-base">
                🔒 Complete Training First
              </button>
            )
          ) : (
            <a href={`/careers/apply?role=${role}`}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-9 py-4 text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-105 active:scale-95 sm:text-base">
              Apply First to Unlock Test →
            </a>
          )}

          {!allDone && cid && (
            <p className="mt-3 text-[11px] font-bold text-black/40 dark:text-white/40">
              Progress: {progressPct}% complete
            </p>
          )}
        </div>

        {/* After joining note */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200/50 bg-emerald-50/60 p-4 dark:border-emerald-400/20 dark:bg-emerald-500/5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
            <BookOpen className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-black text-emerald-800 dark:text-emerald-300">Join karne ke baad kya milega?</p>
            <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-emerald-700/90 dark:text-emerald-400/80">
              Select hone ke baad, AgentForge ki poori internal <b>Knowledge Base</b> ka access milega —
              detailed scripts, WhatsApp templates, objection handling, SOPs aur <b>AI Caller GPT</b>.
              Support team Zoom/WhatsApp pe live training degi. Naya member bhi 1 din mein productive ho jaata hai.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function SectionHeader({ step, title, done, extraLabel }: { step: number; title: string; done: boolean; extraLabel?: string }) {
  return (
    <div className="mt-10 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white ${done ? "bg-emerald-500" : "bg-gradient-to-br from-cyan-400 to-blue-600"}`}>
          {done ? <CheckCircle2 className="h-4 w-4" /> : step}
        </span>
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">{title}</p>
      </div>
      {extraLabel && <span className="text-[11px] font-bold text-black/50 dark:text-white/50">{extraLabel}</span>}
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">Loading…</div>}>
      <LearnInner />
    </Suspense>
  );
}
