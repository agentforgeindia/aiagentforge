"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { useTheme } from "@/app/components/ThemeProvider";
import { useAuth } from "@/app/components/AuthProvider";
import StickyMobileCTA from "@/app/components/StickyMobileCTA";
import {
  BadgeCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
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
import {
  SiFlipkart,
  SiInstagram,
  SiMeta,
  SiShopify,
} from "react-icons/si";
import { canGenerate } from "@/lib/checkCredits";
import { shouldDeductCredits } from "@/lib/deductCredits";
import { hasBulkAccess } from "@/lib/plans";
import SignupPromptPopup from "@/app/components/SignupPromptPopup";
import AIThinkingSteps from "@/app/components/AIThinkingSteps";
import TestimonialsSlider, {
  type Testimonial,
} from "@/app/components/TestimonialsSlider";
import RatingFeedbackModal from "@/app/components/RatingFeedbackModal";
import CongratulationsPopup from "@/app/components/CongratulationsPopup";

const PRODUCTOGRAPHY_THINKING_STEPS = [
  "Reading product details",
  "Building scene composition",
  "Applying DSLR lighting setup",
  "Adjusting depth of field",
  "Rendering catalogue-quality details",
  "Color grading & retouching",
  "Adding brand watermark",
  "Polishing the final visual",
];

// Seed testimonials — short, raw, WhatsApp-style. Real submissions from the
// DB (table: `testimonials`, status: 'approved') replace these once available.
const PRODUCTOGRAPHY_SEED_TESTIMONIALS: Testimonial[] = [
  {
    id: "seed-pg-1",
    name: "Tushar V****",
    city: "Bengaluru",
    message:
      "The perfume bottle shot turned out perfect for Amazon. Swapped the hero image and CTR jumped right away 🚀",
    rating: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
    source: "whatsapp",
  },
  {
    id: "seed-pg-2",
    name: "Sneha B****",
    city: "Pune",
    message:
      "Made lifestyle shots for our skincare brand. Catalogue + Instagram both covered in one go. Huge time saver!",
    rating: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    source: "in-app",
  },
  {
    id: "seed-pg-3",
    name: "Mohit J****",
    city: "Delhi",
    message:
      "Made both packaging and lifestyle ads for headphones. Delivered to the agency client in 1 hour — has never happened before.",
    rating: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    source: "whatsapp",
  },
  {
    id: "seed-pg-4",
    name: "Ritika P****",
    city: "Ahmedabad",
    message:
      "I run a D2C food brand. Festive banner ready in 60 seconds. No more dependency on a designer.",
    rating: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    source: "in-app",
  },
  {
    id: "seed-pg-5",
    name: "Arjun S****",
    city: "Mumbai",
    message:
      "A watch shoot used to cost ₹8k at the studio. Got 10 angles here for 100 credits. Quality is at the same level.",
    rating: 4,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    source: "whatsapp",
  },
  {
    id: "seed-pg-6",
    name: "Divya M****",
    city: "Chennai",
    message:
      "Moody lifestyle shots for candles and home decor are straight up Pinterest-quality. Uploaded directly to the catalogue.",
    rating: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    source: "whatsapp",
  },
];

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

const shootStyleOptions: Option[] = [
  { title: "Ecommerce White BG", hint: "Amazon/Flipkart style", icon: <ImageIcon />, iconFile: "/Productography-icons/pss-ecommerce-white.png" },
  { title: "Luxury Studio", hint: "Premium catalogue lighting", icon: <Camera />, iconFile: "/Productography-icons/pss-luxury-studio.png" },
  { title: "Outdoor Lifestyle", hint: "Natural brand shoot", icon: <Camera />, iconFile: "/Productography-icons/pss-outdoor-lifestyle.png" },
  { title: "Ad Creative", hint: "Poster/ad-ready image", icon: <Sparkles />, iconFile: "/Productography-icons/pss-ad-creative.png" },
  { title: "Cinematic Dark", hint: "Dramatic premium shadows", icon: <Palette />, iconFile: "/Productography-icons/pss-cinematic-dark.png" },
  { title: "Instagram Viral", hint: "Trendy social post", icon: <Wand2 />, iconFile: "/Productography-icons/pss-instagram-viral.png" },
  { title: "Festival Theme", hint: "Diwali/Eid/seasonal", icon: <Sparkles />, iconFile: "/Productography-icons/pss-festival.png" },
  { title: "Custom Shoot", hint: "Write exact direction", icon: <Wand2 />, iconFile: "/Productography-icons/pss-custom.png" },
];

const backgroundOptions: Option[] = [
  { title: "Plain White", hint: "Clean ecommerce", icon: <ImageIcon />, iconFile: "/Productography-icons/pbg-plain-white.png" },
  { title: "Luxury Black", hint: "Premium contrast", icon: <Palette />, iconFile: "/Productography-icons/pbg-luxury-black.png" },
  { title: "Marble Surface", hint: "Beauty/jewellery vibe", icon: <Layers />, iconFile: "/Productography-icons/pbg-marble.png" },
  { title: "Wooden Table", hint: "Natural product setup", icon: <Layers />, iconFile: "/Productography-icons/pbg-wooden.png" },
  { title: "Cafe / Lifestyle", hint: "Daily usage scene", icon: <Camera />, iconFile: "/Productography-icons/pbg-cafe.png" },
  { title: "Nature Outdoor", hint: "Fresh outdoor feel", icon: <Camera />, iconFile: "/Productography-icons/pbg-nature.png" },
  { title: "Neon Studio", hint: "Modern Gen-Z style", icon: <Sparkles />, iconFile: "/Productography-icons/pbg-neon.png" },
  { title: "Custom BG", hint: "Write your own scene", icon: <Wand2 />, iconFile: "/Productography-icons/pbg-custom.png" },
];


// ============================================================
// TEXTILE-PARITY HELPERS (Model Usage / Look, Shoot Style + Pose,
// Background Theme, Studio Pose, Output & Quality). Icons shared
// with the textile agent via /public/ui-icons + /public/model-faces.
// ============================================================
const UI = (f: string) => `/ui-icons/${f}.png`;

const USAGE_ICONS: Record<string, string> = {
  "No Model": "/Productography-icons/no model.svg",
  "Single Model": UI("u-single"),
  "Model Holding Product": "/Productography-icons/model holding product.svg",
  "Couple With Product": UI("u-couple"),
  "Family Lifestyle Scene": UI("u-family"),
};
const productModelUsageOptions: Option[] = [
  { title: "No Model", hint: "Product-only premium shoot", icon: <Package />, iconFile: USAGE_ICONS["No Model"] },
  { title: "Single Model", hint: "One model with the product", icon: <UserRound />, iconFile: USAGE_ICONS["Single Model"] },
  { title: "Model Holding Product", hint: "Hand / in-use shot", icon: <UserRound />, iconFile: USAGE_ICONS["Model Holding Product"] },
  { title: "Couple With Product", hint: "Lifestyle pair scene", icon: <UserRound />, iconFile: USAGE_ICONS["Couple With Product"] },
  { title: "Family Lifestyle Scene", hint: "Family usage scene", icon: <UserRound />, iconFile: USAGE_ICONS["Family Lifestyle Scene"] },
];

const POSE_ICONS: Record<string, string> = {
  "Front Face": UI("pose-front-face"),
  "Side Pose": UI("pose-side"),
  "Walking Pose": UI("pose-walking"),
  "Sitting Pose": UI("pose-sitting"),
  "Close-up Shot": UI("pose-closeup"),
  "Half Body": UI("pose-half-body"),
  "Full Body": UI("pose-full-body"),
  Auto: UI("pose-auto"),
};
const productPoseOptions = [
  "Auto",
  "Front Face",
  "Side Pose",
  "Walking Pose",
  "Sitting Pose",
  "Close-up Shot",
  "Half Body",
  "Full Body",
];

const OUTPUT_ICONS: Record<string, string> = {
  "Square (1:1)": UI("oq-square"),
  "Mobile (9:16)": UI("oq-mobile"),
  Premium: UI("oq-premium"),
  "Ultra HD": UI("oq-ultra-hd"),
};

// Background-theme sub-selector (shared universal icons with jewellery /
// textile) — opens under Luxury Studio / Outdoor Lifestyle shoot styles.
const BG_THEME_ICONS: Record<string, string> = {
  "Royal Palace": UI("bg-royal-palace"),
  "Wedding Theme": UI("bg-wedding-theme"),
  "Sea Face": UI("bg-sea-face"),
  Forest: UI("bg-forest"),
  Temple: UI("bg-temple"),
  Forts: UI("bg-forts"),
  "River Site": UI("bg-river-site"),
  Waterfall: UI("bg-waterfall"),
  Mountains: UI("bg-mountains"),
  Garden: UI("bg-garden"),
};
const backgroundThemeOptions = [
  "Royal Palace",
  "Wedding Theme",
  "Sea Face",
  "Forest",
  "Temple",
  "Forts",
  "River Site",
  "Waterfall",
  "Mountains",
  "Garden",
];

// Studio-pose sub-selector (shared universal sp-* icons) — opens under the
// Luxury Studio shoot style (how the model is posed in the studio shot).
const STUDIO_POSE_ICONS: Record<string, string> = {
  Auto: UI("sp-auto"),
  "Standing Front": UI("sp-standing-front"),
  "Three-Quarter Turn": UI("sp-three-quarter-turn"),
  "Hand in Pocket": UI("sp-hand-in-pocket"),
  "Looking Away": UI("sp-looking-away"),
  "Seated Stool": UI("sp-seated-stool"),
  "Leaning Pose": UI("sp-leaning-pose"),
  "Walking Toward Camera": UI("sp-walking-toward-camera"),
};
const studioPoseOptions = [
  "Auto",
  "Standing Front",
  "Three-Quarter Turn",
  "Hand in Pocket",
  "Looking Away",
  "Seated Stool",
  "Leaning Pose",
  "Walking Toward Camera",
];

// Shoot styles that reveal each conditional sub-selector (jewellery parity).
const SHOOT_STYLES_WITH_BG_THEME = ["Outdoor Lifestyle"];
const SHOOT_STYLES_WITH_STUDIO_POSE = ["Luxury Studio"];

// ── Gender/age-aware Model Look faces (shared with textile) ──
const MODEL_ETHNICITIES: { key: string; label: string }[] = [
  { key: "indian", label: "Indian" },
  { key: "western", label: "Western" },
  { key: "asian", label: "Asian" },
  { key: "middle-eastern", label: "Middle Eastern" },
  { key: "african", label: "African" },
  { key: "latin-american", label: "Latin American" },
];
const MODEL_GROUP_NOUN: Record<string, string> = {
  men: "Man",
  women: "Woman",
  boys: "Boy",
  girls: "Girl",
};
type ModelLookItem = { value: string; label: string; imgs: string[] };
const face = (g: string, e: string) => `/model-faces/${g}-${e}.png`;
// Product shoots use adult models by default (no apparel category split).
// Gender/age group selector (textile parity — replaces textile's category
// dimension). Female → women faces, Male → men faces, Kids → boys + girls.
const MODEL_GROUP_OPTIONS = ["Female", "Male", "Kids"] as const;
function modelGroupsFor(group: string): string[] {
  if (group === "Male") return ["men"];
  if (group === "Kids") return ["boys", "girls"];
  if (group === "Female") return ["women"];
  return ["women", "men"];
}
function modelLookMode(usage: string): "single" | "couple" | "family" | "none" {
  const u = (usage || "").toLowerCase();
  if (u.includes("mannequin") || u.includes("no model")) return "none";
  if (u.includes("couple")) return "couple";
  if (u.includes("family")) return "family";
  return "single";
}
function buildModelLookList(usage: string, group = "Female"): ModelLookItem[] {
  const mode = modelLookMode(usage);
  if (mode === "none") return [];
  if (mode === "couple") {
    return MODEL_ETHNICITIES.map((e) => ({
      value: `${e.label} Couple`,
      label: `${e.label} Couple`,
      imgs: [face("men", e.key), face("women", e.key)],
    }));
  }
  if (mode === "family") {
    return MODEL_ETHNICITIES.map((e) => ({
      value: `${e.label} Family`,
      label: `${e.label} Family`,
      imgs: [face("men", e.key), face("women", e.key), face("boys", e.key), face("girls", e.key)],
    }));
  }
  const groups = modelGroupsFor(group);
  const multi = groups.length > 1;
  const out: ModelLookItem[] = [];
  for (const g of groups) {
    for (const e of MODEL_ETHNICITIES) {
      const noun = MODEL_GROUP_NOUN[g];
      out.push({
        value: `${e.label} ${noun}`,
        label: multi ? `${e.label} ${noun}` : e.label,
        imgs: [face(g, e.key)],
      });
    }
  }
  return out;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/60 px-3 py-2 text-sm dark:bg-white/[0.04]">
      <span className="font-bold text-slate-500 dark:text-white/50">{label}</span>
      <span className="truncate text-right font-black text-slate-800 dark:text-white/85">{value || "—"}</span>
    </div>
  );
}

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

const brandPositions: [string, string][] = [
  ["top-left", "Top Left"],
  ["top-right", "Top Right"],
  ["bottom-left", "Bottom Left"],
  ["bottom-right", "Bottom Right"],
];

// Empire (or Founder/Unlimited) — gets branding overlays free.
const isEmpireFromProfile = (profile: any): boolean => {
  const planText = String(
    profile?.plan ||
      profile?.package ||
      profile?.current_plan ||
      profile?.subscription_plan ||
      profile?.plan_name ||
      "",
  ).toLowerCase();
  return Boolean(
    profile?.is_empire ||
      profile?.empire_pack ||
      profile?.has_empire ||
      planText.includes("empire") ||
      planText.includes("founder") ||
      planText.includes("unlimited"),
  );
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
    // Full path with an explicit extension (e.g. /ui-icons/u-single.png,
    // /model-faces/women-indian.png) → use as-is, no folder guessing.
    if (raw.startsWith("/") && /\.(png|jpe?g|svg|webp|avif)$/i.test(raw)) {
      return [raw];
    }
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
        className={`mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-[20px] bg-white transition sm:h-[80px] sm:w-[80px] sm:rounded-[24px] ${
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
            className="block h-full w-full object-contain transition duration-300 group-hover:scale-110"
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
// HERO PRODUCT SLIDER DATA
// ============================================================
type HeroProduct = { label: string; tag: string; icon: string; grad: string };

const HERO_PRODUCT_SLIDES: HeroProduct[][] = [
  [
    { label: "Cosmetics", tag: "Beauty ad", icon: "/Productography-icons/cosmatics.svg", grad: "from-rose-400 to-pink-500" },
    { label: "Perfume", tag: "Luxury bottle", icon: "/Productography-icons/prefume.svg", grad: "from-amber-400 to-orange-500" },
  ],
  [
    { label: "Watches", tag: "Hero shot", icon: "/Productography-icons/wrist watch.svg", grad: "from-slate-700 to-slate-900" },
    { label: "Shoes", tag: "Lifestyle", icon: "/Productography-icons/shoes.svg", grad: "from-cyan-500 to-blue-600" },
  ],
  [
    { label: "Mobiles", tag: "Tech hero", icon: "/Productography-icons/mobile.svg", grad: "from-blue-500 to-indigo-600" },
    { label: "Sunglasses", tag: "Fashion shot", icon: "/Productography-icons/sunglasses.svg", grad: "from-slate-700 to-zinc-900" },
  ],
  [
    { label: "Food", tag: "Hero plate", icon: "/Productography-icons/food.svg", grad: "from-amber-500 to-red-500" },
    { label: "Electronics", tag: "Catalogue", icon: "/Productography-icons/electronics.svg", grad: "from-violet-500 to-fuchsia-600" },
  ],
  [
    { label: "Bags", tag: "Lifestyle", icon: "/Productography-icons/fabric bag.svg", grad: "from-amber-500 to-orange-600" },
    { label: "Decor", tag: "Home goods", icon: "/Productography-icons/decor & accessories.svg", grad: "from-emerald-500 to-teal-600" },
  ],
  [
    { label: "Toys", tag: "Playful ad", icon: "/Productography-icons/toys.svg", grad: "from-pink-400 to-rose-500" },
    { label: "Custom", tag: "Any product", icon: "/Productography-icons/custom look.svg", grad: "from-cyan-500 to-purple-600" },
  ],
];

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function ProductographyPage() {
  const { darkMode } = useTheme();
  const { user: authUser, credits: userCredits, refreshProfile } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [ratingGenerationId, setRatingGenerationId] = useState<string | undefined>();
  const [reviewedResult, setReviewedResult] = useState(false);
  const [downloadAfterReview, setDownloadAfterReview] = useState(false);
  const [showCongratsPopup, setShowCongratsPopup] = useState(false);
  const [congratsCredits, setCongratsCredits] = useState(0);
  const [items, setItems] = useState<GenItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const [builderStep, setBuilderStep] = useState(1);
  const [heroSlide, setHeroSlide] = useState(0);
  const stepTopRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const cancelRef = useRef(false);

  const [productCategory, setProductCategory] = useState("Cosmetics");
  const [modelUsage, setModelUsage] = useState("No Model");
  const [modelGroup, setModelGroup] = useState("Female");
  const [modelLook, setModelLook] = useState("Indian Woman");
  const [pose, setPose] = useState("Auto");
  const [shootStyle, setShootStyle] = useState("Luxury Studio");
  const [background, setBackground] = useState("Plain White");
  const [backgroundTheme, setBackgroundTheme] = useState("Royal Palace");
  const [studioPose, setStudioPose] = useState("Auto");
  const [outputSize, setOutputSize] = useState("1080x1080");
  const [quality, setQuality] = useState("Premium");

  const [customCategory, setCustomCategory] = useState("");
  const [customModelUsage, setCustomModelUsage] = useState("");
  const [customModelLook, setCustomModelLook] = useState("");
  const [customPose, setCustomPose] = useState("");
  const [customShootStyle, setCustomShootStyle] = useState("");
  const [customBackground, setCustomBackground] = useState("");
  const [customOutputSize, setCustomOutputSize] = useState("");
  const [customQuality, setCustomQuality] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");

  // Gender/age-aware Model Look list (textile parity) — reacts to usage + group.
  const modelLookMode_ = modelLookMode(customModelUsage.trim() || modelUsage);
  const modelLookList = buildModelLookList(customModelUsage.trim() || modelUsage, modelGroup);
  const modelLookDisabled = modelLookMode_ === "none";
  // Gender/age selector only matters for a single-person model scene.
  const showModelGroup = modelLookMode_ === "single";

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
  // Overlay placement (corner) for each branding element.
  const [companyNamePosition, setCompanyNamePosition] = useState("bottom-left");
  const [companyPhonePosition, setCompanyPhonePosition] = useState("bottom-right");
  const [companyWebsitePosition, setCompanyWebsitePosition] = useState("bottom-left");
  const [companyAddressPosition, setCompanyAddressPosition] = useState("bottom-right");
  const [logoPosition, setLogoPosition] = useState("top-right");
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

  useEffect(() => {
    if (previewResult) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
  }, [previewResult]);

  const card = darkMode
    ? "border-white/10 bg-white/[0.045] shadow-black/40"
    : "border-black/10 bg-white/85 shadow-cyan-900/10";
  const muted = darkMode ? "text-white/55" : "text-black/55";
  const pageBg = darkMode
    ? "bg-[#070b14] text-white"
    : "bg-[#fff8e8] text-[#111827]";

  const isFreeAccount = useMemo(() => isFreeAccountFromProfile(profile), [profile]);
  const canBulk = useMemo(() => hasBulkAccess(profile?.plan), [profile]);
  // Empire users get branding overlays free (same as the Textile page).
  const isEmpireUser = isEmpireFromProfile(profile);

  const requiredCredits = (() => {
    const q = quality.toLowerCase();
    const s = outputSize;
    let base = 15;
    // Ultra HD = 30 (real 4K). Premium = 15. Mobile/portrait = +2.
    if (q.includes("ultra")) base += 15;
    if (s === "1080x1920" || s === "1920x1080") base += 2;
    // Branding (logo + fields): +1 each — FREE for Empire.
    if (!isEmpireUser) {
      if (useCompanyLogo && companyLogoUrl) base += 1;
      if (useCompanyName && companyName.trim()) base += 1;
      if (useCompanyPhone && companyPhone.trim()) base += 1;
      if (useCompanyWebsite && companyWebsite.trim()) base += 1;
      if (useCompanyAddress && companyAddress.trim()) base += 1;
    }
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
      setModelUsage(s.modelUsage || "No Model");
      setModelGroup(s.modelGroup || "Female");
      setModelLook(s.modelLook || "Indian Woman");
      setPose(s.pose || "Auto");
      setShootStyle(s.shootStyle || "Luxury Studio");
      setBackground(s.background || "Plain White");
      setBackgroundTheme(s.backgroundTheme || "Royal Palace");
      setStudioPose(s.studioPose || "Auto");
      setOutputSize(s.outputSize || "1080x1080");
      setQuality(s.quality || "Premium");
      setCustomCategory(s.customCategory || "");
      setCustomModelUsage(s.customModelUsage || "");
      setCustomModelLook(s.customModelLook || "");
      setCustomPose(s.customPose || "");
      setCustomShootStyle(s.customShootStyle || "");
      setCustomBackground(s.customBackground || "");
      setCustomOutputSize(s.customOutputSize || "");
      setCustomQuality(s.customQuality || "");
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
        productCategory, modelUsage, modelGroup, modelLook, pose, shootStyle, background, backgroundTheme, studioPose,
        outputSize, quality, customCategory, customModelUsage, customModelLook,
        customPose, customShootStyle, customBackground, customOutputSize, customQuality, customInstruction,
        companyName, companyPhone, companyWebsite, companyAddress, companyLogoUrl,
        useCompanyName, useCompanyPhone, useCompanyWebsite, useCompanyAddress,
        useCompanyLogo, productTextEnabled,
      }),
    );
  }, [
    productCategory, modelUsage, modelGroup, modelLook, pose, shootStyle, background, backgroundTheme, studioPose,
    outputSize, quality, customCategory, customModelUsage, customModelLook,
    customPose, customShootStyle, customBackground, customOutputSize, customQuality, customInstruction,
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

  // Hero product slider — auto-rotate every 4 s, paused on
  // hidden tabs so we don't burn the main thread in the background.
  useEffect(() => {
    let interval: number | null = null;
    const start = () => {
      if (interval !== null) return;
      interval = window.setInterval(() => {
        setHeroSlide((current) => (current + 1) % HERO_PRODUCT_SLIDES.length);
      }, 4000);
    };
    const stop = () => {
      if (interval !== null) {
        window.clearInterval(interval);
        interval = null;
      }
    };
    const onVis = () =>
      document.visibilityState === "visible" ? start() : stop();
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

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

    // Fresh upload → reset to Step 1 so the user configures the new product
    // from scratch (category, model usage, shoot, final).
    setBuilderStep(1);
    setTimeout(() => {
      stepTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    // Bulk plan check — multiple files require bulk access
    if (files.length > 1 && !canBulk) {
      alert(
        "Bulk generation is available on Pro and Empire plans. Please upload one product at a time, or upgrade to Pro or Empire.",
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

  // ── Canvas text overlay (article + branding) — fixed small size ──
  type TextOverlayData = {
    article?: string;
    articlePosition?: string;
    lines: { text: string; position: string }[];
    color: "white" | "black";
  };

  const roundRectPath = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const hasOverlayText = (o?: TextOverlayData) =>
    !!(o && (o.article?.trim() || o.lines.some((l) => l.text?.trim())));

  const drawTextOverlay = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    overlay: TextOverlayData,
  ) => {
    const fontPx = Math.max(13, Math.round(H * 0.016));
    const inset = Math.round(W * 0.03);
    const padX = Math.round(fontPx * 0.6);
    const padY = Math.round(fontPx * 0.4);
    const gap = Math.round(fontPx * 0.5);
    const radius = Math.round(fontPx * 0.4);
    const lineH = fontPx + padY * 2;
    const normCorner = (p?: string) => {
      const k = (p || "bottom-left").toLowerCase();
      const right = k.includes("right");
      const top = k.includes("top");
      return `${top ? "top" : "bottom"}-${right ? "right" : "left"}`;
    };
    const buckets: Record<string, string[]> = {
      "top-left": [], "top-right": [], "bottom-left": [], "bottom-right": [],
    };
    if (overlay.article?.trim())
      buckets[normCorner(overlay.articlePosition)].push(overlay.article.trim());
    for (const l of overlay.lines)
      if (l.text?.trim()) buckets[normCorner(l.position)].push(l.text.trim());

    ctx.save();
    ctx.font = `600 ${fontPx}px Inter, Arial, sans-serif`;
    ctx.textBaseline = "top";
    const textColor = overlay.color === "black" ? "#161616" : "#ffffff";
    const pillColor =
      overlay.color === "black" ? "rgba(255,255,255,0.85)" : "rgba(15,15,15,0.55)";
    for (const corner of Object.keys(buckets)) {
      const lines = buckets[corner];
      if (!lines.length) continue;
      const isRight = corner.includes("right");
      const isBottom = corner.includes("bottom");
      const blockH = lines.length * lineH + (lines.length - 1) * gap;
      let y = isBottom ? H - inset - blockH : inset;
      for (const text of lines) {
        const tw = ctx.measureText(text).width;
        const pillW = tw + padX * 2;
        const x = isRight ? W - inset - pillW : inset;
        ctx.fillStyle = pillColor;
        roundRectPath(ctx, x, y, pillW, lineH, radius);
        ctx.fill();
        ctx.fillStyle = textColor;
        ctx.fillText(text, x + padX, y + padY);
        y += lineH + gap;
      }
    }
    ctx.restore();
  };

  const compositeLogoOnImage = async (
    baseImageUrl: string,
    cLogoUrl: string | null,
    showAfWatermark: boolean,
    textOverlay?: TextOverlayData,
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

      if (!companyLogoImg && !afLogoImg && !hasOverlayText(textOverlay))
        return null;

      const canvas = document.createElement("canvas");
      canvas.width = baseImg.naturalWidth;
      canvas.height = baseImg.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(baseImg, 0, 0);

      if (companyLogoImg) {
        drawLogoInCorner(
          ctx,
          canvas.width,
          canvas.height,
          companyLogoImg,
          logoPosition as "top-right" | "bottom-right" | "top-left" | "bottom-left",
          0.07,
          1,
        );
      }
      if (afLogoImg) {
        drawLogoInCorner(ctx, canvas.width, canvas.height, afLogoImg, "bottom-right", 0.06, 0.88);
      }

      if (hasOverlayText(textOverlay)) {
        drawTextOverlay(ctx, canvas.width, canvas.height, textOverlay!);
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
      textOverlay?: TextOverlayData;
    },
  ): Promise<string> => {
    const { companyLogoUrl: cLogo, afWatermark, generationId, textOverlay } =
      options;

    const safeCompanyLogo =
      cLogo && !cLogo.startsWith("data:") && !cLogo.startsWith("blob:") ? cLogo : null;

    if (!safeCompanyLogo && !afWatermark && !hasOverlayText(textOverlay))
      return rawOutputUrl;

    try {
      const compositeBlob = await compositeLogoOnImage(
        rawOutputUrl,
        safeCompanyLogo,
        Boolean(afWatermark),
        textOverlay,
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

  const resolveProductOutputSize = (sz: string): string => {
    if (sz === "1080x1080") return "2000x2000";
    if (sz === "1080x1920") return "1080x1920";
    return sz;
  };

  const generateOne = async (item: GenItem, userId: string) => {
    const generationId = newId();
    const resolvedCategory = customCategory.trim() || productCategory;
    const resolvedModelUsage = customModelUsage.trim() || modelUsage;
    const resolvedModelLook = modelLookDisabled ? "" : (customModelLook.trim() || modelLook);
    const resolvedShootStyle = customShootStyle.trim() || shootStyle;
    const resolvedBackground = customBackground.trim() || background;
    const resolvedPose = modelLookDisabled ? "" : (customPose.trim() || pose);
    const resolvedQuality = customQuality.trim() || quality;
    const resolvedOutputSize = resolveProductOutputSize(customOutputSize.trim() || outputSize);

    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, status: "generating" } : it)));

    const brandDetails = {
      company_name: useCompanyName ? companyName.trim() : "",
      phone_number: useCompanyPhone ? companyPhone.trim() : "",
      website: useCompanyWebsite ? companyWebsite.trim() : "",
      address: useCompanyAddress ? companyAddress.trim() : "",
      logo_url: useCompanyLogo ? companyLogoUrl.trim() : "",
      positions: {
        company_name: companyNamePosition,
        phone_number: companyPhonePosition,
        website: companyWebsitePosition,
        address: companyAddressPosition,
        logo: logoPosition,
      },
    };

    const dbRow = {
      id: generationId,
      user_id: userId,
      design_url: item.url,
      input_image_url: item.url,
      product_type: resolvedCategory,
      model_type: resolvedModelLook,
      shoot_style: resolvedShootStyle,
      output_size: resolvedOutputSize,
      quality: resolvedQuality,
      article_number: item.productCode.trim() || null,
      custom_instruction: customInstruction,
      status: "pending",
      agent_type: "productography",
      category: "productography",
    };

    // Funnel: per-item generation started.
    const generationStartedAt = Date.now();
    track({
      name: "generation_started",
      agent: "productography",
      credits: requiredCredits,
    });

    // Both the row insert AND the n8n forward happen inside the
    // server route, so the browser no longer touches the n8n
    // webhook URL directly (which closed the public exploit).
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      track({
        name: "generation_failed",
        agent: "productography",
        stage: "deduct",
        reason: "no_session",
      });
      throw new Error("Session expired. Please sign in again.");
    }

    const response = await fetch("/api/productography/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        generation_id: generationId,
        // user_id deliberately omitted — server stamps it from JWT.
        agent_type: "productography",
        product_image_url: item.url,
        design_url: item.url,
        input_image_url: item.url,
        product_category: resolvedCategory,
        product_type: resolvedCategory,
        model_usage: resolvedModelUsage,
        model_group: modelLookDisabled ? "" : modelGroup,
        model_type: resolvedModelLook,
        model_look: resolvedModelLook,
        pose: resolvedPose,
        shoot_style: resolvedShootStyle,
        background_style: resolvedBackground,
        background_theme: !customShootStyle.trim() && SHOOT_STYLES_WITH_BG_THEME.includes(shootStyle) ? backgroundTheme : "",
        studio_pose: !customShootStyle.trim() && SHOOT_STYLES_WITH_STUDIO_POSE.includes(shootStyle) && !modelLookDisabled ? studioPose : "",
        output_size: customOutputSize.trim() || outputSize,
        quality: resolvedQuality,
        output_quality: resolvedQuality,
        required_credits: requiredCredits,
        credits_required: requiredCredits,
        // Text/branding is composited on the frontend (canvas) —
        // the AI must NOT render it, otherwise it doubles.
        product_code: "",
        article_number: "",
        text_on_image: "",
        brand_details: {},
        company_details: {},
        company_name: "",
        company_phone: "",
        company_website: "",
        company_address: "",
        company_name_position: companyNamePosition,
        company_phone_position: companyPhonePosition,
        company_website_position: companyWebsitePosition,
        company_address_position: companyAddressPosition,
        logo_position: logoPosition,
        af_watermark: isFreeAccount,
        reserve_second_corner: isFreeAccount,
        custom_instruction: customInstruction,
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      track({
        name: "generation_failed",
        agent: "productography",
        stage: "n8n",
        reason: `status_${response.status}`,
      });
      throw new Error(`Server error ${response.status}: ${text}`);
    }
    const data = text ? JSON.parse(text) : {};
    // n8n's reply is nested inside webhook_response now that
    // the request flows through our adapter route.
    const inner = data?.webhook_response ?? data;
    const immediateImage =
      inner?.image_url || inner?.output_image_url || inner?.image || inner?.url;
    const rawFinalImage = immediateImage || (await pollGenerationResult(generationId));

    // Apply Canvas logo overlay (company top-right + AF bottom-right for free)
    const finalImage = rawFinalImage
      ? await applyLogoOverlay(rawFinalImage, {
          companyLogoUrl: useCompanyLogo ? companyLogoUrl : undefined,
          afWatermark: isFreeAccount,
          generationId,
          textOverlay: {
            article: productTextEnabled ? item.productCode?.trim() || "" : "",
            articlePosition: "top-left",
            lines: [
              { text: useCompanyName ? companyName.trim() : "", position: companyNamePosition },
              { text: useCompanyPhone ? companyPhone.trim() : "", position: companyPhonePosition },
              { text: useCompanyWebsite ? companyWebsite.trim() : "", position: companyWebsitePosition },
              { text: useCompanyAddress ? companyAddress.trim() : "", position: companyAddressPosition },
            ],
            color: "white",
          },
        })
      : rawFinalImage;

    track({
      name: "generation_completed",
      agent: "productography",
      generation_id: generationId,
      duration_ms: Date.now() - generationStartedAt,
    });

    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, resultUrl: finalImage || "", status: "done" } : it)),
    );
    setActiveId(item.id);
    setRatingGenerationId(generationId);
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
      track({
        name: "insufficient_credits",
        agent: "productography",
        required: totalCreditsNeeded,
      });
      alert(`Not enough credits. Required: ${totalCreditsNeeded}, Available: ${availableCredits}`);
      return;
    }

    setLoading(true);
    cancelRef.current = false;
    try {
      let anyResult = false;
      for (const item of readyItems) {
        if (cancelRef.current) break;
        await generateOne(item, authUser.id);
        anyResult = true;
      }

      // Show the finished result in a popup first (with Download / Share).
      // Rating + congrats only fire later, when the user clicks Download.
      if (anyResult && !cancelRef.current) setResultModalOpen(true);

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

  const requestDownload = () => {
    if (!reviewedResult) { setDownloadAfterReview(true); setShowRatingModal(true); return; }
    handleDownloadResult();
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

  const handleDownloadPDF = () => {
    const doneItems = items.filter((it) => it.resultUrl && it.status === "done");
    if (doneItems.length === 0 && !previewResult) return;
    const imgUrls = doneItems.length > 0 ? doneItems.map((it) => it.resultUrl!) : [previewResult!];
    const date = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const imgTags = imgUrls.map((url, i) =>
      `<div class="page"><img src="${url}" /><p class="label">Product Shoot ${i + 1} — AgentForge AI · ${date}</p></div>`
    ).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AgentForge Product Shoots</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#fff; font-family:Arial,sans-serif; }
  .page { page-break-after:always; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; padding:20px; }
  .page:last-child { page-break-after:auto; }
  img { max-width:100%; max-height:90vh; object-fit:contain; border-radius:8px; box-shadow:0 4px 24px rgba(0,0,0,0.12); }
  .label { margin-top:12px; font-size:11px; color:#6b7280; text-align:center; }
  @media print { body { background:#fff; } }
</style></head><body>${imgTags}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (w) { setTimeout(() => { w.print(); setTimeout(() => URL.revokeObjectURL(url), 3000); }, 600); }
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
    <main className={`relative min-h-screen overflow-hidden ${pageBg}`}>
      {/* Gradient Glow Layer — same as home screen */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee66,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf655,transparent_35%),radial-gradient(circle_at_bottom,#0ea5e955,transparent_30%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.08))]" />

      {/* Grid Overlay — same as home screen */}
      <div
        className={`pointer-events-none fixed inset-0 ${darkMode ? "opacity-[0.05]" : "opacity-[0.10]"}`}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      {/* Floating Doodles — productography themed */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Top band */}
        <div className="float-slow absolute left-[6%] top-[6%] text-4xl opacity-65 sm:text-5xl">📸</div>
        <div className="float-medium absolute right-[8%] top-[10%] text-4xl opacity-65 sm:text-5xl">🛍️</div>
        <div className="float-fast absolute left-[22%] top-[14%] text-2xl opacity-55 sm:text-3xl">✨</div>
        <div className="float-medium absolute right-[24%] top-[6%] text-3xl opacity-60 sm:text-4xl">💄</div>
        <div className="float-slow absolute left-[42%] top-[3%] text-2xl opacity-50 sm:text-3xl">⭐</div>
        <div className="float-fast absolute right-[42%] top-[18%] text-3xl opacity-60 sm:text-4xl">⌚</div>

        {/* Side accents */}
        <div className="float-medium absolute left-[3%] top-[28%] text-3xl opacity-55 sm:text-4xl">🕶️</div>
        <div className="float-slow absolute right-[4%] top-[32%] text-3xl opacity-55 sm:text-4xl">👜</div>
        <div className="float-fast absolute left-[8%] top-[44%] text-3xl opacity-55 sm:text-4xl">⚡</div>
        <div className="float-medium absolute right-[6%] top-[46%] text-3xl opacity-55 sm:text-4xl">🏆</div>

        {/* Middle band */}
        <div className="float-slow absolute left-[35%] top-[52%] text-2xl opacity-50 sm:text-3xl">📦</div>
        <div className="float-medium absolute right-[30%] top-[58%] text-2xl opacity-55 sm:text-3xl">👠</div>
        <div className="float-fast absolute left-[14%] top-[62%] text-3xl opacity-55 sm:text-4xl">📷</div>
        <div className="float-slow absolute right-[14%] top-[66%] text-3xl opacity-55 sm:text-4xl">🎁</div>

        {/* Lower band */}
        <div className="float-fast absolute left-[20%] top-[78%] text-2xl opacity-55 sm:text-3xl">✦</div>
        <div className="float-medium absolute right-[18%] top-[82%] text-3xl opacity-60 sm:text-4xl">💎</div>
        <div className="float-slow absolute left-[48%] top-[88%] text-2xl opacity-50 sm:text-3xl">🎨</div>
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

        <section className="mx-auto grid w-full max-w-7xl items-start gap-5 px-3 py-5 sm:px-4 lg:grid-cols-[0.95fr_1.05fr] lg:py-8">
          {/* ───────── Left: ecommerce-luxury hero text ───────── */}
          <div>
            {/* Category eyebrow pill */}
            <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] shadow-md ${
              darkMode
                ? "border-amber-400/30 bg-gradient-to-r from-amber-500/10 via-white/5 to-cyan-500/10 text-amber-200"
                : "border-amber-300/60 bg-gradient-to-r from-amber-50 via-white to-cyan-50 text-amber-700 shadow-amber-200/40"
            }`}>
              <Sparkles className="h-3 w-3" />
              Cosmetics · Watches · Shoes · Perfume · Luxury Ads
            </div>

            <h1 className="max-w-xl text-3xl font-black leading-[1.02] tracking-[-0.03em] lg:text-5xl">
              <span className="block">Luxury Product Shoots.</span>
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                Without the Studio.
              </span>
            </h1>

            <p className={`mt-3 max-w-xl text-base font-bold leading-6 lg:text-lg lg:leading-7`}>
              <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Mobile photo → Amazon-ready hero shot.
              </span>{" "}
              <span className={muted}>In 60 seconds.</span>
            </p>

            <p className={`mt-4 max-w-lg text-justify text-sm leading-6 hyphens-auto lg:text-base ${muted}`}>
              Cosmetics, watches, shoes, perfume, gadgets, packaged goods — upload
              from your phone and get DSLR-quality listing images, lifestyle ad
              creatives and premium brand campaigns ready for Amazon, Flipkart,
              Instagram and your website.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  if (typeof document !== "undefined") {
                    document.getElementById("try")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className="group relative cursor-pointer overflow-hidden rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-6 py-3 text-sm font-black text-white shadow-xl shadow-amber-500/30 transition hover:scale-105 active:scale-95"
              >
                <span className="relative inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Start Luxury Shoot
                </span>
              </button>
              <Link
                href="/gallery"
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-6 py-3 text-sm font-black transition hover:scale-105 active:scale-95 ${darkMode ? "bg-white/10 text-white" : "bg-white text-black border border-black/5 shadow-sm"}`}
              >
                View Gallery
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Trust strip — ecommerce focused */}
            <div className={`mt-6 grid max-w-xl grid-cols-3 gap-2 rounded-2xl border p-2.5 text-center backdrop-blur ${
              darkMode ? "border-white/10 bg-white/[0.04]" : "border-black/10 bg-white/80"
            }`}>
              <div>
                <p className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-sm font-black text-transparent sm:text-base">
                  Amazon Ready
                </p>
                <p className={`text-[9px] font-bold uppercase tracking-wider ${muted}`}>
                  Listing-safe HD
                </p>
              </div>
              <div className={`border-x ${darkMode ? "border-white/10" : "border-black/10"}`}>
                <p className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-sm font-black text-transparent sm:text-base">
                  DSLR Quality
                </p>
                <p className={`text-[9px] font-bold uppercase tracking-wider ${muted}`}>
                  Logo &amp; label intact
                </p>
              </div>
              <div>
                <p className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-sm font-black text-transparent sm:text-base">
                  ~30 sec
                </p>
                <p className={`text-[9px] font-bold uppercase tracking-wider ${muted}`}>
                  Per shoot
                </p>
              </div>
            </div>
          </div>

          {/* ───────── Right: luxury category showcase ───────── */}
          <div className={`relative flex h-fit flex-col overflow-hidden rounded-[1.5rem] border p-3 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-5 ${
            darkMode
              ? "border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-950/70"
              : "border-amber-200/40 bg-gradient-to-br from-amber-50/60 via-white to-rose-50/40"
          }`}>
            {/* Decorative blurs */}
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-rose-400/20 blur-3xl" />

            {/* Header */}
            <div className="relative mb-3 flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-600">
                Premium Showcase
              </p>

              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] ${
                darkMode ? "bg-white/10 text-white/75" : "bg-black text-white"
              }`}>
                <span className="h-1 w-1 rounded-full bg-amber-400" />
                Luxury Ads
              </span>
            </div>

            {/* Product slider — auto-rotating, arrows on the sides */}
            <div className="relative">
              {/* Prev arrow — left side */}
              <button
                type="button"
                aria-label="Previous slide"
                onClick={() =>
                  setHeroSlide((p) => (p - 1 + HERO_PRODUCT_SLIDES.length) % HERO_PRODUCT_SLIDES.length)
                }
                className={`absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border shadow-lg backdrop-blur transition hover:scale-110 active:scale-95 ${
                  darkMode ? "border-white/15 bg-slate-900/80 text-white/80" : "border-black/10 bg-white text-black/70"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Next arrow — right side */}
              <button
                type="button"
                aria-label="Next slide"
                onClick={() => setHeroSlide((p) => (p + 1) % HERO_PRODUCT_SLIDES.length)}
                className={`absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 translate-x-1/2 cursor-pointer items-center justify-center rounded-full border shadow-lg backdrop-blur transition hover:scale-110 active:scale-95 ${
                  darkMode ? "border-white/15 bg-slate-900/80 text-white/80" : "border-black/10 bg-white text-black/70"
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="relative overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${heroSlide * 100}%)` }}
                >
                  {HERO_PRODUCT_SLIDES.map((slide, slideIdx) => (
                    <div key={slideIdx} className="grid w-full shrink-0 grid-cols-2 gap-3">
                      {slide.map((cat) => (
                      <a
                        key={`${slideIdx}-${cat.label}`}
                        href="#try"
                        onClick={(e) => {
                          e.preventDefault();
                          if (typeof document !== "undefined") {
                            document.getElementById("try")?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }}
                        className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border p-2.5 transition hover:-translate-y-1 hover:shadow-lg active:scale-95 ${
                          darkMode ? "border-white/10 bg-white/[0.04] hover:border-amber-400/40" : "border-black/10 bg-white shadow-sm hover:border-amber-400/60"
                        }`}
                      >
                        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-white/[0.08] dark:via-white/[0.04] dark:to-white/[0.02]">
                          <img
                            src={cat.icon}
                            alt={`AI ${cat.label} ${cat.tag.toLowerCase()} — ecommerce product photography example by AgentForge AI`}
                            width={200}
                            height={200}
                            loading="lazy"
                            decoding="async"
                            className="h-3/4 w-3/4 object-contain transition group-hover:scale-110"
                            style={{ mixBlendMode: darkMode ? "screen" : "multiply" }}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                          {/* Amazon-listing-style price+star strip */}
                          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between rounded-md bg-black/70 px-2 py-1 backdrop-blur">
                            <span className="flex items-center gap-0.5 text-[9px] font-black text-amber-300">
                              ★ ★ ★ ★ ★
                            </span>
                            <span className={`rounded-sm bg-gradient-to-r ${cat.grad} px-1.5 py-0.5 text-[8px] font-black text-white`}>
                              HD
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-black sm:text-xs">{cat.label}</p>
                            <p className={`truncate text-[9px] font-bold uppercase tracking-wider ${muted}`}>
                              {cat.tag}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full bg-gradient-to-r ${cat.grad} px-1.5 py-0.5 text-[8px] font-black text-white`}>
                            Try →
                          </span>
                        </div>
                      </a>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Slider dots */}
            <div className="relative mt-3 flex items-center justify-center gap-1.5">
              {HERO_PRODUCT_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={() => setHeroSlide(idx)}
                  className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
                    heroSlide === idx
                      ? "w-6 bg-gradient-to-r from-amber-400 to-rose-500"
                      : darkMode
                      ? "w-1.5 bg-white/25 hover:bg-white/40"
                      : "w-1.5 bg-black/20 hover:bg-black/40"
                  }`}
                />
              ))}
            </div>

            {/* Best-for ticker — ecommerce focused (brand logos) */}
            <div className={`relative mt-3 rounded-[1.25rem] border p-3 sm:p-4 ${
              darkMode ? "border-white/10 bg-black/25" : "border-black/10 bg-white/80"
            }`}>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-600">
                Built for
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {/* Amazon — inline brand mark */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
                    darkMode ? "border-white/10 bg-white/[0.05]" : "border-black/10 bg-white"
                  }`}
                  title="Amazon"
                >
                  <span className="text-[13px] font-black leading-none tracking-tight text-[#232F3E] dark:text-white">
                    amazon
                  </span>
                  <span className="block h-1 w-3 -translate-y-0.5 rounded-full bg-[#FF9900]" />
                </span>

                {/* Flipkart */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
                    darkMode ? "border-white/10 bg-white/[0.05]" : "border-black/10 bg-white"
                  }`}
                  title="Flipkart"
                >
                  <SiFlipkart className="h-3.5 w-3.5 text-[#2874F0]" />
                  <span className="text-[11px] font-black text-[#2874F0]">Flipkart</span>
                </span>

                {/* Meesho — text wordmark in brand pink */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
                    darkMode ? "border-white/10 bg-white/[0.05]" : "border-black/10 bg-white"
                  }`}
                  title="Meesho"
                >
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#F43397] text-[8px] font-black text-white">
                    m
                  </span>
                  <span className="text-[11px] font-black text-[#F43397]">meesho</span>
                </span>

                {/* Instagram */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
                    darkMode ? "border-white/10 bg-white/[0.05]" : "border-black/10 bg-white"
                  }`}
                  title="Instagram"
                >
                  <SiInstagram className="h-3.5 w-3.5 text-[#E1306C]" />
                  <span className="text-[11px] font-black text-[#E1306C]">Instagram</span>
                </span>

                {/* Shopify — represents D2C */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
                    darkMode ? "border-white/10 bg-white/[0.05]" : "border-black/10 bg-white"
                  }`}
                  title="Shopify · D2C sites"
                >
                  <SiShopify className="h-3.5 w-3.5 text-[#96BF48]" />
                  <span className="text-[11px] font-black text-[#5E8E3E] dark:text-[#96BF48]">Shopify · D2C</span>
                </span>

                {/* Meta — Ads */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
                    darkMode ? "border-white/10 bg-white/[0.05]" : "border-black/10 bg-white"
                  }`}
                  title="Meta Ads"
                >
                  <SiMeta className="h-3.5 w-3.5 text-[#0866FF]" />
                  <span className="text-[11px] font-black text-[#0866FF]">Meta Ads</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="try" className="mx-auto max-w-7xl px-3 py-5 sm:px-5 sm:py-8">
          <div className={`rounded-[1.25rem] border p-3 shadow-2xl backdrop-blur-xl sm:rounded-[1.75rem] sm:p-4 lg:p-6 ${card}`}>
            <div className="mb-5 sm:mb-6">
              <h2 className="text-2xl font-black sm:text-3xl">Create Your AI Product Photoshoot</h2>
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
                <label className={`relative flex h-[240px] cursor-pointer overflow-hidden rounded-[1.5rem] border-2 border-dashed transition-all ${
                  items[0]?.url
                    ? darkMode ? "border-cyan-400/40" : "border-cyan-300/60"
                    : darkMode ? "items-center justify-center bg-black/20 p-5 text-center border-white/15" : "items-center justify-center bg-[#fffaf0] p-5 text-center border-black/15"
                }`}>
                  {items[0]?.url ? (
                    <>
                      <img src={items[0].url} alt="Uploaded product preview" className="h-full w-full object-contain" />
                      <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent p-3">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-black/70">Tap to change</span>
                      </div>
                    </>
                  ) : (
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
                  )}
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
                  <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
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
                    <div className="flex items-center justify-between gap-2">
                      <label className={`flex items-center gap-2 text-xs font-bold ${muted}`}>
                        <input type="checkbox" checked={useCompanyLogo} onChange={(e) => setUseCompanyLogo(e.target.checked)} />
                        Use logo on output
                      </label>
                      <select
                        value={logoPosition}
                        disabled={!useCompanyLogo}
                        onChange={(e) => setLogoPosition(e.target.value)}
                        aria-label="Logo position"
                        className={`max-w-[130px] rounded-lg border px-2 py-1.5 text-[11px] font-bold outline-none ${darkMode ? "border-white/10 bg-black/30 text-white disabled:text-white/30" : "border-black/10 bg-white text-black disabled:text-black/30"}`}
                      >
                        {brandPositions.map(([v, t]) => (
                          <option key={v} value={v}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Company name"
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-cyan-400 ${darkMode ? "border-white/10 bg-black/20 text-white" : "border-black/10 bg-white text-black"}`}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <label className={`flex items-center gap-2 text-xs font-bold ${muted}`}>
                        <input type="checkbox" checked={useCompanyName} onChange={(e) => setUseCompanyName(e.target.checked)} />
                        Show company name
                      </label>
                      <select value={companyNamePosition} disabled={!useCompanyName} onChange={(e) => setCompanyNamePosition(e.target.value)} aria-label="Company name position" className={`max-w-[130px] rounded-lg border px-2 py-1.5 text-[11px] font-bold outline-none ${darkMode ? "border-white/10 bg-black/30 text-white disabled:text-white/30" : "border-black/10 bg-white text-black disabled:text-black/30"}`}>
                        {brandPositions.map(([v, t]) => (<option key={v} value={v}>{t}</option>))}
                      </select>
                    </div>

                    <input
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      placeholder="Website"
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-cyan-400 ${darkMode ? "border-white/10 bg-black/20 text-white" : "border-black/10 bg-white text-black"}`}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <label className={`flex items-center gap-2 text-xs font-bold ${muted}`}>
                        <input type="checkbox" checked={useCompanyWebsite} onChange={(e) => setUseCompanyWebsite(e.target.checked)} />
                        Show website
                      </label>
                      <select value={companyWebsitePosition} disabled={!useCompanyWebsite} onChange={(e) => setCompanyWebsitePosition(e.target.value)} aria-label="Website position" className={`max-w-[130px] rounded-lg border px-2 py-1.5 text-[11px] font-bold outline-none ${darkMode ? "border-white/10 bg-black/30 text-white disabled:text-white/30" : "border-black/10 bg-white text-black disabled:text-black/30"}`}>
                        {brandPositions.map(([v, t]) => (<option key={v} value={v}>{t}</option>))}
                      </select>
                    </div>

                    <input
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      placeholder="Phone / WhatsApp"
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-cyan-400 ${darkMode ? "border-white/10 bg-black/20 text-white" : "border-black/10 bg-white text-black"}`}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <label className={`flex items-center gap-2 text-xs font-bold ${muted}`}>
                        <input type="checkbox" checked={useCompanyPhone} onChange={(e) => setUseCompanyPhone(e.target.checked)} />
                        Show phone
                      </label>
                      <select value={companyPhonePosition} disabled={!useCompanyPhone} onChange={(e) => setCompanyPhonePosition(e.target.value)} aria-label="Phone position" className={`max-w-[130px] rounded-lg border px-2 py-1.5 text-[11px] font-bold outline-none ${darkMode ? "border-white/10 bg-black/30 text-white disabled:text-white/30" : "border-black/10 bg-white text-black disabled:text-black/30"}`}>
                        {brandPositions.map(([v, t]) => (<option key={v} value={v}>{t}</option>))}
                      </select>
                    </div>

                    <input
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Address (optional)"
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-cyan-400 ${darkMode ? "border-white/10 bg-black/20 text-white" : "border-black/10 bg-white text-black"}`}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <label className={`flex items-center gap-2 text-xs font-bold ${muted}`}>
                        <input type="checkbox" checked={useCompanyAddress} onChange={(e) => setUseCompanyAddress(e.target.checked)} />
                        Show address
                      </label>
                      <select value={companyAddressPosition} disabled={!useCompanyAddress} onChange={(e) => setCompanyAddressPosition(e.target.value)} aria-label="Address position" className={`max-w-[130px] rounded-lg border px-2 py-1.5 text-[11px] font-bold outline-none ${darkMode ? "border-white/10 bg-black/30 text-white disabled:text-white/30" : "border-black/10 bg-white text-black disabled:text-black/30"}`}>
                        {brandPositions.map(([v, t]) => (<option key={v} value={v}>{t}</option>))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div ref={stepTopRef}>
                <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
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
                        {productModelUsageOptions.map((item) => <OptionCard key={item.title} option={item} active={modelUsage === item.title} onClick={() => {
                          setModelUsage(item.title);
                          const list = buildModelLookList(item.title, modelGroup);
                          if (list.length && !list.some((l) => l.value === modelLook)) setModelLook(list[0].value);
                        }} darkMode={darkMode} />)}
                      </div>
                      <CustomTextBox label="Custom Model Usage" value={customModelUsage} onChange={setCustomModelUsage} placeholder="Example: only female hand holding perfume near face, no full face visible..." darkMode={darkMode} />
                    </div>

                    {showModelGroup && (
                      <div>
                        <h4 className="text-xl font-black">Model Gender / Age</h4>
                        <p className={`mt-1 text-sm ${muted}`}>Pick who the model is — the looks below update to match.</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          {MODEL_GROUP_OPTIONS.map((g) => {
                            const gActive = modelGroup === g;
                            return (
                              <button
                                key={g}
                                type="button"
                                onClick={() => {
                                  setModelGroup(g);
                                  const list = buildModelLookList(customModelUsage.trim() || modelUsage, g);
                                  if (list.length) setModelLook(list[0].value);
                                  setCustomModelLook("");
                                }}
                                className={`rounded-2xl border px-6 py-3 text-sm font-black transition-all active:scale-[0.97] ${
                                  gActive
                                    ? "border-cyan-300 bg-gradient-to-br from-cyan-400/20 via-blue-500/15 to-purple-500/15 text-cyan-700 ring-2 ring-cyan-300/60 dark:text-cyan-200"
                                    : darkMode
                                      ? "border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]"
                                      : "border-slate-200 bg-white/90 text-slate-700 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/10"
                                }`}
                              >
                                {g}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xl font-black">Model Look</h4>
                      {modelLookDisabled ? (
                        <div className={`mt-4 rounded-2xl border border-dashed p-5 text-center text-sm ${darkMode ? "border-white/15 bg-white/[0.03] text-white/55" : "border-black/15 bg-black/[0.02] text-slate-500"}`}>
                          Model Look is not applicable for <span className="font-bold">{customModelUsage.trim() || modelUsage}</span> — no human model is used here.
                        </div>
                      ) : (
                        <>
                          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                            {modelLookList.map((item) => {
                              const isActive = !customModelLook.trim() && modelLook === item.value;
                              return (
                                <button
                                  key={item.value}
                                  type="button"
                                  onClick={() => { setModelLook(item.value); setCustomModelLook(""); }}
                                  className={`group flex flex-col items-center rounded-[22px] border p-3 text-center transition-all duration-300 active:scale-[0.97] ${
                                    isActive
                                      ? "scale-[1.02] border-cyan-300 bg-gradient-to-br from-cyan-400/20 via-blue-500/15 to-purple-500/15 shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-300/60"
                                      : darkMode
                                        ? "border-white/10 bg-white/[0.04] hover:-translate-y-0.5 hover:bg-white/[0.08]"
                                        : "border-slate-200 bg-white/90 hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/10"
                                  }`}
                                >
                                  <div className={`mb-2 h-20 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-100/70 to-transparent dark:from-white/[0.06] sm:h-24 ${item.imgs.length === 4 ? "grid grid-cols-2 grid-rows-2 gap-0.5 p-1" : "flex items-end justify-center gap-0.5"}`}>
                                    {item.imgs.map((src, i) => (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img key={i} src={src} alt={item.label} loading="lazy" className={`object-contain transition duration-300 group-hover:scale-105 ${item.imgs.length === 1 ? "h-full w-full" : item.imgs.length === 2 ? "h-full w-1/2" : "h-full min-h-0 w-full"}`} />
                                    ))}
                                  </div>
                                  <p className={`text-[12px] font-black leading-4 sm:text-sm ${isActive ? "text-cyan-700 dark:text-cyan-200" : darkMode ? "text-white/75" : "text-slate-700"}`}>{item.label}</p>
                                </button>
                              );
                            })}
                          </div>
                          <CustomTextBox label="Custom Model Look" value={customModelLook} onChange={setCustomModelLook} placeholder="Example: Indian female model, premium skincare ad look, soft smile, clean makeup..." darkMode={darkMode} />
                        </>
                      )}
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

                    {!customShootStyle.trim() && SHOOT_STYLES_WITH_BG_THEME.includes(shootStyle) && (
                      <div className="rounded-2xl border border-cyan-300/40 bg-cyan-400/5 p-4 dark:border-cyan-400/20">
                        <h4 className="text-sm font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-300">Select Background Theme</h4>
                        <p className={`mt-1 text-xs ${muted}`}>Premium outdoor backdrop — always upscale, never old or rundown.</p>
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                          {backgroundThemeOptions.map((item) => (
                            <OptionCard
                              key={item}
                              option={{ title: item, icon: <ImageIcon />, iconFile: BG_THEME_ICONS[item] }}
                              active={backgroundTheme === item}
                              onClick={() => setBackgroundTheme(item)}
                              darkMode={darkMode}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {!customShootStyle.trim() && SHOOT_STYLES_WITH_STUDIO_POSE.includes(shootStyle) && !modelLookDisabled && (
                      <div className="rounded-2xl border border-cyan-300/40 bg-cyan-400/5 p-4 dark:border-cyan-400/20">
                        <h4 className="text-sm font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-300">Select Studio Pose</h4>
                        <p className={`mt-1 text-xs ${muted}`}>How the model is posed in the studio shot.</p>
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                          {studioPoseOptions.map((item) => (
                            <OptionCard
                              key={item}
                              option={{ title: item, icon: <Camera />, iconFile: STUDIO_POSE_ICONS[item] }}
                              active={studioPose === item}
                              onClick={() => setStudioPose(item)}
                              darkMode={darkMode}
                            />
                          ))}
                        </div>
                      </div>
                    )}

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
                    {!modelLookDisabled && (
                      <div>
                        <h4 className="text-xl font-black">Pose</h4>
                        <p className={`mt-1 text-sm ${muted}`}>How the model is posed with the product.</p>
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                          {productPoseOptions.map((item) => (
                            <OptionCard
                              key={item}
                              option={{ title: item, icon: <Camera />, iconFile: POSE_ICONS[item] }}
                              active={!customPose.trim() && pose === item}
                              onClick={() => { setPose(item); setCustomPose(""); }}
                              darkMode={darkMode}
                            />
                          ))}
                        </div>
                        <CustomTextBox label="Custom Pose" value={customPose} onChange={setCustomPose} placeholder="Example: model holding product near face, looking at camera, soft natural pose..." darkMode={darkMode} />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xl font-black">Output &amp; Quality</h4>
                      <div className="mt-4 grid gap-5 lg:grid-cols-2">
                        <div className="space-y-3">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Select Size</p>
                          <div className="grid grid-cols-2 gap-3">
                            {["Square (1:1)", "Mobile (9:16)"].map((item) => (
                              <OptionCard
                                key={item}
                                option={{ title: item, icon: <ImageIcon />, iconFile: OUTPUT_ICONS[item] }}
                                active={!customOutputSize.trim() && outputSize === (item.includes("1:1") ? "1080x1080" : "1080x1920")}
                                onClick={() => { setOutputSize(item.includes("1:1") ? "1080x1080" : "1080x1920"); setCustomOutputSize(""); }}
                                darkMode={darkMode}
                              />
                            ))}
                          </div>
                          <CustomTextBox label="Custom Size" value={customOutputSize} onChange={setCustomOutputSize} placeholder="Example: 4:5, 2048x2048" darkMode={darkMode} />
                        </div>
                        <div className="space-y-3">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Select Quality</p>
                          <div className="grid grid-cols-2 gap-3">
                            {["Premium", "Ultra HD"].map((item) => (
                              <OptionCard
                                key={item}
                                option={{ title: item, icon: <Sparkles />, iconFile: OUTPUT_ICONS[item] }}
                                active={!customQuality.trim() && quality === item}
                                onClick={() => { setQuality(item); setCustomQuality(""); }}
                                darkMode={darkMode}
                              />
                            ))}
                          </div>
                          <CustomTextBox label="Custom Quality" value={customQuality} onChange={setCustomQuality} placeholder="Example: 4K Cinematic" darkMode={darkMode} />
                        </div>
                      </div>
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

                        <div className="mb-5 grid gap-2 sm:grid-cols-2">
                          <SummaryRow label="Product" value={customCategory.trim() || productCategory} />
                          <SummaryRow label="Model Usage" value={customModelUsage.trim() || modelUsage} />
                          <SummaryRow label="Model Look" value={modelLookDisabled ? "No model" : (customModelLook.trim() || modelLook)} />
                          <SummaryRow label="Pose" value={modelLookDisabled ? "—" : (customPose.trim() || pose)} />
                          <SummaryRow label="Shoot Style" value={customShootStyle.trim() || shootStyle} />
                          {!customShootStyle.trim() && SHOOT_STYLES_WITH_BG_THEME.includes(shootStyle) && (
                            <SummaryRow label="Background Theme" value={backgroundTheme} />
                          )}
                          {!customShootStyle.trim() && SHOOT_STYLES_WITH_STUDIO_POSE.includes(shootStyle) && !modelLookDisabled && (
                            <SummaryRow label="Studio Pose" value={studioPose} />
                          )}
                          <SummaryRow label="Background" value={customBackground.trim() || background} />
                          <SummaryRow label="Frame" value={`${customOutputSize.trim() || outputSize} / ${customQuality.trim() || quality}`} />
                          <SummaryRow label="Uploads" value={String(readyItems.length)} />
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
                                  ? "Upgrade to Pro or Empire for Bulk"
                                  : readyItems.length > 1
                                    ? `Generate ${readyItems.length} Shoots (${totalCreditsNeeded} Credits)`
                                    : `Start Product Shoot (${totalCreditsNeeded} Credits)`}
                              </span>
                            </>
                          )}
                        </button>
                      </div>

                      {(previewResult || loading) && (
                        <div ref={resultRef} className="border-t border-cyan-400/10 p-4 sm:p-6">
                          {previewResult ? (
                            <>
                              <div className="grid grid-cols-2 gap-3 rounded-3xl bg-black/5 p-4 sm:p-6">
                                <div className="text-center">
                                  {previewImage ? (
                                    <img src={previewImage} alt="Uploaded product photo" className="mx-auto max-h-[300px] w-full rounded-2xl object-cover shadow-lg" />
                                  ) : (
                                    <div className={`flex h-[200px] w-full items-center justify-center rounded-2xl border-2 border-dashed ${darkMode ? "border-white/20" : "border-black/15"}`}><span className="text-3xl opacity-30">📷</span></div>
                                  )}
                                  <p className={`mt-2 text-xs font-bold ${darkMode ? "text-white/55" : "text-black/55"}`}>Your Product</p>
                                </div>
                                <div className="text-center">
                                  <img src={previewResult} alt="Final AI productography output" className="mx-auto max-h-[300px] w-full rounded-2xl object-cover shadow-2xl shadow-cyan-400/20" />
                                  <p className={`mt-2 text-xs font-bold ${darkMode ? "text-white/55" : "text-black/55"}`}>AI Shoot</p>
                                </div>
                              </div>
                              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                <button onClick={requestDownload} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-black text-white shadow-lg shadow-emerald-500/20 transition hover:scale-105">
                                  <Download className="h-5 w-5" /> Download
                                </button>
                                <button onClick={handleNativeShare} className="flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 font-black text-white shadow-lg shadow-blue-500/20 transition hover:scale-105">
                                  <Share2 className="h-5 w-5" /> Share
                                </button>
                                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 font-black text-white shadow-lg shadow-green-500/20 transition hover:scale-105">
                                  WhatsApp
                                </a>
                              </div>
                              <button onClick={handleDownloadPDF} className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-300/50 bg-rose-50 px-5 py-2.5 text-sm font-black text-rose-700 transition hover:scale-[1.02] dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300">
                                📄 Download as PDF {items.filter(it => it.status === "done").length > 1 ? `(${items.filter(it => it.status === "done").length} pages)` : ""}
                              </button>
                              <Link
                                href="/my-creations"
                                className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-bold transition hover:scale-[1.01] ${darkMode ? "border-white/10 bg-white/[0.04] text-white/70 hover:border-cyan-400/30 hover:text-cyan-300" : "border-black/10 bg-cyan-50/70 text-black/70 hover:border-cyan-300 hover:text-cyan-700"}`}
                              >
                                🎨 Your old creations are saved in <span className="ml-1 font-black text-cyan-600">My Creations</span>
                              </Link>
                            </>
                          ) : (
                            <div className="flex h-[360px] w-full flex-col items-center justify-center rounded-3xl bg-black/5 text-center">
                              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
                              <p className="font-bold">Finalizing your product shoot...</p>
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

        {/* ───────── Customer Testimonials ───────── */}
        <TestimonialsSlider
          agentType="productography"
          darkMode={darkMode}
          seed={PRODUCTOGRAPHY_SEED_TESTIMONIALS}
          heading="What early product brands are saying"
          subtitle="Real WhatsApp & in-app feedback from e-commerce sellers, D2C brands and agencies — names masked for privacy."
        />
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

      {/* Result popup — shows the finished shoot first; Download triggers the
          rating → congrats flow (same as the jewellery page). */}
      {resultModalOpen && previewResult && (
        <div className="fixed inset-0 z-[900] flex items-start justify-center overflow-y-auto bg-black/25 p-3 backdrop-blur-xl sm:p-6">
          <div className="relative my-auto w-full max-w-lg overflow-hidden rounded-[1.5rem] border border-white/10 bg-white shadow-2xl dark:bg-slate-950 sm:rounded-[2rem]">
            <button
              type="button"
              onClick={() => setResultModalOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-xl leading-none text-white transition hover:bg-black/60"
            >
              ✕
            </button>

            <div className="flex items-center justify-center bg-gradient-to-br from-cyan-500/[0.08] via-black/[0.03] to-violet-500/[0.08] p-3 sm:p-5">
              <img
                src={previewResult}
                alt="Generated product shoot"
                className="mx-auto max-h-[62vh] w-auto rounded-2xl object-contain shadow-2xl shadow-cyan-400/20"
              />
            </div>

            <div className="p-4 sm:p-6">
              <h3 className="mb-4 text-center text-xl font-black sm:text-2xl">Your product shoot is ready ✨</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={requestDownload}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-black text-white shadow-lg shadow-emerald-500/20 transition hover:scale-105 active:scale-95"
                >
                  <Download className="h-5 w-5" /> Download HD
                </button>
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 font-black text-white shadow-lg shadow-blue-500/20 transition hover:scale-105 active:scale-95"
                >
                  <Share2 className="h-5 w-5" /> Share Now
                </button>
              </div>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 font-black text-white shadow-lg shadow-green-500/20 transition hover:scale-105 active:scale-95"
              >
                Share on WhatsApp
              </a>
              <Link
                href="/my-creations"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-cyan-50/70 px-5 py-2.5 text-sm font-bold text-black/70 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 dark:hover:border-cyan-400/30 dark:hover:text-cyan-300"
              >
                🎨 <span className="font-black text-cyan-600">My Creations</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {showRatingModal && (
        <RatingFeedbackModal
          generationId={ratingGenerationId}
          agent="productography"
          onClose={() => {
            setShowRatingModal(false);
            setReviewedResult(true);
            if (downloadAfterReview) { setDownloadAfterReview(false); handleDownloadResult(); }
          }}
          onCreditsAwarded={(credits) => {
            setShowRatingModal(false);
            setReviewedResult(true);
            setCongratsCredits(credits);
            setShowCongratsPopup(true);
            refreshProfile();
            if (downloadAfterReview) { setDownloadAfterReview(false); handleDownloadResult(); }
          }}
        />
      )}
      {showCongratsPopup && (
        <CongratulationsPopup
          credits={congratsCredits}
          onClose={() => setShowCongratsPopup(false)}
        />
      )}

      <StickyMobileCTA
        ctaName="productography_sticky_mobile"
        label={
          authUser?.id
            ? readyItems.length > 0
              ? `Generate ${readyItems.length > 1 ? readyItems.length + " Shoots" : "Shoot"} · ${totalCreditsNeeded} credits`
              : "Upload product photo →"
            : "Start with free credits"
        }
        subLabel={authUser?.id ? "AI Productography" : "100 free credits on signup"}
        hidden={loading || items.length > 0}
        onClick={() => {
          if (!authUser?.id) {
            setShowSignupPopup(true);
            return;
          }
          if (readyItems.length > 0) {
            void handleGenerate();
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
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

          {/* AI thinking pipeline — premium "magic happening" feel */}
          <div className={`mt-6 overflow-hidden rounded-2xl border p-5 text-left shadow-inner ${factBg}`}>
            <AIThinkingSteps
              steps={PRODUCTOGRAPHY_THINKING_STEPS}
              intervalMs={2200}
              darkMode={darkMode}
              title="AI is crafting your product shoot"
            />
          </div>

          <div className={`mt-3 overflow-hidden rounded-2xl border p-5 text-left shadow-inner ${factBg}`}>
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
