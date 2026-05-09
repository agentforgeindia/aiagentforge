"use client";

import React, { useMemo, useRef, useState } from "react";
import { useTheme } from "@/app/components/ThemeProvider";
import {
  ArrowRight,
  Check,
  Crown,
  Gem,
  ImageIcon,
  Sparkles,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import Link from "next/link";

type GenerationMode = "single" | "bulk";

type UploadItem = {
  id: string;
  name: string;
  size: number;
  preview: string;
  file?: File;
};

const JEWELLERY_TYPES = [
  { label: "Ring", icon: "💍" },
  { label: "Earrings", icon: "✨" },
  { label: "Necklace", icon: "📿" },
  { label: "Bracelet", icon: "🫶" },
  { label: "Jewellery Set", icon: "👑" },
];

const OUTPUT_TYPES = [
  { label: "Luxury Studio", icon: "💠" },
  { label: "White Background", icon: "⬜" },
  { label: "Bridal Campaign", icon: "👰" },
  { label: "Premium Lifestyle", icon: "🌟" },
  { label: "Instagram Ad", icon: "📱" },
];

const MODEL_TYPES = [
  { label: "No Model", icon: "💎" },
  { label: "Female Model", icon: "👩" },
  { label: "Hand Model", icon: "🤌" },
  { label: "Neck Focus", icon: "✨" },
  { label: "Editorial Model", icon: "👑" },
];

const OUTPUT_SIZES = [
  { label: "Close-up", icon: "🔎" },
  { label: "Macro Close-up", icon: "🔬" },
  { label: "Half Frame", icon: "🖼️" },
  { label: "Full Look", icon: "📷" },
  { label: "1080 × 1080", icon: "⬛" },
];

const PROP_STYLES = [
  { label: "No Props", icon: "🚫" },
  { label: "Velvet Box", icon: "🎀" },
  { label: "Marble Base", icon: "🪨" },
  { label: "Pearls", icon: "🤍" },
  { label: "Mirror Reflection", icon: "🪞" },
];

function clsx(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function SelectionGroup({
  title,
  subtitle,
  options,
  value,
  onChange,
  darkMode,
}: {
  title: string;
  subtitle: string;
  options: { label: string; icon: string }[];
  value: string;
  onChange: (value: string) => void;
  darkMode: boolean;
}) {
  return (
    <div className={`rounded-[2rem] border p-6 shadow-xl backdrop-blur-xl ${darkMode ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-white/75"}`}>
      <div className="mb-5 px-1">
        <h3 className="text-lg font-black tracking-tight">{title}</h3>
        <p className={`mt-0.5 text-xs leading-5 ${darkMode ? "text-white/50" : "text-black/50"}`}>{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-5">
        {options.map((option) => {
          const active = value === option.label;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onChange(option.label)}
              className={clsx(
                "relative flex flex-col items-center justify-center rounded-3xl border p-3 text-center transition-all duration-300",
                active
                  ? "border-cyan-400 bg-gradient-to-br from-cyan-50 to-blue-100 shadow-lg shadow-cyan-500/15"
                  : darkMode
                    ? "border-white/10 bg-white/[0.04] hover:border-cyan-400/50"
                    : "border-black/10 bg-white/80 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/10"
              )}
            >
              <div
                className={clsx(
                  "mb-2.5 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-transform duration-300",
                  active ? "scale-110 bg-white shadow-lg shadow-cyan-400/20" : darkMode ? "bg-white/10" : "bg-cyan-50"
                )}
              >
                <span>{option.icon}</span>
              </div>
              
              <span className={clsx(
                "text-[10px] font-black uppercase tracking-widest leading-tight",
                active ? "text-cyan-700" : darkMode ? "text-white/60" : "text-black/60"
              )}>
                {option.label}
              </span>

              {active && (
                <div className="absolute top-3 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-white shadow-sm">
                  <Check className="h-2.5 w-2.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function JewelleryAIPage() {
  const { darkMode } = useTheme();

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
  const [outputSize, setOutputSize] = useState("Close-up");
  const [propStyle, setPropStyle] = useState("No Props");

  const [jewelleryDetails, setJewelleryDetails] = useState("");
  const [outputNotes, setOutputNotes] = useState("");
  const [modelNotes, setModelNotes] = useState("");

  const credits = useMemo(() => (generationMode === "single" ? 17 : Math.max(uploads.length, 1) * 17), [generationMode, uploads.length]);

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

  return (
    <main className={clsx("relative min-h-screen overflow-hidden", pageBg)}>
      {/* Background patterns exactly like first screenshot */}
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
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
          <div>
            <div
              className={`mb-6 inline-flex rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] ${darkMode ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-200" : "border border-cyan-700/20 bg-cyan-500/15 text-cyan-900"}`}
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              AgentForge • Jewellery AI Studio
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[1.1] tracking-tight lg:text-[76px]">
              Upload Jewellery.
              <span className="block bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Get Royal Shots.
              </span>
              Grow Premium.
            </h1>

            <p className={`mt-8 max-w-xl text-lg leading-relaxed ${muted}`}>
              Transform your jewellery product images into luxury shots, bridal campaigns, and polished social creatives — all inside one refined royal workflow.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#studio"
                className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-4 font-black text-black shadow-xl shadow-cyan-500/25 transition hover:scale-105 active:scale-95"
              >
                Start Studio
              </a>
              <Link
                href="/gallery"
                className={`rounded-full px-8 py-4 font-black transition hover:scale-105 ${darkMode ? "bg-white/10 text-white" : "bg-white text-black shadow-lg shadow-black/5"}`}
              >
                View Gallery
              </Link>
            </div>
          </div>

          <div
            className={`rounded-[2.5rem] border p-5 shadow-2xl backdrop-blur-xl ${card}`}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div
                className={`flex min-h-[340px] items-center justify-center rounded-[2rem] border p-6 transition-transform hover:scale-[1.02] ${darkMode ? "border-white/10 bg-black/25" : "border-black/10 bg-[#fffaf0]"}`}
              >
                <div className="text-center">
                  <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-100 to-blue-50 text-4xl shadow-inner">
                    💍
                  </div>
                  <p className="text-lg font-black">Jewellery Identity</p>
                  <p className={`mt-2 text-sm leading-6 ${muted}`}>
                    Preserve exact stone, metal, and product character.
                  </p>
                </div>
              </div>

              <div className="flex min-h-[340px] items-center justify-center rounded-[2rem] border border-cyan-300/30 bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-purple-500/20 p-6 transition-transform hover:scale-[1.02]">
                <div className="text-center">
                  <div className="mx-auto mb-5 flex h-36 w-28 items-center justify-center rounded-full bg-gradient-to-b from-cyan-200 via-blue-400 to-purple-500 shadow-2xl shadow-cyan-400/40">
                    <Crown className="h-10 w-10 text-white drop-shadow-md" />
                  </div>
                  <p className="text-lg font-black">Royal Output</p>
                  <p className={`mt-2 text-sm leading-6 ${muted}`}>
                    Get premium, campaign-ready royal visuals instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="studio" className="mx-auto max-w-7xl px-5 py-10">
          <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
            <div className="space-y-8">
              <div className={`rounded-[3rem] border p-8 shadow-2xl backdrop-blur-3xl ${card} lg:p-10`}>
                <div className="mb-10 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setGenerationMode("single")}
                    className={clsx(
                      "rounded-[20px] border px-7 py-4 text-sm font-black transition-all duration-300",
                      generationMode === "single"
                        ? "border-cyan-400 bg-cyan-500/10 text-cyan-600 shadow-lg shadow-cyan-500/10"
                        : darkMode ? "border-white/10 bg-white/5 text-white/50" : "border-black/10 bg-white text-black/50"
                    )}
                  >
                    Single Royal Creation
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenerationMode("bulk")}
                    className={clsx(
                      "rounded-[20px] border px-7 py-4 text-sm font-black transition-all duration-300",
                      generationMode === "bulk"
                        ? "border-cyan-400 bg-cyan-500/10 text-cyan-600 shadow-lg shadow-cyan-500/10"
                        : darkMode ? "border-white/10 bg-white/5 text-white/50" : "border-black/10 bg-white text-black/50"
                    )}
                  >
                    Bulk Royal Studio
                  </button>
                </div>

                <div className="grid gap-10">
                  <SelectionGroup
                    title="Jewellery Identity"
                    subtitle="Define the core product category."
                    options={JEWELLERY_TYPES}
                    value={jewelleryType}
                    onChange={setJewelleryType}
                    darkMode={darkMode}
                  />

                  <div className={`rounded-[2rem] border p-6 ${darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
                    <label className="block">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600">Identity Protection</span>
                      <textarea
                        rows={3}
                        value={jewelleryDetails}
                        onChange={(e) => setJewelleryDetails(e.target.value)}
                        placeholder="Describe stone color, metal finish, and patterns to protect..."
                        className={`mt-3 w-full rounded-2xl border px-5 py-4 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/5 ${darkMode ? "border-white/10 bg-black/40 text-white" : "border-black/10 bg-slate-50 text-black"}`}
                      />
                    </label>
                  </div>

                  <SelectionGroup
                    title="Output Direction"
                    subtitle="The final mood — campaign, catalogue, or lifestyle."
                    options={OUTPUT_TYPES}
                    value={outputType}
                    onChange={setOutputType}
                    darkMode={darkMode}
                  />

                  <div className="grid gap-8 lg:grid-cols-2">
                    <SelectionGroup
                      title="Model Direction"
                      subtitle="How the jewellery is worn."
                      options={MODEL_TYPES}
                      value={modelType}
                      onChange={setModelType}
                      darkMode={darkMode}
                    />

                    <SelectionGroup
                      title="Frame & Size"
                      subtitle="Control crop and export."
                      options={OUTPUT_SIZES}
                      value={outputSize}
                      onChange={setOutputSize}
                      darkMode={darkMode}
                    />
                  </div>

                  <SelectionGroup
                    title="Royal Props"
                    subtitle="Elevate the composition with subtle props."
                    options={PROP_STYLES}
                    value={propStyle}
                    onChange={setPropStyle}
                    darkMode={darkMode}
                  />

                  <div className="grid gap-8 lg:grid-cols-2">
                    <div className={`rounded-[2rem] border p-6 ${darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
                      <label className="block">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600">Styling Notes</span>
                        <textarea
                          rows={3}
                          value={modelNotes}
                          onChange={(e) => setModelNotes(e.target.value)}
                          placeholder="Model makeup, pose, editorial mood..."
                          className={`mt-3 w-full rounded-2xl border px-5 py-4 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/5 ${darkMode ? "border-white/10 bg-black/40 text-white" : "border-black/10 bg-slate-50 text-black"}`}
                        />
                      </label>
                    </div>

                    <div className={`rounded-[2rem] border p-6 ${darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
                      <label className="block">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600">Output Mood</span>
                        <textarea
                          rows={3}
                          value={outputNotes}
                          onChange={(e) => setOutputNotes(e.target.value)}
                          placeholder="Cinematic finish, bridal warmth..."
                          className={`mt-3 w-full rounded-2xl border px-5 py-4 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/5 ${darkMode ? "border-white/10 bg-black/40 text-white" : "border-black/10 bg-slate-50 text-black"}`}
                        />
                      </label>
                    </div>
                  </div>

                  <div className={`rounded-[2.5rem] border p-8 shadow-sm ${darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
                    <div className="mb-8 text-center">
                      <h3 className="text-2xl font-black">Royal Upload</h3>
                      <p className={`mt-1 text-sm ${muted}`}>Upload high-res product for premium results.</p>
                    </div>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer rounded-[2.5rem] border-2 border-dashed p-12 transition-all hover:bg-cyan-500/5 ${darkMode ? "border-white/10 bg-black/20 hover:border-cyan-400/50" : "border-black/10 bg-slate-50/50 hover:border-cyan-400/50"}`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        multiple={generationMode === "bulk"}
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                      />

                      <div className="flex flex-col items-center justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-2xl shadow-cyan-500/30">
                          <Upload className="h-10 w-10" />
                        </div>
                        <p className="mt-6 text-lg font-black">Drop your jewellery here</p>
                        <p className={`mt-2 text-xs ${muted}`}>PNG, JPG or WEBP (Max 20MB)</p>
                      </div>
                    </div>

                    {uploads.length > 0 && (
                      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {uploads.map((item) => (
                          <div key={item.id} className="group relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-slate-200 dark:border-white/10">
                            <img src={item.preview} alt={item.name} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeUpload(item.id); }}
                                className="h-10 w-10 rounded-full bg-white text-rose-600 shadow-xl flex items-center justify-center hover:scale-110 transition"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
              <div className={`rounded-[3rem] border p-8 shadow-2xl backdrop-blur-3xl ${card}`}>
                <div className="flex items-start justify-between mb-10">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600">Royal Summary</p>
                    <p className="mt-1 text-2xl font-black">Studio Status</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg">
                    <Crown className="h-6 w-6" />
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Mode", value: generationMode === "single" ? "Single" : "Bulk" },
                    { label: "Jewellery", value: jewelleryType },
                    { label: "Output", value: outputType },
                    { label: "Model", value: modelType },
                    { label: "Credits", value: `🪙 ${credits}` },
                  ].map((item) => (
                    <div key={item.label} className={`flex items-center justify-between rounded-[1.25rem] border px-5 py-4 ${darkMode ? "border-white/5 bg-white/5" : "border-black/5 bg-slate-50/80"}`}>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${muted}`}>{item.label}</span>
                      <span className="text-sm font-black">{item.value}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-10 w-full rounded-[1.5rem] bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 py-5 text-sm font-black text-white shadow-2xl shadow-cyan-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start Royal Generation
                </button>

                <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <Sparkles className="h-3 w-3" />
                  <span>Powered by AgentForge AI</span>
                </div>
              </div>

              <div className={`rounded-[2rem] border p-6 ${card} border-cyan-400/20 bg-cyan-400/5`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600">Pro Tip</p>
                <p className={`mt-2 text-xs leading-5 ${muted}`}>
                  High-res source images with clean backgrounds lead to the most royal and crisp jewellery outputs.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
