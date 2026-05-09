"use client";

import React, { useMemo, useRef, useState } from "react";
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
}: {
  title: string;
  subtitle: string;
  options: { label: string; icon: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <div className="mb-5">
        <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {options.map((option) => {
          const active = value === option.label;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onChange(option.label)}
              className={clsx(
                "rounded-2xl border px-4 py-4 text-left transition-all duration-200",
                active
                  ? "border-cyan-400 bg-gradient-to-br from-cyan-500/12 via-blue-500/10 to-purple-500/10 shadow-lg shadow-cyan-500/10"
                  : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-300 dark:border-white/10 dark:bg-slate-950/30 dark:hover:border-cyan-500/40"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      "flex h-11 w-11 items-center justify-center rounded-2xl text-lg shadow-sm",
                      active
                        ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200"
                    )}
                  >
                    <span>{option.icon}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{option.label}</span>
                </div>

                <span
                  className={clsx(
                    "mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    active
                      ? "border-cyan-500 bg-cyan-500 text-white"
                      : "border-slate-300 text-transparent dark:border-white/15"
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function JewelleryAIPage() {
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
  const [customInstruction, setCustomInstruction] = useState("");

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_right,rgba(59,130,246,0.10),transparent_25%),linear-gradient(to_bottom,#f8fbff,white)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.15),transparent_25%),radial-gradient(circle_at_right,rgba(59,130,246,0.14),transparent_20%),linear-gradient(to_bottom,#020617,#0f172a)] dark:text-white">
      <section className="relative overflow-hidden border-b border-slate-200/70 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-400/20 dark:text-cyan-300">
                <Sparkles className="h-4 w-4" />
                AgentForge • Jewellery AI Studio
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                Create royal jewellery visuals that feel premium before the first click.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                This page is designed to help you transform a jewellery product image into luxury product shots,
                bridal campaigns, catalogue visuals, and polished social creatives — all inside one refined workflow.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xl text-white shadow-lg shadow-cyan-500/20">
                    <Gem className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-950 dark:text-white">Step 1 • Define the Jewellery</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Choose the product type and preserve the exact original identity.</p>
                </div>

                <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-xl text-white shadow-lg shadow-purple-500/20">
                    <Wand2 className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-950 dark:text-white">Step 2 • Shape the Output</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Define model, styling, framing, props, and final visual direction.</p>
                </div>

                <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-xl text-white shadow-lg shadow-amber-500/20">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-950 dark:text-white">Step 3 • Upload & Generate</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Upload the jewellery image and generate premium, ready-to-use results.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[30px] border border-slate-200/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">Royal Preview Direction</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Luxury-first, catalogue-clean, and campaign-ready.</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
                    <Crown className="h-5 w-5" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex h-24 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 text-4xl">💍</div>
                    <p className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">Product Focus</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex h-24 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 text-4xl">📿</div>
                    <p className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">Bridal Styling</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex h-24 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 text-4xl">✨</div>
                    <p className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">Campaign Finish</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[30px] border border-cyan-200 bg-cyan-50/80 p-5 shadow-sm dark:border-cyan-500/20 dark:bg-cyan-500/10">
                <p className="text-sm font-semibold text-slate-950 dark:text-white">Non-negotiable rule</p>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  The uploaded jewellery must remain the same. Shape, stone placement, metal tone, and key identity details should not change.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="rounded-[30px] border border-slate-200/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setGenerationMode("single")}
                  className={clsx(
                    "rounded-2xl border px-5 py-3 text-sm font-semibold transition",
                    generationMode === "single"
                      ? "border-cyan-400 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-700 dark:text-cyan-300"
                      : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  )}
                >
                  Single Creation
                </button>
                <button
                  type="button"
                  onClick={() => setGenerationMode("bulk")}
                  className={clsx(
                    "rounded-2xl border px-5 py-3 text-sm font-semibold transition",
                    generationMode === "bulk"
                      ? "border-cyan-400 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-700 dark:text-cyan-300"
                      : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  )}
                >
                  Bulk Creation
                </button>
              </div>

              <div className="grid gap-6">
                <SelectionGroup
                  title="Jewellery Identity"
                  subtitle="Start with the product itself. Define what the jewellery is before deciding how it should be presented."
                  options={JEWELLERY_TYPES}
                  value={jewelleryType}
                  onChange={setJewelleryType}
                />

                <div className="rounded-[28px] border border-slate-200/70 bg-slate-50/80 p-6 dark:border-white/10 dark:bg-white/5">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-950 dark:text-white">Jewellery Details</span>
                    <textarea
                      rows={4}
                      value={jewelleryDetails}
                      onChange={(e) => setJewelleryDetails(e.target.value)}
                      placeholder="Describe the exact jewellery details you want to protect: stone color, finish, metal tone, pattern, product character, or any no-change instructions."
                      className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-slate-950/40 dark:text-white"
                    />
                  </label>
                </div>

                <SelectionGroup
                  title="Output Direction"
                  subtitle="Now decide how the final visual should feel — campaign, catalogue, model-led, or social-ready."
                  options={OUTPUT_TYPES}
                  value={outputType}
                  onChange={setOutputType}
                />

                <div className="grid gap-6 lg:grid-cols-2">
                  <SelectionGroup
                    title="Model Direction"
                    subtitle="Choose how the jewellery should be worn or shown."
                    options={MODEL_TYPES}
                    value={modelType}
                    onChange={setModelType}
                  />

                  <SelectionGroup
                    title="Frame & Output"
                    subtitle="Control the crop and export direction."
                    options={OUTPUT_SIZES}
                    value={outputSize}
                    onChange={setOutputSize}
                  />
                </div>

                <SelectionGroup
                  title="Props & Styling Support"
                  subtitle="Use props only to elevate the composition, never to overpower the product."
                  options={PROP_STYLES}
                  value={propStyle}
                  onChange={setPropStyle}
                />

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[28px] border border-slate-200/70 bg-slate-50/80 p-6 dark:border-white/10 dark:bg-white/5">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-950 dark:text-white">Model & Styling Notes</span>
                      <textarea
                        rows={4}
                        value={modelNotes}
                        onChange={(e) => setModelNotes(e.target.value)}
                        placeholder="Example: mature female model, soft bridal makeup, elegant hand pose, premium editorial styling."
                        className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-slate-950/40 dark:text-white"
                      />
                    </label>
                  </div>

                  <div className="rounded-[28px] border border-slate-200/70 bg-slate-50/80 p-6 dark:border-white/10 dark:bg-white/5">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-950 dark:text-white">Output Notes</span>
                      <textarea
                        rows={4}
                        value={outputNotes}
                        onChange={(e) => setOutputNotes(e.target.value)}
                        placeholder="Example: luxury black background, bridal warmth, catalogue cleanliness, cinematic premium finish."
                        className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-slate-950/40 dark:text-white"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-[30px] border border-slate-200/70 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Upload Jewellery</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Upload the product after the visual direction is clear, so the generation feels intentional and premium.
                    </p>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer rounded-[32px] border-2 border-dashed border-cyan-200 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-purple-500/5 p-8 transition hover:border-cyan-300 dark:border-cyan-500/20 dark:hover:border-cyan-500/40"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple={generationMode === "bulk"}
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />

                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="flex h-18 w-18 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 p-5 text-white shadow-lg shadow-cyan-500/25">
                        <Upload className="h-8 w-8" />
                      </div>
                      <h3 className="mt-5 text-2xl font-semibold text-slate-950 dark:text-white">Upload jewellery image</h3>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                        Use a clean jewellery image with visible details. Better source quality gives cleaner premium outputs.
                      </p>
                    </div>
                  </div>

                  {uploads.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {uploads.map((item) => (
                        <div
                          key={item.id}
                          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5"
                        >
                          <div className="aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-900">
                            <img src={item.preview} alt={item.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex items-center justify-between gap-3 p-4">
                            <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.name}</div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeUpload(item.id);
                              }}
                              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:text-rose-600 dark:border-white/10 dark:text-slate-300"
                            >
                              <X className="h-4 w-4" />
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
            <div className="rounded-[30px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">Live Summary</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Royal layout, clearer placement, and a stronger premium feel.
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
                  <Crown className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  { label: "Mode", value: generationMode === "single" ? "Single" : "Bulk" },
                  { label: "Jewellery", value: jewelleryType },
                  { label: "Output", value: outputType },
                  { label: "Model", value: modelType },
                  { label: "Props", value: propStyle },
                  { label: "Credits", value: String(credits) },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <span className="text-sm text-slate-600 dark:text-slate-300">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-950 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5"
              >
                Generate Jewellery Visual
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="mt-3 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
                The page should feel royal before the result does.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
