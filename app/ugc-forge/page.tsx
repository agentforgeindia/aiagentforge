"use client";

import { useState } from "react";
import {
  Upload,
  Sparkles,
  Video,
  Mic,
  Camera,
  Wand2,
  MessageCircle,
  Crown,
  Loader2,
  ImageIcon,
  CheckCircle2,
} from "lucide-react";

import {
  FaInstagram,
  FaYoutube,
  FaLinkedin,
  FaWhatsapp,
} from "react-icons/fa";

const styles = [
  {
    id: "startup founder ad",
    title: "Founder Ad",
    desc: "Premium startup-style personal brand promo.",
    icon: Crown,
  },
  {
    id: "influencer reel",
    title: "Influencer Reel",
    desc: "Casual creator-style scroll-stopping UGC.",
    icon: Camera,
  },
  {
    id: "podcast promo",
    title: "Podcast Promo",
    desc: "Interview/podcast style brand conversation.",
    icon: Mic,
  },
  {
    id: "testimonial ad",
    title: "Testimonial",
    desc: "Trust-building review style content.",
    icon: MessageCircle,
  },
  {
    id: "luxury product ad",
    title: "Luxury Promo",
    desc: "Premium cinematic brand placement.",
    icon: Sparkles,
  },
  {
    id: "viral meme ad",
    title: "Viral Meme",
    desc: "Funny, relatable and shareable format.",
    icon: Video,
  },
];

const platforms = [
  { id: "instagram", label: "Instagram", icon: FaInstagram },
  { id: "youtube", label: "YouTube", icon: FaYoutube },
  { id: "linkedin", label: "LinkedIn", icon: FaLinkedin },
  { id: "whatsapp", label: "WhatsApp", icon: FaWhatsapp },
];

export default function UGCForgePage() {
  const [selectedStyle, setSelectedStyle] = useState("startup founder ad");
  const [platform, setPlatform] = useState("instagram");
  const [brandName, setBrandName] = useState("AgentForge");
  const [tone, setTone] = useState("viral");
  const [language, setLanguage] = useState("hinglish");
  const [faceUrl, setFaceUrl] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<any>(null);

  async function handleGenerate() {
    if (!faceUrl.trim()) {
      alert("Please add a face image URL first.");
      return;
    }

    const generationId = crypto.randomUUID();

    setLoading(true);
    setResult({
      success: true,
      status: "processing",
      generation_id: generationId,
      output_url: "",
      hook: "Generating your UGC hook...",
      caption: "Creating caption for your ad...",
      cta: "Preparing CTA...",
      message: "UGC ad generation started.",
    });

    try {
      const res = await fetch("/api/ugc-forge/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          generation_id: generationId,
          face_url: faceUrl,
          brand_name: brandName,
          style: selectedStyle,
          language,
          tone,
          platform,
          custom_instruction: customInstruction,
        }),
      });

      const text = await res.text();
      console.log("RAW API RESPONSE:", text);

      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      console.log("FINAL DATA:", data);

      if (!res.ok && data?.error !== "n8n returned empty response") {
        throw new Error(data?.error || "Generation failed");
      }

      setResult({
        success: true,
        status: data?.status || "processing",
        generation_id: data?.generation_id || generationId,
        output_url: data?.output_url || "",
        hook:
          data?.hook ||
          "Textile business wale, photoshoot ka kharcha bachao.",
        caption:
          data?.caption ||
          "AgentForge Textile AI turns fabric designs into premium model mockups in seconds.",
        cta: data?.cta || "Try AgentForge Textile AI today.",
        message:
          data?.message ||
          "UGC ad generation started. If image is processing, it will be available after backend completion.",
      });
    } catch (error: any) {
      setResult({
        success: false,
        status: "failed",
        output_url: "",
        hook: "Generation request could not complete.",
        caption: error?.message || "Something went wrong.",
        cta: "Please check n8n execution and try again.",
        message: error?.message || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-white">
      <section className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_35%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.20),transparent_35%)]" />

        <div className="mx-auto max-w-7xl">
          <div className="mb-8 rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-600 dark:text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                  New Agent · UGCForge AI
                </div>

                <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Create AI UGC Ads That Feel Human.
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                  Upload a creator face, choose a style, and generate premium
                  UGC-style promotional content for AgentForge, products,
                  startups, creators and brands.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                    Face → UGC Ad
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white">
                    Caption + Hook + CTA
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white">
                    9:16 Social Ready
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/60 bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 p-1 shadow-2xl shadow-blue-500/20 dark:border-white/10">
                <div className="rounded-[1.8rem] bg-white/95 p-5 dark:bg-slate-950/90">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                        Preview Mode
                      </p>
                      <h3 className="text-xl font-black">AI Creator Ad</h3>
                    </div>
                    <div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-500">
                      <Wand2 className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="aspect-[9/12] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/5">
                    {result?.output_url ? (
                      <img
                        src={result.output_url}
                        alt="UGC Generated Output"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                        <ImageIcon className="mb-4 h-14 w-14 text-slate-400" />
                        <p className="text-lg font-black">Your UGC Ad Preview</p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          {result?.message || "Generated image will appear here after processing."}
                        </p>
                      </div>
                    )}
                  </div>

                  {result && (
                    <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                      <div className="flex items-center gap-2 text-sm font-black text-emerald-600 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" />
                        {result.status === "processing" ? "Generation Started" : result.success === false ? "Generation Failed" : "Generated Successfully"}
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        {result.hook}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
              <h2 className="text-2xl font-black">1. Creator Details</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Add face image URL and brand details.
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Face Image URL
                  </label>
                  <div className="flex gap-3">
                    <input
                      value={faceUrl}
                      onChange={(e) => setFaceUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-cyan-400/30 focus:ring-4 dark:border-white/10 dark:bg-white/5"
                    />
                    <button className="rounded-2xl bg-slate-900 px-4 text-white dark:bg-white dark:text-slate-950">
                      <Upload className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Brand Name
                  </label>
                  <input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-cyan-400/30 focus:ring-4 dark:border-white/10 dark:bg-white/5"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/5"
                    >
                      <option value="hinglish">Hinglish</option>
                      <option value="english">English</option>
                      <option value="hindi">Hindi</option>
                      <option value="punjabi">Punjabi</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">Tone</label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/5"
                    >
                      <option value="viral">Viral</option>
                      <option value="luxury">Luxury</option>
                      <option value="emotional">Emotional</option>
                      <option value="funny">Funny</option>
                      <option value="corporate">Corporate</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Custom Instruction
                  </label>
                  <textarea
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                    placeholder="Example: make it look like a founder promoting AgentForge from a modern office..."
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-cyan-400/30 focus:ring-4 dark:border-white/10 dark:bg-white/5"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
                <h2 className="text-2xl font-black">2. Choose UGC Style</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Pick the creative format for this ad.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {styles.map((item) => {
                    const Icon = item.icon;
                    const active = selectedStyle === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedStyle(item.id)}
                        className={`rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-xl ${
                          active
                            ? "border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/10"
                            : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5"
                        }`}
                      >
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white">
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="font-black">{item.title}</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {item.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
                <h2 className="text-2xl font-black">3. Select Platform</h2>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {platforms.map((item) => {
                    const Icon = item.icon;
                    const active = platform === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setPlatform(item.id)}
                        className={`rounded-2xl border px-4 py-4 text-sm font-bold transition ${
                          active
                            ? "border-blue-400 bg-blue-400/10 text-blue-600 dark:text-blue-300"
                            : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                        }`}
                      >
                        <Icon className="mx-auto mb-2 h-5 w-5" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 px-6 py-4 text-base font-black text-white shadow-xl shadow-blue-500/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating UGC Ad...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5" />
                      Generate UGC Ad
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {result && (
            <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
              <h2 className="text-2xl font-black">Generated Copy</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-5 dark:bg-white/5">
                  <p className="text-sm font-bold text-cyan-500">Hook</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {result.hook}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5 dark:bg-white/5">
                  <p className="text-sm font-bold text-blue-500">Caption</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {result.caption}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5 dark:bg-white/5">
                  <p className="text-sm font-bold text-purple-500">CTA</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {result.cta}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}