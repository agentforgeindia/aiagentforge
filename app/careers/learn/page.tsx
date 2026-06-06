"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen, CheckCircle2, ChevronDown, ChevronUp,
  Building2, Users, LifeBuoy, Sparkles, ArrowUpRight, Globe, HelpCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Module = { id: string; role_slug: string | null; module_order: number; title: string; content: string };

const ROLE_LABEL: Record<string, string> = {
  telecaller:            "Telecaller",
  "support-executive":   "Support Executive",
  "marketing-executive": "Marketing Executive",
  "content-creator":     "Content Creator",
  "hr-executive":        "HR Executive",
  "office-executive":    "Office Executive",
};

const COMPANY_READS = [
  { key: "about",   href: "/about",   title: "About AgentForge", desc: "Our company, mission and what we build", Icon: Building2 },
  { key: "founder", href: "/about",   title: "Meet the Team",    desc: "Founders and team story",               Icon: Users },
  { key: "support", href: "/support", title: "Support & Help",   desc: "How we help our customers",             Icon: LifeBuoy },
];

const TOUR_PAGES = [
  { key: "home",      href: "/",           title: "Home Page",      desc: "Explore the AgentForge homepage" },
  { key: "agents",    href: "/agents",     title: "Our AI Agents",  desc: "Understand our AI products" },
  { key: "pricing",   href: "/pricing",    title: "Pricing",        desc: "Plans and pricing details" },
  { key: "tutorials", href: "/tutorials",  title: "Tutorials",      desc: "Step-by-step guides and walkthroughs" },
  { key: "blog",      href: "/blog",       title: "Blog",           desc: "Company updates and articles" },
];

const FAQ: { q: string; a: string }[] = [
  { q: "Is any prior experience required?",           a: "No, anyone can apply. We provide all training after you join." },
  { q: "When will salary be paid?",                   a: "Monthly salary via bank transfer. Incentives are performance-based." },
  { q: "What are the working hours?",                 a: "8 hours daily with flexible timing. Overtime earns extra incentive." },
  { q: "Why is a security deposit required?",         a: "A refundable ₹500 deposit is collected after selection — it filters serious candidates." },
  { q: "What if I fail the test?",                    a: "You get 3 attempts total. Review the training material and try again." },
  { q: "What equipment is needed for WFH?",          a: "A smartphone or laptop with a stable internet connection — that is all." },
  { q: "What happens after the HR call?",             a: "Once you agree, your salary is confirmed. After the ₹500 deposit, login credentials and full training access are provided." },
  { q: "How does Content Creator work?",              a: "Your social media profile is scored by AI. Good reach earns you a referral link with 10% commission on every purchase." },
  { q: "What is AgentForge Academy?",                 a: "AgentForge Academy is our internal learning platform. Once you join, you get access to role-specific training modules, scripts, SOPs, WhatsApp templates, and AI tools — everything you need to perform from day one." },
  { q: "How does the Referral Rewards programme work?", a: "Every team member gets a personal referral link. When someone signs up or purchases through your link, you earn a commission. Referral earnings are tracked in real time on your dashboard and cleared every 48 hours." },
  { q: "Can I earn from referrals without being hired?", a: "Content Creators with strong social media reach may receive a referral partnership offer even before joining as an employee. AI scores your profile and, if eligible, you get a referral link with 10% commission per sale." },
];

// Inject a reminder popup into each tour page tab
function openTourTab(href: string) {
  const msg = encodeURIComponent(
    "📚 After reading this page, please go back to your Learning screen and continue.\nYou can close this window when done."
  );
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=${href}">
  <title>Loading…</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #fff8e8; display: flex; align-items: flex-start; justify-content: center; padding-top: 0; }
    .banner { position: fixed; top: 0; left: 0; right: 0; z-index: 99999; background: linear-gradient(135deg, #06b6d4, #3b82f6);
      color: #fff; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px;
      font-size: 13px; font-weight: 700; box-shadow: 0 2px 16px rgba(0,0,0,.18); }
    .banner button { background: rgba(255,255,255,.2); border: none; color: #fff; border-radius: 999px;
      padding: 4px 14px; font-size: 12px; font-weight: 900; cursor: pointer; }
    .banner button:hover { background: rgba(255,255,255,.35); }
  </style>
</head>
<body>
  <div class="banner">
    <span>📚 After reading this page, go back to your <b>Learning screen</b> and continue your training. You can close this window when done.</span>
    <button onclick="window.close()">Close</button>
  </div>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    // redirect after a short delay so banner renders first
    setTimeout(() => { try { w.location.href = href; } catch (_) {} }, 300);
  }
}

function LearnInner() {
  const params = useSearchParams();
  const role   = params.get("role") ?? "telecaller";
  const cid    = params.get("cid") ?? "";

  const [modules, setModules]   = useState<Module[]>([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState<string | null>(null);
  const [openFaq, setOpenFaq]   = useState<number | null>(null);
  const [readMods, setReadMods] = useState<Set<string>>(new Set());
  const [readComp, setReadComp] = useState<Set<string>>(new Set());
  const [readTour, setReadTour] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("recruitment_training")
        .select("*")
        .or(`role_slug.eq.${role},role_slug.is.null`);
      const raw = (data as Module[]) ?? [];
      raw.sort((a, b) => {
        if ((a.role_slug === null) !== (b.role_slug === null)) return a.role_slug === null ? -1 : 1;
        return a.module_order - b.module_order;
      });
      // Deduplicate by title — keep the role-specific version over generic (null slug)
      const seen = new Set<string>();
      const list = raw.filter((m) => {
        const key = m.title.trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setModules(list);
      setLoading(false);
    })();
  }, [role]);

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

  const allModsRead = modules.length === 0 || readMods.size >= modules.length;
  const allCompRead = readComp.size >= COMPANY_READS.length;
  const allTourDone = readTour.size >= TOUR_PAGES.length;
  const allDone     = allModsRead && allCompRead && allTourDone;

  const totalItems  = COMPANY_READS.length + modules.length + TOUR_PAGES.length;
  const doneItems   = readComp.size + readMods.size + readTour.size;
  const progressPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <main className="relative min-h-screen bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee44,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf633,transparent_35%)]" />

      <div className="relative z-10 mx-auto max-w-2xl px-5 py-14">
        {/* Progress bar */}
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
          For <b>{ROLE_LABEL[role] ?? role}</b> — first get to know the company, complete your role training, take the website tour, then unlock your assessment.
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
          <p className="mt-2 text-[11px] font-bold text-amber-600 dark:text-amber-400">⚠️ Open all three links before proceeding.</p>
        )}

        {/* ── SECTION 2: Role Training ── */}
        <SectionHeader step={2} title="Role Training" done={allModsRead} extraLabel={`${readMods.size}/${modules.length} read`} />
        {modules.length > 0 && (
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all" style={{ width: `${(readMods.size / Math.max(modules.length, 1)) * 100}%` }} />
          </div>
        )}
        {loading ? (
          <p className="mt-6 text-center text-sm text-black/50 dark:text-white/50">Loading…</p>
        ) : modules.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-cyan-200/40 bg-white/80 p-6 text-center dark:border-cyan-400/20 dark:bg-white/[0.05]">
            <BookOpen className="mx-auto h-7 w-7 text-cyan-400" />
            <p className="mt-2 text-sm font-medium text-black/60 dark:text-white/60">Training material for this role is coming soon. Complete the website tour and take the test.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {modules.map((m, i) => {
              const isWelcome = m.title.toLowerCase().includes("welcome");
              const isOpen = open === m.id;
              const isRead = readMods.has(m.id);

              // "Welcome to AgentForge" — always expanded, featured card
              if (isWelcome) {
                return (
                  <div key={m.id} onClick={() => setReadMods((r) => new Set(r).add(m.id))}
                    className="overflow-hidden rounded-2xl border-2 border-cyan-300/60 bg-gradient-to-br from-cyan-50/80 to-blue-50/60 p-5 shadow-md shadow-cyan-200/20 dark:border-cyan-400/30 dark:from-cyan-900/20 dark:to-blue-900/10">
                    <div className="mb-3 flex items-center gap-2">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${isRead ? "bg-emerald-500" : "bg-gradient-to-br from-cyan-400 to-blue-600"}`}>
                        {isRead ? <CheckCircle2 className="h-4 w-4" /> : "★"}
                      </span>
                      <span className="text-sm font-black text-cyan-700 dark:text-cyan-300">{m.title}</span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-black/75 dark:text-white/75">{m.content}</div>
                  </div>
                );
              }

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
          Explore our website — the assessment includes questions about our products and pages.
        </p>
        <div className="mt-3 space-y-2">
          {TOUR_PAGES.map((p) => {
            const visited = readTour.has(p.key);
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setReadTour((r) => new Set(r).add(p.key));
                  openTourTab(p.href);
                }}
                className="group flex w-full items-center gap-3 rounded-xl border border-cyan-200/40 bg-white/85 px-4 py-3 shadow-sm backdrop-blur transition hover:border-cyan-400 text-left dark:border-cyan-400/20 dark:bg-white/[0.05]">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-xs ${visited ? "bg-emerald-500" : "bg-gradient-to-br from-cyan-400 to-blue-600"}`}>
                  {visited ? <CheckCircle2 className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-black">{p.title}</p>
                  <p className="text-[11px] font-medium text-black/45 dark:text-white/45">{p.desc}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-black/30 transition group-hover:text-cyan-500 dark:text-white/30" />
              </button>
            );
          })}
        </div>
        {!allTourDone && (
          <p className="mt-2 text-[11px] font-bold text-amber-600 dark:text-amber-400">⚠️ Visit all pages to unlock the test button.</p>
        )}

        {/* ── SECTION 4: FAQ ── */}
        <div className="mt-12">
          <SectionHeader step={4} title="Frequently Asked Questions" done />
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
            {allDone ? "🎉 All done! Ready for your assessment?" : "Complete your training first"}
          </h2>
          <p className="mt-1 text-sm font-medium text-black/55 dark:text-white/55">
            {allDone
              ? "Take a short skill test. Pass it and our team will contact you."
              : `Still pending: ${[
                  !allCompRead ? "Company pages" : "",
                  !allModsRead && modules.length > 0 ? "Training modules" : "",
                  !allTourDone ? "Website tour" : "",
                ].filter(Boolean).join(", ")}`}
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
            <p className="text-xs font-black text-emerald-800 dark:text-emerald-300">What do you get after joining?</p>
            <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-emerald-700/90 dark:text-emerald-400/80">
              Once selected, you get full access to AgentForge&apos;s internal <b>Knowledge Base</b> —
              scripts, WhatsApp templates, objection handling, SOPs and <b>AI Caller GPT</b>.
              The support team runs live training on Zoom/WhatsApp. New members are productive within their first day.
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
