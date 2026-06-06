"use client";

// /careers — AgentForge Careers Portal.
// Flow: See roles → Apply (signup) → Learn + Tour → Test → Result → HR Process → Payment → Join

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen, Building2, BrainCircuit, Phone, PartyPopper,
  Phone as PhoneIcon, Briefcase, Headphones, Megaphone, Clapperboard,
  GraduationCap, Circle, Wallet, Clock, Home, Star, Monitor,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Role = {
  id: string; title: string; slug: string; description: string | null;
  is_open: boolean; openings?: number; work_type?: string; location?: string | null;
  salary_display?: string | null; is_referral_based?: boolean; job_type?: string;
};

const WORK_TYPE: Record<string, { label: string; cls: string }> = {
  wfh:    { label: "🏠 Work From Home", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
  remote: { label: "🌐 Remote",         cls: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" },
  hybrid: { label: "🔀 Hybrid",         cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
  office: { label: "🏢 Office",         cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
};

const ROLE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  telecaller:           PhoneIcon,
  "support-executive":  Headphones,
  "marketing-executive": Megaphone,
  "content-creator":    Clapperboard,
  "hr-executive":       GraduationCap,
  "office-executive":   Monitor,
};

function Doodles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg className="absolute left-6 top-20 h-16 w-16 text-cyan-400/35" viewBox="0 0 64 64" fill="none">
        <path d="M32 10 L58 24 L32 38 L6 24 Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" fill="currentColor" opacity="0.2" />
        <path d="M48 30 L48 46 C48 46 40 54 32 54 C24 54 16 46 16 46 L16 30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="58" y1="24" x2="58" y2="38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <svg className="absolute right-8 top-16 h-10 w-10 text-purple-400/50 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
      </svg>
      <svg className="absolute left-8 top-1/2 h-16 w-20 text-blue-400/25" viewBox="0 0 80 64" fill="none">
        <path d="M40 12 C40 12 24 8 8 12 L8 54 C24 50 40 54 40 54" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M40 12 C40 12 56 8 72 12 L72 54 C56 50 40 54 40 54" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="40" y1="12" x2="40" y2="54" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <svg className="absolute right-10 top-1/3 h-14 w-14 text-emerald-400/30" viewBox="0 0 56 56" fill="none">
        <path d="M6 28 L28 8 L50 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 28 L12 48 L44 48 L44 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="22" y="34" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="2.5" />
      </svg>
      <svg className="absolute bottom-36 left-8 h-14 w-14 text-amber-400/30" viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="3" />
        <text x="19" y="36" fontSize="20" fontWeight="900" fill="currentColor" fontFamily="serif">₹</text>
      </svg>
      <svg className="absolute bottom-24 right-8 h-14 w-14 text-purple-400/30" viewBox="0 0 42 42" fill="currentColor">
        {[7,21,35].map(y => [7,21,35].map(x => <circle key={`${x}${y}`} cx={x} cy={y} r="2.5" />))}
      </svg>
    </div>
  );
}

const JOURNEY = [
  { Icon: BookOpen,     title: "Apply",      desc: "Sign up and fill basic details — done in 1 minute.",          color: "from-cyan-400 to-blue-500" },
  { Icon: Building2,    title: "Learn",      desc: "Role training + know AgentForge + Website Tour.",             color: "from-blue-400 to-indigo-500" },
  { Icon: BrainCircuit, title: "Skill Test", desc: "Short MCQ test — progress purely on merit.",                 color: "from-indigo-400 to-purple-500" },
  { Icon: Phone,        title: "HR Call",    desc: "On pass, our HR team will call you for the next steps.",     color: "from-purple-400 to-fuchsia-500" },
  { Icon: PartyPopper,  title: "Get Hired",  desc: "Security deposit → receive login credentials → start work!", color: "from-fuchsia-400 to-pink-500" },
];

const BENEFITS = [
  { Icon: Home,    label: "Work From Home (WFH)" },
  { Icon: Wallet,  label: "Fixed Salary + Incentive" },
  { Icon: Clock,   label: "Flexible 8-hour shift" },
  { Icon: Star,    label: "Overtime = Extra Incentive" },
];

const SALARY_MAP: Record<string, { label: string; cls: string }> = {
  "₹5,000 + Incentive":  { label: "₹5,000 + Incentive",  cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/20" },
  "₹8,000 + Incentive":  { label: "₹8,000 + Incentive",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/20" },
  "₹10,000 + Incentive": { label: "₹10,000 + Incentive", cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-400/20" },
  "Referral Commission": { label: "10% Referral Commission", cls: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-400/20" },
};

export default function CareersPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("recruitment_roles")
        .select("*")
        .eq("is_open", true)
        .order("openings", { ascending: false });
      setRoles((data as Role[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const totalOpenings = roles.reduce((s, r) => s + (r.openings ?? 0), 0);
  const wfhRoles   = roles.filter(r => r.job_type !== "office");
  const officeRoles = roles.filter(r => r.job_type === "office");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee44,transparent_40%),radial-gradient(circle_at_top_right,#8b5cf633,transparent_40%),radial-gradient(circle_at_bottom,#3b82f622,transparent_45%)]" />
      <Doodles />

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-16">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-white/80 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.3em] text-cyan-700 shadow-md shadow-cyan-300/30 backdrop-blur dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200">
            🚀 AgentForge Careers
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Learn.{" "}
            <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">Earn.</span>{" "}
            Grow with us.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-relaxed text-black/60 dark:text-white/60">
            No resume required. Complete a short training, pass the skill test — and get hired on merit.
            All roles are <b>Work From Home</b>. Flexible hours. Fixed salary + incentive.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a href="#roles"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-8 py-3.5 text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-105 active:scale-95 sm:text-base">
              View Open Positions →
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {BENEFITS.map((b) => (
              <span key={b.label} className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200/50 bg-white/70 px-3 py-1.5 text-xs font-bold text-black/65 backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.06] dark:text-white/70">
                <b.Icon className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" />{b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Journey Steps */}
        <div className="mt-20 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-600">How It Works</p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">5 steps to get hired</h2>
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

        {/* WFH Roles */}
        <div id="roles" className="mt-20 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-600">🏠 Work From Home Roles</p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">
            {totalOpenings > 0 ? (
              <><span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">{totalOpenings}+ openings</span> — pick your role</>
            ) : "Open Positions"}
          </h2>
          <p className="mt-2 text-sm text-black/50 dark:text-white/50">8 hours/day · Flexible timing · Overtime = Extra Incentive</p>
        </div>

        {loading ? (
          <p className="mt-6 text-center text-sm text-black/50 dark:text-white/50">Loading…</p>
        ) : (
          <>
            {/* WFH roles grid */}
            {wfhRoles.length > 0 && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {wfhRoles.map((r) => <RoleCard key={r.id} r={r} />)}
              </div>
            )}

            {/* Office roles */}
            {officeRoles.length > 0 && (
              <>
                <div className="mt-14 text-center">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">🏢 Office Roles</p>
                  <h2 className="mt-2 text-2xl font-black sm:text-3xl">Office-based Positions</h2>
                  <p className="mt-2 text-sm text-black/50 dark:text-white/50">On-site work · Fixed hours · Growth opportunities</p>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {officeRoles.map((r) => <RoleCard key={r.id} r={r} office />)}
                </div>
              </>
            )}

            {roles.length === 0 && (
              <p className="mt-6 text-center text-sm text-black/50 dark:text-white/50">No open positions right now. Check back soon!</p>
            )}
          </>
        )}

        {/* Final CTA */}
        <div className="relative mt-20 overflow-hidden rounded-[2rem] border border-cyan-300/40 bg-gradient-to-r from-cyan-400/15 via-blue-500/15 to-purple-500/15 p-10 text-center shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-black sm:text-3xl md:text-4xl">Ready to build your career?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-black/60 dark:text-white/60">
            Apply. Train. Test. Our team will reach out to you.
          </p>
          <Link href="/careers/apply"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-9 py-4 text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-105 active:scale-95 sm:text-base">
            Apply Now →
          </Link>
        </div>
      </div>
    </main>
  );
}

function RoleCard({ r, office }: { r: Role; office?: boolean }) {
  const Ic = ROLE_ICON[r.slug] ?? Circle;
  const wt = WORK_TYPE[r.work_type ?? (office ? "office" : "wfh")];
  const sal = r.salary_display ? SALARY_MAP[r.salary_display] ?? null : null;

  return (
    <Link href={`/careers/apply?role=${r.slug}`}
      className="group rounded-2xl border border-cyan-200/40 bg-white/80 p-5 shadow-md shadow-cyan-200/10 backdrop-blur transition hover:scale-[1.02] hover:border-cyan-400 hover:shadow-cyan-300/30 dark:border-cyan-400/20 dark:bg-white/[0.05] dark:hover:border-cyan-400">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md bg-gradient-to-br ${office ? "from-slate-500 to-slate-700" : "from-cyan-400 to-blue-600"}`}>
            <Ic className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-black">{r.title}</p>
            {(r.openings ?? 0) > 0 && (
              <p className="text-[11px] font-black text-cyan-600 dark:text-cyan-300">{r.openings} opening{(r.openings ?? 0) > 1 ? "s" : ""}</p>
            )}
          </div>
        </div>
        <span className="text-xl font-black text-cyan-600 transition group-hover:translate-x-1 dark:text-cyan-300">→</span>
      </div>

      {r.description && (
        <p className="mt-2 text-[11px] font-medium leading-relaxed text-black/50 dark:text-white/45 line-clamp-2">{r.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {wt && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${wt.cls}`}>{wt.label}</span>
        )}
        {sal && (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${sal.cls}`}>
            💰 {sal.label}
          </span>
        )}
        {r.is_referral_based && !sal && (
          <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-black text-purple-700 dark:border-purple-400/20 dark:bg-purple-500/10 dark:text-purple-300">
            🔗 10% Referral
          </span>
        )}
      </div>
    </Link>
  );
}
