"use client";

import React, { useMemo, useRef, useState } from "react";
import { useTheme } from "@/app/components/ThemeProvider";
import {
  Check,
  Crown,
  Gem,
  Sparkles,
  Upload,
  X,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { canGenerate } from "@/lib/checkCredits";
import { shouldDeductCredits } from "@/lib/deductCredits";

type GenerationMode = "single" | "bulk";

type UploadItem = {
  id: string;
  name: string;
  size: number;
  preview: string;
  file?: File;
};

type JewelleryIconName = 
  | "ring" | "earrings" | "necklace" | "bracelet" | "set"
  | "studio" | "whitebg" | "bridal" | "lifestyle" | "social"
  | "nomodel" | "female" | "hand" | "neck" | "editorial"
  | "closeup" | "macro" | "half" | "full" | "square" | "mobile" | "premium" | "ultra"
  | "noprops" | "box" | "marble" | "pearls" | "mirror" | "pattern";

function JewelleryIcon({ icon }: { icon: JewelleryIconName }) {
  const common = "drop-shadow-sm";

  if (icon === "ring") {
    return (
      <svg viewBox="0 0 96 96" className={`h-11 w-11 ${common}`} aria-hidden="true">
        <circle cx="48" cy="58" r="24" stroke="url(#gGold)" strokeWidth="6" fill="none" />
        <path d="M48 10l12 18-12 12-12-12 12-18Z" fill="url(#gDiamond)" />
        <defs>
          <linearGradient id="gGold" x1="24" y1="34" x2="72" y2="82"><stop stopColor="#facc15"/><stop offset=".5" stopColor="#eab308"/><stop offset="1" stopColor="#ca8a04"/></linearGradient>
          <linearGradient id="gDiamond" x1="36" y1="10" x2="60" y2="40"><stop stopColor="#22d3ee"/><stop offset=".5" stopColor="#60a5fa"/><stop offset="1" stopColor="#a78bfa"/></linearGradient>
        </defs>
      </svg>
    );
  }

  if (icon === "necklace") {
    return (
      <svg viewBox="0 0 96 96" className={`h-11 w-11 ${common}`} aria-hidden="true">
        <path d="M20 20c0 30 20 50 28 50s28-20 28-50" stroke="url(#gGold)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle cx="48" cy="74" r="10" fill="url(#gDiamond)" />
      </svg>
    );
  }

  if (icon === "earrings") {
    return (
      <svg viewBox="0 0 96 96" className={`h-11 w-11 ${common}`} aria-hidden="true">
        <path d="M30 20v20M66 20v20" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
        <circle cx="30" cy="55" r="12" fill="url(#gGold)" />
        <circle cx="66" cy="55" r="12" fill="url(#gGold)" />
        <circle cx="30" cy="55" r="5" fill="url(#gDiamond)" />
        <circle cx="66" cy="55" r="5" fill="url(#gDiamond)" />
      </svg>
    );
  }

  if (icon === "studio" || icon === "bridal" || icon === "lifestyle" || icon === "social" || icon === "whitebg") {
    return (
      <svg viewBox="0 0 96 96" className={`h-11 w-11 ${common}`} aria-hidden="true">
        <rect x="18" y="30" width="60" height="42" rx="12" fill="#075985" />
        <rect x="30" y="22" width="22" height="12" rx="5" fill="#0891b2" />
        <circle cx="48" cy="51" r="15" fill="#e0f2fe" />
        <circle cx="48" cy="51" r="9" fill="#38bdf8" />
        {icon === "bridal" && <path d="M72 21l4 8 9 2-7 6 2 9-8-5-8 5 2-9-7-6 9-2 4-8Z" fill="#f59e0b" />}
      </svg>
    );
  }

  if (icon === "mobile" || icon === "square") {
    return (
      <svg viewBox="0 0 96 96" className={`h-11 w-11 ${common}`} aria-hidden="true">
        {icon === "mobile" ? <rect x="30" y="8" width="36" height="80" rx="9" fill="#0e7490" /> : <rect x="18" y="18" width="60" height="60" rx="14" fill="#0e7490" />}
        {icon === "mobile" ? <rect x="34" y="18" width="28" height="58" rx="5" fill="#cffafe" /> : <rect x="28" y="28" width="40" height="40" rx="8" fill="#cffafe" />}
        <circle cx="48" cy="80" r="3" fill="#fff" />
      </svg>
    );
  }

  if (icon === "premium" || icon === "ultra") {
    return (
      <svg viewBox="0 0 96 96" className={`h-11 w-11 ${common}`} aria-hidden="true">
        <path d="M48 10l10 24 26 2-20 17 7 25-23-14-23 14 7-25-20-17 26-2 10-24Z" fill="url(#gStar)" />
        <path d="M48 23l6 15 16 1-12 10 4 16-14-9-14 9 4-16-12-10 16-1 6-15Z" fill="#fff" opacity=".45" />
        <defs><linearGradient id="gStar" x1="16" y1="13" x2="75" y2="77"><stop stopColor="#22d3ee"/><stop offset=".55" stopColor="#3b82f6"/><stop offset="1" stopColor="#a855f7"/></linearGradient></defs>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 96 96" className={`h-11 w-11 ${common}`} aria-hidden="true">
      <path d="M32 16h32l6 20 10 8-8 14 4 26H20l4-26-8-14 10-8 6-20Z" fill="url(#gCloth)" />
      <defs><linearGradient id="gCloth" x1="16" y1="16" x2="80" y2="84"><stop stopColor="#22d3ee"/><stop offset=".5" stopColor="#3b82f6"/><stop offset="1" stopColor="#a78bfa"/></linearGradient></defs>
    </svg>
  );
}

function OptionCard({
  title,
  active,
  icon,
  onClick,
  darkMode,
}: {
  title: string;
  active: boolean;
  icon: JewelleryIconName;
  onClick: () => void;
  darkMode: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[108px] flex-col items-center justify-center rounded-3xl border p-3 transition active:scale-[0.98] ${
        active
          ? "border-[#24b8ff] bg-gradient-to-br from-cyan-100 to-blue-100 shadow-lg shadow-cyan-500/15"
          : darkMode
            ? "border-white/10 bg-white/[0.04] hover:border-[#24b8ff]/70"
            : "border-black/10 bg-white/85 hover:border-[#24b8ff]/70 hover:shadow-lg hover:shadow-cyan-500/10"
      }`}
    >
      <div
        className={`mb-2 flex h-16 w-16 items-center justify-center rounded-3xl ${
          active
            ? "bg-white shadow-lg shadow-cyan-400/25"
            : darkMode
              ? "bg-white/10"
              : "bg-[#eefaff] shadow-sm"
        }`}
      >
        <JewelleryIcon icon={icon} />
      </div>

      <p
        className={`text-center text-[11px] font-bold leading-tight ${active ? "text-[#0077b6]" : darkMode ? "text-white/70" : "text-black/70"}`}
      >
        {title}
      </p>
    </button>
  );
}

export default function JewelleryAIPage() {
  const { darkMode } = useTheme();
  const { user: authUser, credits: userCredits, refreshProfile } = useAuth();

  const pageBg = darkMode
    ? "bg-[#070b14] text-white"
    : "bg-[#fff8e8] text-[#111827]";
  
  const card = darkMode
    ? "border-white/10 bg-white/[0.07] shadow-black/40"
    : "border-black/10 bg-white/75 shadow-black/10";
  
  const muted = darkMode ? "text-white/55" : "text-black/55";

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [generationMode, setGenerationMode] = useState<GenerationMode>("single");
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const [jewelleryType, setJewelleryType] = useState("Ring");
  const [outputType, setOutputType] = useState("Luxury Studio");
  const [modelType, setModelType] = useState("No Model");
  const [outputSize, setOutputSize] = useState("1080x1080");
  const [quality, setQuality] = useState("Premium");
  const [propStyle, setPropStyle] = useState("No Props");

  const [showIdentityBox, setShowIdentityBox] = useState(false);
  const [showMoodBox, setShowMoodBox] = useState(false);
  
  const [jewelleryDetails, setJewelleryDetails] = useState("");
  const [outputNotes, setOutputNotes] = useState("");
  const [modelNotes, setModelNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [generationId, setGenerationId] = useState("");
  const cancelRef = useRef(false);

  const requiredCredits = useMemo(() => {
    let base = 15;
    if (quality === "Ultra HD") base = 20;
    else if (outputSize === "1080x1920") base = 17;
    
    return generationMode === "single" ? base : Math.max(uploads.length, 1) * base;
  }, [generationMode, uploads.length, quality, outputSize]);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;

    const nextUploads: UploadItem[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
      file,
    }));

    setUploads(generationMode === "single" ? [nextUploads[0]] : nextUploads);
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setResult("");
    setShowResult(false);
    try {
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
      const filePath = `jewellery-designs/${Date.now()}-${safeFileName}`;

      const { error } = await supabase.storage
        .from("designs")
        .upload(filePath, file);

      if (error) throw error;

      const { data } = supabase.storage.from("designs").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      alert("Image upload failed.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const pollGenerationResult = async (id: string) => {
    for (let attempt = 0; attempt < 36; attempt += 1) {
      if (cancelRef.current) return null;
      const { data, error } = await supabase.from("generations").select("*").eq("id", id).single();
      if (error) console.error("Polling error:", error);
      const row = data as any;
      const finalImage = row?.output_image_url || row?.output_url || row?.image_url;
      if (row?.status === "completed" && finalImage) return finalImage as string;
      if (row?.status === "failed") throw new Error("Generation failed.");
      await new Promise((resolve) => window.setTimeout(resolve, 5000));
    }
    throw new Error("Generation timeout.");
  };

  const handleGenerate = async () => {
    if (uploads.length === 0) {
      alert("Please upload jewellery image first.");
      return;
    }

    const userId = authUser?.id;
    if (!userId) {
      alert("Please login to generate.");
      return;
    }

    setLoading(true);
    cancelRef.current = false;
    setShowResult(true);

    try {
      // Check credits
      const { data: profile } = await supabase.from("profiles").select("credits").eq("id", userId).single();
      if (!profile || (profile.credits || 0) < requiredCredits) {
        alert(`Need ${requiredCredits} credits. Please recharge.`);
        setLoading(false);
        return;
      }

      // Upload if not already uploaded (simplified for single here)
      const upload = uploads[0];
      let imageUrl = upload.preview;
      if (upload.file) {
        const url = await handleUpload(upload.file);
        if (!url) { setLoading(false); return; }
        imageUrl = url;
      }

      const newGenId = `gen-${Math.random().toString(36).slice(2, 11)}`;
      
      // Insert generation record
      await supabase.from("generations").insert([{
        id: newGenId,
        user_id: userId,
        input_image_url: imageUrl,
        jewellery_type: jewelleryType,
        output_type: outputType,
        model_type: modelType,
        prop_style: propStyle,
        output_size: outputSize,
        quality,
        status: "pending"
      }]);

      // Deduct credits
      await supabase.from("profiles").update({ credits: (profile.credits || 0) - requiredCredits }).eq("id", userId);
      refreshProfile();

      // Trigger n8n
      await fetch(process.env.NEXT_PUBLIC_N8N_PRODUCTION_WEBHOOK || "", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generation_id: newGenId,
          image_url: imageUrl,
          jewellery_type: jewelleryType,
          output_type: outputType,
          model_type: modelType,
          prop_style: propStyle,
          output_size: outputSize,
          quality,
          jewellery_details: jewelleryDetails,
          output_notes: outputNotes,
          model_notes: modelNotes
        })
      });

      const finalUrl = await pollGenerationResult(newGenId);
      if (finalUrl) setResult(finalUrl);

    } catch (err) {
      console.error(err);
      alert("Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`relative min-h-screen overflow-hidden ${pageBg}`}>
      {/* Background patterns */}
      <div
        className={`absolute inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.16]"}`}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />
      <div
        className={`absolute inset-0 ${
          darkMode
            ? "bg-[radial-gradient(circle_at_top_left,#00d4ff22,transparent_34%),radial-gradient(circle_at_top_right,#7c3cff22,transparent_34%)]"
            : "bg-[radial-gradient(circle_at_top_left,#06b6d433,transparent_34%),radial-gradient(circle_at_top_right,#fde04766,transparent_34%)]"
        }`}
      />

      <div className="relative z-10">
        <section className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
          <div>
            <div
              className={`mb-5 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${darkMode ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-200" : "border border-cyan-700/20 bg-cyan-500/15 text-cyan-900"}`}
            >
              AgentForge • Jewellery AI Studio
            </div>

            <h2 className="max-w-3xl text-5xl font-black leading-tight tracking-tight lg:text-7xl">
              Upload Jewellery.
              <span className="block bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Get Royal Shots.
              </span>
              Grow Premium.
            </h2>

            <p className={`mt-6 max-w-xl text-lg leading-8 ${muted}`}>
              Transform your jewellery product images into luxury shots, bridal campaigns, and polished social creatives — all inside one refined royal workflow.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#studio"
                className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-4 font-black text-black shadow-xl shadow-cyan-500/25 transition hover:scale-105 active:scale-95"
              >
                Start Generating
              </a>
              <Link
                href="/gallery"
                className={`rounded-full px-7 py-4 font-black transition hover:scale-105 ${darkMode ? "bg-white/10 text-white" : "bg-white text-black shadow-xl shadow-black/5"}`}
              >
                View Gallery
              </Link>
            </div>
          </div>

          <div
            className={`rounded-[2rem] border p-5 shadow-2xl backdrop-blur-xl ${card}`}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div
                className={`flex min-h-80 items-center justify-center rounded-[1.5rem] border p-6 transition-transform hover:scale-[1.02] ${darkMode ? "border-white/10 bg-black/25" : "border-black/10 bg-[#fffaf0]"}`}
              >
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-100 to-blue-50 shadow-inner">
                    <JewelleryIcon icon="ring" />
                  </div>
                  <p className="font-semibold">Jewellery Identity</p>
                  <p className={`mt-1 text-sm ${muted}`}>
                    Preserve exact stone, metal, and product character.
                  </p>
                </div>
              </div>

              <div className="flex min-h-80 items-center justify-center rounded-[1.5rem] border border-cyan-300/30 bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-purple-500/20 p-6 transition-transform hover:scale-[1.02]">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-44 w-28 items-center justify-center rounded-full bg-gradient-to-b from-cyan-200 via-blue-400 to-purple-500 shadow-lg shadow-cyan-400/30 text-white">
                    <Crown className="h-10 w-10 drop-shadow-md" />
                  </div>
                  <p className="font-semibold">Royal Output</p>
                  <p className={`mt-1 text-sm ${muted}`}>
                    Get premium, campaign-ready royal visuals instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="studio" className="mx-auto max-w-7xl px-5 py-8">
          <div
            className={`rounded-[2.5rem] border p-6 shadow-2xl backdrop-blur-xl lg:p-10 ${card}`}
          >
            <div className="mb-10">
              <h3 className="text-4xl font-black">Create Your Royal Shot</h3>
              <p className={`mt-2 ${muted}`}>
                Upload your jewellery product, choose your royal setting, and create a premium luxury shot.
              </p>
            </div>

            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-6">
                <label
                  className={`flex min-h-[430px] cursor-pointer items-center justify-center rounded-[2rem] border-2 border-dashed p-6 text-center transition-all hover:bg-cyan-500/5 ${darkMode ? "border-white/15 bg-black/20" : "border-black/15 bg-slate-50"}`}
                >
                  {uploads.length > 0 ? (
                    <div className="grid w-full grid-cols-1 gap-4">
                      {uploads.map((item) => (
                        <div key={item.id} className="relative aspect-square overflow-hidden rounded-2xl shadow-lg">
                          <img src={item.preview} alt={item.name} className="h-full w-full object-contain" />
                          <button
                            onClick={(e) => { e.stopPropagation(); removeUpload(item.id); }}
                            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white text-rose-600 shadow-xl flex items-center justify-center"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-xl shadow-cyan-500/25">
                        <Upload className="h-10 w-10" />
                      </div>
                      <p className="text-xl font-black">Drop Jewellery Image</p>
                      <p className={`mt-2 text-sm ${muted}`}>PNG, JPG or WEBP (Max 20MB)</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple={generationMode === "bulk"}
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                  />
                </label>

                <div className="space-y-4">
                  <div className={`rounded-2xl border p-5 ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-black/10 bg-white/80"}`}>
                    <button
                      type="button"
                      onClick={() => setShowIdentityBox(!showIdentityBox)}
                      className="flex w-full items-center justify-between text-left font-black"
                    >
                      <span className="flex items-center gap-3">💎 Identity Protection</span>
                      <ChevronDown className={`h-5 w-5 transition-transform ${showIdentityBox ? "rotate-180" : ""}`} />
                    </button>
                    {showIdentityBox && (
                      <textarea
                        value={jewelleryDetails}
                        onChange={(e) => setJewelleryDetails(e.target.value)}
                        placeholder="Describe stone color, metal finish, and patterns to protect..."
                        className={`mt-4 w-full rounded-xl border px-4 py-3 outline-none transition focus:border-cyan-400 ${darkMode ? "border-white/10 bg-black/30 text-white" : "border-black/10 bg-slate-50 text-black"}`}
                        rows={3}
                      />
                    )}
                  </div>

                  <div className={`rounded-2xl border p-5 ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-black/10 bg-white/80"}`}>
                    <button
                      type="button"
                      onClick={() => setShowMoodBox(!showMoodBox)}
                      className="flex w-full items-center justify-between text-left font-black"
                    >
                      <span className="flex items-center gap-3">✨ Royal Mood & Stylist</span>
                      <ChevronDown className={`h-5 w-5 transition-transform ${showMoodBox ? "rotate-180" : ""}`} />
                    </button>
                    {showMoodBox && (
                      <div className="mt-4 space-y-4">
                        <textarea
                          value={modelNotes}
                          onChange={(e) => setModelNotes(e.target.value)}
                          placeholder="Model makeup, pose, editorial mood..."
                          className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:border-cyan-400 ${darkMode ? "border-white/10 bg-black/30 text-white" : "border-black/10 bg-slate-50 text-black"}`}
                          rows={2}
                        />
                        <textarea
                          value={outputNotes}
                          onChange={(e) => setOutputNotes(e.target.value)}
                          placeholder="Cinematic finish, bridal warmth..."
                          className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:border-cyan-400 ${darkMode ? "border-white/10 bg-black/30 text-white" : "border-black/10 bg-slate-50 text-black"}`}
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <section>
                  <h4 className="mb-4 font-black uppercase tracking-widest text-cyan-600 text-[10px]">
                    1. Select Jewellery Identity
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {["Ring", "Earrings", "Necklace", "Bracelet", "Set"].map((item) => (
                      <OptionCard
                        key={item}
                        title={item}
                        active={jewelleryType === item}
                        icon={item.toLowerCase() as any}
                        onClick={() => setJewelleryType(item)}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="mb-4 font-black uppercase tracking-widest text-cyan-600 text-[10px]">
                    2. Select Output Direction
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {["Luxury Studio", "White BG", "Bridal", "Lifestyle", "Social"].map((item) => (
                      <OptionCard
                        key={item}
                        title={item}
                        active={outputType === item}
                        icon={item.toLowerCase().replace(" ", "") as any}
                        onClick={() => setOutputType(item)}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="mb-4 font-black uppercase tracking-widest text-cyan-600 text-[10px]">
                    3. Model & Frame
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {["No Model", "Female", "Hand", "Neck", "Editorial"].map((item) => (
                      <OptionCard
                        key={item}
                        title={item}
                        active={modelType === item}
                        icon={item.toLowerCase().replace(" ", "") as any}
                        onClick={() => setModelType(item)}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="mb-4 font-black uppercase tracking-widest text-cyan-600 text-[10px]">
                    4. Royal Props
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {["No Props", "Box", "Marble", "Pearls", "Mirror"].map((item) => (
                      <OptionCard
                        key={item}
                        title={item}
                        active={propStyle === item}
                        icon={item.toLowerCase().replace(" ", "") as any}
                        onClick={() => setPropStyle(item)}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="mb-4 font-black uppercase tracking-widest text-cyan-600 text-[10px]">
                    5. Output & Quality
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase text-slate-400">Select Size</p>
                      <div className="grid grid-cols-2 gap-3">
                        {["Square (1:1)", "Mobile (9:16)"].map((item) => (
                          <OptionCard
                            key={item}
                            title={item}
                            active={outputSize === (item.includes("1:1") ? "1080x1080" : "1080x1920")}
                            icon={item.includes("1:1") ? "square" : "mobile"}
                            onClick={() => setOutputSize(item.includes("1:1") ? "1080x1080" : "1080x1920")}
                            darkMode={darkMode}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase text-slate-400">Select Quality</p>
                      <div className="grid grid-cols-2 gap-3">
                        {["Premium", "Ultra HD"].map((item) => (
                          <OptionCard
                            key={item}
                            title={item}
                            active={quality === item}
                            icon={item.toLowerCase().replace(" ", "") as any}
                            onClick={() => setQuality(item)}
                            darkMode={darkMode}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="pt-4">
                  <button
                    disabled={loading || uploading}
                    onClick={handleGenerate}
                    className={`flex w-full items-center justify-center gap-3 rounded-[2rem] bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 py-6 text-base font-black text-white shadow-2xl shadow-cyan-500/25 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50`}
                  >
                    {loading ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Generating Royal Shot...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        <span>Start Royal Generation ({requiredCredits} Credits)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-10">
          <div className="grid gap-8 lg:grid-cols-1">
             <aside className="grid gap-8 lg:grid-cols-2">
                <div className={`rounded-[3rem] border p-10 shadow-2xl backdrop-blur-3xl ${card}`}>
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-600">Royal Summary</p>
                      <p className="mt-2 text-3xl font-black">Studio Status</p>
                    </div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-2xl shadow-amber-500/20">
                      <Crown className="h-8 w-8" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: "Mode", value: generationMode === "single" ? "Single" : "Bulk" },
                      { label: "Jewellery", value: jewelleryType },
                      { label: "Output", value: outputType },
                      { label: "Model", value: modelType },
                      { label: "Credits", value: `🪙 ${requiredCredits}` },
                    ].map((item) => (
                      <div key={item.label} className={`flex items-center justify-between rounded-[1.5rem] border px-7 py-5 ${darkMode ? "border-white/5 bg-white/5" : "border-black/5 bg-slate-50/80"}`}>
                        <span className={`text-[11px] font-black uppercase tracking-widest ${muted}`}>{item.label}</span>
                        <span className="text-base font-black">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className={`rounded-[2.5rem] border p-8 ${card} border-cyan-400/20 bg-cyan-400/5`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Sparkles className="h-4 w-4 text-cyan-600" />
                      <p className="text-[11px] font-black uppercase tracking-widest text-cyan-600">Pro Tip</p>
                    </div>
                    <p className={`text-sm leading-relaxed ${muted}`}>
                      High-res source images with clean backgrounds lead to the most royal and crisp jewellery outputs.
                    </p>
                  </div>
                  
                  <div className={`rounded-[2.5rem] border p-8 ${card} border-blue-400/20 bg-blue-400/5`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Crown className="h-4 w-4 text-blue-600" />
                      <p className="text-[11px] font-black uppercase tracking-widest text-blue-600">Royal Quality</p>
                    </div>
                    <p className={`text-sm leading-relaxed ${muted}`}>
                      Every generation is processed with our Ultra-HD engine to preserve the brilliance of your gemstones.
                    </p>
                  </div>
                </div>
             </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
