"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle, Loader2, ArrowRight, User, Phone, Mail, MapPin, GraduationCap, Clock, Briefcase } from "lucide-react";

const EDUCATION_OPTIONS = ["10th Pass", "12th Pass", "Graduate", "Post Graduate", "Other"];
const EXPERIENCE_OPTIONS = ["Fresher", "0–1 Year", "1–2 Years", "2–5 Years", "5+ Years"];
const HOURS_OPTIONS = ["2–4 Hours", "4–6 Hours", "6–8 Hours", "Full Time (8+ Hours)"];
const JOB_OPTIONS = [
  { value: "telecaller", label: "📞 Telecaller" },
  { value: "researcher", label: "🔍 Lead Research Executive" },
  { value: "social_media", label: "📱 Social Media Executive" },
  { value: "ai_operator", label: "🤖 AI Operator" },
  { value: "support", label: "🎧 Customer Support" },
];

type FormData = {
  name: string; mobile: string; email: string; city: string;
  education: string; experience: string; available_hours: string; job_category: string;
};

const INIT: FormData = { name: "", mobile: "", email: "", city: "", education: "", experience: "", available_hours: "", job_category: "" };

export default function AcademyRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INIT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [candidateId, setCandidateId] = useState("");

  function set(key: keyof FormData, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.mobile || !form.city || !form.education || !form.job_category) {
      setError("Sabhi required fields fill karo.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.mobile)) {
      setError("Valid 10-digit mobile number daalo.");
      return;
    }
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("academy_candidates")
        .insert({ ...form, status: "assessment_pending" })
        .select("id")
        .single();
      if (err) throw err;
      setCandidateId(data.id);
      setDone(true);
    } catch (e: unknown) {
      setError((e as Error).message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-white/80 dark:bg-white/5 p-8 text-center shadow-lg">
          <CheckCircle className="mx-auto mb-4 h-14 w-14 text-emerald-500" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Registration Complete!</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            {form.name}, aapka registration ho gaya. Ab online assessment dena hai — 30 minutes ka test hai.
          </p>
          <div className="mt-6 space-y-3">
            <button
              onClick={() => router.push(`/academy/assessment?id=${candidateId}`)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 py-3.5 font-semibold text-white transition-all hover:scale-105"
            >
              Assessment Shuru Karo <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-xs text-slate-400">Assessment baad mein bhi de sakte ho. Apna candidate ID note karo: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{candidateId.slice(0, 8)}...</span></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-600 dark:text-cyan-400">
            Step 1 of 2 — Registration
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Apply for Work From Home</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">2 minute mein register karo — bilkul free</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/20 bg-white/80 dark:bg-white/5 p-6 shadow-sm backdrop-blur">

          {/* Name */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <User className="h-3.5 w-3.5" /> Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={form.name} onChange={e => set("name", e.target.value)}
              placeholder="Aapka poora naam"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Phone className="h-3.5 w-3.5" /> Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel" value={form.mobile} onChange={e => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit mobile number"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Mail className="h-3.5 w-3.5" /> Email (optional)
            </label>
            <input
              type="email" value={form.email} onChange={e => set("email", e.target.value)}
              placeholder="aap@email.com"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
            />
          </div>

          {/* City */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <MapPin className="h-3.5 w-3.5" /> City <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={form.city} onChange={e => set("city", e.target.value)}
              placeholder="Aapka city"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
            />
          </div>

          {/* Education */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <GraduationCap className="h-3.5 w-3.5" /> Education <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {EDUCATION_OPTIONS.map(opt => (
                <button key={opt} type="button" onClick={() => set("education", opt)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${form.education === opt ? "border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-cyan-300"}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Briefcase className="h-3.5 w-3.5" /> Experience
            </label>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_OPTIONS.map(opt => (
                <button key={opt} type="button" onClick={() => set("experience", opt)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${form.experience === opt ? "border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-cyan-300"}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Available Hours */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Clock className="h-3.5 w-3.5" /> Available Hours per Day
            </label>
            <div className="flex flex-wrap gap-2">
              {HOURS_OPTIONS.map(opt => (
                <button key={opt} type="button" onClick={() => set("available_hours", opt)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${form.available_hours === opt ? "border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-cyan-300"}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Job Category */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Briefcase className="h-3.5 w-3.5" /> Preferred Role <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {JOB_OPTIONS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => set("job_category", value)}
                  className={`flex w-full items-center rounded-xl border px-4 py-3 text-sm font-medium transition-all text-left ${form.job_category === value ? "border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" : "border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-cyan-300"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 py-3.5 font-semibold text-white shadow-lg transition-all hover:scale-[1.02] disabled:opacity-60"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Registering...</> : <>Register & Proceed to Assessment <ArrowRight className="h-4 w-4" /></>}
          </button>

          <p className="text-center text-xs text-slate-400">Registration bilkul free hai. Koi hidden charge nahi.</p>
        </form>
      </div>
    </div>
  );
}
