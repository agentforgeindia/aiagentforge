"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";
import { useAuth } from "@/app/components/AuthProvider";
import {
  BadgeCheck,
  Camera,
  Crown,
  Download,
  Gem,
  Image as ImageIcon,
  Layers,
  Package,
  Palette,
  RefreshCw,
  Share2,
  ShoppingBag,
  Sparkles,
  Upload,
  UploadCloud,
  UserRound,
  Wand2,
  X,
} from "lucide-react";
import { canGenerate } from "@/lib/checkCredits";
import { shouldDeductCredits } from "@/lib/deductCredits";
import { hasBulkAccess } from "@/lib/plans";
import SignupPromptPopup from "@/app/components/SignupPromptPopup";

const WEBHOOK_URL =
  process.env.NEXT_PUBLIC_PRODUCTOGRAPHY_WEBHOOK_URL ||
  process.env.NEXT_PUBLIC_N8N_PRODUCTOGRAPHY_WEBHOOK_URL ||
  "";

// Guard: if the env var wasn't set at build time, fail loudly instead of
// silently posting to the current origin (which returns the Next.js 404 HTML
// and produces a confusing "n8n error 404 <!DOCTYPE html>" downstream).
const WEBHOOK_URL_IS_VALID =
  typeof WEBHOOK_URL === "string" && /^https?:\/\//i.test(WEBHOOK_URL);

const AF_LOGO_PATH = "/af-logo.png";

type GenStatus = "uploading" | "ready" | "generating" | "done" | "failed";

type GenItem = {
  id: string;
  fileName: string;
  url: string;
  productCode: string;
  status: GenStatus;
  resultUrl?: string;
  error?: string;
};

type Option = {
  title: string;
  hint?: string;
  icon: ReactNode;
  iconFile?: string;
};

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const extractCodeFromFileName = (fileName: string) => {
  const cleanName = fileName.replace(/\.[^/.]+$/, "");
  const match = cleanName.match(
    /(?:sku|product|prod|code|item|p)?[-_\s]*([A-Z0-9]{2,}[-_][A-Z0-9]{2,}|[A-Z]{1,4}\d{2,}|\d{3,})/i,
  );
  return match?.[1]?.toUpperCase().replace(/_/g, "-") || "";
};

// ============================================================
// OPTION ARRAYS — icons from /icons/ folder where relatable
// (textile + jewellery shared library)
// ============================================================

const productCategories: Option[] = [
  { title: "Cosmetics", hint: "Cream, serum, makeup", icon: <Sparkles />, iconFile: "/Productography-icons/cosmatics.svg" },
  { title: "Perfume", hint: "Bottle, luxury fragrance", icon: <Package />, iconFile: "/Productography-icons/prefume.svg" },
  { title: "Jewellery", hint: "Rings, chains, sets", icon: <Gem />, iconFile: "/Productography-icons/jewellery.svg" },
  { title: "Fashion Accessories", hint: "Bags, belts, watches", icon: <ShoppingBag />, iconFile: "/Productography-icons/wrist watch.svg" },
  { title: "Food & Beverage", hint: "Packaged food, drinks", icon: <Package />, iconFile: "/Productography-icons/food.svg" },
  { title: "Electronics", hint: "Gadgets, devices", icon: <Camera />, iconFile: "/Productography-icons/electronics.svg" },
  { title: "Home Decor", hint: "Candles, decor, crafts", icon: <Palette />, iconFile: "/Productography-icons/cushion cover.svg" },
  { title: "Toys & Kids", hint: "Toys, kids products", icon: <UserRound />, iconFile: "/Productography-icons/toys.svg" },
  { title: "Shoes", hint: "Sneakers, sandals", icon: <Package />, iconFile: "/Productography-icons/shoes.svg" },
  { title: "Bags & Luggage", hint: "Handbags, backpacks, totes", icon: <ShoppingBag />, iconFile: "/Productography-icons/fabric bag.svg" },
  { title: "Furniture & Home", hint: "Sofa, lamps, kitchen items", icon: <Palette />, iconFile: "/Productography-icons/sofa cover.svg" },
  { title: "Custom Product", hint: "Write your own", icon: <Wand2 />, iconFile: "/Productography-icons/custom-look.svg" },
];

const modelUsageOptions: Option[] = [
  { title: "Without Model", hint: "Product-only premium shoot", icon: <Package />, iconFile: "/Productography-icons/no model.svg" },
  { title: "Hand Model", hint: "Hand holding/using product", icon: <UserRound />, iconFile: "/Productography-icons/model holding product.svg" },
  { title: "Boy Model", hint: "Male lifestyle model", icon: <UserRound />, iconFile: "/Productography-icons/mens ware.svg" },
  { title: "Girl Model", hint: "Female lifestyle model", icon: <UserRound />, iconFile: "/Productography-icons/female ware.svg" },
  { title: "Kid Model", hint: "Kids product lifestyle", icon: <UserRound />, iconFile: "/Productography-icons/kids ware.svg" },
  { title: "Couple / Family", hint: "Lifestyle family scene", icon: <UserRound />, iconFile: "/Productography-icons/family lifestyle scene.svg" },
];

const modelLookOptions: Option[] = [
  { title: "Indian", hint: "Indian market look", icon: <UserRound />, iconFile: "/Productography-icons/indian model.svg" },
  { title: "European", hint: "Global premium look", icon: <UserRound />, iconFile: "/Productography-icons/european-model.svg" },
  { title: "Asian", hint: "East/South Asian look", icon: <UserRound />, iconFile: "/Productography-icons/middle asian model.svg" },
  { title: "Arabic", hint: "Middle East premium", icon: <UserRound />, iconFile: "/Productography-icons/middle eastern models.svg" },
  { title: "African", hint: "African model look", icon: <UserRound />, iconFile: "/Productography-icons/african models.svg" },
  { title: "Custom Look", hint: "Write exact look", icon: <Wand2 />, iconFile: "/Productography-icons/custom-look.svg" },
];

const shootStyleOptions: Option[] = [
  { title: "Ecommerce White BG", hint: "Amazon/Flipkart style", icon: <ImageIcon />, iconFile: "/Productography-icons/white background.svg" },
  { title: "Luxury Studio", hint: "Premium catalogue lighting", icon: <Camera />, iconFile: "/Productography-icons/photo studio setup.svg" },
  { title: "Outdoor Lifestyle", hint: "Natural brand shoot", icon: <Camera />, iconFile: "/Productography-icons/outdoor premium.svg" },
  { title: "Ad Creative", hint: "Poster/ad-ready image", icon: <Sparkles />, iconFile: "/Productography-icons/add_creative.svg" },
  { title: "Cinematic Dark", hint: "Dramatic premium shadows", icon: <Palette />, iconFile: "/Productography-icons/luxury_black.svg" },
  { title: "Instagram Viral", hint: "Trendy social post", icon: <Wand2 />, iconFile: "/Productography-icons/insta.svg" },
  { title: "Festival Theme", hint: "Diwali/Eid/seasonal", icon: <Sparkles />, iconFile: "/Productography-icons/Festival.svg" },
  { title: "Custom Shoot", hint: "Write exact direction", icon: <Wand2 />, iconFile: "/Productography-icons/custom-look.svg" },
];

const backgroundOptions: Option[] = [
  { title: "Plain White", hint: "Clean ecommerce", icon: <ImageIcon />, iconFile: "/Productography-icons/white background.svg" },
  { title: "Luxury Black", hint: "Premium contrast", icon: <Palette />, iconFile: "/Productography-icons/luxury_black.svg" },
  { title: "Marble Surface", hint: "Beauty/jewellery vibe", icon: <Layers />, iconFile: "/Productography-icons/marble.svg" },
  { title: "Wooden Table", hint: "Natural product setup", icon: <Layers />, iconFile: "/Productography-icons/wooden.svg" },
  { title: "Cafe / Lifestyle", hint: "Daily usage scene", icon: <Camera />, iconFile: "/Productography-icons/lifestyle room view.svg" },
  { title: "Nature Outdoor", hint: "Fresh outdoor feel", icon: <Camera />, iconFile: "/Productography-icons/outdoor premium.svg" },
  { title: "Neon Studio", hint: "Modern Gen-Z style", icon: <Sparkles />, iconFile: "/Productography-icons/neon.svg" },
  { title: "Custom BG", hint: "Write your own scene", icon: <Wand2 />, iconFile: "/Productography-icons/custom-look.svg" },
];

const angleOptions: Option[] = [
  { title: "Front View", hint: "Safe default", icon: <Camera />, iconFile: "/Productography-icons/front view.svg" },
  { title: "45 Degree", hint: "Premium angle", icon: <Camera />, iconFile: "/Productography-icons/camera45angle.svg" },
  { title: "Top View", hint: "Flat lay", icon: <Camera />, iconFile: "/Productography-icons/top view.svg" },
  { title: "Macro Close-up", hint: "Texture/detail shot", icon: <Camera />, iconFile: "/Productography-icons/close-up shot.svg" },
  { title: "Hero Shot", hint: "Main ad image", icon: <Sparkles />, iconFile: "/Productography-icons/hero_shot.svg" },
  { title: "Custom Angle", hint: "Write exact angle", icon: <Wand2 />, iconFile: "/Productography-icons/custom-look.svg" },
];

const FRAME_OUTPUT_OPTIONS: Option[] = [
  { title: "1080x1080", hint: "Instagram / catalogue", icon: <ImageIcon />, iconFile: "/Productography-icons/square.svg" },
  { title: "1080x1920", hint: "Story / reel still", icon: <ImageIcon />, iconFile: "/Productography-icons/mobile.svg" },
  { title: "Premium", hint: "Fast + sharp", icon: <BadgeCheck />, iconFile: "/Productography-icons/premium.svg" },
  { title: "Ultra HD", hint: "Best detail", icon: <Sparkles />, iconFile: "/Productography-icons/ultra hd.svg" },
];

const facts = [
  {
    title: "Mobile photo can sell like a studio shoot",
    text: "Clean lighting, shadows, and background instantly make normal product photos look brand-ready.",
  },
  {
    title: "Logo safety is king",
    text: "For productography, product shape, packaging text, logo, color, and label must stay unchanged.",
  },
  {
    title: "White BG is for marketplace, lifestyle is for desire",
    text: "Use ecommerce shots for listing, and lifestyle/ad shots for Instagram, WhatsApp, and paid ads.",
  },
  {
    title: "One product, many creatives",
    text: "A single product photo can become catalogue, premium studio, ad creative, and social post versions.",
  },
];

// Free account check (Empire / Founder / Unlimited / Pro / Growth / Creator = paid)
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

// ============================================================
// OptionCard — supports SVG file (from /icons/ or /jewellery-icon/)
// with lucide icon fallback
// ============================================================
function OptionCard({
  option,
  active,
  onClick,
  darkMode,
}: {
  option: Option;
  active: boolean;
  onClick: () => void;
  darkMode: boolean;
}) {
  const [iconAttempt, setIconAttempt] = useState(0);

  // Build fallback chain: Productography-icons (preferred) → original /icons/ → lucide
  const sources: string[] = (() => {
    if (!option.iconFile) return [];
    const raw = option.iconFile;
    // If raw is /icons/foo.svg → also try /Productography-icons/foo.svg
    if (raw.startsWith("/icons/")) {
      const name = raw.replace("/icons/", "");
      return [`/Productography-icons/${name}`, raw];
    }
    // If raw is /Productography-icons/... → also try /icons/ as fallback
    if (raw.startsWith("/Productography-icons/")) {
      const name = raw.replace("/Productography-icons/", "");
      return [raw, `/icons/${name}`];
    }
    // Short name → try both folders
    return [`/Productography-icons/${raw}.svg`, `/icons/${raw}.svg`];
  })();

  const showLucide = iconAttempt >= sources.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-h-[124px] min-w-0 flex-col items-center justify-center rounded-[22px] p-3 text-center transition-all duration-300 active:scale-[0.97] sm:min-h-[148px] sm:rounded-[28px] sm:p-4 ${
        active
          ? "scale-[1.025] bg-gradient-to-br from-cyan-400/20 via-blue-500/15 to-purple-500/15 shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-300/70"
          : darkMode
            ? "bg-white/[0.045] hover:-translate-y-1 hover:bg-white/[0.08] hover:shadow-lg hover:shadow-cyan-500/10"
            : "bg-gradient-to-br from-cyan-50/80 via-white to-blue-50/40 hover:-translate-y-1 hover:from-cyan-100/80 hover:via-white hover:to-blue-100/40 hover:shadow-xl hover:shadow-cyan-500/10"
      }`}
    >
      <div
        className={`mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-[20px] transition sm:h-[80px] sm:w-[80px] sm:rounded-[24px] ${
          active
            ? "text-cyan-500 shadow-lg shadow-cyan-400/25"
            : darkMode
              ? "text-cyan-300"
              : "text-cyan-700 shadow-sm"
        }`}
      >
        {!showLucide && sources.length > 0 ? (
          <img
            src={sources[iconAttempt]}
            alt=""
            className="block h-full w-full object-cover transition duration-300 group-hover:scale-110"
            style={{ mixBlendMode: darkMode ? "screen" : "multiply" }}
            onError={() => setIconAttempt((n) => n + 1)}
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center ${darkMode ? "bg-white/[0.07]" : "bg-cyan-50"}`}>
            <div className="h-9 w-9 sm:h-10 sm:w-10">{option.icon}</div>
          </div>
        )}
      </div>
      <p
        className={`text-[12px] font-black leading-4 sm:text-sm ${
          active ? "text-[#0077b6]" : darkMode ? "text-white/75" : "text-black/75"
        }`}
      >
        {option.title}
      </p>
      {option.hint && <p className="mt-1 text-[10px] leading-3 opacity-50 sm:text-xs">{option.hint}</p>}
    </button>
  );
}

function CustomTextBox({
  label,
  value,
  onChange,
  placeholder,
  darkMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  darkMode: boolean;
}) {
  return (
    <div className="mt-4">
      <label className="mb-2 block text-xs font-black uppercase tracking-widest text-cyan-600">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className={`w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-400 ${
          darkMode
            ? "border-white/10 bg-black/25 text-white placeholder:text-white/35"
            : "border-black/10 bg-white text-black placeholder:text-black/35"
        }`}
      />
    </div>
  );
}

// ============================================================
// FrameQualityGrid — combines output size + quality in one block
// (jewellery / textile parity)
// ============================================================
function FrameQualityGrid({
  outputSize,
  quality,
  setOutputSize,
  setQuality,
  darkMode,
}: {
  outputSize: string;
  quality: string;
  setOutputSize: (v: string) => void;
  setQuality: (v: string) => void;
  darkMode: boolean;
}) {
  return (
    <div
      className={`rounded-[1.35rem] border p-4 sm:p-5 ${
        darkMode ? "border-white/10 bg-black/25" : "border-black/10 bg-white/70"
      }`}
    >
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-widest text-cyan-600">
          Frame / Output Size + Quality
        </p>
        <p className={`mt-1 text-xs leading-5 ${darkMode ? "text-white/50" : "text-black/50"}`}>
          Mobile, square, Premium and Ultra HD in one section.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {FRAME_OUTPUT_OPTIONS.map((option) => {
          const isQuality = option.title === "Premium" || option.title === "Ultra HD";
          const active = isQuality ? quality === option.title : outputSize === option.title;
          return (
            <OptionCard
              key={option.title}
              option={option}
              active={active}
              darkMode={darkMode}
              onClick={() => {
                if (isQuality) setQuality(option.title);
                else setOutputSize(option.title);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function ProductographyPage() {
  const { darkMode } = useTheme();
  const { user: authUser, credits: userCredits, refreshProfile } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [items, setItems] = useState<GenItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const [builderStep, setBuilderStep] = useState(1);
  const stepTopRef = useRef<HTMLDivElement | null>(null);
  const cancelRef = useRef(false);

  const [productCategory, setProductCategory] = useState("Cosmetics");
  const [modelUsage, setModelUsage] = useState("Without Model");
  const [modelLook, setModelLook] = useState("Indian");
  const [shootStyle, setShootStyle] = useState("Luxury Studio");
  const [background, setBackground] = useState("Plain White");
  const [cameraAngle, setCameraAngle] = useState("Front View");
  const [outputSize, setOutputSize] = useState("1080x1080");
  const [quality, setQuality] = useState("Premium");

  const [customCategory, setCustomCategory] = useState("");
  const [customModelUsage, setCustomModelUsage] = useState("");
  const [customModelLook, setCustomModelLook] = useState("");
  const [customShootStyle, setCustomShootStyle] = useState("");
  const [customBackground, setCustomBackground] = useState("");
  const [customCameraAngle, setCustomCameraAngle] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");

  // Brand details
  const [companyName, setCompanyName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [useCompanyName, setUseCompanyName] = useState(false);
  const [useCompanyPhone, setUseCompanyPhone] = useState(false);
  const [useCompanyWebsite, setUseCompanyWebsite] = useState(false);
  const [useCompanyAddress, setUseCompanyAddress] = useState(false);
  const [useCompanyLogo, setUseCompanyLogo] = useState(false);
  const [productTextEnabled, setProductTextEnabled] = useState(false);

  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const activeItem =
    items.find((it) => it.id === activeId) ||
    items.find((it) => it.resultUrl) ||
    items[0] ||
    null;
  const previewImage = activeItem?.url || null;
  const previewResult = activeItem?.resultUrl || null;
  const readyItems = items.filter((it) => it.status === "ready" || it.status === "done");

  const card = darkMode
    ? "border-white/10 bg-white/[0.045] shadow-black/40"
    : "border-black/10 bg-white/85 shadow-cyan-900/10";
  const muted = darkMode ? "text-white/55" : "text-black/55";
  const pageBg = darkMode
    ? "bg-[#050b16] text-white"
    : "bg-gradient-to-b from-[#f8fbff] via-white to-[#eefaff] text-black";

  const isFreeAccount = useMemo(() => isFreeAccountFromProfile(profile), [profile]);
  const canBulk = useMemo(() => hasBulkAccess(profile), [profile]);

  const requiredCredits = (() => {
    const q = quality.toLowerCase();
    const s = outputSize;
    let base = 15;
    if (q.includes("ultra")) base += 5;
    if (s === "1080x1920" || s === "1920x1080") base += 2;
    if (useCompanyLogo && companyLogoUrl) base += 1;
    if (useCompanyName && companyName.trim()) base += 1;
    if (useCompanyPhone && companyPhone.trim()) base += 1;
    if (useCompanyWebsite && companyWebsite.trim()) base += 1;
    if (useCompanyAddress && companyAddress.trim()) base += 1;
    return base;
  })();

  const totalCreditsNeeded = requiredCredits * Math.max(readyItems.length, 1);

  // ============================================================
  // PROFILE LOAD
  // ============================================================
  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      if (!authUser?.id) {
        setProfile(null);
        return;
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
      if (mounted) setProfile(data || null);
    };
    loadProfile();
    return () => {
      mounted = false;
    };
  }, [authUser?.id]);

  // ============================================================
  // SETTINGS LOAD / SAVE
  // ============================================================
  useEffect(() => {
    const saved = localStorage.getItem("productography_settings");
    if (!saved) return;
    try {
      const s = JSON.parse(saved);
      setProductCategory(s.productCategory || "Cosmetics");
      setModelUsage(s.modelUsage || "Without Model");
      setModelLook(s.modelLook || "Indian");
      setShootStyle(s.shootStyle || "Luxury Studio");
      setBackground(s.background || "Plain White");
      setCameraAngle(s.cameraAngle || "Front View");
      setOutputSize(s.outputSize || "1080x1080");
      setQuality(s.quality || "Premium");
      setCustomCategory(s.customCategory || "");
      setCustomModelUsage(s.customModelUsage || "");
      setCustomModelLook(s.customModelLook || "");
      setCustomShootStyle(s.customShootStyle || "");
      setCustomBackground(s.customBackground || "");
      setCustomCameraAngle(s.customCameraAngle || "");
      setCustomInstruction(s.customInstruction || "");
      setCompanyName(s.companyName || "");
      setCompanyPhone(s.companyPhone || "");
      setCompanyWebsite(s.companyWebsite || "");
      setCompanyAddress(s.companyAddress || "");
      setCompanyLogoUrl(s.companyLogoUrl || "");
      setUseCompanyName(Boolean(s.useCompanyName));
      setUseCompanyPhone(Boolean(s.useCompanyPhone));
      setUseCompanyWebsite(Boolean(s.useCompanyWebsite));
      setUseCompanyAddress(Boolean(s.useCompanyAddress));
      setUseCompanyLogo(Boolean(s.useCompanyLogo));
      setProductTextEnabled(Boolean(s.productTextEnabled));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "productography_settings",
      JSON.stringify({
        productCategory, modelUsage, modelLook, shootStyle, background, cameraAngle,
        outputSize, quality, customCategory, customModelUsage, customModelLook,
        customShootStyle, customBackground, customCameraAngle, customInstruction,
        companyName, companyPhone, companyWebsite, companyAddress, companyLogoUrl,
        useCompanyName, useCompanyPhone, useCompanyWebsite, useCompanyAddress,
        useCompanyLogo, productTextEnabled,
      }),
    );
  }, [
    productCategory, modelUsage, modelLook, shootStyle, background, cameraAngle,
    outputSize, quality, customCategory, customModelUsage, customModelLook,
    customShootStyle, customBackground, customCameraAngle, customInstruction,
    companyName, companyPhone, companyWebsite, companyAddress, companyLogoUrl,
    useCompanyName, useCompanyPhone, useCompanyWebsite, useCompanyAddress,
    useCompanyLogo, productTextEnabled,
  ]);

  useEffect(() => {
    if (!loading) {
      setFactIndex(0);
      return;
    }
    const interval = window.setInterval(() => {
      setFactIndex((current) => (current + 1) % facts.length);
    }, 4200);
    return () => window.clearInterval(interval);
  }, [loading]);

  // ============================================================
  // FILE UPLOAD HELPERS
  // ============================================================
  const uploadFile = async (file: File) => {
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
    const filePath = `productography-inputs/${authUser?.id || "guest"}/${Date.now()}-${newId().slice(0, 6)}-${safeFileName}`;
    const { error } = await supabase.storage.from("designs").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("designs").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const uploadBrandLogo = async (file: File): Promise<string> => {
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
    const filePath = `brand-logos/${authUser?.id || "guest"}/${Date.now()}-${newId().slice(0, 6)}-${safeFileName}`;
    const { error } = await supabase.storage.from("designs").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("designs").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file only.");
      e.target.value = "";
      return;
    }
    setUploadingLogo(true);
    try {
      const url = await uploadBrandLogo(file);
      setCompanyLogoUrl(url);
      setUseCompanyLogo(true);
    } catch (err: any) {
      console.error("Logo upload failed:", err);
      alert(err?.message || "Logo upload failed.");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;

    const invalid = files.find((file) => !file.type.startsWith("image/"));
    if (invalid) {
      alert("Please upload image files only.");
      e.target.value = "";
      return;
    }

    // Bulk plan check — multiple files require bulk access
    if (files.length > 1 && !canBulk) {
      alert(
        "Bulk generation is available on Empire / Founder / Unlimited plans. Please upload one product at a time or upgrade.",
      );
      e.target.value = "";
      return;
    }

    setUploading(true);
    for (const file of files) {
      const id = newId();
      setItems((prev) => [
        ...prev,
        { id, fileName: file.name, url: "", productCode: extractCodeFromFileName(file.name), status: "uploading" },
      ]);
      setActiveId((current) => current || id);
      try {
        const url = await uploadFile(file);
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, url, status: "ready" } : it)));
        if (extractCodeFromFileName(file.name)) setProductTextEnabled(true);
      } catch (error: any) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === id ? { ...it, status: "failed", error: error?.message || "Upload failed" } : it,
          ),
        );
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  const updateItemProductCode = (id: string, value: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, productCode: value.toUpperCase() } : it)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setActiveId((current) => (current === id ? null : current));
  };

  // ============================================================
  // CANVAS LOGO OVERLAY (same system as jewellery/textile)
  // ============================================================
  const loadImageAsElement = async (url: string): Promise<HTMLImageElement> => {
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
    cLogoUrl: string | null,
    showAfWatermark: boolean,
  ): Promise<Blob | null> => {
    try {
      const baseImg = await loadImageAsElement(baseImageUrl);
      const [companyLogoImg, afLogoImg] = await Promise.all([
        cLogoUrl
          ? loadImageAsElement(cLogoUrl).catch((e) => {
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

      if (!companyLogoImg && !afLogoImg) return null;

      const canvas = document.createElement("canvas");
      canvas.width = baseImg.naturalWidth;
      canvas.height = baseImg.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(baseImg, 0, 0);

      if (companyLogoImg) {
        drawLogoInCorner(ctx, canvas.width, canvas.height, companyLogoImg, "top-right", 0.14, 1);
      }
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

  const uploadCompositeBlobToSupabase = async (blob: Blob, folder: string): Promise<string> => {
    const filePath = `${folder}/${authUser?.id || "guest"}/${Date.now()}-${newId().slice(0, 6)}-composite.png`;
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
    const { companyLogoUrl: cLogo, afWatermark, generationId } = options;

    const safeCompanyLogo =
      cLogo && !cLogo.startsWith("data:") && !cLogo.startsWith("blob:") ? cLogo : null;

    if (!safeCompanyLogo && !afWatermark) return rawOutputUrl;

    try {
      const compositeBlob = await compositeLogoOnImage(
        rawOutputUrl,
        safeCompanyLogo,
        Boolean(afWatermark),
      );
      if (!compositeBlob) return rawOutputUrl;

      const compositeUrl = await uploadCompositeBlobToSupabase(
        compositeBlob,
        "productography-outputs",
      );

      await supabase
        .from("generations")
        .update({
          output_url: compositeUrl,
          output_image_url: compositeUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", generationId);

      return compositeUrl;
    } catch (error) {
      console.error("Logo overlay pipeline failed, falling back to raw output:", error);
      return rawOutputUrl;
    }
  };

  // ============================================================
  // GENERATION
  // ============================================================
  const pollGenerationResult = async (id: string) => {
    for (let attempt = 0; attempt < 36; attempt += 1) {
      if (cancelRef.current) return null;
      const { data } = await supabase.from("generations").select("*").eq("id", id).single();
      const row = data as any;
      const finalImage = row?.output_image_url || row?.output_url || row?.image_url || row?.result_url;
      if (row?.status === "completed" && finalImage) return finalImage as string;
      if (row?.status === "failed") throw new Error("Generation failed in n8n.");
      await new Promise((resolve) => window.setTimeout(resolve, 5000));
    }
    throw new Error("Generation is taking longer than expected. Please check n8n execution.");
  };

  const generateOne = async (item: GenItem, userId: string) => {
    const generationId = newId();
    const resolvedCategory = customCategory.trim() || productCategory;
    const resolvedModelUsage = customModelUsage.trim() || modelUsage;
    const resolvedModelLook = customModelLook.trim() || modelLook;
    const resolvedShootStyle = customShootStyle.trim() || shootStyle;
    const resolvedBackground = customBackground.trim() || background;
    const resolvedCameraAngle = customCameraAngle.trim() || cameraAngle;

    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, status: "generating" } : it)));

    const brandDetails = {
      company_name: useCompanyName ? companyName.trim() : "",
      phone_number: useCompanyPhone ? companyPhone.trim() : "",
      website: useCompanyWebsite ? companyWebsite.trim() : "",
      address: useCompanyAddress ? companyAddress.trim() : "",
      logo_url: useCompanyLogo ? companyLogoUrl.trim() : "",
    };

    const dbRow = {
      id: generationId,
      user_id: userId,
      design_url: item.url,
      input_image_url: item.url,
      product_type: resolvedCategory,
      model_type: resolvedModelLook,
      shoot_style: resolvedShootStyle,
      output_size: outputSize,
      quality,
      article_number: item.productCode.trim() || null,
      custom_instruction: customInstruction,
      status: "pending",
      agent_type: "productography",
      category: "productography",
    };

    const { error: dbError } = await supabase.from("generations").insert([dbRow]);
    if (dbError) throw new Error(`Database record failed: ${dbError.message}`);

    if (!WEBHOOK_URL_IS_VALID) {
      throw new Error(
        "Productography webhook URL is not configured. Set NEXT_PUBLIC_PRODUCTOGRAPHY_WEBHOOK_URL in your production environment (Vercel/host dashboard) and redeploy. Got: \"" +
          WEBHOOK_URL +
          "\"",
      );
    }

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generation_id: generationId,
        user_id: userId,
        agent_type: "productography",
        product_image_url: item.url,
        design_url: item.url,
        input_image_url: item.url,
        product_category: resolvedCategory,
        product_type: resolvedCategory,
        model_usage: resolvedModelUsage,
        model_type: resolvedModelLook,
        model_look: resolvedModelLook,
        shoot_style: resolvedShootStyle,
        background_style: resolvedBackground,
        camera_angle: resolvedCameraAngle,
        output_size: outputSize,
        quality,
        output_quality: quality,
        required_credits: requiredCredits,
        credits_required: requiredCredits,
        product_code: item.productCode.trim(),
        article_number: item.productCode.trim(),
        text_on_image: productTextEnabled ? item.productCode.trim() : "",
        brand_details: brandDetails,
        company_details: brandDetails,
        company_name: brandDetails.company_name,
        company_phone: brandDetails.phone_number,
        company_website: brandDetails.website,
        company_address: brandDetails.address,
        af_watermark: isFreeAccount,
        reserve_second_corner: isFreeAccount,
        custom_instruction: customInstruction,
      }),
    });

    const text = await response.text();
    if (!response.ok) throw new Error(`n8n error ${response.status}: ${text}`);
    const data = text ? JSON.parse(text) : {};
    const immediateImage = data?.image_url || data?.output_image_url || data?.image || data?.url;
    const rawFinalImage = immediateImage || (await pollGenerationResult(generationId));

    // Apply Canvas logo overlay (company top-right + AF bottom-right for free)
    const finalImage = rawFinalImage
      ? await applyLogoOverlay(rawFinalImage, {
          companyLogoUrl: useCompanyLogo ? companyLogoUrl : undefined,
          afWatermark: isFreeAccount,
          generationId,
        })
      : rawFinalImage;

    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, resultUrl: finalImage || "", status: "done" } : it)),
    );
    setActiveId(item.id);
  };

  const handleGenerate = async () => {
    if (!authUser?.id) {
      setShowSignupPopup(true);
      return;
    }
    if (!readyItems.length) {
      alert("Please upload at least one product image.");
      return;
    }

    const availableCredits = Number(userCredits ?? profile?.credits ?? 0);
    const allowed = await canGenerate(authUser.id, totalCreditsNeeded);
    if (!allowed && availableCredits < totalCreditsNeeded) {
      alert(`Not enough credits. Required: ${totalCreditsNeeded}, Available: ${availableCredits}`);
      return;
    }

    setLoading(true);
    cancelRef.current = false;
    try {
      for (const item of readyItems) {
        if (cancelRef.current) break;
        await generateOne(item, authUser.id);
      }

      // Credit deduction is now handled server-side by n8n workflow
      // (per item, after Update Completed → Get/Compute/Deduct Credits)
      // Just refresh the profile so UI shows latest balance.
      await refreshProfile?.();
    } catch (error: any) {
      console.error("Productography generation error:", error);
      alert(error?.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResult = async () => {
    if (!previewResult) return;
    const response = await fetch(previewResult);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agentforge-productography-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleNativeShare = async () => {
    if (!previewResult) return;
    if (navigator.share) {
      await navigator.share({ title: "AgentForge Productography AI", text: "My AI product shoot is ready", url: previewResult });
    } else {
      await navigator.clipboard.writeText(previewResult);
      alert("Image link copied.");
    }
  };

  const goStep = (step: number) => {
    setBuilderStep(step);
    setTimeout(() => stepTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const stepMeta = [
    { id: 1, title: "Product", sub: "Upload + category" },
    { id: 2, title: "Model", sub: "Model or no model" },
    { id: 3, title: "Shoot", sub: "Style + background" },
    { id: 4, title: "Final", sub: "Brand + generate" },
  ];

  const whatsappLink = previewResult
    ? `https://wa.me/?text=${encodeURIComponent(`AI product shoot ready: ${previewResult}`)}`
    : "#";

  return (
    <main className={`min-h-screen overflow-hidden ${pageBg}`}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-20 right-0 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl" />
      </div>

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
                    AgentForge Productography AI is now live — try it free
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
            <div className={`mb-5 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${darkMode ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-200" : "border border-cyan-700/20 bg-cyan-500/15 text-cyan-900"}`}>
              Mobile product photo to premium still shoot
            </div>
            <h1 className="max-w-xl text-3xl font-black leading-[1.02] tracking-[-0.04em] lg:text-5xl">
              Productography AI
              <span className="block bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Upload. Generate. Done.
              </span>
              Studio Shoot Without Studio.
            </h1>
            <p className={`mt-4 max-w-lg text-sm leading-6 lg:text-base ${muted}`}>
              Upload a normal product image from mobile and generate professional still product photography for ecommerce, Instagram, ads, catalogues, and WhatsApp selling.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#try" className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-black text-black shadow-xl shadow-cyan-500/25 transition hover:scale-105">
                Start Product Shoot
              </a>
              <Link href="/gallery" className={`rounded-full px-6 py-3 text-sm font-black ${darkMode ? "bg-white/10 text-white" : "bg-white text-black"}`}>
                View Gallery
              </Link>
            </div>
          </div>

          {/* Hero preview card with still photos */}
          <div className={`flex h-fit flex-col rounded-[1.5rem] border p-3 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-4 ${card}`}>
            <div className="grid grid-cols-2 gap-4">
              <div className={`flex min-h-[170px] items-center justify-center rounded-[1.25rem] border p-3 sm:min-h-[210px] sm:rounded-[1.5rem] sm:p-4 ${darkMode ? "border-white/10 bg-black/25" : "border-black/10 bg-[#fffaf0]"}`}>
                <div className="text-center">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Uploaded product preview"
                      className="mx-auto mb-3 h-28 w-28 rounded-2xl object-cover shadow-lg sm:h-36 sm:w-36 sm:rounded-3xl"
                    />
                  ) : (
                    <img
                      src="/productography-banner.png"
                      alt="Sample product photo"
                      className="mx-auto mb-3 h-28 w-28 rounded-2xl object-cover shadow-lg sm:h-36 sm:w-36 sm:rounded-3xl"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <p className="font-semibold">Product Photo</p>
                  <p className={`mt-1 text-sm ${muted}`}>
                    {previewImage ? "Uploaded source image" : "Upload mobile product photo"}
                  </p>
                </div>
              </div>

              <div className="flex min-h-[170px] items-center justify-center rounded-[1.25rem] border border-cyan-300/30 bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-purple-500/20 p-3 sm:min-h-[210px] sm:rounded-[1.5rem] sm:p-4">
                <div className="text-center">
                  {previewResult ? (
                    <img
                      src={previewResult}
                      alt="Generated productography output"
                      className="mx-auto mb-3 h-32 w-28 rounded-2xl object-cover shadow-lg shadow-cyan-400/30 sm:h-44 sm:w-36 sm:rounded-3xl"
                    />
                  ) : (
                    <div className="mx-auto mb-3 flex h-32 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white shadow-lg shadow-cyan-400/30 sm:h-44 sm:w-36 sm:rounded-3xl">
                      <Sparkles className="h-12 w-12" />
                    </div>
                  )}
                  <p className="font-semibold">AI Product Shoot</p>
                  <p className={`mt-1 text-sm ${muted}`}>
                    {previewResult ? "Latest generated output" : "Premium still image preview"}
                  </p>
                </div>
              </div>
            </div>

            <div className={`mt-4 rounded-[1.5rem] border p-4 ${darkMode ? "border-white/10 bg-black/25" : "border-black/10 bg-white/80"}`}>
              <p className="text-[11px] font-black uppercase tracking-widest text-cyan-600">Best for</p>
              <p className="mt-2 text-sm font-bold leading-relaxed">
                Ecommerce listing, Instagram post, ad creative, website hero, WhatsApp catalogue, product launch creatives.
              </p>
            </div>
          </div>
        </section>

        <section id="try" className="mx-auto max-w-7xl px-3 py-5 sm:px-5 sm:py-8">
          <div className={`rounded-[1.25rem] border p-3 shadow-2xl backdrop-blur-xl sm:rounded-[1.75rem] sm:p-4 lg:p-6 ${card}`}>
            <div className="mb-5 sm:mb-6">
              <h3 className="text-2xl font-black sm:text-3xl">Create Product Shoot</h3>
              <p className={`mt-2 text-sm sm:text-base ${muted}`}>
                Same AgentForge structure: upload product, choose features, write custom instructions, generate professional still image.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-600">
                  Estimated credits: {totalCreditsNeeded}
                </div>
                {!canBulk && (
                  <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black text-amber-600">
                    Bulk Locked — Upgrade for multi upload
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
              <div className="lg:sticky lg:top-24">
                <label className={`flex min-h-[190px] cursor-pointer items-center justify-center rounded-[1.5rem] border-2 border-dashed p-5 text-center ${darkMode ? "border-white/15 bg-black/20" : "border-black/15 bg-[#fffaf0]"}`}>
                  <div>
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-400 text-white shadow-lg shadow-cyan-400/25">
                      <UploadCloud className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-semibold">Upload Product Photo</p>
                    <p className={`mt-2 text-sm ${muted}`}>
                      PNG, JPG, JPEG, WEBP. {canBulk ? "Multiple files supported." : "One file at a time (free tier)."}
                    </p>
                    <p className="mt-2 text-xs font-bold text-cyan-600">
                      Still image generation only — no reel/video.
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple={canBulk}
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>

                {uploading && <p className="mt-3 text-sm font-bold text-cyan-600">Uploading product image...</p>}

                {activeItem && (
                  <div className={`mt-4 rounded-2xl border p-4 ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-black/10 bg-white/80"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-cyan-600">Product / SKU Code</p>
                        <p className={`mt-1 text-xs ${muted}`}>Optional. Keep it small, clean, around 10pt if added.</p>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-bold">
                        <input type="checkbox" checked={productTextEnabled} onChange={(e) => setProductTextEnabled(e.target.checked)} />
                        Add
                      </label>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <input
                        value={activeItem.productCode}
                        onChange={(e) => updateItemProductCode(activeItem.id, e.target.value)}
                        placeholder="SKU / CODE"
                        className={`min-w-0 flex-1 rounded-2xl border px-4 py-3 text-sm font-black uppercase outline-none focus:border-cyan-400 ${darkMode ? "border-white/10 bg-black/25 text-white" : "border-black/10 bg-white text-black"}`}
                      />
                      <button type="button" onClick={() => removeItem(activeItem.id)} className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-500">
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {items.length > 1 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {items.map((it) => (
                      <button key={it.id} type="button" onClick={() => setActiveId(it.id)} className={`overflow-hidden rounded-xl border-2 ${activeId === it.id ? "border-cyan-400" : "border-transparent"}`}>
                        {it.url ? <img src={it.url} alt={it.fileName} className="aspect-square w-full object-cover" /> : <div className="aspect-square animate-pulse bg-cyan-400/10" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Company / Brand details card */}
                <div className={`mt-4 rounded-[1.35rem] border p-4 ${darkMode ? "border-white/10 bg-white/[0.045]" : "border-black/10 bg-white/80"}`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-widest text-cyan-600">Company / Branding</p>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1.5 text-[11px] font-black text-cyan-700 dark:bg-white/10 dark:text-cyan-200"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {uploadingLogo ? "Uploading..." : "Upload Logo"}
                    </button>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />

                  <div className={`mb-3 flex items-center gap-3 rounded-2xl border p-3 ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-black/10 bg-white/70"}`}>
                    <div className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl ${darkMode ? "bg-white/10 text-cyan-200" : "bg-cyan-50 text-cyan-700"}`}>
                      {companyLogoUrl ? (
                        <img src={companyLogoUrl} alt="Company logo" className="h-full w-full object-cover" />
                      ) : (
                        <Crown className="h-6 w-6" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold">Logo on output</p>
                      <p className={`text-[11px] ${muted}`}>
                        {companyLogoUrl ? "Uploaded — appears top-right of generated image" : "Optional. Will overlay top-right corner."}
                      </p>
                    </div>
                    {companyLogoUrl && (
                      <button
                        type="button"
                        onClick={() => { setCompanyLogoUrl(""); setUseCompanyLogo(false); }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-500/10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className={`flex items-center gap-2 text-xs font-bold ${muted}`}>
                      <input type="checkbox" checked={useCompanyLogo} onChange={(e) => setUseCompanyLogo(e.target.checked)} />
                      Use logo on output
                    </label>
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Company name"
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-cyan-400 ${darkMode ? "border-white/10 bg-black/20 text-white" : "border-black/10 bg-white text-black"}`}
                    />
                    <label className={`flex items-center gap-2 text-xs font-bold ${muted}`}>
                      <input type="checkbox" checked={useCompanyName} onChange={(e) => setUseCompanyName(e.target.checked)} />
                      Show company name
                    </label>
                    <input
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      placeholder="Website"
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-cyan-400 ${darkMode ? "border-white/10 bg-black/20 text-white" : "border-black/10 bg-white text-black"}`}
                    />
                    <label className={`flex items-center gap-2 text-xs font-bold ${muted}`}>
                      <input type="checkbox" checked={useCompanyWebsite} onChange={(e) => setUseCompanyWebsite(e.target.checked)} />
                      Show website
                    </label>
                    <input
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      placeholder="Phone / WhatsApp"
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-cyan-400 ${darkMode ? "border-white/10 bg-black/20 text-white" : "border-black/10 bg-white text-black"}`}
                    />
                    <label className={`flex items-center gap-2 text-xs font-bold ${muted}`}>
                      <input type="checkbox" checked={useCompanyPhone} onChange={(e) => setUseCompanyPhone(e.target.checked)} />
                      Show phone
                    </label>
                    <input
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Address (optional)"
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-cyan-400 ${darkMode ? "border-white/10 bg-black/20 text-white" : "border-black/10 bg-white text-black"}`}
                    />
                    <label className={`flex items-center gap-2 text-xs font-bold ${muted}`}>
                      <input type="checkbox" checked={useCompanyAddress} onChange={(e) => setUseCompanyAddress(e.target.checked)} />
                      Show address
                    </label>
                  </div>
                </div>
              </div>

              <div ref={stepTopRef}>
                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {stepMeta.map((step, index) => (
                    <div
                      key={step.id}
                      onClick={() => goStep(step.id)}
                      className={`relative cursor-pointer overflow-hidden rounded-3xl border p-4 shadow-sm transition-all duration-300 active:scale-[0.98] ${
                        builderStep === step.id
                          ? "border-cyan-300 bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-cyan-200/60"
                          : darkMode
                            ? "border-white/10 bg-white/[0.04] text-white hover:border-cyan-200"
                            : "border-cyan-100 bg-white/80 text-slate-900 hover:border-cyan-200"
                      }`}
                    >
                      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-cyan-200/30 blur-2xl" />

                      <div className="relative z-10 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={`text-[10px] font-black tracking-[0.22em] ${
                            builderStep === step.id ? "text-white/80" : "text-cyan-600"
                          }`}>
                            STEP {step.id}
                          </p>

                          <h3 className="mt-1 text-lg font-black leading-none">{step.title}</h3>

                          <p className={`mt-1 text-[11px] font-semibold ${
                            builderStep === step.id
                              ? "text-white/80"
                              : darkMode ? "text-white/50" : "text-slate-500"
                          }`}>
                            {step.sub}
                          </p>
                        </div>

                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                          builderStep === step.id ? "bg-white text-cyan-600" : "bg-cyan-400 text-white"
                        }`}>
                          ✓
                        </div>
                      </div>

                      {index !== stepMeta.length - 1 && (
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-cyan-300 to-blue-400" />
                      )}
                    </div>
                  ))}
                </div>

                {builderStep === 1 && (
                  <div className="space-y-7">
                    <div>
                      <h4 className="text-xl font-black">Product Category</h4>
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                        {productCategories.map((item) => <OptionCard key={item.title} option={item} active={productCategory === item.title} onClick={() => setProductCategory(item.title)} darkMode={darkMode} />)}
                      </div>
                      <CustomTextBox label="Custom Product Details" value={customCategory} onChange={setCustomCategory} placeholder="Example: handmade scented candle, matte black bottle, premium skincare jar..." darkMode={darkMode} />
                    </div>
                  </div>
                )}

                {builderStep === 2 && (
                  <div className="space-y-7">
                    <div>
                      <h4 className="text-xl font-black">Model / Usage</h4>
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                        {modelUsageOptions.map((item) => <OptionCard key={item.title} option={item} active={modelUsage === item.title} onClick={() => setModelUsage(item.title)} darkMode={darkMode} />)}
                      </div>
                      <CustomTextBox label="Custom Model Usage" value={customModelUsage} onChange={setCustomModelUsage} placeholder="Example: only female hand holding perfume near face, no full face visible..." darkMode={darkMode} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black">Model Look</h4>
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                        {modelLookOptions.map((item) => <OptionCard key={item.title} option={item} active={modelLook === item.title} onClick={() => setModelLook(item.title)} darkMode={darkMode} />)}
                      </div>
                      <CustomTextBox label="Custom Model Look" value={customModelLook} onChange={setCustomModelLook} placeholder="Example: Indian female model, premium skincare ad look, soft smile, clean makeup..." darkMode={darkMode} />
                    </div>
                  </div>
                )}

                {builderStep === 3 && (
                  <div className="space-y-7">
                    <div>
                      <h4 className="text-xl font-black">Shoot Style</h4>
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                        {shootStyleOptions.map((item) => <OptionCard key={item.title} option={item} active={shootStyle === item.title} onClick={() => setShootStyle(item.title)} darkMode={darkMode} />)}
                      </div>
                      <CustomTextBox label="Custom Shoot Style" value={customShootStyle} onChange={setCustomShootStyle} placeholder="Example: premium cosmetic ad, soft shadows, luxury editorial lighting, no text..." darkMode={darkMode} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black">Background</h4>
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                        {backgroundOptions.map((item) => <OptionCard key={item.title} option={item} active={background === item.title} onClick={() => setBackground(item.title)} darkMode={darkMode} />)}
                      </div>
                      <CustomTextBox label="Custom Background" value={customBackground} onChange={setCustomBackground} placeholder="Example: luxury marble bathroom counter with morning sunlight and soft reflection..." darkMode={darkMode} />
                    </div>
                  </div>
                )}

                {builderStep === 4 && (
                  <div className="space-y-7">
                    <div>
                      <h4 className="text-xl font-black">Camera Angle</h4>
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                        {angleOptions.map((item) => <OptionCard key={item.title} option={item} active={cameraAngle === item.title} onClick={() => setCameraAngle(item.title)} darkMode={darkMode} />)}
                      </div>
                      <CustomTextBox label="Custom Camera Angle" value={customCameraAngle} onChange={setCustomCameraAngle} placeholder="Example: 45 degree hero shot, product centered, slight reflection, shallow depth of field..." darkMode={darkMode} />
                    </div>

                    <FrameQualityGrid
                      outputSize={outputSize}
                      quality={quality}
                      setOutputSize={setOutputSize}
                      setQuality={setQuality}
                      darkMode={darkMode}
                    />

                    <div>
                      <h4 className="text-xl font-black">Final Custom Prompt</h4>
                      <CustomTextBox
                        label="Overall Direction"
                        value={customInstruction}
                        onChange={setCustomInstruction}
                        placeholder="Example: Make it look like a premium brand campaign. Do not change logo or packaging. Keep product exact. Add soft reflection."
                        darkMode={darkMode}
                      />
                    </div>

                    <div className={`overflow-hidden rounded-[2rem] border ${darkMode ? "border-white/10 bg-black/25" : "border-black/10 bg-white/90"}`}>
                      <div className="p-4 sm:p-6">
                        <div className="mb-5">
                          <p className="text-[11px] font-black uppercase tracking-widest text-cyan-600">Ready to Generate</p>
                          <h3 className="mt-2 text-2xl font-black">Premium Product Shoot</h3>
                          <p className={`mt-3 text-sm leading-relaxed ${muted}`}>
                            Required credits: <b>{totalCreditsNeeded}</b>. Output: still product image with logo overlay.
                          </p>
                        </div>

                        <button
                          disabled={loading || uploading || readyItems.length === 0}
                          onClick={handleGenerate}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-4 text-base font-black text-black shadow-xl shadow-cyan-500/25 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 sm:gap-3 sm:py-5 sm:text-lg"
                        >
                          {loading ? (
                            <>
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                              <span>
                                Generating {readyItems.length} Shoot
                                {readyItems.length > 1 ? "s" : ""}...
                              </span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-5 w-5" />
                              <span>
                                {readyItems.length > 1 && !canBulk
                                  ? "Upgrade to Empire Pack for Bulk"
                                  : readyItems.length > 1
                                    ? `Generate ${readyItems.length} Shoots (${totalCreditsNeeded} Credits)`
                                    : `Start Product Shoot (${totalCreditsNeeded} Credits)`}
                              </span>
                            </>
                          )}
                        </button>
                      </div>

                      {(previewResult || loading) && (
                        <div className="border-t border-cyan-400/10 p-4 sm:p-6">
                          <div className="flex flex-col items-center justify-center rounded-3xl bg-black/5 p-4 sm:p-6">
                            {previewResult ? (
                              <img src={previewResult} alt="Final AI productography output" className="w-full max-w-[430px] rounded-3xl object-cover shadow-2xl" />
                            ) : (
                              <div className="flex h-[360px] w-full flex-col items-center justify-center text-center">
                                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
                                <p className="font-bold">Finalizing your product shoot...</p>
                              </div>
                            )}
                          </div>

                          {previewResult && (
                            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                              <button onClick={handleDownloadResult} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-black text-white shadow-lg shadow-emerald-500/20 transition hover:scale-105">
                                <Download className="h-5 w-5" /> Download
                              </button>
                              <button onClick={handleNativeShare} className="flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 font-black text-white shadow-lg shadow-blue-500/20 transition hover:scale-105">
                                <Share2 className="h-5 w-5" /> Share
                              </button>
                              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 font-black text-white shadow-lg shadow-green-500/20 transition hover:scale-105">
                                WhatsApp
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className={`sticky bottom-3 z-[90] mt-4 flex items-center justify-between gap-3 rounded-3xl border p-2 shadow-2xl backdrop-blur-xl sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none ${darkMode ? "border-white/10 bg-[#07111f]/92" : "border-black/10 bg-white/92"}`}>
                  <button type="button" onClick={() => goStep(Math.max(1, builderStep - 1))} disabled={builderStep === 1} className={`rounded-2xl px-5 py-3 text-sm font-black transition disabled:opacity-40 sm:px-6 ${darkMode ? "bg-white/[0.06] text-white" : "bg-white text-black"}`}>
                    Back
                  </button>
                  {builderStep < 4 && (
                    <button type="button" onClick={() => goStep(Math.min(4, builderStep + 1))} className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-black text-black shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] sm:flex-none sm:px-8">
                      Next Step
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ============================================================
          LOADING MODAL — light/dark theme + floating product icons
          ============================================================ */}
      {loading && <ProductographyLoadingModal darkMode={darkMode} fact={facts[factIndex]} onCancel={() => { cancelRef.current = true; setLoading(false); }} />}

      <SignupPromptPopup
        open={showSignupPopup}
        onClose={() => setShowSignupPopup(false)}
        source="productography-ai"
        context="product shoot"
      />
    </main>
  );
}

// ============================================================
// LOADING MODAL — light/dark theme aware with floating product icons
// ============================================================
function ProductographyLoadingModal({
  darkMode,
  fact,
  onCancel,
}: {
  darkMode: boolean;
  fact: { title: string; text: string };
  onCancel: () => void;
}) {
  // Floating decorative product icons
  const floatingIcons = [
    { Icon: Package,    x: "6%",  y: "10%", size: 58, delay: "0s",   rotate: -14, color: "text-cyan-400/55" },
    { Icon: Camera,     x: "86%", y: "14%", size: 66, delay: "0.7s", rotate: 16,  color: "text-purple-400/55" },
    { Icon: ShoppingBag,x: "10%", y: "72%", size: 50, delay: "1.2s", rotate: 8,   color: "text-amber-400/60" },
    { Icon: Sparkles,   x: "82%", y: "68%", size: 62, delay: "0.4s", rotate: -18, color: "text-cyan-500/55" },
    { Icon: ImageIcon,  x: "3%",  y: "42%", size: 42, delay: "1.5s", rotate: 22,  color: "text-pink-400/55" },
    { Icon: BadgeCheck, x: "92%", y: "42%", size: 46, delay: "0.9s", rotate: -8,  color: "text-blue-400/55" },
    { Icon: Palette,    x: "22%", y: "4%",  size: 38, delay: "1.8s", rotate: -20, color: "text-amber-500/55" },
    { Icon: Camera,     x: "70%", y: "3%",  size: 40, delay: "0.2s", rotate: 8,   color: "text-purple-500/55" },
    { Icon: Sparkles,   x: "32%", y: "88%", size: 36, delay: "1.4s", rotate: 14,  color: "text-cyan-500/55" },
    { Icon: Package,    x: "62%", y: "88%", size: 44, delay: "0.55s",rotate: -10, color: "text-rose-400/55" },
  ];

  const backdrop = darkMode
    ? "bg-gradient-to-br from-slate-950/60 via-slate-900/40 to-slate-950/60"
    : "bg-gradient-to-br from-cyan-50/40 via-white/15 to-purple-50/40";
  const cardBg = darkMode ? "bg-slate-900/90 border-cyan-400/30" : "bg-white/90 border-cyan-200/70";
  const titleColor = darkMode ? "text-white" : "text-slate-900";
  const subColor = darkMode ? "text-white/70" : "text-slate-600";
  const factBg = darkMode
    ? "bg-gradient-to-br from-cyan-500/10 via-white/5 to-purple-500/10 border-cyan-400/20"
    : "bg-gradient-to-br from-cyan-50/80 via-white to-purple-50/40 border-cyan-200/70";
  const progressBg = darkMode ? "bg-white/10" : "bg-slate-200/80";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-4">
      <div className={`absolute inset-0 backdrop-blur-[2px] ${backdrop}`} />

      {/* Floating product icons */}
      {floatingIcons.map((item, i) => {
        const Icon = item.Icon;
        return (
          <div
            key={i}
            className="pointer-events-none absolute"
            style={{
              left: item.x,
              top: item.y,
              animation: `pFloat ${4.5 + i * 0.35}s ease-in-out ${item.delay} infinite, pSpin ${10 + i}s linear ${item.delay} infinite`,
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
        @keyframes pFloat {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-18px); }
        }
        @keyframes pSpin {
          0%   { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(20deg); }
        }
        @keyframes afLogoFloatP {
          0%, 100% { transform: scale(1) rotate(-4deg); }
          50%      { transform: scale(1.1) rotate(4deg); }
        }
      `}</style>

      <div className={`relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border p-7 shadow-[0_20px_60px_-15px_rgba(34,211,238,0.45)] backdrop-blur-2xl sm:p-8 ${cardBg}`}>
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-purple-300/30 blur-3xl" />

        <div className="relative">
          <div className="relative mx-auto mb-6 h-24 w-24">
            <div className="absolute inset-0 animate-ping rounded-full bg-cyan-400 opacity-30" />
            <div className="absolute -inset-2 animate-pulse rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 opacity-40 blur-2xl" />
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white shadow-2xl ring-4 ring-cyan-400/60">
              <img
                src="/logo-new.jpg"
                alt="AgentForge"
                className="h-full w-full object-cover"
                style={{ animation: "afLogoFloatP 2.4s ease-in-out infinite" }}
                onError={(e) => {
                  e.currentTarget.src = "/af-logo.png";
                }}
              />
            </div>
          </div>

          <h3 className={`text-center text-2xl font-black tracking-tight sm:text-3xl ${titleColor}`}>
            AI is Crafting...
          </h3>
          <p className={`mt-3 text-center text-sm leading-6 ${subColor}`}>
            Generating your premium product still. Please do not refresh.
          </p>

          <div className={`mt-6 overflow-hidden rounded-full ${progressBg}`}>
            <div className="h-3 w-full animate-pulse rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600" />
          </div>

          <div className={`mt-6 overflow-hidden rounded-2xl border p-5 text-left shadow-inner ${factBg}`}>
            <p className="text-[11px] font-black uppercase tracking-widest text-cyan-600">
              {fact.title}
            </p>
            <p className={`mt-2 text-sm leading-relaxed ${darkMode ? "text-white/85" : "text-slate-700"}`}>
              {fact.text}
            </p>
          </div>

          <button
            onClick={onCancel}
            className={`mt-4 w-full text-center text-xs font-black uppercase tracking-widest transition ${darkMode ? "text-white/30 hover:text-rose-400" : "text-slate-400 hover:text-rose-500"}`}
          >
            Cancel Generation
          </button>
        </div>
      </div>
    </div>
  );
}
