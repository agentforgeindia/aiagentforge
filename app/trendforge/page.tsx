"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "../components/ThemeProvider";

type Trend = {
  id: string;
  title: string;
  category: string;
  tag: string;
  credits: number;
  description: string;
  prompt: string;
  visual: string;
};

const TRENDS: Trend[] = [
  {
    id: "luxury-mafia-portrait",
    title: "Luxury Mafia Portrait",
    category: "Cinematic",
    tag: "Trending",
    credits: 17,
    description: "Sharp suit, luxury crime-drama lighting, confident boss energy.",
    visual: "bg-[radial-gradient(circle_at_30%_20%,#facc15_0_10%,transparent_11%),linear-gradient(135deg,#020617,#111827,#7c2d12)]",
    prompt:
      "Use the uploaded face as the identity reference. Create a luxury mafia cinematic portrait with premium suit styling, dramatic low-key lighting, confident expression, editorial composition, sharp facial likeness, high-end magazine finish, ultra-realistic details. Keep identity consistent. No text, no watermark, no distorted face.",
  },
  {
    id: "anime-podcast-studio",
    title: "Anime Podcast Studio",
    category: "Anime Creator",
    tag: "Hot",
    credits: 17,
    description: "Anime-style creator podcast frame with studio lights and viral reel vibe.",
    visual: "bg-[radial-gradient(circle_at_25%_25%,#22d3ee_0_11%,transparent_12%),radial-gradient(circle_at_75%_35%,#a78bfa_0_12%,transparent_13%),linear-gradient(135deg,#0f172a,#312e81,#581c87)]",
    prompt:
      "Use the uploaded face as the identity reference. Transform the person into a premium anime-style podcast host inside a modern studio, cinematic microphones, LED panels, cozy creator setup, expressive confident pose, viral reel composition. Preserve recognizable facial identity. No text, no watermark, no extra fingers, no face distortion.",
  },
  {
    id: "old-money-editorial",
    title: "Old Money Editorial",
    category: "Luxury",
    tag: "Premium",
    credits: 17,
    description: "Soft luxury, beige tones, clean wealth aesthetic, editorial portrait.",
    visual: "bg-[radial-gradient(circle_at_55%_28%,#fef3c7_0_14%,transparent_15%),linear-gradient(135deg,#f8fafc,#c4b5fd,#0f172a)]",
    prompt:
      "Use the uploaded face as the identity reference. Create an old money luxury editorial portrait with elegant outfit, warm beige palette, premium lifestyle background, natural confident expression, soft film lighting, Vogue-style composition, ultra-realistic finish. Preserve face identity. No text, no watermark.",
  },
  {
    id: "punjabi-superstar-poster",
    title: "Punjabi Superstar Poster",
    category: "Music Poster",
    tag: "India",
    credits: 17,
    description: "Music-video star energy with bold lighting and poster-grade attitude.",
    visual: "bg-[radial-gradient(circle_at_30%_30%,#fb7185_0_12%,transparent_13%),radial-gradient(circle_at_70%_30%,#22d3ee_0_10%,transparent_11%),linear-gradient(135deg,#111827,#1d4ed8,#7c3aed)]",
    prompt:
      "Use the uploaded face as the identity reference. Create a Punjabi superstar cinematic poster look, stylish outfit, confident music-video pose, bold neon rim lighting, premium poster composition, realistic skin texture, viral Instagram aesthetic. Keep face identity accurate. No text, no watermark, no logo.",
  },
  {
    id: "royal-wedding-look",
    title: "Royal Wedding Look",
    category: "Wedding",
    tag: "Couple Ready",
    credits: 17,
    description: "Regal wedding portrait styling with royal lighting and luxury fabric mood.",
    visual: "bg-[radial-gradient(circle_at_50%_25%,#fde68a_0_12%,transparent_13%),linear-gradient(135deg,#450a0a,#7f1d1d,#f59e0b)]",
    prompt:
      "Use the uploaded face as the identity reference. Create a royal wedding portrait with luxury ethnic styling, regal lighting, premium fabric details, cinematic background, elegant expression, high-end wedding editorial finish. Preserve identity and natural face structure. No text, no watermark.",
  },
  {
    id: "fitness-cinematic",
    title: "Fitness Cinematic",
    category: "Lifestyle",
    tag: "Reel Ready",
    credits: 17,
    description: "Athletic transformation with dramatic gym lighting and motivational feel.",
    visual: "bg-[radial-gradient(circle_at_35%_25%,#67e8f9_0_10%,transparent_11%),linear-gradient(135deg,#020617,#064e3b,#111827)]",
    prompt:
      "Use the uploaded face as the identity reference. Create a cinematic fitness portrait with athletic styling, dramatic gym lighting, powerful confident pose, premium motivational poster look, realistic physique styling without exaggeration, sharp editorial details. Preserve face identity. No text, no watermark.",
  },
];

export default function TrendForgePage() {
  const { darkMode } = useTheme();
  const router = useRouter();
  const [selectedTrend, setSelectedTrend] = useState<Trend>(TRENDS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState("");

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode ? "border-white/10 bg-white/[0.07] shadow-black/40" : "border-black/10 bg-white/80 shadow-black/10";
  const softCard = darkMode ? "border-white/10 bg-white/[0.05]" : "border-black/10 bg-white/70";
  const muted = darkMode ? "text-white/65" : "text-black/60";

  const trendingStats = useMemo(
    () => ["No prompt needed", "17 credits / generation", "Saved to My Creations", "Daily trend drops"],
    [],
  );

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const pickedFile = event.target.files?.[0];
    setError("");
    setResultUrl("");

    if (!pickedFile) return;
    if (!pickedFile.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    setFile(pickedFile);
    setPreviewUrl(URL.createObjectURL(pickedFile));
  }

  async function uploadImage(userId: string) {
    if (!file) throw new Error("Please upload your photo first.");

    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `trendforge/${userId}/${Date.now()}-${selectedTrend.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("generation-uploads")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("generation-uploads").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleGenerate() {
    try {
      setError("");
      setResultUrl("");
      setIsGenerating(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.push("/login");
        return;
      }

      const imageUrl = await uploadImage(user.id);

      const response = await fetch("/api/trendforge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          image_url: imageUrl,
          trend_id: selectedTrend.id,
          trend_name: selectedTrend.title,
          trend_category: selectedTrend.category,
          hidden_prompt: selectedTrend.prompt,
          credits: selectedTrend.credits,
          generation_type: "trendforge",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Generation failed. Please try again.");
      }

      setResultUrl(data.image_url || data.output_url || "");
    } catch (err: any) {
      setError(err?.message || "Something went wrong while generating your viral image.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.08))]" />
      <div
        className={`fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.14]"}`}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-12 md:py-16">
        <section className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-black text-cyan-600">
              🔥 AgentForge Special Agent
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-tight md:text-7xl">
              TrendForge AI
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Select Trend. Upload Photo. Generate.
              </span>
            </h1>

            <p className={`mt-6 max-w-3xl text-lg leading-8 ${muted}`}>
              Create viral AI photos from your own image. No prompt box, no editing headache, no complicated settings. Pick the trend, upload your photo, and AgentForge handles the full hidden prompt system.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {trendingStats.map((item) => (
                <span key={item} className={`rounded-full border px-4 py-2 text-sm font-bold ${softCard}`}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className={`rounded-[2rem] border p-5 shadow-2xl backdrop-blur-xl ${card}`}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Create Viral Photo</h2>
                <p className={`mt-1 text-sm ${muted}`}>Choose one trend and upload your photo.</p>
              </div>
              <span className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 text-xs font-black text-white">
                {selectedTrend.credits} Credits
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className={`group flex min-h-[330px] cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed p-5 text-center transition hover:border-cyan-400 ${softCard}`}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Uploaded preview" className="h-[290px] w-full rounded-[1.35rem] object-cover" />
                ) : (
                  <div>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/15 text-3xl">
                      📸
                    </div>
                    <p className="text-xl font-black">Upload your photo</p>
                    <p className={`mx-auto mt-2 max-w-xs text-sm leading-6 ${muted}`}>
                      Selfie, portrait, couple image, or creator photo. Clear face gives better result.
                    </p>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
              </label>

              <div className={`overflow-hidden rounded-[1.75rem] border ${softCard}`}>
                <div className={`h-[210px] ${selectedTrend.visual}`} />
                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-black text-red-500">
                      {selectedTrend.tag}
                    </span>
                    <span className={`text-xs font-bold ${muted}`}>{selectedTrend.category}</span>
                  </div>
                  <h3 className="text-2xl font-black">{selectedTrend.title}</h3>
                  <p className={`mt-2 min-h-[48px] text-sm leading-6 ${muted}`}>{selectedTrend.description}</p>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={!file || isGenerating}
                    className="mt-5 w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-4 font-black text-white shadow-xl shadow-cyan-500/25 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isGenerating ? "Generating viral image..." : "Generate Viral Image"}
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-500">{error}</p>}

            {resultUrl && (
              <div className={`mt-5 rounded-[1.75rem] border p-4 ${softCard}`}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-black">Generated Output</h3>
                  <Link href="/my-creations" className="text-sm font-black text-cyan-600">
                    View My Creations →
                  </Link>
                </div>
                <img src={resultUrl} alt="TrendForge generated output" className="w-full rounded-[1.35rem] object-cover" />
              </div>
            )}
          </div>
        </section>

        <section className="py-14">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-4xl font-black">Choose Today’s Viral Trend</h2>
              <p className={`mt-3 max-w-2xl leading-7 ${muted}`}>
                These cards work like hidden prompt templates. User only sees the trend name; the actual prompt stays inside AgentForge.
              </p>
            </div>
            <span className="w-fit rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-black text-cyan-600">
              More trends can be added from admin later
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TRENDS.map((trend) => {
              const active = selectedTrend.id === trend.id;
              return (
                <button
                  key={trend.id}
                  type="button"
                  onClick={() => {
                    setSelectedTrend(trend);
                    setResultUrl("");
                    setError("");
                  }}
                  className={`group overflow-hidden rounded-[2rem] border text-left shadow-xl backdrop-blur-xl transition hover:-translate-y-1 ${
                    active ? "border-cyan-400 bg-cyan-400/10 shadow-cyan-500/20" : card
                  }`}
                >
                  <div className={`h-44 ${trend.visual}`} />
                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-600">
                        {trend.category}
                      </span>
                      {active && <span className="text-sm font-black text-cyan-600">Selected</span>}
                    </div>
                    <h3 className="text-2xl font-black">{trend.title}</h3>
                    <p className={`mt-2 text-sm leading-6 ${muted}`}>{trend.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className={`rounded-[2rem] border p-8 text-center shadow-xl backdrop-blur-xl ${card}`}>
          <h2 className="text-4xl font-black">How TrendForge Works</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              ["01", "Select Trend", "Pick a viral template from AgentForge trend library."],
              ["02", "Upload Photo", "Upload clear photo. No prompt or manual styling required."],
              ["03", "Generate", "AI applies hidden trend prompt and creates your output."],
            ].map(([num, title, desc]) => (
              <div key={title} className={`rounded-3xl border p-6 ${softCard}`}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/20 text-sm font-black text-cyan-600">
                  {num}
                </div>
                <h3 className="text-xl font-black">{title}</h3>
                <p className={`mt-2 text-sm leading-6 ${muted}`}>{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
