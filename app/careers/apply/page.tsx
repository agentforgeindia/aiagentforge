"use client";

// /careers/apply — Step 1 of the hiring flow.
// Candidate fills signup details → redirected to /careers/learn?role=X&cid=UUID
// Content Creators: video upload + AgentForge pitch script shown after submit

import { Suspense, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Link as LinkIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

const CC_PITCH_SCRIPT = `🎯 AgentForge — India's Own AI Platform for Businesses

Hi [Business Owner's Name]!

I wanted to introduce you to AgentForge — India's first AI visual studio built specifically for textile, jewellery, and product photography businesses.

━━━━━━━━━━━━━━━━━━━━━━━━━

📦 TEXTILE PRINTS TO MOCKUP
Upload your fabric print design → get realistic apparel and fabric mockups in seconds. No photoshoot. No model. No studio.
Perfect for: Fabric manufacturers, garment exporters, textile wholesalers.

💍 JEWELLERY AI PHOTOGRAPHY
Upload a simple jewellery photo → get professional studio-quality images with perfect backgrounds. Save ₹5,000+ per shoot.
Perfect for: Jewellery shops, online jewellery sellers, exporters.

📸 PRODUCTOGRAPHY AI
Any product photo → beautiful lifestyle and studio shots using AI. Ready for your website and social media in seconds.
Perfect for: E-commerce sellers, product brands, D2C businesses.

━━━━━━━━━━━━━━━━━━━━━━━━━

💡 HOW TO PITCH IT:
"Kya aap photography ke liye studio hire karte ho? AgentForge ka AI seconds mein professional photos de deta hai — fraction of the cost pe."

Or in English:
"Are you spending money on photoshoots? AgentForge's AI gives you professional visuals in seconds — for a fraction of the cost."

━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Made in India, priced for Indian businesses
✅ No photography studio needed
✅ Results in seconds, not days
✅ Plans starting from ₹99/month

🔗 Your referral link: https://aiagentforge.in/?ref=YOURCODE
💰 You earn 10% commission on every purchase they make — forever.

━━━━━━━━━━━━━━━━━━━━━━━━━

📱 WHERE TO SHARE:
• Instagram Reels / Stories — before vs. after AI photo comparison
• YouTube Shorts — "How Indian businesses are using AI for photography"
• WhatsApp Business groups for textile / jewellery traders
• LinkedIn posts targeting business owners
`;

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
  const [videoFile, setVideoFile]         = useState<File | null>(null);
  const [loading, setLoading]             = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError]                 = useState<string | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [submitted, setSubmitted]         = useState<{ candidateId: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

    const body = isCC ? { ...f, social_links: cc } : { ...f };

    const res  = await fetch("/api/careers/apply", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const json = await res.json();

    if (!json.ok) {
      setLoading(false);
      if (json.already_applied) {
        setAlreadyApplied(true);
      } else {
        setError(json.error ?? "Something went wrong.");
      }
      return;
    }

    const candidateId = json.candidate_id as string;

    // Upload demo video for CC if provided
    if (isCC && videoFile) {
      try {
        setUploadProgress("Uploading demo video…");
        const ext  = videoFile.name.split(".").pop() ?? "mp4";
        const path = `${candidateId}/demo.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("cc-demo-videos")
          .upload(path, videoFile, { upsert: true });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("cc-demo-videos").getPublicUrl(path);
          await supabase.from("candidates").update({ demo_video_url: urlData?.publicUrl ?? path }).eq("id", candidateId);
        }
      } catch (_) { /* Non-blocking — proceed even if upload fails */ }
      setUploadProgress(null);
    }

    setLoading(false);

    if (isCC) {
      setSubmitted({ candidateId }); // Show pitch script before redirecting
    } else {
      router.push(`/careers/learn?role=${f.role_slug}&cid=${candidateId}`);
    }
  }

  const input = "w-full rounded-xl border border-cyan-200/50 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 dark:border-white/10 dark:bg-[#0f1a2e] dark:text-white";
  const selectInput = `${input} [&>option]:bg-[#0f1a2e] [&>option]:text-white`;

  const selectedRole = ROLES.find(r => r.slug === f.role_slug);

  // ── CC Pitch Script screen (shown after submit) ──
  if (submitted) {
    return (
      <main className="relative min-h-screen bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#f472b644,transparent_40%),radial-gradient(circle_at_top_right,#8b5cf633,transparent_40%)]" />
        <div className="relative z-10 mx-auto max-w-2xl px-5 py-14">
          <div className="mb-6 text-center">
            <p className="text-5xl">✅</p>
            <h1 className="mt-3 text-2xl font-black">
              Application <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Submitted!</span>
            </h1>
            <p className="mt-2 text-sm font-medium text-black/60 dark:text-white/60">
              Welcome to the AgentForge Influencer Programme. Here is your pitch script — save it!
            </p>
          </div>

          <div className="rounded-3xl border-2 border-purple-300/60 bg-white/90 p-5 shadow-xl dark:border-purple-400/30 dark:bg-white/[0.06]">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">📜 Your Pitch Script</span>
            </div>
            <pre className="whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-slate-700 dark:text-slate-200" style={{ fontFamily: "inherit" }}>
              {CC_PITCH_SCRIPT}
            </pre>
            <button
              onClick={() => { navigator.clipboard.writeText(CC_PITCH_SCRIPT); }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-purple-300/60 bg-purple-50 px-4 py-1.5 text-xs font-black text-purple-700 transition hover:bg-purple-100 dark:border-purple-400/30 dark:bg-purple-400/10 dark:text-purple-300"
            >
              📋 Copy Script
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm font-bold text-black/55 dark:text-white/55">
              Next: Tour the AgentForge website, then take a short 5-question assessment about our platform.
            </p>
            <a
              href={`/careers/learn?role=${f.role_slug}&cid=${submitted.candidateId}`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 text-sm font-black text-white shadow-xl shadow-purple-500/30 transition hover:scale-[1.03] active:scale-95"
            >
              Continue to Website Tour →
            </a>
          </div>
        </div>
      </main>
    );
  }

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
            <select className={selectInput} value={f.role_slug} onChange={(e) => up("role_slug", e.target.value)}>
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

              {/* Demo Video Upload */}
              <div className="rounded-xl border border-dashed border-purple-300/70 bg-white/60 p-4 dark:border-purple-400/30 dark:bg-white/[0.04]">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-purple-700 dark:text-purple-300">
                  🎬 Demo Video (optional but recommended)
                </p>
                <p className="mt-1 text-[11px] font-medium text-black/50 dark:text-white/40">
                  Upload a short intro video showing your content style. Max 100 MB. MP4 / MOV preferred.
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                />
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="rounded-full border border-purple-300/60 bg-purple-50 px-4 py-1.5 text-xs font-black text-purple-700 transition hover:bg-purple-100 dark:border-purple-400/30 dark:bg-purple-400/10 dark:text-purple-300"
                  >
                    📂 Choose Video
                  </button>
                  {videoFile && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      ✅ {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Already applied — show info card with HR email */}
          {alreadyApplied && (
            <div className="rounded-2xl border border-amber-300/70 bg-amber-50/80 p-4 dark:border-amber-400/30 dark:bg-amber-500/5">
              <p className="text-sm font-black text-amber-800 dark:text-amber-300">⏳ Application Already Submitted</p>
              <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-black/70 dark:text-white/65">
                Your application is under review. Please wait — our HR team will call or WhatsApp you soon.
              </p>
              <p className="mt-2.5 text-[12px] font-medium text-black/60 dark:text-white/55">
                If it has been <b>more than 72 hours</b> without any response, contact us:
              </p>
              <a
                href="mailto:hr@aiagentforge.in"
                className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-400/60 bg-white px-4 py-2 text-sm font-black text-amber-700 shadow-sm transition hover:bg-amber-50 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300"
              >
                📧 hr@aiagentforge.in
              </a>
            </div>
          )}

          {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
          {uploadProgress && <p className="text-sm font-bold text-cyan-600">{uploadProgress}</p>}

          <button type="submit" disabled={loading || alreadyApplied}
            className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 py-3.5 text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50">
            {loading ? "Submitting…" : isCC ? "Submit Application →" : "Continue → Training & Test"}
          </button>
          <p className="text-center text-[11px] font-bold text-black/40 dark:text-white/40">
            {isCC ? "No test required · Get your referral code instantly if eligible" : "No resume needed · Only 1-2 minutes · 3 test attempts"}
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
