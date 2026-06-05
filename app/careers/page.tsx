"use client";

// /careers — AgentForge Academy (professional, doodled, journey-based).
// Sequence: Learn → Know AgentForge → Skill Test → Interview → Hired.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen, Building2, BrainCircuit, Phone, PartyPopper,
  Phone as PhoneIcon, Briefcase, Headphones, Megaphone, Clapperboard,
  Bot, Palette, Code2, Circle, Wallet, Clock, Home, GraduationCap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Role = { id: string; title: string; slug: string; description: string | null; is_open: boolean };

const ROLE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  telecaller: PhoneIcon, "sales-executive": Briefcase, "support-executive": Headphones,
  "marketing-executive": Megaphone, "content-creator": Clapperboard, "ai-operator": Bot,
  designer: Palette, developer: Code2,
};

// ── Decorative doodles (inline SVG) ──
function Doodles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg className="absolute left-4 top-24 h-12 w-24 text-cyan-400/50" viewBox="0 0 100 40" fill="none">
        <path d="M2 20 Q 15 2, 28 20 T 54 20 T 80 20 T 98 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <svg className="absolute right-8 top-16 h-10 w-10 text-purple-400/60 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
      </svg>
      <svg className="absolute left-10 top-1/2 h-16 w-16 text-blue-400/30" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3" strokeDasharray="6 8" />
      </svg>
      <svg className="absolute bottom-24 right-10 h-14 w-20 text-cyan-400/40" viewBox="0 0 80 50" fill="none">
        <path d="M4 40 Q 40 4, 72 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M62 18 L74 28 L60 34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <svg className="absolute bottom-40 left-6 h-12 w-12 text-purple-400/40" viewBox="0 0 40 40" fill="currentColor">
        {[6, 18, 30].map((y) => [6, 18, 30].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" />))}
      </svg>
    </div>
  );
}

const JOURNEY = [
  { Icon: BookOpen,     title: "Learn",           desc: "Role-wise training modules padho — basics se objection handling tak.", color: "from-cyan-400 to-blue-500" },
  { Icon: Building2,    title: "Know AgentForge", desc: "Company, founder aur product samjho — About + Support pages.",          color: "from-blue-400 to-indigo-500" },
  { Icon: BrainCircuit, title: "Skill Test",      desc: "Short timed test do — merit ke hisaab se aage badho.",                  color: "from-indigo-400 to-purple-500" },
  { Icon: Phone,        title: "Interview Call",  desc: "Pass = hamari team interview ke liye aapko call karegi.",               color: "from-purple-400 to-fuchsia-500" },
  { Icon: PartyPopper,  title: "Get Hired",       desc: "Join karo, full Knowledge Base + AI tools ka access paao.",            color: "from-fuchsia-400 to-pink-500" },
];

const BENEFITS = [
  { Icon: Home,          label: "Work From Home roles" },
  { Icon: Wallet,        label: "Learn & Earn — merit pay" },
  { Icon: Clock,         label: "No resume, no waiting" },
  { Icon: GraduationCap, label: "Free training + AI tools" },
];

export default function AcademyPage() {
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
    <main className="relative min-h-screen overflow-hidden bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee44,transparent_40%),radial-gradient(circle_at_top_right,#8b5cf633,transparent_40%),radial-gradient(circle_at_bottom,#3b82f622,transparent_45%)]" />
      <Doodles />

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-16">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-white/80 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.3em] text-cyan-700 shadow-md shadow-cyan-300/30 backdrop-blur dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200">
            🎓 AgentForge Academy
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Learn.{" "}
            <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">Earn.</span>{" "}
            Grow with us.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-relaxed text-black/60 dark:text-white/60">
            Resume ki zaroorat nahi. Seekho, AgentForge ko samjho, ek quick skill
            test do — aur merit pe job paao. Naye log bhi yahan se career shuru karte hain.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/careers/learn?role=telecaller"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-8 py-3.5 text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-105 active:scale-95 sm:text-base">
              Start Learning →
            </Link>
            <Link href="/careers/apply"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-8 py-3.5 text-sm font-bold transition hover:scale-105 dark:border-white/15 dark:bg-white/10 dark:text-white sm:text-base">
              Apply Directly
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {BENEFITS.map((b) => (
              <span key={b.label} className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200/50 bg-white/70 px-3 py-1.5 text-xs font-bold text-black/65 backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.06] dark:text-white/70">
                <b.Icon className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" />{b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Journey */}
        <div className="mt-20 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-600">Your Journey</p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">5 simple steps to get hired</h2>
        </div>
        <div className="relative mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {JOURNEY.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-cyan-200/40 bg-white/85 p-5 text-center shadow-md shadow-cyan-200/15 backdrop-blur transition hover:scale-[1.03] dark:border-cyan-400/20 dark:bg-white/[0.05]">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-black px-2.5 py-0.5 text-[10px] font-black text-white dark:bg-white dark:text-black">
                STEP {i + 1}
              </span>
              <div className={`mx-auto mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-lg`}>
                <s.Icon className="h-7 w-7" />
              </div>
              <h3 className="mt-3 text-sm font-black">{s.title}</h3>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-black/50 dark:text-white/50">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Roles */}
        <div className="mt-20 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-600">Open Positions</p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Pick your role &amp; start learning</h2>
        </div>
        {loading ? (
          <p className="mt-6 text-center text-sm text-black/50 dark:text-white/50">Loading…</p>
        ) : roles.length === 0 ? (
          <p className="mt-6 text-center text-sm text-black/50 dark:text-white/50">No open positions right now. Check back soon!</p>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((r) => {
              const Ic = ROLE_ICON[r.slug] ?? Circle;
              return (
                <Link key={r.id} href={`/careers/learn?role=${r.slug}`}
                  className="group flex items-center justify-between rounded-2xl border border-cyan-200/40 bg-white/80 p-5 shadow-md shadow-cyan-200/10 backdrop-blur transition hover:scale-[1.02] hover:border-cyan-400 hover:shadow-cyan-300/30 dark:border-cyan-400/20 dark:bg-white/[0.05] dark:hover:border-cyan-400">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-md">
                      <Ic className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-sm font-black">{r.title}</p>
                      <p className="text-[11px] font-bold text-black/50 dark:text-white/50">Learn → Apply → Test</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-cyan-600 transition group-hover:translate-x-1 dark:text-cyan-300">→</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Final CTA */}
        <div className="relative mt-20 overflow-hidden rounded-[2rem] border border-cyan-300/40 bg-gradient-to-r from-cyan-400/15 via-blue-500/15 to-purple-500/15 p-10 text-center shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-black sm:text-3xl md:text-4xl">Ready to build your career?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-black/60 dark:text-white/60">
            Join AgentForge Academy. Seekho, test do, aur team ka hissa bano.
          </p>
          <Link href="/careers/learn?role=telecaller"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-9 py-4 text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-105 active:scale-95 sm:text-base">
            Enter the Academy →
          </Link>
        </div>
      </div>
    </main>
  );
}
