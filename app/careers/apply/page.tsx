"use client";

// /careers/apply — Step 1 of the hiring flow.
// Candidate fills signup details → redirected to /careers/learn?role=X&cid=UUID

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Link as LinkIcon } from "lucide-react";

const ROLES = [
  { slug: "telecaller",           label: "Telecaller",            salary: "₹5,000 + Incentive" },
  { slug: "support-executive",    label: "Support Executive",      salary: "₹8,000 + Incentive" },
  { slug: "marketing-executive",  label: "Marketing Executive",    salary: "₹10,000 + Incentive" },
  { slug: "content-creator",      label: "Content Creator",        salary: "10% Referral Commission" },
  { slug: "hr-executive",         label: "HR Executive",           salary: "₹10,000 + Incentive" },
  { slug: "office-executive",     label: "Office Executive",       salary: "₹8,000 + Incentive" },
];

function ApplyForm() {
  const params  = useSearchParams();
  const router  = useRouter();
  const preRole = params.get("role") ?? "telecaller";

  const [f, setF] = useState({
    name: "", mobile: "", email: "", city: "", state: "",
    role_slug: ROLES.some(r => r.slug === preRole) ? preRole : "telecaller",
  });
  const [cc, setCc] = useState({
    instagram_url: "", youtube_url: "", facebook_url: "", other_url: "",
    followers_count: "", avg_views: "", niche: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const isCC = f.role_slug === "content-creator";

  function up(k: string, v: string)  { setF((p) => ({ ...p, [k]: v })); }
  function upc(k: string, v: string) { setCc((p) => ({ ...p, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name || f.mobile.length < 8) {
      setError("Full name and a valid mobile number are required."); return;
    }
    if (isCC && !cc.instagram_url && !cc.youtube_url && !cc.facebook_url && !cc.other_url) {
      setError("Please add at least one social media profile link for the Content Creator role."); return;
    }
    setLoading(true); setError(null);

    const body = isCC
      ? { ...f, social_links: cc }
      : { ...f };

    const res  = await fetch("/api/careers/apply", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const json = await res.json();
    setLoading(false);

    if (!json.ok) { setError(json.error ?? "Something went wrong."); return; }

    // Redirect to learn page with role + candidateId
    router.push(`/careers/learn?role=${f.role_slug}&cid=${json.candidate_id}`);
  }

  const input = "w-full rounded-xl border border-cyan-200/50 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 dark:border-white/10 dark:bg-white/5 dark:text-white";

  const selectedRole = ROLES.find(r => r.slug === f.role_slug);

  return (
    <main className="relative min-h-screen bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee44,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf633,transparent_35%)]" />

      <div className="relative z-10 mx-auto max-w-lg px-5 py-14">
        {/* Step indicator */}
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-black text-white">1</span>
          <div className="h-1 flex-1 rounded-full bg-black/10 dark:bg-white/10">
            <div className="h-full w-1/5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-black/30 dark:text-white/30">Step 1 of 5</span>
        </div>

        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">Sign Up</p>
        <h1 className="mt-2 text-3xl font-black">
          Apply to{" "}
          <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">AgentForge</span>
        </h1>
        <p className="mt-1 text-sm font-medium text-black/55 dark:text-white/55">
          Fill in your basic details. Training + test follows. Done in 1 minute.
        </p>

        {selectedRole && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-cyan-200/50 bg-white/70 px-4 py-2.5 backdrop-blur dark:border-cyan-400/20 dark:bg-white/[0.06]">
            <span className="text-sm font-black text-slate-800 dark:text-white">{selectedRole.label}</span>
            <span className="ml-auto rounded-full bg-gradient-to-r from-cyan-400/20 to-blue-600/20 px-2.5 py-0.5 text-[11px] font-black text-cyan-700 dark:text-cyan-300">
              💰 {selectedRole.salary}
            </span>
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={input} placeholder="Full Name *" value={f.name} onChange={(e) => up("name", e.target.value)} required />
            <input className={input} placeholder="Mobile Number *" value={f.mobile} onChange={(e) => up("mobile", e.target.value)} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={input} placeholder="Email" type="email" value={f.email} onChange={(e) => up("email", e.target.value)} />
            <select className={input} value={f.role_slug} onChange={(e) => up("role_slug", e.target.value)}>
              {ROLES.map((r) => <option key={r.slug} value={r.slug}>{r.label}</option>)}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={input} placeholder="City" value={f.city} onChange={(e) => up("city", e.target.value)} />
            <input className={input} placeholder="State" value={f.state} onChange={(e) => up("state", e.target.value)} />
          </div>

          {/* Content Creator — Social Media Links */}
          {isCC && (
            <div className="space-y-3 rounded-2xl border border-purple-200/60 bg-purple-50/50 p-4 dark:border-purple-400/20 dark:bg-purple-500/5">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-700 dark:text-purple-300">
                📱 Social Media Profiles (required)
              </p>
              <p className="text-[11px] font-medium text-black/55 dark:text-white/45">
                Share your social media profiles. Our AI will analyse your reach and may offer a referral partnership.
              </p>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-lg">📸</span>
                <input className={input} placeholder="Instagram Profile URL" value={cc.instagram_url} onChange={(e) => upc("instagram_url", e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-lg">▶️</span>
                <input className={input} placeholder="YouTube Channel URL" value={cc.youtube_url} onChange={(e) => upc("youtube_url", e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-lg">👥</span>
                <input className={input} placeholder="Facebook Page URL" value={cc.facebook_url} onChange={(e) => upc("facebook_url", e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 shrink-0 text-black/40 dark:text-white/40" />
                <input className={input} placeholder="Other (LinkedIn, Twitter, etc.)" value={cc.other_url} onChange={(e) => upc("other_url", e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={input} placeholder="Total Followers (approx.)" value={cc.followers_count} onChange={(e) => upc("followers_count", e.target.value)} />
                <input className={input} placeholder="Avg. Reel/Video Views" value={cc.avg_views} onChange={(e) => upc("avg_views", e.target.value)} />
              </div>
              <input className={input} placeholder="Your Content Niche (e.g. Fashion, Tech, Food)" value={cc.niche} onChange={(e) => upc("niche", e.target.value)} />
            </div>
          )}

          {error && <p className="text-sm font-bold text-rose-600">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 py-3.5 text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50">
            {loading ? "Submitting…" : "Continue → Training & Test"}
          </button>
          <p className="text-center text-[11px] font-bold text-black/40 dark:text-white/40">
            No resume needed · Only 1-2 minutes · 3 test attempts
          </p>
        </form>
      </div>
    </main>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">Loading…</div>}>
      <ApplyForm />
    </Suspense>
  );
}
