"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  Crown,
  Diamond,
  Gem,
  Hand,
  ImageIcon,
  Layers3,
  LucideIcon,
  Package,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Square,
  Upload,
  UserRound,
  Wand2,
  X,
} from "lucide-react";
import SignupPromptPopup from "@/app/components/SignupPromptPopup";

type GenerationMode = "single" | "bulk";
type BuilderStep = 1 | 2 | 3 | 4;

type UploadItem = {
  id: string;
  name: string;
  size: number;
  preview: string;
  file?: File;
};

type OptionItem = {
  label: string;
  icon: LucideIcon;
  hint?: string;
  iconFile?: string;
};

const JEWELLERY_TYPES: OptionItem[] = [
  { label: "Ring", icon: Diamond, hint: "Hero product", iconFile: "ring" },
  { label: "Earrings", icon: Sparkles, hint: "Pair styling", iconFile: "earrings" },
  { label: "Necklace", icon: Gem, hint: "Neck focus", iconFile: "necklace" },
  { label: "Bracelet", icon: Hand, hint: "Wrist detail", iconFile: "bracelet" },
  { label: "More Options", icon: Crown, hint: "Payal, tikka, set", iconFile: "more-options" },
];

const MORE_JEWELLERY_OPTIONS = [
  "Jewellery Set",
  "Payal",
  "Tikka",
  "Mangalsutra",
  "Bangles",
  "Nose Pin",
  "Pendant",
  "Chain",
  "Anklet",
  "Kada",
];

const MODEL_USAGE_BY_JEWELLERY: Record<string, OptionItem[]> = {
  Ring: [
    { label: "No Model", icon: Package, hint: "Pure product", iconFile: "no-model" },
    { label: "Hand Model", icon: Hand, hint: "Ring close-up", iconFile: "hand-close-up" },
    { label: "Couple Hands", icon: UserRound, hint: "Engagement feel", iconFile: "couple-hands" },
    { label: "Luxury Flat Lay", icon: ImageIcon, hint: "Premium surface", iconFile: "luxury-flat-ray" },
  ],
  Earrings: [
    { label: "No Model", icon: Package, hint: "Pure product", iconFile: "no-model" },
    { label: "Ear Close-up", icon: UserRound, hint: "Wearing detail", iconFile: "ear-close-up" },
    { label: "Female Model", icon: UserRound, hint: "Wearable luxury", iconFile: "female-model" },
    { label: "Bridal Model", icon: Crown, hint: "Wedding style", iconFile: "bridal-model" },
  ],
  Necklace: [
    { label: "No Model", icon: Package, hint: "Pure product", iconFile: "no-model" },
    { label: "Neck Focus", icon: Gem, hint: "Close-up neck", iconFile: "neck-focus" },
    { label: "Female Model", icon: UserRound, hint: "Wearable luxury", iconFile: "female-model" },
    { label: "Bridal Model", icon: Crown, hint: "Heavy look", iconFile: "bridal-model" },
    { label: "Bust Portrait", icon: Camera, hint: "Face + jewellery", iconFile: "bust-portrait" },
  ],
  Bracelet: [
    { label: "No Model", icon: Package, hint: "Pure product", iconFile: "no-model" },
    { label: "Hand Model", icon: Hand, hint: "Wrist detail", iconFile: "hand-close-up" },
    { label: "Wrist Close-up", icon: ScanSearch, hint: "Texture focus", iconFile: "wrist-close-up" },
    { label: "Lifestyle Hand", icon: ImageIcon, hint: "Natural usage", iconFile: "lifestyle-hand" },
  ],
  "More Options": [
    { label: "No Model", icon: Package, hint: "Product only", iconFile: "no-model" },
    { label: "Female Model", icon: UserRound, hint: "Wearable look", iconFile: "female-model" },
    { label: "Bridal Model", icon: Crown, hint: "Wedding rich", iconFile: "bridal-model" },
    { label: "Detail Close-up", icon: ScanSearch, hint: "Jewellery focus", iconFile: "detail-close-up" },
    { label: "Editorial Scene", icon: ImageIcon, hint: "Campaign feel", iconFile: "editorial-scene" },
  ],
};

const POSE_OPTIONS: OptionItem[] = [
  { label: "Auto Pose", icon: Wand2, hint: "Best fit", iconFile: "auto-pose" },
  { label: "Front Pose", icon: UserRound, hint: "Clean front", iconFile: "front-pose" },
  { label: "Side Pose", icon: UserRound, hint: "Angle look", iconFile: "side-pose" },
  { label: "Half Body", icon: UserRound, hint: "Waist-up", iconFile: "half-body" },
  { label: "Full Body", icon: UserRound, hint: "Editorial", iconFile: "full-body" },
];

const MODEL_LOOK_OPTIONS: OptionItem[] = [
  { label: "Indian Model", icon: UserRound, hint: "Indian market", iconFile: "indian-model" },
  { label: "Bridal Look", icon: Crown, hint: "Wedding premium", iconFile: "bridal-look" },
  { label: "Luxury Editorial", icon: BadgeCheck, hint: "Fashion shoot", iconFile: "luxury-editorial" },
  { label: "Minimal Modern", icon: ShieldCheck, hint: "Clean look", iconFile: "minimal-modern" },
  { label: "Custom Look", icon: Sparkles, hint: "Type below", iconFile: "custom-look" },
];

const FACE_EXPRESSION_OPTIONS: OptionItem[] = [
  { label: "Soft Smile", icon: Sparkles, hint: "Warm face", iconFile: "soft-smile" },
  { label: "Confident", icon: BadgeCheck, hint: "Premium vibe", iconFile: "confident" },
  { label: "Serious", icon: UserRound, hint: "Editorial", iconFile: "serious" },
  { label: "Royal", icon: Crown, hint: "Bridal aura", iconFile: "royal" },
  { label: "Natural", icon: ShieldCheck, hint: "Real feel", iconFile: "natural" },
];

const SHOOT_STYLE_OPTIONS: OptionItem[] = [
  { label: "Luxury Studio", icon: Crown, hint: "Premium lights", iconFile: "luxury-studio" },
  { label: "White Catalogue", icon: Square, hint: "Clean ecommerce", iconFile: "white-catalogue" },
  { label: "Bridal Editorial", icon: Sparkles, hint: "Wedding rich", iconFile: "bridal-editorial" },
  { label: "Macro Detail", icon: ScanSearch, hint: "Stone focus", iconFile: "macro-detail" },
  { label: "Lifestyle Campaign", icon: ImageIcon, hint: "Ad creative", iconFile: "lifestyle-campaign" },
];

const ACCESSORY_OPTIONS: OptionItem[] = [
  { label: "No Accessories", icon: ShieldCheck, hint: "Clean focus", iconFile: "no-accessories" },
  { label: "Velvet Box", icon: Package, hint: "Luxury support", iconFile: "velvet-box" },
  { label: "Marble Base", icon: Square, hint: "Premium base", iconFile: "marble-base" },
  { label: "Pearls", icon: Gem, hint: "Soft richness", iconFile: "pearls" },
  { label: "Flowers", icon: Sparkles, hint: "Bridal touch", iconFile: "flowers" },
];

const FRAME_OUTPUT_OPTIONS: OptionItem[] = [
  { label: "Square 1080x1080", icon: Square, hint: "Post / catalogue", iconFile: "square" },
  { label: "Mobile 1080x1920", icon: Layers3, hint: "Story / Reel", iconFile: "mobile" },
  { label: "Premium", icon: BadgeCheck, hint: "Clean output", iconFile: "premium" },
  { label: "Ultra HD", icon: Sparkles, hint: "Sharper detail", iconFile: "ultra-hd" },
];

const builderStepMeta = [
  { id: 1 as BuilderStep, title: "Product", sub: "Type + protection" },
  { id: 2 as BuilderStep, title: "Style", sub: "Output + props" },
  { id: 3 as BuilderStep, title: "Model", sub: "Model + frame" },
  { id: 4 as BuilderStep, title: "Final", sub: "Upload + generate" },
];

const jewelleryLoadingFacts = [
  {
    title: "Gold trust factor",
    text: "Jewellery buyers notice metal tone, stone placement, reflections, and finishing first. Clean output builds trust faster.",
  },
  {
    title: "Catalogue psychology",
    text: "A premium jewellery image makes the same product feel more valuable before the customer even asks the price.",
  },
  {
    title: "AF rule",
    text: "Original jewellery shape, stone layout, polish, and metal colour should stay unchanged. Styling should support the product, not redesign it.",
  },
  {
    title: "Gold / Silver live pricing",
    text: "Show live gold and silver rates here through your pricing API. Until connected, use this as a buyer-engagement placeholder.",
  },
  {
    title: "Bridal conversion",
    text: "Bridal jewellery sells better when buyers can imagine the full look: pose, expression, outfit mood, and premium lighting.",
  },
];

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const JEWELLERY_SETTINGS_KEY = "agentforge-jewellery-ai-settings-v1";
const JEWELLERY_COMPANY_KEY = "agentforge-jewellery-ai-company-v1";

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function clsx(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function OptionCard({
  option,
  active,
  onClick,
}: {
  option: OptionItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = option.icon;
  const [iconFailed, setIconFailed] = useState(false);
  const iconSrc = option.iconFile ? `/jewellery-icon/${option.iconFile}.svg` : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "group relative flex min-h-[118px] flex-col items-center justify-center rounded-[24px] border p-3 text-center transition-all duration-300 active:scale-[0.97] sm:min-h-[145px] sm:rounded-[28px] sm:p-4",
        active
          ? "scale-[1.025] border-cyan-300 bg-gradient-to-br from-cyan-400/20 via-blue-500/15 to-purple-500/15 shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-300/60"
          : "border-slate-200 bg-white/90 hover:-translate-y-1 hover:border-cyan-300 hover:bg-white hover:shadow-xl hover:shadow-cyan-500/10 dark:border-white/10 dark:bg-white/[0.045] dark:hover:bg-white/[0.08]",
      )}
    >
      <div
        className={clsx(
          "mb-3 flex h-16 w-16 items-center justify-center rounded-[22px] transition sm:h-[76px] sm:w-[76px] sm:rounded-[26px]",
          active
            ? "bg-white/80 text-cyan-700 shadow-md shadow-cyan-400/20 dark:bg-white/[0.10] dark:text-cyan-200"
            : "bg-[#eefaff] text-cyan-700 shadow-sm shadow-cyan-500/10 dark:bg-white/[0.07] dark:text-cyan-200",
        )}
      >
        {iconSrc && !iconFailed ? (
          <img
            src={iconSrc}
            alt=""
            className="h-14 w-14 object-contain drop-shadow-md transition duration-300 group-hover:scale-110 sm:h-16 sm:w-16"
            onError={() => setIconFailed(true)}
          />
        ) : (
          <Icon className="h-8 w-8" />
        )}
      </div>
      <p className={clsx("text-[12px] font-black leading-4 sm:text-sm", active ? "text-cyan-700 dark:text-cyan-200" : "text-slate-700 dark:text-white/75")}>{option.label}</p>
      {option.hint && <p className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-white/40">{option.hint}</p>}
    </button>
  );
}

function SelectionGrid({
  title,
  subtitle,
  options,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  options: OptionItem[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[1.35rem] border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.045] sm:p-5">
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-300">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/50">{subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {options.map((option) => (
          <OptionCard key={option.label} option={option} active={value === option.label} onClick={() => onChange(option.label)} />
        ))}
      </div>
    </div>
  );
}

function TextInputBox({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block rounded-[1.35rem] border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.045]">
      <span className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-300">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400 dark:border-white/10 dark:bg-black/20"
      />
    </label>
  );
}


function FrameQualityGrid({
  outputSize,
  quality,
  setOutputSize,
  setQuality,
}: {
  outputSize: string;
  quality: string;
  setOutputSize: (value: string) => void;
  setQuality: (value: string) => void;
}) {
  return (
    <div className="rounded-[1.35rem] border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.045] sm:p-5">
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-300">Frame / Output Size + Quality</p>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/50">Mobile, square, Premium and Ultra HD in one section.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {FRAME_OUTPUT_OPTIONS.map((option) => {
          const isQuality = option.label === "Premium" || option.label === "Ultra HD";
          const active = isQuality ? quality === option.label : outputSize === option.label;
          return (
            <OptionCard
              key={option.label}
              option={option}
              active={active}
              onClick={() => {
                if (isQuality) setQuality(option.label);
                else setOutputSize(option.label);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}


function JewelleryLoadingModal({
  fact,
  progress,
}: {
  fact: { title: string; text: string };
  progress: number;
}) {
  // Floating decorative jewellery icons scattered around the popup
  const floatingIcons = [
    { Icon: Diamond,  x: "6%",  y: "10%", size: 58, delay: "0s",   rotate: -14, color: "text-cyan-400/55" },
    { Icon: Gem,      x: "86%", y: "14%", size: 66, delay: "0.7s", rotate: 16,  color: "text-purple-400/55" },
    { Icon: Sparkles, x: "10%", y: "72%", size: 50, delay: "1.2s", rotate: 8,   color: "text-amber-400/60" },
    { Icon: Crown,    x: "82%", y: "68%", size: 62, delay: "0.4s", rotate: -18, color: "text-cyan-500/55" },
    { Icon: Diamond,  x: "3%",  y: "42%", size: 42, delay: "1.5s", rotate: 22,  color: "text-pink-400/55" },
    { Icon: Sparkles, x: "92%", y: "42%", size: 46, delay: "0.9s", rotate: -8,  color: "text-blue-400/55" },
    { Icon: Gem,      x: "22%", y: "4%",  size: 38, delay: "1.8s", rotate: -20, color: "text-amber-500/55" },
    { Icon: Crown,    x: "70%", y: "3%",  size: 40, delay: "0.2s", rotate: 8,   color: "text-purple-500/55" },
    { Icon: Sparkles, x: "32%", y: "88%", size: 36, delay: "1.4s", rotate: 14,  color: "text-cyan-500/55" },
    { Icon: Diamond,  x: "62%", y: "88%", size: 44, delay: "0.55s",rotate: -10, color: "text-rose-400/55" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-4">
      {/* Transparent backdrop — page through dikhega, sirf soft glassy haze */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/40 via-white/15 to-purple-50/40 backdrop-blur-[2px]" />

      {/* Floating jewellery illustrations behind the popup */}
      {floatingIcons.map((item, i) => {
        const Icon = item.Icon;
        return (
          <div
            key={i}
            className="pointer-events-none absolute"
            style={{
              left: item.x,
              top: item.y,
              animation: `jFloat ${4.5 + i * 0.35}s ease-in-out ${item.delay} infinite, jSpin ${10 + i}s linear ${item.delay} infinite`,
            }}
          >
            <div style={{ transform: `rotate(${item.rotate}deg)` }}>
              <Icon
                size={item.size}
                strokeWidth={1.25}
                className={`${item.color} drop-shadow-[0_8px_24px_rgba(34,211,238,0.25)]`}
              />
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes jFloat {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-18px); }
        }
        @keyframes jSpin {
          0%   { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(20deg); }
        }
        @keyframes afLogoFloat {
          0%, 100% { transform: scale(1) rotate(-4deg); }
          50%      { transform: scale(1.1) rotate(4deg); }
        }
      `}</style>

      {/* The popup card itself — glassy white with cyan glow */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-cyan-200/70 bg-white/90 p-7 shadow-[0_20px_60px_-15px_rgba(34,211,238,0.45)] backdrop-blur-2xl sm:p-8">
        {/* Subtle inner glow blobs */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-purple-300/30 blur-3xl" />

        <div className="relative">
          {/* Animated AgentForge logo */}
          <div className="relative mx-auto mb-6 h-24 w-24">
            <div className="absolute inset-0 animate-ping rounded-full bg-cyan-400 opacity-30" />
            <div className="absolute -inset-2 animate-pulse rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 opacity-40 blur-2xl" />
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white shadow-2xl ring-4 ring-cyan-400/60">
              <img
                src="/logo-new.jpg"
                alt="AgentForge"
                className="h-full w-full object-cover"
                style={{ animation: "afLogoFloat 2.4s ease-in-out infinite" }}
                onError={(e) => {
                  e.currentTarget.src = "/agentforge.png";
                }}
              />
            </div>
          </div>

          <h3 className="text-center text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            AI is Crafting...
          </h3>
          <p className="mt-3 text-center text-sm leading-6 text-slate-600">
            Generating your premium jewellery visual. Please do not refresh.
          </p>

          <div className="mt-6 overflow-hidden rounded-full bg-slate-200/80">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-center text-xs font-black uppercase tracking-widest text-cyan-700">
            {progress}% processing
          </p>

          <div className="mt-6 overflow-hidden rounded-2xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50/80 via-white to-purple-50/40 p-5 text-left shadow-inner">
            <p className="text-[11px] font-black uppercase tracking-widest text-cyan-700">
              {fact.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {fact.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
      <span className="text-sm text-slate-500 dark:text-white/50">{label}</span>
      <span className="max-w-[58%] truncate text-right text-sm font-black text-slate-950 dark:text-white">{value}</span>
    </div>
  );
}

const isFreeAccountFromProfile = (profile: any): boolean => {
  const planText = String(
    profile?.plan ||
      profile?.package ||
      profile?.current_plan ||
      profile?.subscription_plan ||
      profile?.plan_name ||
      "",
  ).toLowerCase();
  const paid =
    planText.includes("empire") ||
    planText.includes("founder") ||
    planText.includes("unlimited") ||
    planText.includes("pro") ||
    planText.includes("growth") ||
    planText.includes("creator");
  return !paid;
};

export default function JewelleryAIPage() {
  const { user: authUser, credits: userCredits, refreshProfile, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const stepTopRef = useRef<HTMLDivElement | null>(null);

  const [generationMode, setGenerationMode] = useState<GenerationMode>("single");
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [builderStep, setBuilderStep] = useState<BuilderStep>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingFactIndex, setLoadingFactIndex] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(8);
  const [generatedOutputUrl, setGeneratedOutputUrl] = useState("");

  const [jewelleryType, setJewelleryType] = useState("Ring");
  const [moreJewellery, setMoreJewellery] = useState<string[]>([]);
  const [customJewellery, setCustomJewellery] = useState("");
  const [modelType, setModelType] = useState("No Model");
  const [pose, setPose] = useState("Auto Pose");
  const [modelLook, setModelLook] = useState("Indian Model");
  const [faceExpression, setFaceExpression] = useState("Soft Smile");
  const [shootStyle, setShootStyle] = useState("Luxury Studio");
  const [accessory, setAccessory] = useState("No Accessories");
  const [outputSize, setOutputSize] = useState("Square 1080x1080");
  const [quality, setQuality] = useState("Premium");

  const [customPose, setCustomPose] = useState("");
  const [customModelLook, setCustomModelLook] = useState("");
  const [customShootStyle, setCustomShootStyle] = useState("");
  const [customAccessory, setCustomAccessory] = useState("");

  const [jewelleryDetails, setJewelleryDetails] = useState("");
  const [modelNotes, setModelNotes] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");
  const [showPromptBox, setShowPromptBox] = useState(false);

  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [companyLogoPreview, setCompanyLogoPreview] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [useCompanyLogo, setUseCompanyLogo] = useState(true);
  const [useCompanyName, setUseCompanyName] = useState(true);
  const [useCompanyWebsite, setUseCompanyWebsite] = useState(true);
  const isFreeAccount = useMemo(() => isFreeAccountFromProfile(profile), [profile]);

  useEffect(() => {
    try {
      const savedSettings = window.localStorage.getItem(JEWELLERY_SETTINGS_KEY);
      const savedCompany = window.localStorage.getItem(JEWELLERY_COMPANY_KEY);

      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setGenerationMode(settings.generationMode || "single");
        setJewelleryType(settings.jewelleryType || "Ring");
        setMoreJewellery(Array.isArray(settings.moreJewellery) ? settings.moreJewellery : []);
        setCustomJewellery(settings.customJewellery || "");
        setModelType(settings.modelType || "No Model");
        setPose(settings.pose || "Auto Pose");
        setModelLook(settings.modelLook || "Indian Model");
        setFaceExpression(settings.faceExpression || "Soft Smile");
        setShootStyle(settings.shootStyle || "Luxury Studio");
        setAccessory(settings.accessory || "No Accessories");
        setOutputSize(settings.outputSize || "Square 1080x1080");
        setQuality(settings.quality || "Premium");
        setCustomPose(settings.customPose || "");
        setCustomModelLook(settings.customModelLook || "");
        setCustomShootStyle(settings.customShootStyle || "");
        setCustomAccessory(settings.customAccessory || "");
        setJewelleryDetails(settings.jewelleryDetails || "");
        setModelNotes(settings.modelNotes || "");
        setCustomInstruction(settings.customInstruction || "");
        setUseCompanyLogo(settings.useCompanyLogo ?? true);
        setUseCompanyName(settings.useCompanyName ?? true);
        setUseCompanyWebsite(settings.useCompanyWebsite ?? true);
      }

      if (savedCompany) {
        const company = JSON.parse(savedCompany);
        setCompanyLogoPreview(company.companyLogoPreview || "");
        setCompanyName(company.companyName || "");
        setCompanyWebsite(company.companyWebsite || "");
        setCompanyPhone(company.companyPhone || "");
      }
    } catch (error) {
      console.warn("Jewellery saved settings could not be loaded.", error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        JEWELLERY_SETTINGS_KEY,
        JSON.stringify({
          generationMode,
          jewelleryType,
          moreJewellery,
          customJewellery,
          modelType,
          pose,
          modelLook,
          faceExpression,
          shootStyle,
          accessory,
          outputSize,
          quality,
          customPose,
          customModelLook,
          customShootStyle,
          customAccessory,
          jewelleryDetails,
          modelNotes,
          customInstruction,
          useCompanyLogo,
          useCompanyName,
          useCompanyWebsite,
        }),
      );
    } catch (error) {
      console.warn("Jewellery settings could not be saved.", error);
    }
  }, [
    generationMode,
    jewelleryType,
    moreJewellery,
    customJewellery,
    modelType,
    pose,
    modelLook,
    faceExpression,
    shootStyle,
    accessory,
    outputSize,
    quality,
    customPose,
    customModelLook,
    customShootStyle,
    customAccessory,
    jewelleryDetails,
    modelNotes,
    customInstruction,
    useCompanyLogo,
    useCompanyName,
    useCompanyWebsite,
  ]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        JEWELLERY_COMPANY_KEY,
        JSON.stringify({
          companyLogoPreview,
          companyName,
          companyWebsite,
          companyPhone,
        }),
      );
    } catch (error) {
      console.warn("Jewellery company details could not be saved.", error);
    }
  }, [companyLogoPreview, companyName, companyWebsite, companyPhone]);
  
  


  useEffect(() => {
    if (!isGenerating) {
      setLoadingFactIndex(0);
      setGenerationProgress(8);
      return;
    }

    const factTimer = window.setInterval(() => {
      setLoadingFactIndex((current) => (current + 1) % jewelleryLoadingFacts.length);
    }, 4200);

    const progressTimer = window.setInterval(() => {
      setGenerationProgress((current) => Math.min(current + 7, 94));
    }, 1200);

    return () => {
      window.clearInterval(factTimer);
      window.clearInterval(progressTimer);
    };
  }, [isGenerating]);

  const selectedJewelleryLabel = useMemo(() => {
    if (jewelleryType !== "More Options") return customJewellery.trim() || jewelleryType;
    const selected = moreJewellery.join(", ");
    const custom = customJewellery.trim();
    return [selected, custom].filter(Boolean).join(", ") || "More Options";
  }, [customJewellery, jewelleryType, moreJewellery]);

  const dynamicModelOptions = MODEL_USAGE_BY_JEWELLERY[jewelleryType] || MODEL_USAGE_BY_JEWELLERY["More Options"];

  const credits = useMemo(() => {
    const base = quality === "Ultra HD" ? 20 : outputSize.includes("Mobile") ? 17 : 15;
    const brandingCredits =
      (useCompanyLogo && companyLogoPreview ? 1 : 0) +
      (useCompanyName && companyName.trim() ? 1 : 0) +
      (useCompanyWebsite && companyWebsite.trim() ? 1 : 0) +
      (companyPhone.trim() ? 1 : 0);

    const perImageCredits = base + brandingCredits;
    return generationMode === "single" ? perImageCredits : Math.max(uploads.length, 1) * perImageCredits;
  }, [
    generationMode,
    outputSize,
    quality,
    uploads.length,
    useCompanyLogo,
    companyLogoPreview,
    useCompanyName,
    companyName,
    useCompanyWebsite,
    companyWebsite,
    companyPhone,
  ]);

  const previewImage = uploads[0]?.preview || null;

  const toggleMoreJewellery = (item: string) => {
    setMoreJewellery((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  };

  const handleLogoUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    try {
      // Upload to Supabase so n8n + Canvas overlay can access via URL
      const publicUrl = await uploadFileToSupabase(file, "brand-logos");
      setCompanyLogoPreview(publicUrl);
    } catch (error) {
      console.error("Logo upload failed:", error);
      // Fallback: show local preview (won't work for overlay, but at least visible)
      const dataUrl = await fileToDataUrl(file);
      setCompanyLogoPreview(dataUrl);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;

    const nextUploads: UploadItem[] = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        preview: URL.createObjectURL(file),
        file,
      }));

    setUploads(generationMode === "single" ? nextUploads.slice(0, 1) : nextUploads);
    if (nextUploads.length) setBuilderStep(4);
  };

  const removeUpload = (id: string) => setUploads((prev) => prev.filter((item) => item.id !== id));

  const canGoNext =
    builderStep === 1
      ? Boolean(selectedJewelleryLabel)
      : builderStep === 2
        ? Boolean(shootStyle && accessory)
        : builderStep === 3
          ? Boolean(modelType && pose && modelLook && faceExpression && outputSize && quality)
          : true;

  const scrollToStepTop = () => {
    window.setTimeout(() => {
      stepTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const goToStep = (step: BuilderStep) => {
    setBuilderStep(step);
    scrollToStepTop();
  };

  const nextStep = () => {
    setBuilderStep((step) => Math.min(4, step + 1) as BuilderStep);
    scrollToStepTop();
  };

  const previousStep = () => {
  setBuilderStep((step) => Math.max(1, step - 1) as BuilderStep);
  scrollToStepTop();
};

const uploadFileToSupabase = async (file: File, folder: string) => {
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
  const filePath = `${folder}/${authUser?.id || "guest"}/${Date.now()}-${newId()}-${safeFileName}`;

  const { error } = await supabase.storage.from("designs").upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("designs").getPublicUrl(filePath);
  return data.publicUrl;
};

const refundCredits = async (userId: string, amount: number) => {
  const { data } = await supabase.from("profiles").select("credits").eq("id", userId).single();
  await supabase
    .from("profiles")
    .update({ credits: (data?.credits || 0) + amount })
    .eq("id", userId);
  refreshProfile?.();
};

// ============================================================
// LOGO OVERLAY (Canvas-based post-processing)
// FAL output + company logo → composite → upload → Supabase URL
// ============================================================

const loadImageAsElement = async (url: string): Promise<HTMLImageElement> => {
  // Fetch as blob to bypass CORS issues on Canvas readback
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(objectUrl);
      reject(e);
    };
    img.src = objectUrl;
  });
};

const AF_LOGO_PATH = "/af-logo.png";

const drawLogoInCorner = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  logoImg: HTMLImageElement,
  corner: "top-right" | "bottom-right" | "top-left" | "bottom-left",
  widthRatio: number,
  opacity: number = 1,
) => {
  const targetWidth = Math.round(canvasWidth * widthRatio);
  const targetHeight = Math.round(
    (logoImg.naturalHeight / logoImg.naturalWidth) * targetWidth,
  );
  const padding = Math.round(canvasWidth * 0.03);

  const x = corner.includes("right")
    ? canvasWidth - targetWidth - padding
    : padding;
  const y = corner.includes("bottom")
    ? canvasHeight - targetHeight - padding
    : padding;

  // Rounded white pill behind logo
  const pillPad = Math.round(targetWidth * 0.08);
  const r = Math.round(targetHeight * 0.18);
  const rx = x - pillPad;
  const ry = y - pillPad;
  const rw = targetWidth + pillPad * 2;
  const rh = targetHeight + pillPad * 2;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.beginPath();
  ctx.moveTo(rx + r, ry);
  ctx.lineTo(rx + rw - r, ry);
  ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + r);
  ctx.lineTo(rx + rw, ry + rh - r);
  ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - r, ry + rh);
  ctx.lineTo(rx + r, ry + rh);
  ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - r);
  ctx.lineTo(rx, ry + r);
  ctx.quadraticCurveTo(rx, ry, rx + r, ry);
  ctx.closePath();
  ctx.fill();
  ctx.drawImage(logoImg, x, y, targetWidth, targetHeight);
  ctx.restore();
};

const compositeLogoOnImage = async (
  baseImageUrl: string,
  companyLogoUrl: string | null,
  showAfWatermark: boolean,
): Promise<Blob | null> => {
  try {
    const baseImg = await loadImageAsElement(baseImageUrl);

    // Load logos in parallel; tolerate individual failures
    const [companyLogoImg, afLogoImg] = await Promise.all([
      companyLogoUrl
        ? loadImageAsElement(companyLogoUrl).catch((e) => {
            console.warn("Company logo load failed:", e);
            return null;
          })
        : Promise.resolve(null),
      showAfWatermark
        ? loadImageAsElement(AF_LOGO_PATH).catch((e) => {
            console.warn("AF logo load failed:", e);
            return null;
          })
        : Promise.resolve(null),
    ]);

    // Nothing to overlay → bail
    if (!companyLogoImg && !afLogoImg) return null;

    const canvas = document.createElement("canvas");
    canvas.width = baseImg.naturalWidth;
    canvas.height = baseImg.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 1. Base FAL output
    ctx.drawImage(baseImg, 0, 0);

    // 2. Company logo — top-right, 14% width
    if (companyLogoImg) {
      drawLogoInCorner(ctx, canvas.width, canvas.height, companyLogoImg, "top-right", 0.14, 1);
    }

    // 3. AF watermark logo — bottom-right, 10% width, slightly translucent
    if (afLogoImg) {
      drawLogoInCorner(ctx, canvas.width, canvas.height, afLogoImg, "bottom-right", 0.10, 0.88);
    }

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
    });
  } catch (error) {
    console.error("Canvas composite failed:", error);
    return null;
  }
};

const uploadBlobToSupabase = async (blob: Blob, folder: string) => {
  const filePath = `${folder}/${authUser?.id || "guest"}/${Date.now()}-${newId()}-composite.png`;
  const file = new File([blob], "composite.png", { type: "image/png" });
  const { error } = await supabase.storage.from("designs").upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("designs").getPublicUrl(filePath);
  return data.publicUrl;
};

const applyLogoOverlay = async (
  rawOutputUrl: string,
  options: {
    companyLogoUrl?: string;
    afWatermark?: boolean;
    generationId: string;
  },
): Promise<string> => {
  const { companyLogoUrl, afWatermark, generationId } = options;

  // Sanitize company logo URL — accept only real http(s) URLs
  const safeCompanyLogo =
    companyLogoUrl &&
    !companyLogoUrl.startsWith("data:") &&
    !companyLogoUrl.startsWith("blob:")
      ? companyLogoUrl
      : null;

  // Nothing to overlay → return raw
  if (!safeCompanyLogo && !afWatermark) {
    return rawOutputUrl;
  }

  try {
    const compositeBlob = await compositeLogoOnImage(
      rawOutputUrl,
      safeCompanyLogo,
      Boolean(afWatermark),
    );
    if (!compositeBlob) return rawOutputUrl;

    const compositeUrl = await uploadBlobToSupabase(
      compositeBlob,
      "jewellery-outputs",
    );

    // Persist composite URL — My Creations + downloads see the branded version
    await supabase
      .from("generations")
      .update({
        output_url: compositeUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", generationId);

    return compositeUrl;
  } catch (error) {
    console.error("Logo overlay pipeline failed, falling back to raw output:", error);
    return rawOutputUrl;
  }
};

const handleDownloadResult = async () => {
  if (!generatedOutputUrl) return;

  try {
    const response = await fetch(generatedOutputUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "agentforge-jewellery-ai.png";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    window.open(generatedOutputUrl, "_blank");
  }
};

const handleShareResult = async () => {
  if (!generatedOutputUrl) return;

  try {
    if (navigator.share) {
      await navigator.share({
        title: "AgentForge Jewellery AI",
        text: "Created with AgentForge Jewellery AI Studio",
        url: generatedOutputUrl,
      });
      return;
    }

    await navigator.clipboard.writeText(generatedOutputUrl);
    alert("Result link copied!");
  } catch (error) {
    await navigator.clipboard.writeText(generatedOutputUrl);
    alert("Result link copied!");
  }
};

const handleGenerate = async () => {
  const generationId = newId();

  try {
    if (!authUser?.id) {
      setShowSignupPopup(true);
      return;
    }

    if (!uploads.length) {
      alert("Please upload jewellery image first.");
      return;
    }
const WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_JEWELLERY_WEBHOOK_URL ||
  "https://n8n.aiagentforge.in/webhook/generate-jewellery";


    setIsGenerating(true);
    setGeneratedOutputUrl("");
    setGenerationProgress(12);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits, plan")
      .eq("id", authUser.id)
      .single();

    if (profileError || !profile) {
      alert("Profile not found.");
      return;
    }

    if ((profile.credits || 0) < credits) {
      alert(`Not enough credits. Required: ${credits}, Available: ${profile.credits || 0}`);
      return;
    }

    const { error: deductError } = await supabase
      .from("profiles")
      .update({ credits: (profile.credits || 0) - credits })
      .eq("id", authUser.id);

    if (deductError) {
      alert("Credit deduction failed.");
      return;
    }

    refreshProfile?.();
    setGenerationProgress(25);

    const uploadedImageUrls = [];
    for (const item of uploads) {
      if (!item.file) continue;
      const publicUrl = await uploadFileToSupabase(item.file, "jewellery-products");
      uploadedImageUrls.push({
        name: item.name,
        source_image_url: publicUrl,
        original_name: item.name,
      });
    }

    if (!uploadedImageUrls.length) {
      await refundCredits(authUser.id, credits);
      alert("Image upload failed. Credits refunded.");
      return;
    }

    let logoUrl = "";
    if (useCompanyLogo && companyLogoPreview) {
      logoUrl = companyLogoPreview;
    }

    const firstImageUrl = uploadedImageUrls[0]?.source_image_url || "";

    await supabase.from("generations").insert({
      id: generationId,
      user_id: authUser.id,
      status: "queued",
      design_url: firstImageUrl,
      style_type: "jewellery",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    setGenerationProgress(38);

    const sharedSettings = {
      source_image_url: firstImageUrl,
      model_image_url: "",
      has_uploaded_model: false,
      plan: String(profile.plan || "starter").toLowerCase(),
      is_pro: String(profile.plan || "").toLowerCase().includes("pro"),
      is_empire: String(profile.plan || "").toLowerCase().includes("empire"),
      jewellery_type: selectedJewelleryLabel,
      more_jewellery: moreJewellery,
      output_type: customShootStyle || shootStyle,
      model_type: modelType,
      pose: customPose || pose,
      model_look: customModelLook || modelLook,
      face_expression: faceExpression,
      shoot_style: customShootStyle || shootStyle,
      accessories: customAccessory || accessory,
      output_size: outputSize,
      output_quality: quality,
      jewellery_notes: jewelleryDetails,
      model_notes: modelNotes,
      custom_instruction: customInstruction,
      required_credits: credits,
      af_watermark: isFreeAccount,
      company_details: {
        logo_url: logoUrl,
        company_name: useCompanyName ? companyName.trim() : "",
        website: useCompanyWebsite ? companyWebsite.trim() : "",
        phone: companyPhone.trim(),
      },
    };

    const generationMode =
  uploadedImageUrls.length > 1 ? "bulk" : "single";

    const payload = {
  generation_mode: generationMode,

  generation_id: generationId,
  user_id: authUser.id,
  required_credits: credits,

  source_image_url: uploadedImageUrls[0]?.source_image_url,

  batch_id:
    generationMode === "bulk"
      ? `jewellery-${Date.now()}`
      : null,

  items: uploadedImageUrls.map((item, index) => ({
    generation_id: index === 0 ? generationId : newId(),
    source_image_url: item.source_image_url,
    model_image_url: "",
    original_name: item.original_name,
  })),

  shared_settings: sharedSettings,
};

const hasInvalidImageUrl = payload.items.some(
  (item) => !item.source_image_url || item.source_image_url.startsWith("data:")
);

if (hasInvalidImageUrl) {
  throw new Error("Image upload failed. Please upload image again.");
}

    setGenerationProgress(48);
let response;

try {
  response = await fetch("/api/jewellery/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});
} catch (err) {
  console.error("Fetch error:", err);
  throw new Error("Unable to connect to Jewellery AI server");
}

if (!response.ok) {
  const errorText = await response.text();

  console.error("Webhook error:", errorText);

  throw new Error(
    `Server Error ${response.status}: ${errorText}`
  );
}

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      await refundCredits(authUser.id, credits);
      console.error(data);
      alert("Generation failed. Credits refunded. Check n8n.");
      return;
    }

    setGenerationProgress(65);

    const immediateImage =
      data?.image_url ||
      data?.output_url ||
      data?.output_image_url ||
      data?.url ||
      data?.result?.image_url ||
      data?.result?.output_url;

    if (immediateImage) {
      setGenerationProgress(85);

      await supabase
        .from("generations")
        .update({
          status: "completed",
          output_url: immediateImage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", generationId);

      // Apply logo overlay — company logo (top-right) + AF logo (bottom-right for free accounts)
      const finalUrl = await applyLogoOverlay(immediateImage, {
        companyLogoUrl: useCompanyLogo ? companyLogoPreview : undefined,
        afWatermark: isFreeAccount,
        generationId,
      });

      setGeneratedOutputUrl(finalUrl);
      setGenerationProgress(100);
      refreshProfile?.();
      window.setTimeout(() => setIsGenerating(false), 900);
      return;
    }

    for (let attempt = 0; attempt < 42; attempt += 1) {
      const { data: row } = await supabase
        .from("generations")
        .select("*")
        .eq("id", generationId)
        .single();

      const finalImage = row?.output_url || row?.output_image_url || row?.image_url;

      if (row?.status === "completed" && finalImage) {
        setGenerationProgress(88);
        // Apply logo overlay — company logo (top-right) + AF logo (bottom-right for free accounts)
        const finalUrl = await applyLogoOverlay(finalImage, {
          companyLogoUrl: useCompanyLogo ? companyLogoPreview : undefined,
          afWatermark: isFreeAccount,
          generationId,
        });
        setGeneratedOutputUrl(finalUrl);
        setGenerationProgress(100);
        refreshProfile?.();
        window.setTimeout(() => setIsGenerating(false), 900);
        return;
      }

      if (row?.status === "failed") {
        await refundCredits(authUser.id, credits);
        alert("Generation failed in n8n. Credits refunded.");
        return;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 5000));
    }

    setGenerationProgress(94);
    alert("Generation started. It is taking longer than expected. You can check My Creations shortly.");
  } catch (error) {
    console.error(error);
    if (authUser?.id) await refundCredits(authUser.id, credits);
    alert("Something went wrong. Credits refunded if they were deducted.");
  } finally {
    setIsGenerating(false);
  }
};

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#06b6d433,transparent_34%),radial-gradient(circle_at_top_right,#fde04766,transparent_34%),linear-gradient(to_bottom,#f8fbff,#ffffff)] pb-28 text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,#00d4ff22,transparent_34%),radial-gradient(circle_at_top_right,#7c3cff22,transparent_34%),linear-gradient(to_bottom,#020617,#0f172a)] dark:text-white sm:pb-0">
      {isGenerating && (
        <JewelleryLoadingModal
          fact={jewelleryLoadingFacts[loadingFactIndex]}
          progress={generationProgress}
        />
      )}

      <SignupPromptPopup
        open={showSignupPopup}
        onClose={() => setShowSignupPopup(false)}
        source="jewellery-ai"
        context="jewellery visual"
      />


      <div
        className="absolute inset-0 opacity-[0.14] dark:opacity-[0.06]"
        style={{
          backgroundImage: "linear-gradient(45deg,currentColor 1px,transparent 1px),linear-gradient(-45deg,currentColor 1px,transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="relative z-10">
        {/* Newly Launched announcement strip */}
        <div className="mx-auto max-w-7xl px-3 pt-4 sm:px-4">
          <div
            className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 px-4 py-3 text-white shadow-xl shadow-rose-500/25 sm:rounded-3xl sm:px-6 sm:py-4"
            style={{ animation: "afNewlyPulse 2.6s ease-in-out infinite" }}
          >
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 left-0 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
            <div className="relative flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/25 text-lg ring-2 ring-white/40 backdrop-blur"
                  style={{ animation: "afNewlySpark 1.4s ease-in-out infinite" }}
                  aria-hidden="true"
                >
                  ✨
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/90">
                    Newly Launched
                  </p>
                  <p className="text-sm font-black sm:text-base">
                    AgentForge Jewellery AI Studio is now live — try it free
                  </p>
                </div>
              </div>
              <span className="hidden shrink-0 rounded-full bg-white/95 px-4 py-1.5 text-xs font-black text-rose-600 shadow-md sm:inline-flex">
                LIVE NOW
              </span>
            </div>
          </div>
          <style>{`
            @keyframes afNewlyPulse {
              0%, 100% { box-shadow: 0 10px 30px -10px rgba(244,63,94,0.55); }
              50%      { box-shadow: 0 16px 40px -8px rgba(244,63,94,0.85); }
            }
            @keyframes afNewlySpark {
              0%, 100% { transform: scale(1) rotate(0deg); }
              50%      { transform: scale(1.15) rotate(12deg); }
            }
          `}</style>
        </div>

        <section className="mx-auto grid w-full max-w-7xl items-start gap-5 px-3 py-5 sm:px-4 lg:grid-cols-[0.9fr_1.1fr] lg:py-8">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-cyan-700/20 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-900 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-200">
              Jewellery product to premium AI visual
            </div>

            <h1 className="max-w-xl text-3xl font-black leading-[1.02] tracking-[-0.04em] lg:text-5xl">
              AI Jewellery Studio
              <span className="block bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Upload. Generate. Done.
              </span>
              Sell Like Luxury.
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-600 dark:text-white/60 lg:text-base">
              Generate luxury studio shots, bridal campaign creatives, jewellery catalogue images, and Instagram-ready visuals from one product photo.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#try" className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-black text-black shadow-xl shadow-cyan-500/25 transition hover:scale-105">
                Start Generating
              </a>
              <button type="button" onClick={() => setGenerationMode(generationMode === "single" ? "bulk" : "single")} className="rounded-full bg-white px-6 py-3 text-sm font-black text-black shadow-lg dark:bg-white/10 dark:text-white">
                {generationMode === "single" ? "Single Creation" : "Bulk Creation"}
              </button>
            </div>
          </div>

          <div className="flex h-fit flex-col rounded-[1.5rem] border border-black/10 bg-white/80 p-3 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] sm:rounded-[2rem] sm:p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex min-h-[170px] items-center justify-center rounded-[1.25rem] border border-black/10 bg-[#fffaf0] p-3 dark:border-white/10 dark:bg-black/25 sm:min-h-[210px] sm:rounded-[1.5rem] sm:p-4">
                <div className="text-center">
                  {previewImage ? (
                    <img src={previewImage} alt="Uploaded jewellery preview" className="mx-auto mb-3 h-28 w-28 rounded-2xl object-cover shadow-lg sm:h-36 sm:w-36 sm:rounded-3xl" />
                  ) : (
                    <div className="mx-auto mb-3 flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 text-cyan-700 shadow-lg dark:from-cyan-500/20 dark:to-blue-500/20 dark:text-cyan-200 sm:h-36 sm:w-36 sm:rounded-3xl">
                      <Gem className="h-14 w-14" />
                    </div>
                  )}
                  <p className="font-semibold">Jewellery Image</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-white/50">{previewImage ? "Uploaded preview" : "Upload product photo"}</p>
                </div>
              </div>

              <div className="relative flex min-h-[170px] items-center justify-center overflow-hidden rounded-[1.25rem] border border-cyan-300/30 bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-purple-500/20 p-3 sm:min-h-[210px] sm:rounded-[1.5rem] sm:p-4">
                {isFreeAccount && (
                  <div className="pointer-events-none absolute inset-0 z-10 flex rotate-[-22deg] items-center justify-center text-6xl font-black text-slate-900/10 dark:text-white/10 sm:text-7xl">
                    AF
                  </div>
                )}
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-32 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 text-white shadow-lg shadow-cyan-400/30 sm:h-44 sm:w-36 sm:rounded-3xl">
                    <Crown className="h-14 w-14" />
                  </div>
                  <p className="font-semibold">AI Luxury Output</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-white/50">Premium campaign preview</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 rounded-[1.5rem] border border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-black/25">
              <div className="rounded-2xl bg-cyan-50 p-3 text-center dark:bg-white/[0.05]">
                <p className="text-xs text-slate-500 dark:text-white/50">Product</p>
                <p className="mt-1 truncate text-sm font-black">{selectedJewelleryLabel}</p>
              </div>
              <div className="rounded-2xl bg-cyan-50 p-3 text-center dark:bg-white/[0.05]">
                <p className="text-xs text-slate-500 dark:text-white/50">Shoot</p>
                <p className="mt-1 truncate text-sm font-black">{customShootStyle || shootStyle}</p>
              </div>
              <div className="rounded-2xl bg-cyan-50 p-3 text-center dark:bg-white/[0.05]">
                <p className="text-xs text-slate-500 dark:text-white/50">Credits</p>
                <p className="mt-1 truncate text-sm font-black">{credits}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="try" className="mx-auto max-w-7xl px-3 py-5 sm:px-5 sm:py-8">
          <div className="rounded-[1.25rem] border border-black/10 bg-white/80 p-3 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] sm:rounded-[1.75rem] sm:p-4 lg:p-6">
            <div className="mb-5 sm:mb-6">
              <h3 className="text-2xl font-black sm:text-3xl">Create Your Jewellery Visual</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/60 sm:text-base">
                Textile page jaisa same practical flow — left upload, right step-wise controls, and final summary.
              </p>
              <div className="mt-4 inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black text-amber-600">
                Bulk Locked — Upgrade to Empire Pack
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
              <div className="lg:sticky lg:top-24">
                <label className="flex min-h-[190px] cursor-pointer items-center justify-center rounded-[1.5rem] border-2 border-dashed border-black/15 bg-[#fffaf0] p-5 text-center dark:border-white/15 dark:bg-black/20">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple={generationMode === "bulk"}
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <div>
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-400 text-white shadow-lg shadow-cyan-400/25">
                      <Upload className="h-7 w-7" />
                    </div>
                    <p className="text-lg font-semibold">Upload jewellery image</p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-white/50">PNG, JPG, WEBP supported</p>
                    <p className="mt-2 text-xs font-semibold text-cyan-700 dark:text-cyan-200">Image uploading — you can fill options while we prepare the file.</p>
                  </div>
                </label>

                {uploads.length > 0 && (
                  <div className="mt-4 rounded-[1.35rem] border border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.045]">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-widest text-cyan-600">Uploads</p>
                      <button type="button" onClick={() => setUploads([])} className="text-xs font-bold text-slate-500 hover:text-rose-500">Clear All</button>
                    </div>
                    <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1">
                      {uploads.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/80 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                          <img src={item.preview} alt={item.name} className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold">{item.name}</p>
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-white/45">{(item.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button type="button" onClick={() => removeUpload(item.id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-500/10">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-[1.35rem] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.045]">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-widest text-cyan-600">Company Details</p>
                    <button type="button" onClick={() => logoInputRef.current?.click()} className="rounded-full bg-cyan-50 px-3 py-1.5 text-[11px] font-black text-cyan-700 dark:bg-white/10 dark:text-cyan-200">
                      Upload Logo
                    </button>
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => handleLogoUpload(e.target.files)} />

                  <div className="mb-3 flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-cyan-50 text-cyan-700 dark:bg-white/10 dark:text-cyan-200">
                      {companyLogoPreview ? <img src={companyLogoPreview} alt="Company logo" className="h-full w-full object-cover" /> : <Crown className="h-6 w-6" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold">Branding on output</p>
                      <p className="text-[11px] text-slate-500 dark:text-white/45">Logo, name, website optional</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-white/60"><input type="checkbox" checked={useCompanyLogo} onChange={(e) => setUseCompanyLogo(e.target.checked)} /> Use logo</label>
                    <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name" className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-black/20" />
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-white/60"><input type="checkbox" checked={useCompanyName} onChange={(e) => setUseCompanyName(e.target.checked)} /> Show company name</label>
                    <input value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="Website" className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-black/20" />
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-white/60"><input type="checkbox" checked={useCompanyWebsite} onChange={(e) => setUseCompanyWebsite(e.target.checked)} /> Show website</label>
                    <input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="Phone / WhatsApp optional" className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-black/20" />
                  </div>
                </div>

                <div className="mt-4 rounded-[1.35rem] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.045]">
                  <p className="text-xs font-black uppercase tracking-widest text-cyan-600">Live Summary</p>
                  <div className="mt-3 space-y-2">
                    <SummaryRow label="Mode" value={generationMode === "single" ? "Single" : "Bulk"} />
                    <SummaryRow label="Jewellery" value={selectedJewelleryLabel} />
                    <SummaryRow label="Shoot" value={customShootStyle || shootStyle} />
                    <SummaryRow label="Model" value={modelType} />
                    <SummaryRow label="Frame" value={`${outputSize} / ${quality}`} />
                    <SummaryRow label="Credits" value={String(credits)} />
                  </div>
                </div>
              </div>

              <div>
                <div ref={stepTopRef} className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {builderStepMeta.map((step, index) => (
                    <div
                      key={step.id}
                      onClick={() => goToStep(step.id)}
                      className={clsx(
                        "relative cursor-pointer overflow-hidden rounded-3xl border p-4 shadow-sm transition-all duration-300 active:scale-[0.98]",
                        builderStep === step.id
                          ? "border-cyan-300 bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-cyan-200/60"
                          : "border-cyan-100 bg-white/80 text-slate-900 hover:border-cyan-200 dark:border-white/10 dark:bg-white/[0.04] dark:text-white",
                      )}
                    >
                      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-cyan-200/30 blur-2xl" />

                      <div className="relative z-10 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={clsx(
                            "text-[10px] font-black tracking-[0.22em]",
                            builderStep === step.id ? "text-white/80" : "text-cyan-600",
                          )}>
                            STEP {step.id}
                          </p>

                          <h3 className="mt-1 text-lg font-black leading-none">{step.title}</h3>

                          <p className={clsx(
                            "mt-1 text-[11px] font-semibold",
                            builderStep === step.id ? "text-white/80" : "text-slate-500 dark:text-white/50",
                          )}>
                            {step.sub}
                          </p>
                        </div>

                        <div className={clsx(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black",
                          builderStep === step.id ? "bg-white text-cyan-600" : "bg-cyan-400 text-white",
                        )}>
                          ✓
                        </div>
                      </div>

                      {index !== builderStepMeta.length - 1 && (
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-cyan-300 to-blue-400" />
                      )}
                    </div>
                  ))}
                </div>

                {builderStep === 1 && (
                  <div className="space-y-4">
                    <SelectionGrid title="Jewellery Type" subtitle="Choose the main jewellery category first." options={JEWELLERY_TYPES} value={jewelleryType} onChange={setJewelleryType} />

                    {jewelleryType === "More Options" && (
                      <div className="rounded-[1.35rem] border border-cyan-300/40 bg-cyan-400/10 p-4 dark:border-cyan-400/20">
                        <p className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-300">More Jewellery Options</p>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                          {MORE_JEWELLERY_OPTIONS.map((item) => (
                            <label key={item} className="flex cursor-pointer items-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-3 py-2 text-xs font-bold dark:border-white/10 dark:bg-white/[0.05]">
                              <input type="checkbox" checked={moreJewellery.includes(item)} onChange={() => toggleMoreJewellery(item)} />
                              {item}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <TextInputBox label="Other Jewellery / Custom Type" value={customJewellery} onChange={setCustomJewellery} placeholder="Example: Kundan choker, temple jewellery, custom pendant..." />

                    <div className="rounded-[1.35rem] border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.045]">
                      <p className="text-xs font-black uppercase tracking-widest text-cyan-600">Jewellery Protection Notes</p>
                      <textarea
                        rows={4}
                        value={jewelleryDetails}
                        onChange={(e) => setJewelleryDetails(e.target.value)}
                        placeholder="Mention stone color, cut, metal tone, polish, pattern, shape, and anything that must not change."
                        className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400 dark:border-white/10 dark:bg-black/20"
                      />
                    </div>
                  </div>
                )}

                {builderStep === 2 && (
                  <div className="space-y-4">
                    
                    <SelectionGrid title="Shoot Style" subtitle="Choose lighting, background and jewellery presentation." options={SHOOT_STYLE_OPTIONS} value={shootStyle} onChange={setShootStyle} />
                    <TextInputBox label="Custom Shoot Style" value={customShootStyle} onChange={setCustomShootStyle} placeholder="Example: black glossy background, warm gold lighting, festive campaign..." />
                    <SelectionGrid title="Accessories" subtitle="Choose jewellery-related support props." options={ACCESSORY_OPTIONS} value={accessory} onChange={setAccessory} />
                    <TextInputBox label="Custom Accessories" value={customAccessory} onChange={setCustomAccessory} placeholder="Example: silk cloth, jewellery box, flowers, diya, mirror..." />
                    <SelectionGrid title="Model / Scene Usage" subtitle="Options change according to selected jewellery." options={dynamicModelOptions} value={modelType} onChange={setModelType} />
                  </div>
                )}

                {builderStep === 3 && (
                  <div className="space-y-4">
                    <SelectionGrid title="Pose" subtitle="Add model pose or product scene pose." options={POSE_OPTIONS} value={pose} onChange={setPose} />
                    <TextInputBox label="Custom Pose" value={customPose} onChange={setCustomPose} placeholder="Example: hand near face, neck close-up, bride looking side..." />
                    <SelectionGrid title="Model Looks" subtitle="Choose model look according to jewellery market." options={MODEL_LOOK_OPTIONS} value={modelLook} onChange={setModelLook} />
                    <TextInputBox label="Custom Model Look" value={customModelLook} onChange={setCustomModelLook} placeholder="Example: Punjabi bridal, South Indian bride, modern luxury model..." />
                    <SelectionGrid title="Face Expression" subtitle="Useful when model face is visible." options={FACE_EXPRESSION_OPTIONS} value={faceExpression} onChange={setFaceExpression} />
                    <div className="rounded-[1.35rem] border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.045]">
                      <p className="text-xs font-black uppercase tracking-widest text-cyan-600">Model & Styling Notes</p>
                      <textarea
                        rows={3}
                        value={modelNotes}
                        onChange={(e) => setModelNotes(e.target.value)}
                        placeholder="Example: elegant female model, refined hand pose, bridal softness, luxury editorial styling."
                        className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400 dark:border-white/10 dark:bg-black/20"
                      />
                    </div>
                  </div>
                )}

                {builderStep === 4 && (
  <div className="space-y-4">

    <FrameQualityGrid
      outputSize={outputSize}
      quality={quality}
      setOutputSize={setOutputSize}
      setQuality={setQuality}
    />
                    <div className="rounded-[1.35rem] border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.045]">
                      <button type="button" onClick={() => setShowPromptBox(!showPromptBox)} className="flex w-full items-center justify-between gap-3 text-left font-black">
                        <span>📝 Custom Instruction (Optional)</span>
                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs text-cyan-800 dark:bg-white/10 dark:text-white/70">{showPromptBox ? "Hide" : "Open"}</span>
                      </button>
                      {showPromptBox && (
                        <textarea
                          rows={4}
                          value={customInstruction}
                          onChange={(e) => setCustomInstruction(e.target.value)}
                          placeholder="Add specific instructions like dark background, bridal mood, gold glow, premium macro shot, etc."
                          className="mt-4 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400 dark:border-white/10 dark:bg-black/20"
                        />
                      )}
                    </div>

                        
                    <div className="rounded-[1.35rem] border border-cyan-300/40 bg-gradient-to-br from-cyan-400/10 via-blue-500/10 to-purple-500/10 p-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <SummaryRow label="Jewellery" value={selectedJewelleryLabel} />
                        <SummaryRow label="Shoot" value={customShootStyle || shootStyle} />
                        <SummaryRow label="Model" value={modelType} />
                        <SummaryRow label="Pose" value={customPose || pose} />
                        <SummaryRow label="Look" value={customModelLook || modelLook} />
                        <SummaryRow label="Face" value={faceExpression} />
                        <SummaryRow label="Frame" value={`${outputSize} / ${quality}`} />
                        <SummaryRow label="Accessories" value={customAccessory || accessory} />
                        <SummaryRow label="Uploads" value={String(uploads.length)} />
                      </div>
                      <button type="button" onClick={handleGenerate} disabled={isGenerating || !uploads.length} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
                        {isGenerating ? "Generating..." : `Generate Jewellery Visual • ${credits} Credits`}
                        <ArrowRight className="h-4 w-4" />
                      </button>

                      {generatedOutputUrl && (
                        <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-cyan-300/40 bg-white/90 p-4 shadow-xl shadow-cyan-500/10 dark:bg-slate-950/60">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-300">Generated Output</p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-white/50">Your result is also saved in My Creations.</p>
                            </div>
                            <BadgeCheck className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                          </div>

                          <img
                            src={generatedOutputUrl}
                            alt="Generated jewellery output"
                            className="max-h-[520px] w-full rounded-[1.25rem] object-contain shadow-lg"
                          />

                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={handleDownloadResult}
                              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:scale-[1.02] dark:bg-white dark:text-slate-950"
                            >
                              Download
                            </button>
                            <button
                              type="button"
                              onClick={handleShareResult}
                              className="rounded-2xl border border-cyan-300/50 bg-cyan-50 px-4 py-3 text-sm font-black text-cyan-700 transition hover:scale-[1.02] dark:bg-cyan-400/10 dark:text-cyan-200"
                            >
                              Share / Copy Link
                            </button>
                          </div>
                        </div>
                      )}
                      <p className="mt-3 text-center text-xs leading-5 text-slate-500 dark:text-white/45">
                        Free account outputs show AF watermark. Shape, stone placement, finish, texture, and metal tone must stay true to the uploaded jewellery.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between gap-3">
                  <button type="button" onClick={previousStep} disabled={builderStep === 1} className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/10 dark:text-white">
                    Back
                  </button>
                  <button type="button" onClick={nextStep} disabled={!canGoNext || builderStep === 4} className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-black text-black shadow-xl shadow-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-40">
                    Next Step
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/90 px-3 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90 sm:hidden">
        <button type="button" onClick={handleGenerate} disabled={isGenerating || !uploads.length} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50">
          {isGenerating ? "Generating..." : `Generate • ${credits} Credits`}
          <Wand2 className="h-4 w-4" />
        </button>
      </div>
    </main>
  );
}
