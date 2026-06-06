"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/app/admin/AdminShell";
import { useAdminPermissions } from "@/app/admin/AdminPermissions";
import { supabase } from "@/lib/supabase";
import {
  User, Phone, MapPin, Briefcase, Calendar, Camera,
  Save, Loader2, CheckCircle, AlertCircle,
  CreditCard, Building, Shield, Star, Clock, Link,
} from "lucide-react";

type Profile = {
  full_name: string; phone: string; designation: string; department: string;
  bio: string; city: string; state: string; date_of_birth: string;
  emergency_contact_name: string; emergency_contact_phone: string;
  bank_name: string; account_number: string; ifsc: string; upi_id: string;
  linkedin: string; github: string; skills: string;
  avatar_url: string; joining_date: string;
};

const EMPTY: Profile = {
  full_name: "", phone: "", designation: "", department: "",
  bio: "", city: "", state: "", date_of_birth: "",
  emergency_contact_name: "", emergency_contact_phone: "",
  bank_name: "", account_number: "", ifsc: "", upi_id: "",
  linkedin: "", github: "", skills: "", avatar_url: "", joining_date: "",
};

const DEPARTMENTS = ["Sales", "Support", "Marketing", "Operations", "Tech", "HR", "Finance", "Management"];

function Doodles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Person silhouette top-left */}
      <svg className="absolute left-6 top-16 h-16 w-12 text-indigo-400/20 dark:text-indigo-400/10" viewBox="0 0 48 64" fill="none">
        <circle cx="24" cy="14" r="10" stroke="currentColor" strokeWidth="3" />
        <path d="M4 58 C4 44 44 44 44 58" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {/* Star top-right */}
      <svg className="absolute right-10 top-14 h-8 w-8 text-amber-400/25 dark:text-amber-400/15 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
      </svg>
      {/* ID card mid-left */}
      <svg className="absolute left-4 top-1/3 h-14 w-10 text-blue-400/15 dark:text-blue-400/10" viewBox="0 0 40 56" fill="none">
        <rect x="2" y="2" width="36" height="52" rx="6" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="20" cy="18" r="7" stroke="currentColor" strokeWidth="2" />
        <line x1="8" y1="32" x2="32" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="40" x2="28" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {/* Shield bottom-right */}
      <svg className="absolute bottom-24 right-8 h-14 w-12 text-emerald-400/15 dark:text-emerald-400/10" viewBox="0 0 48 56" fill="none">
        <path d="M24 4 L42 12 L42 30 C42 42 24 52 24 52 C24 52 6 42 6 30 L6 12 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M16 28 L22 34 L32 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {/* Dot grid bottom-left */}
      <svg className="absolute bottom-32 left-6 h-12 w-12 text-slate-400/20 dark:text-slate-400/10" viewBox="0 0 36 36" fill="currentColor">
        {[6,18,30].map(y => [6,18,30].map(x => <circle key={`${x}${y}`} cx={x} cy={y} r="2" />))}
      </svg>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400";
const labelCls = "mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400";
const sectionCls = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#11141a]";
const sectionTitleCls = "mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white";

export default function MyProfilePage() {
  const { email } = useAdminPermissions();
  const [form, setForm] = useState<Profile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"personal" | "work" | "bank" | "emergency">("personal");

  useEffect(() => {
    if (!email) return;
    (async () => {
      const { data } = await supabase
        .from("team_profiles")
        .select("*")
        .eq("email", email)
        .single();
      if (data) setForm({ ...EMPTY, ...data });
      setLoading(false);
    })();
  }, [email]);

  function set(k: keyof Profile, v: string) {
    setForm(p => ({ ...p, [k]: v }));
    setSaved(false);
    setError("");
  }

  async function save() {
    setSaving(true); setError("");
    const { error: err } = await supabase
      .from("team_profiles")
      .upsert({ ...form, email }, { onConflict: "email" });
    if (err) setError(err.message);
    else setSaved(true);
    setSaving(false);
  }

  const initials = (form.full_name || email || "?").slice(0, 2).toUpperCase();

  return (
    <AdminShell breadcrumbs={[{ label: "My Profile" }]} title="My Profile" subtitle="Fill in your complete profile details" email={email}>
      <div className="relative">
        <Doodles />
        <div className="relative z-10">

          {/* Header card */}
          <div className={`${sectionCls} mb-6 flex flex-col items-center gap-4 sm:flex-row`}>
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-black text-white shadow-lg">
                {form.avatar_url
                  ? <img src={form.avatar_url} alt="Avatar" className="h-full w-full rounded-2xl object-cover" />
                  : initials}
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">{form.full_name || "Your Name"}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{form.designation || "Designation"} {form.department ? `· ${form.department}` : ""}</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">{email}</p>
            </div>
            <div className="ml-auto flex flex-wrap gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center dark:border-slate-700 dark:bg-slate-800">
                <p className="text-lg font-black text-slate-900 dark:text-white">{form.joining_date ? new Date(form.joining_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Joined</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-[#11141a]">
            {([
              { id: "personal", label: "Personal", icon: User },
              { id: "work", label: "Work", icon: Briefcase },
              { id: "bank", label: "Bank / Pay", icon: CreditCard },
              { id: "emergency", label: "Emergency", icon: Shield },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setTab(id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition whitespace-nowrap ${tab === id ? "bg-indigo-600 text-white shadow" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"}`}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-indigo-500" /></div>
          ) : (
            <div className="space-y-4">

              {/* ── Personal ── */}
              {tab === "personal" && (
                <>
                  <div className={sectionCls}>
                    <p className={sectionTitleCls}><User className="h-4 w-4 text-indigo-500" /> Basic Information</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}><User className="h-3.5 w-3.5" /> Full Name *</label>
                        <input className={inputCls} value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Your full name" />
                      </div>
                      <div>
                        <label className={labelCls}><Phone className="h-3.5 w-3.5" /> Mobile Number</label>
                        <input className={inputCls} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="10-digit number" />
                      </div>
                      <div>
                        <label className={labelCls}><Calendar className="h-3.5 w-3.5" /> Date of Birth</label>
                        <input type="date" className={inputCls} value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}><MapPin className="h-3.5 w-3.5" /> City</label>
                        <input className={inputCls} value={form.city} onChange={e => set("city", e.target.value)} placeholder="Your city" />
                      </div>
                      <div>
                        <label className={labelCls}><MapPin className="h-3.5 w-3.5" /> State</label>
                        <input className={inputCls} value={form.state} onChange={e => set("state", e.target.value)} placeholder="State" />
                      </div>
                      <div>
                        <label className={labelCls}><Camera className="h-3.5 w-3.5" /> Profile Photo URL</label>
                        <input className={inputCls} value={form.avatar_url} onChange={e => set("avatar_url", e.target.value)} placeholder="https://..." />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className={labelCls}>Bio / About Me</label>
                      <textarea className={inputCls} rows={3} value={form.bio} onChange={e => set("bio", e.target.value)} placeholder="Write a short bio about yourself..." />
                    </div>
                  </div>
                  <div className={sectionCls}>
                    <p className={sectionTitleCls}><Star className="h-4 w-4 text-amber-500" /> Skills & Social</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}><Link className="h-3.5 w-3.5" /> LinkedIn</label>
                        <input className={inputCls} value={form.linkedin} onChange={e => set("linkedin", e.target.value)} placeholder="linkedin.com/in/..." />
                      </div>
                      <div>
                        <label className={labelCls}><Link className="h-3.5 w-3.5" /> GitHub</label>
                        <input className={inputCls} value={form.github} onChange={e => set("github", e.target.value)} placeholder="github.com/..." />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}><Star className="h-3.5 w-3.5" /> Skills (comma separated)</label>
                        <input className={inputCls} value={form.skills} onChange={e => set("skills", e.target.value)} placeholder="Calling, WhatsApp, CRM, Sales, AI Tools..." />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── Work ── */}
              {tab === "work" && (
                <div className={sectionCls}>
                  <p className={sectionTitleCls}><Briefcase className="h-4 w-4 text-blue-500" /> Work Details</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}><Briefcase className="h-3.5 w-3.5" /> Designation</label>
                      <input className={inputCls} value={form.designation} onChange={e => set("designation", e.target.value)} placeholder="e.g. Telecaller, AI Operator" />
                    </div>
                    <div>
                      <label className={labelCls}><Building className="h-3.5 w-3.5" /> Department</label>
                      <select className={inputCls} value={form.department} onChange={e => set("department", e.target.value)}>
                        <option value="">Select department</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}><Clock className="h-3.5 w-3.5" /> Joining Date</label>
                      <input type="date" className={inputCls} value={form.joining_date} onChange={e => set("joining_date", e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Bank ── */}
              {tab === "bank" && (
                <div className={sectionCls}>
                  <p className={sectionTitleCls}><CreditCard className="h-4 w-4 text-emerald-500" /> Bank & Payment Details</p>
                  <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    ⚠️ These details are used only for salary transfers and are kept fully secure.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Bank Name</label>
                      <input className={inputCls} value={form.bank_name} onChange={e => set("bank_name", e.target.value)} placeholder="e.g. SBI, HDFC, ICICI" />
                    </div>
                    <div>
                      <label className={labelCls}>Account Number</label>
                      <input className={inputCls} value={form.account_number} onChange={e => set("account_number", e.target.value)} placeholder="Account number" />
                    </div>
                    <div>
                      <label className={labelCls}>IFSC Code</label>
                      <input className={inputCls} value={form.ifsc} onChange={e => set("ifsc", e.target.value.toUpperCase())} placeholder="SBIN0001234" />
                    </div>
                    <div>
                      <label className={labelCls}>UPI ID</label>
                      <input className={inputCls} value={form.upi_id} onChange={e => set("upi_id", e.target.value)} placeholder="name@upi" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Emergency ── */}
              {tab === "emergency" && (
                <div className={sectionCls}>
                  <p className={sectionTitleCls}><Shield className="h-4 w-4 text-red-500" /> Emergency Contact</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}><User className="h-3.5 w-3.5" /> Contact Name</label>
                      <input className={inputCls} value={form.emergency_contact_name} onChange={e => set("emergency_contact_name", e.target.value)} placeholder="Family member's name" />
                    </div>
                    <div>
                      <label className={labelCls}><Phone className="h-3.5 w-3.5" /> Contact Phone</label>
                      <input className={inputCls} value={form.emergency_contact_phone} onChange={e => set("emergency_contact_phone", e.target.value)} placeholder="10-digit number" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error / Success */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {saved && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4 shrink-0" /> Profile saved successfully!
            </div>
          )}

          {/* Save button */}
          <div className="mt-6 flex justify-end">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Profile</>}
            </button>
          </div>

        </div>
      </div>
    </AdminShell>
  );
}
