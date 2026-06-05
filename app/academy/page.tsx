"use client";

import Link from "next/link";
import {
  BookOpen, Briefcase, Phone, Headphones, Share2, Bot,
  GraduationCap, IndianRupee, Clock, Home, TrendingUp,
  CheckCircle, ArrowRight, Star, Users, Award,
} from "lucide-react";

const JOURNEY = [
  { step: "01", title: "Register", desc: "Apna naam, city aur skills bharo — 2 minute ka kaam", color: "from-cyan-400 to-blue-500", icon: "📝" },
  { step: "02", title: "Assessment", desc: "30 min ka online MCQ test do — English, Sales, AI topics", color: "from-blue-400 to-indigo-500", icon: "📋" },
  { step: "03", title: "Training", desc: "6 modules complete karo apni speed se — learning portal pe", color: "from-indigo-400 to-purple-500", icon: "🎓" },
  { step: "04", title: "Work & Earn", desc: "Task milenge, complete karo aur salary + incentive pao", color: "from-purple-400 to-pink-500", icon: "💰" },
];

const JOBS = [
  { icon: Phone, title: "Telecaller", basic: "₹5,000", incentive: "Per Sale", color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400", border: "border-cyan-500/20" },
  { icon: TrendingUp, title: "Lead Research Executive", basic: "₹5,000", incentive: "Target Based", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", border: "border-blue-500/20" },
  { icon: Share2, title: "Social Media Executive", basic: "₹5,000", incentive: "Performance Based", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400", border: "border-purple-500/20" },
  { icon: Bot, title: "AI Operator", basic: "₹5,000", incentive: "Output Based", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
  { icon: Headphones, title: "Customer Support", basic: "₹5,000", incentive: "CSAT Based", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", border: "border-amber-500/20" },
];

const MODULES = [
  { num: 1, title: "AgentForge Introduction", icon: "🏢", desc: "Company, products aur mission" },
  { num: 2, title: "Communication Training", icon: "💬", desc: "WhatsApp, Email, Calling" },
  { num: 3, title: "Lead Handling", icon: "🎯", desc: "Lead qualify karna seekho" },
  { num: 4, title: "AI Product Training", icon: "🤖", desc: "Textile, Jewellery, Photography" },
  { num: 5, title: "CRM Training", icon: "📊", desc: "Lead update aur follow up" },
  { num: 6, title: "Sales Basics", icon: "💡", desc: "Objection handling aur closing" },
];

const STATS = [
  { value: "₹5,000", label: "Basic Salary", icon: IndianRupee },
  { value: "100%", label: "Work From Home", icon: Home },
  { value: "6", label: "Training Modules", icon: BookOpen },
  { value: "5", label: "Job Categories", icon: Briefcase },
];

function Doodles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg className="absolute left-4 top-24 h-12 w-24 text-cyan-400/40" viewBox="0 0 100 40" fill="none">
        <path d="M2 20 Q 15 2, 28 20 T 54 20 T 80 20 T 98 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <svg className="absolute right-8 top-16 h-10 w-10 text-purple-400/50 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
      </svg>
      <svg className="absolute right-1/4 top-1/3 h-8 w-8 text-blue-400/30 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
      </svg>
      <svg className="absolute bottom-40 right-10 h-14 w-20 text-cyan-400/30" viewBox="0 0 80 50" fill="none">
        <path d="M4 40 Q 40 4, 72 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M62 18 L74 28 L60 34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );
}

export default function AcademyPage() {
  return (
    <div className="min-h-screen pb-20">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 px-4 text-center">
        <Doodles />
        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Hiring Open — Work From Home
          </div>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-900 dark:text-white sm:text-5xl">
            Learn Skills.{" "}
            <span className="bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">
              Work From Home.
            </span>{" "}
            Earn More.
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            AgentForge Learn &amp; Earn Academy — India bhar se talented log onboard kar raha hai.
            Training dete hain, kaam dete hain, aur performance ke basis par earning hoti hai.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            {["No Office Required", "Training Provided", "Flexible Hours", "Incentive + Basic Salary"].map((t) => (
              <span key={t} className="flex items-center gap-1.5 rounded-full bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> {t}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/academy/register"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:shadow-cyan-500/25 transition-all hover:scale-105"
            >
              Apply Now — Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/academy/portal"
              className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-white/20 bg-white/60 dark:bg-white/5 px-8 py-3.5 text-base font-semibold text-slate-700 dark:text-white hover:border-cyan-500/50 transition-all"
            >
              Candidate Login
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section className="px-4 py-8">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 p-5 text-center shadow-sm">
              <Icon className="mx-auto mb-2 h-5 w-5 text-cyan-500" />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-3xl font-bold text-slate-900 dark:text-white">How It Works</h2>
          <p className="mb-10 text-center text-slate-500 dark:text-slate-400">Char simple steps mein apni journey shuru karo</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY.map(({ step, title, desc, color, icon }) => (
              <div key={step} className="relative rounded-2xl border border-white/20 bg-white/60 dark:bg-white/5 p-5 shadow-sm">
                <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-xl shadow`}>
                  {icon}
                </div>
                <div className="absolute right-4 top-4 text-xs font-bold text-slate-300 dark:text-slate-600">{step}</div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Job Categories ───────────────────────────────────── */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-3xl font-bold text-slate-900 dark:text-white">Job Categories</h2>
          <p className="mb-10 text-center text-slate-500 dark:text-slate-400">Apni skill ke hisaab se role choose karo</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {JOBS.map(({ icon: Icon, title, basic, incentive, color, border }) => (
              <div key={title} className={`rounded-2xl border ${border} bg-white/60 dark:bg-white/5 p-5 shadow-sm`}>
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Basic</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{basic}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Incentive</p>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{incentive}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Training Modules ─────────────────────────────────── */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-3xl font-bold text-slate-900 dark:text-white">Training Modules</h2>
          <p className="mb-10 text-center text-slate-500 dark:text-slate-400">6 modules — basics se sales mastery tak</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map(({ num, title, icon, desc }) => (
              <div key={num} className="flex items-start gap-3 rounded-xl border border-white/20 bg-white/60 dark:bg-white/5 p-4 shadow-sm">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="text-xs font-medium text-cyan-500">Module {num}</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Scale Vision ─────────────────────────────────────── */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 p-8 text-center shadow-sm">
          <Users className="mx-auto mb-3 h-10 w-10 text-purple-500" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Scale Vision — 100 Members</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Jab 100 active members ho jayenge — 50 Telecallers, 20 Researchers, 10 Support, 10 Social Media, 10 AI Operators —
            agar har member sirf ₹10,000/month contribute kare, to hoga
          </p>
          <p className="mt-4 text-4xl font-bold bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">
            ₹10 Lakh / Month
          </p>
          <p className="mt-1 text-sm text-slate-500">collective business contribution</p>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="px-4 py-10 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tayaar ho? Abhi apply karo.</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Registration free hai. Training free hai. Bas skill aur dedication chahiye.</p>
        <Link
          href="/academy/register"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-10 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-cyan-500/25 transition-all hover:scale-105"
        >
          Apply Now — Free <ArrowRight className="h-5 w-5" />
        </Link>
      </section>

    </div>
  );
}
