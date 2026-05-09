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

type JewelleryIconName = 
  | "ring" | "earrings" | "necklace" | "bracelet" | "set"
  | "studio" | "whitebg" | "bridal" | "lifestyle" | "social"
  | "nomodel" | "female" | "hand" | "neck" | "editorial"
  | "closeup" | "macro" | "half" | "full" | "square"
  | "noprops" | "box" | "marble" | "pearls" | "mirror";

function JewelleryIcon({ icon, active, darkMode }: { icon: JewelleryIconName; active: boolean; darkMode: boolean }) {
  const primary = active ? "#0ea5e9" : (darkMode ? "#cbd5e1" : "#475569");
  const secondary = active ? "#38bdf8" : (darkMode ? "#94a3b8" : "#64748b");
  
  const common = "h-10 w-10 drop-shadow-sm transition-colors duration-300";

  switch (icon) {
    case "ring":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="14" r="7" />
          <path d="M12 7l-2-2 2-2 2 2-2 2z" fill={secondary} />
        </svg>
      );
    case "earrings":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <circle cx="7" cy="18" r="3" fill={active ? secondary : "none"} />
          <circle cx="17" cy="18" r="3" fill={active ? secondary : "none"} />
          <path d="M7 15V7M17 15V7" />
        </svg>
      );
    case "necklace":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <path d="M6 3c0 6 3 10 6 10s6-4 6-10" />
          <circle cx="12" cy="17" r="4" fill={secondary} opacity={active ? 1 : 0.6} />
        </svg>
      );
    case "bracelet":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <ellipse cx="12" cy="12" rx="10" ry="4" />
          <path d="M12 8a4 4 0 0 1 0 8" fill={secondary} />
        </svg>
      );
    case "set":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="1.5">
          <path d="M12 2L4 10l8 8 8-8-8-8z" fill={secondary} />
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
      );
    case "studio":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" fill={secondary} />
        </svg>
      );
    case "whitebg":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 12h18" opacity="0.3" />
        </svg>
      );
    case "bridal":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={secondary} opacity="0.4" />
          <path d="M12 8l2 2-2 2-2-2 2-2z" fill={active ? "#fff" : primary} />
        </svg>
      );
    case "lifestyle":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={secondary} />
        </svg>
      );
    case "social":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <circle cx="12" cy="18" r="1" />
        </svg>
      );
    case "nomodel":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <path d="M6 3h12l4 6-10 12L2 9z" fill={secondary} opacity="0.5" />
          <path d="M12 3v18M2 9h20" opacity="0.3" />
        </svg>
      );
    case "female":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
          <path d="M12 14c-4.4 0-8 3.6-8 8h16c0-4.4-3.6-8-8-8z" fill={secondary} />
        </svg>
      );
    case "hand":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10V5a2 2 0 0 0-4 0v5M6 11V8a2 2 0 0 0-4 0v10a7 7 0 0 0 14 0v-7a2 2 0 0 0-4 0" fill={secondary} opacity="0.3" />
        </svg>
      );
    case "neck":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <path d="M4 2c2 8 8 12 8 12s6-4 8-12" />
          <path d="M12 14c-4 0-7 3-7 7h14c0-4-3-7-7-7z" fill={secondary} opacity="0.4" />
        </svg>
      );
    case "editorial":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" fill={secondary} />
        </svg>
      );
    case "closeup":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <path d="M11 8v6M8 11h6" opacity="0.5" />
        </svg>
      );
    case "macro":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
          <path d="M12 7v10M7 12h10" fill={secondary} opacity="0.3" />
          <circle cx="12" cy="12" r="3" fill={primary} />
        </svg>
      );
    case "half":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 12h18" strokeDasharray="4 4" />
          <path d="M12 3v18" opacity="0.2" />
        </svg>
      );
    case "full":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <path d="M15 3h6v6M9 21H3v-6M21 15v6h-6M3 9V3h6" />
          <rect x="7" y="7" width="10" height="10" rx="1" fill={secondary} opacity="0.3" />
        </svg>
      );
    case "square":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="2" fill={secondary} opacity={active ? 0.4 : 0.1} />
          <path d="M4 12h16M12 4v16" opacity="0.2" />
        </svg>
      );
    case "noprops":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      );
    case "box":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <path d="M21 8l-9-4-9 4 9 4 9-4z" />
          <path d="M3 8v8l9 4 9-4V8" />
          <path d="M12 12v8" />
          <path d="M12 4v8" opacity="0.3" />
        </svg>
      );
    case "marble":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <path d="M2 20h20l-2-12h-16z" fill={secondary} opacity="0.3" />
          <path d="M6 12h12M9 16h6" opacity="0.5" />
        </svg>
      );
    case "pearls":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="1.5">
          <circle cx="6" cy="12" r="3" fill={secondary} />
          <circle cx="12" cy="12" r="3.5" fill={primary} />
          <circle cx="18" cy="12" r="3" fill={secondary} />
        </svg>
      );
    case "mirror":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke={primary} strokeWidth="2">
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <path d="M8 12l3 3 5-5" stroke={secondary} />
        </svg>
      );
    default:
      return <Gem className={common} color={primary} />;
  }
}

const JEWELLERY_TYPES: { label: string; icon: JewelleryIconName }[] = [
  { label: "Ring", icon: "ring" },
  { label: "Earrings", icon: "earrings" },
  { label: "Necklace", icon: "necklace" },
  { label: "Bracelet", icon: "bracelet" },
  { label: "Jewellery Set", icon: "set" },
];

const OUTPUT_TYPES: { label: string; icon: JewelleryIconName }[] = [
  { label: "Luxury Studio", icon: "studio" },
  { label: "White Background", icon: "whitebg" },
  { label: "Bridal Campaign", icon: "bridal" },
  { label: "Premium Lifestyle", icon: "lifestyle" },
  { label: "Instagram Ad", icon: "social" },
];

const MODEL_TYPES: { label: string; icon: JewelleryIconName }[] = [
  { label: "No Model", icon: "nomodel" },
  { label: "Female Model", icon: "female" },
  { label: "Hand Model", icon: "hand" },
  { label: "Neck Focus", icon: "neck" },
  { label: "Editorial Model", icon: "editorial" },
];

const OUTPUT_SIZES: { label: string; icon: JewelleryIconName }[] = [
  { label: "Close-up", icon: "closeup" },
  { label: "Macro Close-up", icon: "macro" },
  { label: "Half Frame", icon: "half" },
  { label: "Full Look", icon: "full" },
  { label: "1080 × 1080", icon: "square" },
];

const PROP_STYLES: { label: string; icon: JewelleryIconName }[] = [
  { label: "No Props", icon: "noprops" },
  { label: "Velvet Box", icon: "box" },
  { label: "Marble Base", icon: "marble" },
  { label: "Pearls", icon: "pearls" },
  { label: "Mirror Reflection", icon: "mirror" },
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
  options: { label: string; icon: JewelleryIconName }[];
  value: string;
  onChange: (value: string) => void;
  darkMode: boolean;
}) {
  return (
    <div className={`rounded-[2rem] border p-8 shadow-xl backdrop-blur-xl ${darkMode ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-white/75"}`}>
      <div className="mb-6 px-1">
        <h3 className="text-xl font-black tracking-tight">{title}</h3>
        <p className={`mt-1 text-xs leading-5 ${darkMode ? "text-white/50" : "text-black/50"}`}>{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {options.map((option) => {
          const active = value === option.label;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onChange(option.label)}
              className={clsx(
                "relative flex min-h-[160px] flex-col items-center justify-center rounded-[2.5rem] border p-6 text-center transition-all duration-300",
                active
                  ? "border-cyan-400 bg-gradient-to-br from-cyan-50 to-blue-100 shadow-lg shadow-cyan-500/15"
                  : darkMode
                    ? "border-white/10 bg-white/[0.04] hover:border-cyan-400/50"
                    : "border-black/10 bg-white/80 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/10"
              )}
            >
              <div
                className={clsx(
                  "mb-4 flex h-20 w-20 items-center justify-center rounded-3xl transition-transform duration-300",
                  active ? "scale-110 bg-white shadow-xl shadow-cyan-400/20" : darkMode ? "bg-white/10" : "bg-cyan-50"
                )}
              >
                <JewelleryIcon icon={option.icon} active={active} darkMode={darkMode} />
              </div>
              
              <span className={clsx(
                "text-xs font-black uppercase tracking-widest leading-tight",
                active ? "text-cyan-700" : darkMode ? "text-white/60" : "text-black/60"
              )}>
                {option.label}
              </span>

              {active && (
                <div className="absolute top-5 right-5 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-white shadow-sm scale-125">
                  <Check className="h-3.5 w-3.5" />
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
        <section className="mx-auto grid max-w-[1440px] items-center gap-16 px-6 py-12 lg:grid-cols-[0.85fr_1.15fr] lg:py-24">
          <div>
            <div
              className={`mb-6 inline-flex rounded-full px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.25em] ${darkMode ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-200" : "border border-cyan-700/20 bg-cyan-500/15 text-cyan-900"}`}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AgentForge • Jewellery AI Studio
            </div>

            <h1 className="max-w-4xl text-6xl font-black leading-[1.05] tracking-tight lg:text-[88px]">
              Upload Jewellery.
              <span className="block bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Get Royal Shots.
              </span>
              Grow Premium.
            </h1>

            <p className={`mt-10 max-w-2xl text-xl leading-relaxed ${muted}`}>
              Transform your jewellery product images into luxury shots, bridal campaigns, and polished social creatives — all inside one refined royal workflow.
            </p>

            <div className="mt-12 flex flex-wrap gap-5">
              <a
                href="#studio"
                className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-10 py-5 font-black text-black shadow-2xl shadow-cyan-500/30 transition hover:scale-105 active:scale-95"
              >
                Start Studio
              </a>
              <Link
                href="/gallery"
                className={`rounded-full px-10 py-5 font-black transition hover:scale-105 ${darkMode ? "bg-white/10 text-white" : "bg-white text-black shadow-xl shadow-black/5"}`}
              >
                View Gallery
              </Link>
            </div>
          </div>

          <div
            className={`rounded-[3rem] border p-6 shadow-2xl backdrop-blur-xl ${card}`}
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div
                className={`flex min-h-[400px] items-center justify-center rounded-[2.5rem] border p-8 transition-transform hover:scale-[1.02] ${darkMode ? "border-white/10 bg-black/25" : "border-black/10 bg-[#fffaf0]"}`}
              >
                <div className="text-center">
                  <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-cyan-100 to-blue-50 shadow-inner">
                    <JewelleryIcon icon="ring" active={false} darkMode={darkMode} />
                  </div>
                  <p className="text-xl font-black">Jewellery Identity</p>
                  <p className={`mt-3 text-sm leading-7 ${muted}`}>
                    Preserve exact stone, metal, and product character for high-end cataloguing.
                  </p>
                </div>
              </div>

              <div className="flex min-h-[400px] items-center justify-center rounded-[2.5rem] border border-cyan-300/30 bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-purple-500/20 p-8 transition-transform hover:scale-[1.02]">
                <div className="text-center">
                  <div className="mx-auto mb-6 flex h-44 w-32 items-center justify-center rounded-full bg-gradient-to-b from-cyan-200 via-blue-400 to-purple-500 shadow-2xl shadow-cyan-400/50 text-white">
                    <Crown className="h-12 w-12 drop-shadow-md" />
                  </div>
                  <p className="text-xl font-black">Royal Output</p>
                  <p className={`mt-3 text-sm leading-7 ${muted}`}>
                    Get premium, campaign-ready royal visuals instantly for your luxury brand.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="studio" className="mx-auto max-w-[1440px] px-6 py-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
            <div className="space-y-10">
              <div className={`rounded-[3.5rem] border p-10 shadow-2xl backdrop-blur-3xl ${card} lg:p-12`}>
                <div className="mb-12 flex flex-wrap items-center gap-5">
                  <button
                    type="button"
                    onClick={() => setGenerationMode("single")}
                    className={clsx(
                      "rounded-[24px] border px-10 py-5 text-sm font-black transition-all duration-300",
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
                      "rounded-[24px] border px-10 py-5 text-sm font-black transition-all duration-300",
                      generationMode === "bulk"
                        ? "border-cyan-400 bg-cyan-500/10 text-cyan-600 shadow-lg shadow-cyan-500/10"
                        : darkMode ? "border-white/10 bg-white/5 text-white/50" : "border-black/10 bg-white text-black/50"
                    )}
                  >
                    Bulk Royal Studio
                  </button>
                </div>

                <div className="grid gap-12">
                  <SelectionGroup
                    title="Jewellery Identity"
                    subtitle="Define the core product category for AI protection."
                    options={JEWELLERY_TYPES}
                    value={jewelleryType}
                    onChange={setJewelleryType}
                    darkMode={darkMode}
                  />

                  <div className={`rounded-[2.5rem] border p-8 ${darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
                    <label className="block">
                      <span className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-600">Identity Protection</span>
                      <textarea
                        rows={3}
                        value={jewelleryDetails}
                        onChange={(e) => setJewelleryDetails(e.target.value)}
                        placeholder="Describe stone color, metal finish, and patterns to protect..."
                        className={`mt-4 w-full rounded-2xl border px-6 py-5 text-base outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/5 ${darkMode ? "border-white/10 bg-black/40 text-white" : "border-black/10 bg-slate-50 text-black"}`}
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

                  <div className="grid gap-10 xl:grid-cols-1 2xl:grid-cols-2">
                    <SelectionGroup
                      title="Model Direction"
                      subtitle="How the jewellery is worn by royal avatars."
                      options={MODEL_TYPES}
                      value={modelType}
                      onChange={setModelType}
                      darkMode={darkMode}
                    />

                    <SelectionGroup
                      title="Frame & Size"
                      subtitle="Control crop and professional export size."
                      options={OUTPUT_SIZES}
                      value={outputSize}
                      onChange={setOutputSize}
                      darkMode={darkMode}
                    />
                  </div>

                  <SelectionGroup
                    title="Royal Props"
                    subtitle="Elevate the composition with subtle handcrafted props."
                    options={PROP_STYLES}
                    value={propStyle}
                    onChange={setPropStyle}
                    darkMode={darkMode}
                  />

                  <div className="grid gap-10 lg:grid-cols-2">
                    <div className={`rounded-[2.5rem] border p-8 ${darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
                      <label className="block">
                        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-600">Styling Notes</span>
                        <textarea
                          rows={3}
                          value={modelNotes}
                          onChange={(e) => setModelNotes(e.target.value)}
                          placeholder="Model makeup, pose, editorial mood..."
                          className={`mt-4 w-full rounded-2xl border px-6 py-5 text-base outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/5 ${darkMode ? "border-white/10 bg-black/40 text-white" : "border-black/10 bg-slate-50 text-black"}`}
                        />
                      </label>
                    </div>

                    <div className={`rounded-[2.5rem] border p-8 ${darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
                      <label className="block">
                        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-600">Output Mood</span>
                        <textarea
                          rows={3}
                          value={outputNotes}
                          onChange={(e) => setOutputNotes(e.target.value)}
                          placeholder="Cinematic finish, bridal warmth..."
                          className={`mt-4 w-full rounded-2xl border px-6 py-5 text-base outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/5 ${darkMode ? "border-white/10 bg-black/40 text-white" : "border-black/10 bg-slate-50 text-black"}`}
                        />
                      </label>
                    </div>
                  </div>

                  <div className={`rounded-[3rem] border p-10 shadow-sm ${darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
                    <div className="mb-10 text-center">
                      <h3 className="text-3xl font-black">Royal Upload</h3>
                      <p className={`mt-2 text-sm ${muted}`}>Upload high-res product for premium results.</p>
                    </div>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer rounded-[3rem] border-2 border-dashed p-16 transition-all hover:bg-cyan-500/5 ${darkMode ? "border-white/10 bg-black/20 hover:border-cyan-400/50" : "border-black/10 bg-slate-50/50 hover:border-cyan-400/50"}`}
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
                        <div className="flex h-24 w-24 items-center justify-center rounded-[32px] bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-2xl shadow-cyan-500/30">
                          <Upload className="h-12 w-12" />
                        </div>
                        <p className="mt-8 text-xl font-black">Drop your jewellery here</p>
                        <p className={`mt-2 text-xs ${muted}`}>PNG, JPG or WEBP (Max 20MB)</p>
                      </div>
                    </div>

                    {uploads.length > 0 && (
                      <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3">
                        {uploads.map((item) => (
                          <div key={item.id} className="group relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-lg">
                            <img src={item.preview} alt={item.name} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeUpload(item.id); }}
                                className="h-12 w-12 rounded-full bg-white text-rose-600 shadow-2xl flex items-center justify-center hover:scale-110 transition"
                              >
                                <X className="h-6 w-6" />
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

            <aside className="space-y-8 xl:sticky xl:top-28 xl:h-fit">
              <div className={`rounded-[3.5rem] border p-10 shadow-2xl backdrop-blur-3xl ${card}`}>
                <div className="flex items-start justify-between mb-12">
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
                    { label: "Credits", value: `🪙 ${credits}` },
                  ].map((item) => (
                    <div key={item.label} className={`flex items-center justify-between rounded-[1.5rem] border px-7 py-5 ${darkMode ? "border-white/5 bg-white/5" : "border-black/5 bg-slate-50/80"}`}>
                      <span className={`text-[11px] font-black uppercase tracking-widest ${muted}`}>{item.label}</span>
                      <span className="text-base font-black">{item.value}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-12 w-full rounded-[2rem] bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 py-6 text-base font-black text-white shadow-2xl shadow-cyan-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start Royal Generation
                </button>

                <div className="mt-8 flex items-center justify-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">
                  <Sparkles className="h-4 w-4" />
                  <span>Powered by AgentForge AI</span>
                </div>
              </div>

              <div className={`rounded-[2.5rem] border p-8 ${card} border-cyan-400/20 bg-cyan-400/5`}>
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="h-4 w-4 text-cyan-600" />
                  <p className="text-[11px] font-black uppercase tracking-widest text-cyan-600">Pro Tip</p>
                </div>
                <p className={`text-sm leading-relaxed ${muted}`}>
                  High-res source images with clean backgrounds lead to the most royal and crisp jewellery outputs for your campaign.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
