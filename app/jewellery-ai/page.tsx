"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";
import StickyMobileCTA from "@/app/components/StickyMobileCTA";
import TeamCreditToggle from "@/app/components/TeamCreditToggle";
import { track } from "@/lib/analytics";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
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
import {
  SiFlipkart,
  SiInstagram,
  SiMeta,
  SiShopify,
} from "react-icons/si";
import SignupPromptPopup from "@/app/components/SignupPromptPopup";
import AIThinkingSteps from "@/app/components/AIThinkingSteps";
import TestimonialsSlider, {
  type Testimonial,
} from "@/app/components/TestimonialsSlider";
import RatingFeedbackModal from "@/app/components/RatingFeedbackModal";
import CongratulationsPopup from "@/app/components/CongratulationsPopup";

const JEWELLERY_THINKING_STEPS = [
  "Analyzing gemstone reflections",
  "Setting up studio lighting",
  "Choosing the perfect model pose",
  "Mapping metal tones & finish",
  "Applying luxury shoot style",
  "Rendering DSLR-quality details",
  "Adding brand overlay",
  "Polishing the final shot",
];

// Seed testimonials — short, raw, WhatsApp-style. Real submissions from the
// DB (table: `testimonials`, status: 'approved') replace these once available.
const JEWELLERY_SEED_TESTIMONIALS: Testimonial[] = [
  {
    id: "seed-jw-1",
    name: "Neha A****",
    city: "Jaipur",
    message:
      "Necklace shots look exactly like DSLR work 😍 Didn't even need to hire a model. Festive collection ready in 2 hours!",
    rating: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    source: "whatsapp",
  },
  {
    id: "seed-jw-2",
    name: "Rohan G****",
    city: "Surat",
    message:
      "Diamond ring reflections look stunning. Perfect for the catalogue — covered all designs in a single day.",
    rating: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    source: "in-app",
  },
  {
    id: "seed-jw-3",
    name: "Priyanka M****",
    city: "Hyderabad",
    message:
      "Bridal jewellery model shoots used to be very expensive. Now I get the same look with AgentForge — at a fraction of the cost.",
    rating: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    source: "whatsapp",
  },
  {
    id: "seed-jw-4",
    name: "Aman T****",
    city: "Delhi",
    message:
      "Kundan set colors and stones looked exactly like the originals. As soon as I posted on Instagram, 4 enquiries came in!",
    rating: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    source: "in-app",
  },
  {
    id: "seed-jw-5",
    name: "Kavita R****",
    city: "Mumbai",
    message:
      "Earring close-up shots are premium catalogue-quality. The client even asked for a tax invoice 😅",
    rating: 4,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    source: "whatsapp",
  },
  {
    id: "seed-jw-6",
    name: "Sanjay K****",
    city: "Coimbatore",
    message:
      "The Indian model look comes out perfect for temple jewellery. Wedding season campaign was ready in 2 days.",
    rating: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    source: "whatsapp",
  },
];

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
  "Other",
];

const MODEL_USAGE_BY_JEWELLERY: Record<string, OptionItem[]> = {
  Ring: [
    { label: "No Model", icon: Package, hint: "Pure product", iconFile: "no-model" },
    { label: "Hand Model", icon: Hand, hint: "Ring close-up", iconFile: "hand-close-up" },
    { label: "Couple Hands", icon: UserRound, hint: "Engagement feel", iconFile: "couple-hands" },
    { label: "Female Model", icon: UserRound, hint: "Full styling", iconFile: "female-model" },
    { label: "Bridal Model", icon: Crown, hint: "Wedding rich", iconFile: "bridal-model" },
    { label: "Luxury Flat Lay", icon: ImageIcon, hint: "Premium surface", iconFile: "luxury-flat-ray" },
    { label: "Macro Detail", icon: ScanSearch, hint: "Stone focus", iconFile: "macro-detail" },
  ],
  Earrings: [
    { label: "No Model", icon: Package, hint: "Pure product", iconFile: "no-model" },
    { label: "Ear Close-up", icon: UserRound, hint: "Wearing detail", iconFile: "ear-close-up" },
    { label: "Female Model", icon: UserRound, hint: "Wearable luxury", iconFile: "female-model" },
    { label: "Bridal Model", icon: Crown, hint: "Wedding style", iconFile: "bridal-model" },
    { label: "Half Body", icon: UserRound, hint: "Lifestyle look", iconFile: "half-body" },
    { label: "Luxury Flat Lay", icon: ImageIcon, hint: "Velvet box", iconFile: "luxury-flat-ray" },
  ],
  Necklace: [
    { label: "No Model", icon: Package, hint: "Pure product", iconFile: "no-model" },
    { label: "Neck Focus", icon: Gem, hint: "Close-up neck", iconFile: "neck-focus" },
    { label: "Neck Close-up", icon: Gem, hint: "Detail shot", iconFile: "neck-close-up" },
    { label: "Female Model", icon: UserRound, hint: "Wearable luxury", iconFile: "female-model" },
    { label: "Bridal Model", icon: Crown, hint: "Heavy look", iconFile: "bridal-model" },
    { label: "Half Body", icon: UserRound, hint: "Outfit + necklace", iconFile: "half-body" },
    { label: "Luxury Flat Lay", icon: ImageIcon, hint: "Velvet box", iconFile: "luxury-flat-ray" },
  ],
  Bracelet: [
    { label: "No Model", icon: Package, hint: "Pure product", iconFile: "no-model" },
    { label: "Hand Model", icon: Hand, hint: "Wrist detail", iconFile: "hand-close-up" },
    { label: "Wrist Close-up", icon: ScanSearch, hint: "Texture focus", iconFile: "wrist-close-up" },
    { label: "Couple Hands", icon: UserRound, hint: "Engagement feel", iconFile: "couple-hands" },
    { label: "Lifestyle Hand", icon: ImageIcon, hint: "Natural usage", iconFile: "lifestyle-hand" },
    { label: "Female Model", icon: UserRound, hint: "Full styling", iconFile: "female-model" },
    { label: "Luxury Flat Lay", icon: ImageIcon, hint: "Premium surface", iconFile: "luxury-flat-ray" },
  ],
  "More Options": [
    { label: "No Model", icon: Package, hint: "Product only", iconFile: "no-model" },
    { label: "Hand Model", icon: Hand, hint: "Hand styling", iconFile: "hand-close-up" },
    { label: "Couple Hands", icon: UserRound, hint: "Engagement feel", iconFile: "couple-hands" },
    { label: "Female Model", icon: UserRound, hint: "Wearable look", iconFile: "female-model" },
    { label: "Bridal Model", icon: Crown, hint: "Wedding rich", iconFile: "bridal-model" },
    { label: "Half Body", icon: UserRound, hint: "Lifestyle", iconFile: "half-body" },
    { label: "Full Body", icon: UserRound, hint: "Editorial", iconFile: "full-body" },
    { label: "Detail Close-up", icon: ScanSearch, hint: "Jewellery focus", iconFile: "detail-close-up" },
    { label: "Editorial Scene", icon: ImageIcon, hint: "Campaign feel", iconFile: "editorial-scene" },
    { label: "Luxury Flat Lay", icon: ImageIcon, hint: "Premium surface", iconFile: "luxury-flat-ray" },
  ],
};

const POSE_OPTIONS: OptionItem[] = [
  // Auto + body poses
  { label: "Auto Pose", icon: Wand2, hint: "Random AI pick", iconFile: "/jewellery-icon/jp-auto-pose.png" },
  { label: "Front Pose", icon: UserRound, hint: "Upper body front shot", iconFile: "/jewellery-icon/jp-front-pose.png" },
  { label: "Side Pose", icon: UserRound, hint: "45° model turn", iconFile: "/jewellery-icon/jp-side-pose.png" },
  { label: "Half Body", icon: UserRound, hint: "Half model frame", iconFile: "/jewellery-icon/jp-half-body.png" },
  { label: "Full Body", icon: UserRound, hint: "Full model frame", iconFile: "/jewellery-icon/jp-full-body.png" },

  // Hand poses (rings / bracelets) — AI must match gender to jewellery
  { label: "Hand Pose", icon: Hand, hint: "Hand matched to jewellery (male/female)", iconFile: "/jewellery-icon/jp-hand-pose.png" },
  { label: "Wrist Detail", icon: ScanSearch, hint: "Wrist matched to jewellery (male/female)", iconFile: "/jewellery-icon/jp-wrist-detail.png" },
  { label: "Couple Hands", icon: Hand, hint: "Engagement feel", iconFile: "/jewellery-icon/jp-couple-hands.png" },

  // Neck poses (necklace / mangalsutra)
  { label: "Neck Close-up", icon: Gem, hint: "Female neck shot — necklace focus", iconFile: "/jewellery-icon/jp-neck-closeup.png" },

  // Ear poses (earrings)
  { label: "Ear Close-up", icon: UserRound, hint: "Side pose, earring visible", iconFile: "/jewellery-icon/jp-ear-closeup.png" },
];

// Model look options are now merged into SHOOT_STYLE_OPTIONS below.
// Constant kept for backward-compat references (unused by UI).
const MODEL_LOOK_OPTIONS: OptionItem[] = [];

const FACE_EXPRESSION_OPTIONS: OptionItem[] = [
  { label: "Soft Smile", icon: Sparkles, hint: "Warm face", iconFile: "soft-smile" },
  { label: "Confident", icon: BadgeCheck, hint: "Premium vibe", iconFile: "/ui-icons/fe-confident.png" },
  { label: "Serious", icon: UserRound, hint: "Editorial", iconFile: "/ui-icons/fe-serious.png" },
  { label: "Royal", icon: Crown, hint: "Bridal aura", iconFile: "royal" },
  { label: "Natural", icon: ShieldCheck, hint: "Real feel", iconFile: "natural" },
];

// Camera angle — crucial for jewellery presentation
const CAMERA_ANGLE_OPTIONS: OptionItem[] = [
  { label: "Auto Angle", icon: Wand2, hint: "AI picks best", iconFile: "auto-pose" },
  { label: "Eye Level", icon: Camera, hint: "Straight on", iconFile: "front-pose" },
  { label: "Top Down", icon: Camera, hint: "Flat lay view", iconFile: "luxury-flat-ray" },
  { label: "Side Profile", icon: Camera, hint: "Earring/profile", iconFile: "side-pose" },
];

// Shoot Style — merged with Model Look (one unified selection covering both
// shoot atmosphere AND model aesthetic). Hints describe what the user
// should expect from the AI output for each selection.
// SHOOT STYLE = only the scene / background / lighting (deduped).
// Model ethnicity now lives in its own "Model Look" box (Step 3).
const SHOOT_STYLE_OPTIONS: OptionItem[] = [
  { label: "Luxury Studio", icon: Crown, hint: "Dark velvet premium studio", iconFile: "/jewellery-icon/js-luxury-studio.png" },
  { label: "White Background", icon: Square, hint: "Clean seamless white catalogue BG", iconFile: "/jewellery-icon/js-white-background.png" },
  { label: "Bridal Editorial", icon: Sparkles, hint: "Bridal / festive rich styling", iconFile: "/jewellery-icon/js-bridal-editorial.png" },
  { label: "Luxury Editorial", icon: BadgeCheck, hint: "Fashion / cinematic editorial", iconFile: "/jewellery-icon/js-luxury-editorial.png" },
  { label: "Macro Detail", icon: ScanSearch, hint: "Diamond / kundan stone focus", iconFile: "/jewellery-icon/js-macro-detail.png" },
  { label: "Outdoor Premium", icon: ImageIcon, hint: "Premium outdoor backdrop — pick a theme", iconFile: "/jewellery-icon/js-outdoor-premium.png" },
  { label: "Studio Professional", icon: Camera, hint: "Pro studio shoot — pick a pose", iconFile: "/jewellery-icon/js-studio-professional.png" },
];

// Model Look (textile-parity) — which kind of model wears the jewellery.
const JEWEL_MODEL_LOOK_OPTIONS: OptionItem[] = [
  { label: "No Model", icon: Package, hint: "Product-only, no human", iconFile: "/jewellery-icon/js-no-model.png" },
  { label: "Indian Model", icon: UserRound, hint: "Indian / South-Asian", iconFile: "/model-faces/women-indian.png" },
  { label: "Western Model", icon: UserRound, hint: "European / American look", iconFile: "/model-faces/women-western.png" },
  { label: "Asian Model", icon: UserRound, hint: "East-Asian look", iconFile: "/model-faces/women-asian.png" },
  { label: "Middle Eastern Model", icon: UserRound, hint: "Middle-Eastern look", iconFile: "/model-faces/women-middle-eastern.png" },
  { label: "African Model", icon: UserRound, hint: "African look", iconFile: "/model-faces/women-african.png" },
  { label: "European Model", icon: UserRound, hint: "European look", iconFile: "/model-faces/women-western.png" },
  { label: "Upload Your Model", icon: Upload, hint: "Your own photo (+2)" },
];

// Background-theme + studio-pose sub-options (textile-parity), shown only
// when the matching shoot style is selected.
const JEWEL_OUTDOOR_BG_OPTIONS = [
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
const JEWEL_STUDIO_POSE_OPTIONS = [
  "Auto",
  "Standing Front",
  "Three-Quarter Turn",
  "Hand in Pocket",
  "Looking Away",
  "Seated Stool",
  "Leaning Pose",
  "Walking Toward Camera",
];

// Cropped jewellery PNG icons for the "More Jewellery Options" sub-grid.
const MORE_JEWELLERY_ICONS: Record<string, string> = {
  "Jewellery Set": "/jewellery-icon/jm-jewellery-set.png",
  Payal: "/jewellery-icon/jm-payal.png",
  Tikka: "/jewellery-icon/jm-tikka.png",
  Mangalsutra: "/jewellery-icon/jm-mangalsutra.png",
  Bangles: "/jewellery-icon/jm-bangles.png",
  "Nose Pin": "/jewellery-icon/jm-nose-pin.png",
  Pendant: "/jewellery-icon/jm-pendant.png",
  Chain: "/jewellery-icon/jm-chain.png",
  Anklet: "/jewellery-icon/jm-anklet.png",
  Other: "/jewellery-icon/jm-other.png",
};

// Universal background-theme + studio-pose icons (shared with the textile agent).
const JEWEL_BG_THEME_ICONS: Record<string, string> = {
  "Royal Palace": "/ui-icons/bg-royal-palace.png",
  "Wedding Theme": "/ui-icons/bg-wedding-theme.png",
  "Sea Face": "/ui-icons/bg-sea-face.png",
  Forest: "/ui-icons/bg-forest.png",
  Temple: "/ui-icons/bg-temple.png",
  Forts: "/ui-icons/bg-forts.png",
  "River Site": "/ui-icons/bg-river-site.png",
  Waterfall: "/ui-icons/bg-waterfall.png",
  Mountains: "/ui-icons/bg-mountains.png",
  Garden: "/ui-icons/bg-garden.png",
};
const JEWEL_STUDIO_POSE_ICONS: Record<string, string> = {
  Auto: "/ui-icons/sp-auto.png",
  "Standing Front": "/ui-icons/sp-standing-front.png",
  "Three-Quarter Turn": "/ui-icons/sp-three-quarter-turn.png",
  "Hand in Pocket": "/ui-icons/sp-hand-in-pocket.png",
  "Looking Away": "/ui-icons/sp-looking-away.png",
  "Seated Stool": "/ui-icons/sp-seated-stool.png",
  "Leaning Pose": "/ui-icons/sp-leaning-pose.png",
  "Walking Toward Camera": "/ui-icons/sp-walking-toward-camera.png",
};

// 10 props covering temple, diamond, bridal and luxury flat-lay use cases.
// AI agent picks the appropriate styling based on the jewellery type + this choice.
// IMPORTANT: when "No Accessories" is selected, the back-end agent must NOT add
// any extra jewellery, tray contents, or decorative pieces beyond the model + the
// uploaded jewellery itself. This is enforced via `style_directives` in the payload.
const ACCESSORY_OPTIONS: OptionItem[] = [
  { label: "No Accessories", icon: ShieldCheck, hint: "Strict — only uploaded jewellery, nothing extra", iconFile: "/jewellery-icon/ja-no-accessories.png" },
  { label: "Flat Lay", icon: Square, hint: "Top-down spread", iconFile: "/jewellery-icon/ja-flat-lay.png" },
  { label: "Velvet Box", icon: Package, hint: "Luxury display", iconFile: "/jewellery-icon/ja-velvet-box.png" },
  { label: "Marble Surface", icon: Square, hint: "Premium base", iconFile: "/jewellery-icon/ja-marble-surface.png" },
  { label: "Silk Drape", icon: Sparkles, hint: "Rich backdrop", iconFile: "/jewellery-icon/ja-silk-drape.png" },
  { label: "Rose Petals", icon: Sparkles, hint: "Romantic vibe", iconFile: "/jewellery-icon/ja-rose-petals.png" },
  { label: "Marigold + Diya", icon: Sparkles, hint: "Temple jewellery", iconFile: "/jewellery-icon/ja-marigold-diya.png" },
  { label: "Diamond Sparkle Set", icon: Diamond, hint: "Crystals + mirror", iconFile: "/jewellery-icon/ja-diamond-sparkle.png" },
  { label: "Pearl String Decor", icon: Gem, hint: "Soft luxury", iconFile: "/jewellery-icon/ja-pearl-string.png" },
  { label: "Wooden Antique Tray", icon: Package, hint: "Vintage style", iconFile: "/jewellery-icon/ja-wooden-tray.png" },
];

const FRAME_OUTPUT_OPTIONS: OptionItem[] = [
  { label: "Square 1080x1080", icon: Square, hint: "Post / catalogue", iconFile: "/ui-icons/oq-square.png" },
  { label: "Mobile 1080x1920", icon: Layers3, hint: "Story / Reel", iconFile: "/ui-icons/oq-mobile.png" },
  { label: "Premium", icon: BadgeCheck, hint: "Clean output", iconFile: "/ui-icons/oq-premium.png" },
  { label: "Ultra HD", icon: Sparkles, hint: "Sharper detail", iconFile: "/ui-icons/oq-ultra-hd.png" },
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
const JEWELLERY_GUIDANCE_KEY = "agentforge-jewellery-guidance-v1"; // { gens: number, hiddenManually: boolean }
const JEWELLERY_GUIDANCE_AUTO_OFF_AFTER = 3; // smart: ON for first N generations

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

// Flat, colourful inline-SVG icons for the "More Jewellery Options" grid
// (these jewellery sub-types have no bitmap files). Same flat illustration
// style as the rest of the picker — gold metal + gem accents on a soft tile.
function jewelGlyphName(label: string): string {
  const k = label.toLowerCase().trim();
  if (k.includes("set")) return "set";
  if (k.includes("payal")) return "payal";
  if (k.includes("tikka")) return "tikka";
  if (k.includes("mangal")) return "mangalsutra";
  if (k.includes("bangle")) return "bangles";
  if (k.includes("nose")) return "nosepin";
  if (k.includes("pendant")) return "pendant";
  if (k.includes("chain")) return "chain";
  if (k.includes("anklet")) return "anklet";
  return "other";
}

function JewelGlyphIcon({ name }: { name: string }) {
  // Website-theme palette (cyan / blue / violet) — not gold.
  const G = "#3b82f6";
  const GL = "#22d3ee";
  const GD = "#6366f1";
  let body: React.ReactNode = null;
  switch (name) {
    case "set":
      body = (
        <>
          <path d="M16 18l16 18 16-18" fill="none" stroke={G} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx="32" cy="38" r="4" fill="#a855f7" />
          <circle cx="14" cy="20" r="3" fill={GL} />
          <circle cx="50" cy="20" r="3" fill={GL} />
        </>
      );
      break;
    case "payal":
      body = (
        <>
          <path d="M14 28a18 11 0 0 0 36 0" fill="none" stroke={G} strokeWidth="3" strokeLinecap="round" />
          <circle cx="20" cy="36" r="2.2" fill={GL} />
          <circle cx="26" cy="39" r="2.2" fill={GL} />
          <circle cx="32" cy="40" r="2.2" fill={GL} />
          <circle cx="38" cy="39" r="2.2" fill={GL} />
          <circle cx="44" cy="36" r="2.2" fill={GL} />
        </>
      );
      break;
    case "tikka":
      body = (
        <>
          <path d="M26 14a6 4 0 0 1 12 0" fill="none" stroke={G} strokeWidth="2.2" />
          <path d="M32 14v14" stroke={G} strokeWidth="2.6" />
          <circle cx="32" cy="33" r="6" fill={GL} />
          <circle cx="32" cy="33" r="2.5" fill="#a855f7" />
          <circle cx="32" cy="44" r="2.4" fill={GD} />
        </>
      );
      break;
    case "mangalsutra":
      body = (
        <>
          <path d="M14 18c4 12 12 18 18 18s14-6 18-18" fill="none" stroke="#6366f1" strokeWidth="2.4" strokeDasharray="2.5 2.5" strokeLinecap="round" />
          <circle cx="32" cy="38" r="5" fill={GL} />
          <circle cx="29" cy="38" r="1.5" fill="#6366f1" />
          <circle cx="35" cy="38" r="1.5" fill="#6366f1" />
        </>
      );
      break;
    case "bangles":
      body = (
        <>
          <ellipse cx="32" cy="25" rx="16" ry="5" fill="none" stroke={G} strokeWidth="3" />
          <ellipse cx="32" cy="32" rx="16" ry="5" fill="none" stroke={GL} strokeWidth="3" />
          <ellipse cx="32" cy="39" rx="16" ry="5" fill="none" stroke={GD} strokeWidth="3" />
        </>
      );
      break;
    case "nosepin":
      body = (
        <>
          <path d="M35 30q9 0 9 9" fill="none" stroke={G} strokeWidth="1.8" />
          <circle cx="29" cy="30" r="6" fill={GL} />
          <circle cx="29" cy="30" r="2.4" fill="#a855f7" />
        </>
      );
      break;
    case "pendant":
      body = (
        <>
          <path d="M18 16l14 16 14-16" fill="none" stroke={G} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M32 32c-4 4-4 9 0 11 4-2 4-7 0-11z" fill="#22d3ee" />
        </>
      );
      break;
    case "chain":
      body = (
        <>
          <path d="M16 16v14a16 13 0 0 0 32 0V16" fill="none" stroke={G} strokeWidth="3.4" strokeDasharray="3 2.5" strokeLinecap="round" />
        </>
      );
      break;
    case "anklet":
      body = (
        <>
          <ellipse cx="32" cy="31" rx="14" ry="16" fill="none" stroke={G} strokeWidth="3" strokeDasharray="3 2.5" />
          <circle cx="32" cy="49" r="3" fill="#a855f7" />
        </>
      );
      break;
    case "other":
    default:
      return (
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
          <rect x="2" y="2" width="60" height="60" rx="16" fill="#cffafe" />
          <path d="M22 22h20l6 7-16 17L16 29z" fill="#22d3ee" />
          <path d="M16 29l6-7h20l6 7z" fill="#67e8f9" />
          <path d="M16 29h32l-16 17z" fill="#0e7490" fillOpacity="0.22" />
        </svg>
      );
  }
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
      <rect x="2" y="2" width="60" height="60" rx="16" fill="#e0f2fe" />
      {body}
    </svg>
  );
}

// Website-theme (cyan / blue / violet) flat icons for the jewellery
// background-theme and studio-pose sub-selectors.
function jewelOptGlyphName(label: string): string {
  const k = label.toLowerCase().trim();
  if (k.includes("royal palace")) return "palace";
  if (k.includes("wedding")) return "wedding";
  if (k.includes("sea")) return "sea";
  if (k.includes("forest")) return "forest";
  if (k.includes("temple")) return "temple";
  if (k.includes("fort")) return "fort";
  if (k.includes("river")) return "river";
  if (k.includes("waterfall")) return "waterfall";
  if (k.includes("mountain")) return "mountains";
  if (k.includes("garden")) return "garden";
  if (k.includes("standing")) return "poseStand";
  if (k.includes("three-quarter") || k.includes("turn")) return "poseTurn";
  if (k.includes("pocket")) return "posePocket";
  if (k.includes("looking")) return "poseAway";
  if (k.includes("seated") || k.includes("stool")) return "poseSit";
  if (k.includes("leaning")) return "poseLean";
  if (k.includes("walking")) return "poseWalk";
  return "poseAuto";
}

function jewelPersonPose(arms: [number, number], legs: [number, number], headDx = 0, seat = false): React.ReactNode {
  const C = "#7c3aed";
  const L = "#c4b5fd";
  return (
    <>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="#ede9fe" />
      {seat && (
        <>
          <rect x="17" y="44" width="17" height="3" rx="1.5" fill={L} />
          <rect x="18" y="46" width="3" height="7" rx="1.5" fill={L} />
          <rect x="30" y="46" width="3" height="7" rx="1.5" fill={L} />
        </>
      )}
      <rect x="29.2" y="33" width="4" height="16" rx="2" fill={C} transform={`rotate(${legs[0]} 31 34)`} />
      <rect x="30.8" y="33" width="4" height="16" rx="2" fill={C} transform={`rotate(${legs[1]} 33 34)`} />
      <rect x="28" y="20" width="3.6" height="13" rx="1.8" fill={C} transform={`rotate(${arms[0]} 30 21)`} />
      <rect x="32.4" y="20" width="3.6" height="13" rx="1.8" fill={C} transform={`rotate(${arms[1]} 34 21)`} />
      <rect x="28.5" y="19" width="7" height="16" rx="3.5" fill={C} />
      <circle cx={32 + headDx} cy="13" r="5.5" fill={C} />
    </>
  );
}

function JewelOptIcon({ name }: { name: string }) {
  let body: React.ReactNode = null;
  switch (name) {
    case "poseStand": return <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">{jewelPersonPose([-12, 12], [-8, 8])}</svg>;
    case "poseTurn": return <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">{jewelPersonPose([-8, 22], [-5, 12], -3)}</svg>;
    case "posePocket": return <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">{jewelPersonPose([-12, 55], [-8, 8])}</svg>;
    case "poseAway": return <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">{jewelPersonPose([-12, 12], [-8, 8], 5)}</svg>;
    case "poseSit": return <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">{jewelPersonPose([-10, 10], [80, 95], 0, true)}</svg>;
    case "poseLean": return <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">{jewelPersonPose([-22, 8], [14, 20], 4)}</svg>;
    case "poseWalk": return <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">{jewelPersonPose([-26, 26], [-28, 28])}</svg>;
    case "poseAuto":
      return (
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
          <rect x="2" y="2" width="60" height="60" rx="16" fill="#ede9fe" />
          <path d="M28 14c2 9 5 12 14 14-9 2-12 5-14 14-2-9-5-12-14-14 9-2 12-5 14-14z" fill="#8b5cf6" />
          <path d="M47 16c1 4 2 5 6 6-4 1-5 2-6 6-1-4-2-5-6-6 4-1 5-2 6-6z" fill="#a855f7" />
        </svg>
      );
    case "palace":
      body = (
        <>
          <rect x="14" y="34" width="9" height="16" fill="#3b82f6" />
          <rect x="41" y="34" width="9" height="16" fill="#3b82f6" />
          <rect x="26" y="30" width="12" height="20" fill="#22d3ee" />
          <path d="M26 30a6 6 0 0 1 12 0z" fill="#6366f1" />
          <path d="M14 34a4.5 4.5 0 0 1 9 0z" fill="#6366f1" />
          <path d="M41 34a4.5 4.5 0 0 1 9 0z" fill="#6366f1" />
          <rect x="30" y="41" width="4" height="9" fill="#1e40af" />
          <rect x="11" y="50" width="42" height="3" rx="1.5" fill="#2563eb" />
        </>
      );
      break;
    case "wedding":
      body = (
        <>
          <path d="M18 50V28a14 14 0 0 1 28 0v22z" fill="#a5b4fc" />
          <path d="M24 50V30a8 8 0 0 1 16 0v20z" fill="#e0f2fe" />
          <path d="M32 30c-2-3-7.5-2.5-7.5 1.8 0 3.3 4.3 5.4 7.5 8.2 3.2-2.8 7.5-4.9 7.5-8.2 0-4.3-5.5-4.8-7.5-1.8z" fill="#8b5cf6" />
        </>
      );
      break;
    case "sea":
      body = (
        <>
          <circle cx="32" cy="22" r="7" fill="#38bdf8" />
          <path d="M8 38q4-5 8 0t8 0 8 0 8 0 8 0v8H8z" fill="#22d3ee" />
          <path d="M8 45q4-5 8 0t8 0 8 0 8 0 8 0v7H8z" fill="#0ea5e9" />
        </>
      );
      break;
    case "forest":
      body = (
        <>
          <path d="M32 14l9 13h-5l6 9h-6l5 8H21l5-8h-6l6-9h-5z" fill="#0ea5e9" />
          <rect x="30" y="44" width="4" height="8" fill="#6366f1" />
          <rect x="14" y="50" width="36" height="3" rx="1.5" fill="#38bdf8" />
        </>
      );
      break;
    case "temple":
      body = (
        <>
          <path d="M20 50V32l12-10 12 10v18z" fill="#3b82f6" />
          <rect x="28" y="40" width="8" height="10" fill="#1e40af" />
          <rect x="31" y="14" width="2" height="8" fill="#6366f1" />
          <path d="M33 15l6 2-6 2z" fill="#8b5cf6" />
        </>
      );
      break;
    case "fort":
      body = (
        <>
          <path d="M12 50V30h5v-5h5v5h5v-5h5v5h5v-5h5v5h5v-5h5v5h5v20z" fill="#38bdf8" />
          <path d="M28 50V41a4 4 0 0 1 8 0v9z" fill="#3b82f6" />
        </>
      );
      break;
    case "river":
      body = <path d="M2 24c10 0 10 8 20 8s10-8 20-8 10 8 20 8v8c-10 0-10-8-20-8s-10 8-20 8-10-8-20-8z" fill="#38bdf8" />;
      break;
    case "waterfall":
      body = (
        <>
          <rect x="20" y="14" width="24" height="4" rx="2" fill="#6366f1" />
          <rect x="22" y="18" width="20" height="22" fill="#22d3ee" />
          <path d="M16 44q16 8 32 0v8H16z" fill="#0ea5e9" />
        </>
      );
      break;
    case "mountains":
      body = (
        <>
          <path d="M4 50l16-24 10 14 10-18 14 28z" fill="#3b82f6" />
          <path d="M20 26l-4 6h8z" fill="#e0f2fe" />
          <path d="M40 22l-4 6h8z" fill="#e0f2fe" />
          <rect x="4" y="50" width="56" height="3" fill="#1e40af" />
        </>
      );
      break;
    case "garden":
    default:
      body = (
        <>
          <rect x="31" y="30" width="2.5" height="20" fill="#0ea5e9" />
          <path d="M32 40c-7 0-9-5-9-5 5-1 9 1 9 5z" fill="#38bdf8" />
          <path d="M32 44c7 0 9-5 9-5-5-1-9 1-9 5z" fill="#38bdf8" />
          <circle cx="32" cy="20" r="4" fill="#8b5cf6" />
          <circle cx="26" cy="24" r="4" fill="#8b5cf6" />
          <circle cx="38" cy="24" r="4" fill="#8b5cf6" />
          <circle cx="28" cy="30" r="4" fill="#8b5cf6" />
          <circle cx="36" cy="30" r="4" fill="#8b5cf6" />
          <circle cx="32" cy="25" r="3.5" fill="#22d3ee" />
        </>
      );
      break;
  }
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
      <rect x="2" y="2" width="60" height="60" rx="16" fill="#e0f2fe" />
      {body}
    </svg>
  );
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
  const iconSrc = option.iconFile
    ? option.iconFile.startsWith("/")
      ? option.iconFile
      : `/jewellery-icon/${option.iconFile}.svg`
    : "";

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
        className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-[22px] bg-white text-cyan-700 transition sm:h-[76px] sm:w-[76px] sm:rounded-[26px]"
      >
        {iconSrc && !iconFailed ? (
          <img
            src={iconSrc}
            alt=""
            className="block h-full w-full object-contain transition duration-300 group-hover:scale-105"
            onError={() => setIconFailed(true)}
          />
        ) : (
          <Icon className="h-8 w-8" />
        )}
      </div>
      <p className={clsx("text-[12px] font-black leading-4 sm:text-sm", active ? "text-cyan-700 dark:text-cyan-200" : "text-slate-700 dark:text-white/75")}>{option.label}</p>
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

          {/* AI thinking pipeline — premium "magic happening" feel */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-cyan-200/70 bg-white/70 p-5 text-left shadow-inner">
            <AIThinkingSteps
              steps={JEWELLERY_THINKING_STEPS}
              intervalMs={2200}
              title="AI is crafting your jewellery visual"
            />
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50/80 via-white to-purple-50/40 p-5 text-left shadow-inner">
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
// HERO PRODUCT SLIDER DATA — Jewellery showcase
// ============================================================
type HeroJewel = { label: string; tag: string; icon: string; grad: string };

const HERO_JEWEL_SLIDES: HeroJewel[][] = [
  [
    { label: "Rings", tag: "Hero shot", icon: "/jewellery-icon/ring.svg", grad: "from-amber-400 to-orange-500" },
    { label: "Necklaces", tag: "Catalogue", icon: "/jewellery-icon/necklace.svg", grad: "from-rose-400 to-pink-500" },
  ],
  [
    { label: "Earrings", tag: "Close-up", icon: "/jewellery-icon/earrings.svg", grad: "from-violet-500 to-fuchsia-500" },
    { label: "Bracelets", tag: "Wrist shot", icon: "/jewellery-icon/bracelet.svg", grad: "from-cyan-500 to-blue-600" },
  ],
  [
    { label: "Bridal Sets", tag: "Editorial", icon: "/jewellery-icon/bridal-look.svg", grad: "from-rose-500 to-red-600" },
    { label: "Pearls", tag: "Luxury", icon: "/jewellery-icon/pearls.svg", grad: "from-slate-300 to-slate-500" },
  ],
  [
    { label: "Bridal Campaign", tag: "Premium ad", icon: "/jewellery-icon/bridal-campaign.svg", grad: "from-amber-500 to-rose-500" },
    { label: "Custom", tag: "Any piece", icon: "/jewellery-icon/more-options.svg", grad: "from-cyan-500 to-purple-600" },
  ],
];

export default function JewelleryAIPage() {
  const { user: authUser, credits: userCredits, refreshProfile, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const stepTopRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  const [generationMode, setGenerationMode] = useState<GenerationMode>("single");
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [builderStep, setBuilderStep] = useState<BuilderStep>(1);

  // Team access
  const [teamId, setTeamId] = useState<string | null>(null);

  // Upload Your Model
  const [modelPhotoUrl, setModelPhotoUrl] = useState("");
  const [modelPhotoUploading, setModelPhotoUploading] = useState(false);
  const [tryOnConsent, setTryOnConsent] = useState(false);

  // Upload Your Scene (background scene the jewellery is composited into)
  const [referenceSceneUrl, setReferenceSceneUrl] = useState("");
  const [sceneUploading, setSceneUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingFactIndex, setLoadingFactIndex] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(8);
  const [generatedOutputUrl, setGeneratedOutputUrl] = useState("");
  const [heroSlide, setHeroSlide] = useState(0);

  // Hero jewellery slider — auto-rotate every 4 s, but pause when
  // the tab is hidden. A background tab firing setInterval keeps
  // the JS thread busy on every wake and hurts INP on return.
  useEffect(() => {
    let interval: number | null = null;
    const start = () => {
      if (interval !== null) return;
      interval = window.setInterval(() => {
        setHeroSlide((current) => (current + 1) % HERO_JEWEL_SLIDES.length);
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

  const [jewelleryType, setJewelleryType] = useState("Ring");
  const [moreJewellery, setMoreJewellery] = useState<string[]>([]);
  const [customJewellery, setCustomJewellery] = useState("");
  const [modelType, setModelType] = useState("No Model");
  const [pose, setPose] = useState("Auto Pose");
  const [modelLook, setModelLook] = useState("Indian Model");
  const [faceExpression, setFaceExpression] = useState("Soft Smile");
  const [shootStyle, setShootStyle] = useState("Luxury Studio");
  const [jewelOutdoorBg, setJewelOutdoorBg] = useState("Royal Palace");
  const [jewelStudioPose, setJewelStudioPose] = useState("Auto");
  const [accessory, setAccessory] = useState("No Accessories");
  const [cameraAngle, setCameraAngle] = useState("Auto Angle");
  const [customCameraAngle, setCustomCameraAngle] = useState("");
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
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingGenerationId, setRatingGenerationId] = useState<string | undefined>();
  // Textile-style output popup (blurred backdrop, just the result + actions).
  const [resultModalOpen, setResultModalOpen] = useState(false);
  // Gate download behind a review — user can VIEW the output freely,
  // but the first Download click asks for a rating first.
  const [reviewedResult, setReviewedResult] = useState(false);
  const [downloadAfterReview, setDownloadAfterReview] = useState(false);
  const [showCongratsPopup, setShowCongratsPopup] = useState(false);
  const [congratsCredits, setCongratsCredits] = useState(0);

  // ----- AI Guidance (Vision-based auto-fill + suggestion card) -----
  type JewellerySuggestion = {
    detected_piece: string;
    jewellery_type: string;
    more_jewellery: string[];
    shoot_style: string;
    accessories: string;
    model_type: string;
    pose: string;
    face_expression: string;
    camera_angle: string;
    reason: string;
  };
  const [aiSuggestion, setAiSuggestion] = useState<JewellerySuggestion | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Smart default: ON for first 3 generations, then OFF (user can re-enable)
  const [showGuidance, setShowGuidance] = useState(true);

  const [companyLogoPreview, setCompanyLogoPreview] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [useCompanyLogo, setUseCompanyLogo] = useState(true);
  const [useCompanyName, setUseCompanyName] = useState(true);
  const [useCompanyWebsite, setUseCompanyWebsite] = useState(true);
  const [useCompanyPhone, setUseCompanyPhone] = useState(true);
  const [useCompanyAddress, setUseCompanyAddress] = useState(false);
  // Overlay placement (corner) for each branding element.
  const [companyNamePosition, setCompanyNamePosition] = useState("bottom-left");
  const [companyPhonePosition, setCompanyPhonePosition] = useState("bottom-right");
  const [companyWebsitePosition, setCompanyWebsitePosition] = useState("bottom-left");
  const [companyAddressPosition, setCompanyAddressPosition] = useState("bottom-right");
  const [logoPosition, setLogoPosition] = useState("top-right");
  const isFreeAccount = useMemo(() => isFreeAccountFromProfile(profile), [profile]);

  // Smart guidance default: read counter on mount. Show if (gens < 3 && !hiddenManually).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(JEWELLERY_GUIDANCE_KEY);
      const parsed = raw ? JSON.parse(raw) : { gens: 0, hiddenManually: false };
      const shouldShow =
        !parsed.hiddenManually && (parsed.gens || 0) < JEWELLERY_GUIDANCE_AUTO_OFF_AFTER;
      setShowGuidance(shouldShow);
    } catch {
      setShowGuidance(true);
    }
  }, []);

  useEffect(() => {
    if (generatedOutputUrl) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
  }, [generatedOutputUrl]);

  // Bump generation counter once per successful output. After N gens, guidance
  // auto-disables on future sessions (until user manually re-enables).
  useEffect(() => {
    if (!generatedOutputUrl) return;
    try {
      const raw = window.localStorage.getItem(JEWELLERY_GUIDANCE_KEY);
      const parsed = raw ? JSON.parse(raw) : { gens: 0, hiddenManually: false };
      const next = { ...parsed, gens: (parsed.gens || 0) + 1 };
      window.localStorage.setItem(JEWELLERY_GUIDANCE_KEY, JSON.stringify(next));
    } catch {}
  }, [generatedOutputUrl]);

  // Fetch user's team ID (for team credit deduction)
  useEffect(() => {
    if (!authUser?.id) return;
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;
      fetch("/api/team/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((json) => { if (json.teams?.length > 0) setTeamId(json.teams[0].id); })
        .catch(() => {});
    });
  }, [authUser?.id]);

  // Always start at Step 1 when the user lands on the page (per requirement:
  // "first step se hi start ho" — fresh visit ko bhi reset karo, na sirf re-upload).
  useEffect(() => {
    setBuilderStep(1);
    setGeneratedOutputUrl("");
  }, []);

  // Post-generation flow (mirrors the textile agent):
  //  • result ready → notify the user (bell) with a My Creations link
  //  • result viewer closed → ask for a rating, then clear the uploaded
  //    design + output so a NEW design can be uploaded without a refresh.
  const jwPrevResultOpen = useRef(false);
  useEffect(() => {
    if (!jwPrevResultOpen.current && resultModalOpen && authUser?.id) {
      supabase
        .rpc("add_user_notification", {
          p_user_id: authUser.id,
          p_title: "✅ Your jewellery mockup is ready!",
          p_body: "View it anytime in My Creations.",
          p_link: "/my-creations",
        })
        .then(() => {}, () => {});
      if (typeof window !== "undefined")
        window.dispatchEvent(new Event("af-notifications-refresh"));
    }
    if (jwPrevResultOpen.current && !resultModalOpen) {
      // Team-credit generations earn no bonus → don't prompt for a review.
      if (!reviewedResult && !teamId) setShowRatingModal(true);
      setUploads([]);
      setGeneratedOutputUrl("");
      setBuilderStep(1);
    }
    jwPrevResultOpen.current = resultModalOpen;
  }, [resultModalOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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
        setCameraAngle(settings.cameraAngle || "Auto Angle");
        setCustomCameraAngle(settings.customCameraAngle || "");
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
        setUseCompanyPhone(settings.useCompanyPhone ?? true);
        setUseCompanyAddress(settings.useCompanyAddress ?? false);
      }

      if (savedCompany) {
        const company = JSON.parse(savedCompany);
        setCompanyLogoPreview(company.companyLogoPreview || "");
        setCompanyName(company.companyName || "");
        setCompanyWebsite(company.companyWebsite || "");
        setCompanyPhone(company.companyPhone || "");
        setCompanyAddress(company.companyAddress || "");
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
          cameraAngle,
          customCameraAngle,
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
          useCompanyPhone,
          useCompanyAddress,
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
    cameraAngle,
    customCameraAngle,
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
    useCompanyPhone,
    useCompanyAddress,
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
          companyAddress,
        }),
      );
    } catch (error) {
      console.warn("Jewellery company details could not be saved.", error);
    }
  }, [companyLogoPreview, companyName, companyWebsite, companyPhone, companyAddress]);
  
  


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

  const credits = useMemo(() => {
    const base = quality === "Ultra HD" ? 30 : outputSize.includes("Mobile") ? 17 : 15;
    // Branding overlays: +1 each — FREE for Empire users.
    const brandingCredits = isEmpireFromProfile(profile)
      ? 0
      : (useCompanyLogo && companyLogoPreview ? 1 : 0) +
        (useCompanyName && companyName.trim() ? 1 : 0) +
        (useCompanyWebsite && companyWebsite.trim() ? 1 : 0) +
        (useCompanyPhone && companyPhone.trim() ? 1 : 0) +
        (useCompanyAddress && companyAddress.trim() ? 1 : 0);

    const modelUploadCredits = modelPhotoUrl ? 2 : 0;
    const sceneUploadCredits = referenceSceneUrl ? 2 : 0;
    const perImageCredits = base + brandingCredits + modelUploadCredits + sceneUploadCredits;
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
    useCompanyPhone,
    companyPhone,
    useCompanyAddress,
    companyAddress,
    profile,
    modelPhotoUrl,
    referenceSceneUrl,
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

  const applySuggestion = (s: JewellerySuggestion) => {
    // Auto-fill best 3+ recommendations. User can still change anything.
    setJewelleryType(s.jewellery_type);
    if (s.jewellery_type === "More Options" && Array.isArray(s.more_jewellery)) {
      setMoreJewellery(s.more_jewellery);
    }
    setShootStyle(s.shoot_style);
    setAccessory(s.accessories);
    setModelType(s.model_type);
    setPose(s.pose);
    setFaceExpression(s.face_expression);
    setCameraAngle(s.camera_angle);
  };

  const runGuidanceAnalysis = async (file: File) => {
    setIsAnalyzing(true);
    setAiSuggestion(null);
    try {
      // Pre-upload to Supabase so the analyze endpoint can fetch by URL.
      // (Speeds up the eventual Generate too — same URL is reused.)
      const publicUrl = await uploadFileToSupabase(file, "jewellery-products");

      const resp = await fetch("/api/jewellery/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: publicUrl }),
      });
      const data = await resp.json().catch(() => ({}));
      if (data?.suggestion) {
        setAiSuggestion(data.suggestion);
        applySuggestion(data.suggestion);
      }
    } catch (err) {
      console.warn("Guidance analysis failed (silent):", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const dismissGuidance = () => {
    setShowGuidance(false);
    setAiSuggestion(null);
    try {
      const raw = window.localStorage.getItem(JEWELLERY_GUIDANCE_KEY);
      const parsed = raw ? JSON.parse(raw) : { gens: 0, hiddenManually: false };
      window.localStorage.setItem(
        JEWELLERY_GUIDANCE_KEY,
        JSON.stringify({ ...parsed, hiddenManually: true }),
      );
    } catch {}
  };

  const enableGuidance = () => {
    setShowGuidance(true);
    try {
      const raw = window.localStorage.getItem(JEWELLERY_GUIDANCE_KEY);
      const parsed = raw ? JSON.parse(raw) : { gens: 0, hiddenManually: false };
      window.localStorage.setItem(
        JEWELLERY_GUIDANCE_KEY,
        JSON.stringify({ gens: 0, hiddenManually: false }),
      );
    } catch {}
    // If an upload already exists, re-run analysis
    if (uploads[0]?.file) runGuidanceAnalysis(uploads[0].file);
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

    const finalUploads = generationMode === "single" ? nextUploads.slice(0, 1) : nextUploads;
    setUploads(finalUploads);

    // After a new image upload: always send the user back to Step 1
    // (clears any leftover step/output from a previous generation so they
    // start fresh — jewellery type → shoot → pose → final).
    if (finalUploads.length) {
      setBuilderStep(1);
      setGeneratedOutputUrl("");
      setAiSuggestion(null);
      // smooth scroll back to the step strip
      setTimeout(() => {
        stepTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

      // Kick off vision guidance only if user hasn't disabled it
      if (showGuidance && finalUploads[0]?.file) {
        runGuidanceAnalysis(finalUploads[0].file);
      }
    }
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

// Server-gated refund — direct UPDATE on profiles.credits is now
// blocked by a Postgres trigger (see sql/credits.sql). The server
// validates ownership + status='failed' + idempotency before refunding.
const refundCredits = async (
  userId: string,
  amount: number,
  generationId?: string,
) => {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const jwt = sess.session?.access_token;
    if (!jwt || !generationId) {
      // Without a generation_id the server can't gate the refund. Skip
      // silently — the user will need to contact support. Logged here
      // so we can detect this in production.
      console.warn("[refundCredits] missing JWT or generation_id; skipping", {
        userId,
        amount,
        generationId,
      });
      return;
    }
    await fetch("/api/credits/refund", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        generation_id: generationId,
        amount,
        reason: "client_detected_failure",
      }),
    });
  } catch (err) {
    console.error("[refundCredits] failed:", err);
  } finally {
    refreshProfile?.();
  }
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

// ── Canvas text overlay (branding) — fixed small size ──
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
  companyLogoUrl: string | null,
  showAfWatermark: boolean,
  logoCorner: "top-right" | "bottom-right" | "top-left" | "bottom-left" = "top-right",
  textOverlay?: TextOverlayData,
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
    if (!companyLogoImg && !afLogoImg && !hasOverlayText(textOverlay))
      return null;

    const canvas = document.createElement("canvas");
    canvas.width = baseImg.naturalWidth;
    canvas.height = baseImg.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 1. Base FAL output
    ctx.drawImage(baseImg, 0, 0);

    // 2. Company logo — top-right, 14% width
    if (companyLogoImg) {
      drawLogoInCorner(ctx, canvas.width, canvas.height, companyLogoImg, logoCorner, 0.14, 1);
    }

    // 3. AF watermark logo — bottom-right, 10% width, slightly translucent
    if (afLogoImg) {
      drawLogoInCorner(ctx, canvas.width, canvas.height, afLogoImg, "bottom-right", 0.10, 0.88);
    }

    // 4. Branding text overlay (fixed small size)
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
    logoPosition?: string;
    textOverlay?: TextOverlayData;
  },
): Promise<string> => {
  const { companyLogoUrl, afWatermark, generationId, logoPosition, textOverlay } =
    options;

  // Sanitize company logo URL — accept only real http(s) URLs
  const safeCompanyLogo =
    companyLogoUrl &&
    !companyLogoUrl.startsWith("data:") &&
    !companyLogoUrl.startsWith("blob:")
      ? companyLogoUrl
      : null;

  // Nothing to overlay → return raw
  if (!safeCompanyLogo && !afWatermark && !hasOverlayText(textOverlay)) {
    return rawOutputUrl;
  }

  try {
    const compositeBlob = await compositeLogoOnImage(
      rawOutputUrl,
      safeCompanyLogo,
      Boolean(afWatermark),
      (logoPosition as "top-right" | "bottom-right" | "top-left" | "bottom-left") || "top-right",
      textOverlay,
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

// Gate: ask for a review before the first download. User keeps
// viewing the output; after rating (or skip) the download proceeds.
const requestDownload = () => {
  if (!reviewedResult && !teamId) {
    setDownloadAfterReview(true);
    setShowRatingModal(true);
    return;
  }
  handleDownloadResult();
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

const handleDownloadPDF = () => {
  if (!generatedOutputUrl) return;
  const date = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AgentForge Jewellery AI</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#fff; font-family:Arial,sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; padding:20px; }
  img { max-width:100%; max-height:90vh; object-fit:contain; border-radius:8px; box-shadow:0 4px 24px rgba(0,0,0,0.12); }
  .label { margin-top:14px; font-size:11px; color:#6b7280; text-align:center; }
  @media print { body { background:#fff; } }
</style></head><body>
<img src="${generatedOutputUrl}" />
<p class="label">AgentForge Jewellery AI · ${date}</p>
</body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (w) { setTimeout(() => { w.print(); setTimeout(() => URL.revokeObjectURL(url), 3000); }, 600); }
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

    if (modelLook === "Upload Your Model" && !modelPhotoUrl) {
      alert("Apni model photo upload karein — Model Look me 'Upload Your Model' card.");
      return;
    }

    if (modelPhotoUrl && !tryOnConsent) {
      alert("Please confirm the consent checkbox for 'Upload Your Model' before generating.");
      return;
    }

const WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_JEWELLERY_WEBHOOK_URL ||
  "https://n8n.aiagentforge.in/webhook/generate-jewellery";


    setIsGenerating(true);
    setGeneratedOutputUrl("");
    setGenerationProgress(12);

    // Funnel event — fires at the moment the user actually commits
    // to a generation. Captured regardless of downstream success.
    const generationStartedAt = Date.now();
    track({ name: "generation_started", agent: "jewellery", credits });

    // Read profile for plan info only — credits are now read,
    // checked AND deducted atomically by /api/jewellery/generate
    // (see sql/credits.sql:deduct_credits + the server route).
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits, plan")
      .eq("id", authUser.id)
      .single();

    if (profileError || !profile) {
      alert("Profile not found.");
      return;
    }

    // Pre-flight credit check — purely a UX nicety. The atomic
    // deduction on the server is the real gate.
    if ((profile.credits || 0) < credits) {
      track({ name: "insufficient_credits", agent: "jewellery", required: credits });
      alert(`Not enough credits. Required: ${credits}, Available: ${profile.credits || 0}`);
      return;
    }

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
      // Upload failed before we hit the server, so no credits
      // were deducted — nothing to refund.
      track({
        name: "generation_failed",
        agent: "jewellery",
        stage: "upload",
        reason: "no_image_uploaded",
      });
      alert("Image upload failed. Please try again.");
      return;
    }

    let logoUrl = "";
    if (useCompanyLogo && companyLogoPreview) {
      logoUrl = companyLogoPreview;
    }

    const firstImageUrl = uploadedImageUrls[0]?.source_image_url || "";

    // Generations row is now inserted server-side inside
    // /api/jewellery/generate with the JWT-verified user_id.

    setGenerationProgress(38);

    // ────────────────────────────────────────────────────────────
    // Style directives — hidden strict instructions sent to n8n so
    // the agent enforces specific behaviour for certain selections.
    // The user's free-text custom_instruction stays clean.
    // ────────────────────────────────────────────────────────────
    const resolvedShootStyle = customShootStyle || shootStyle;
    const resolvedAccessory = customAccessory || accessory;
    const resolvedModelLook =
      modelLook === "Custom-Look"
        ? customModelLook.trim() || "Indian Model"
        : modelLook === "Upload Your Model"
          ? "Uploaded Model"
          : modelLook;
    const isNoModelLook = modelLook === "No Model";

    // Map selected size → actual output dimensions
    const resolveJewelleryOutputSize = (sz: string): string => {
      if (sz.toLowerCase().includes("square") || sz === "Square 1080x1080") return "2000x2000";
      if (sz.toLowerCase().includes("mobile") || sz === "Mobile 1080x1920") return "1080x1920";
      return sz;
    };
    const resolvedOutputSize = resolveJewelleryOutputSize(outputSize);

    const styleDirectives: string[] = [];

    if (resolvedAccessory === "No Accessories") {
      styleDirectives.push(
        "STRICT_ISOLATION: Only the uploaded jewellery piece is visible on the model or in the frame. Do NOT add any other jewellery, no display tray contents, no extra props, no decorative items in the scene. The model wears ONLY the uploaded jewellery — nothing else.",
      );
    }

    if (resolvedShootStyle === "Indian Model") {
      styleDirectives.push(
        "MODEL_MATCH_JEWELLERY: Choose the model archetype based on the jewellery type. Bridal/heavy pieces → Indian bride model with bridal attire. Daily-wear pendants/light necklaces → young everyday Indian woman in casual modern attire. Do NOT reuse the same saree-clad bridal model for every jewellery type.",
      );
    }

    if (resolvedShootStyle === "Bridal Look") {
      styleDirectives.push(
        "INDIAN_BRIDE_MODEL: Use a clearly Indian bride in traditional bridal attire (lehenga/saree) that complements the uploaded jewellery's metal tone and stones. Pose should match the selected pose option.",
      );
    }

    if (resolvedShootStyle === "Luxury Editorial") {
      styleDirectives.push(
        "WESTERN_DRESS_MODEL: Use a model in modern Western fashion (cocktail dress, evening gown, structured top) that elevates the uploaded jewellery. Editorial fashion-magazine vibe.",
      );
    }

    if (resolvedShootStyle === "Outdoor Premium") {
      styleDirectives.push(
        "OUTDOOR_PREMIUM: Premium outdoor jewellery campaign. Include a YOUNG (20-28 yr) Indian female model wearing the uploaded jewellery, shot in a real premium outdoor location (see BACKGROUND_THEME). Natural golden-hour light, shallow depth of field, jewellery sharp and hero. Never an old, broken or rundown backdrop.",
      );
    }

    if (resolvedShootStyle === "Studio Professional") {
      styleDirectives.push(
        "STUDIO_PROFESSIONAL: Professional studio jewellery shoot with a YOUNG (20-28 yr) Indian female model wearing the uploaded jewellery. Clean seamless studio backdrop, softbox + key + rim lighting, controlled metal reflections and stone brilliance. Use the selected STUDIO_POSE.",
      );
    }

    if (resolvedShootStyle === "White Background") {
      styleDirectives.push(
        "WHITE_BACKGROUND: Pure plain white seamless studio background with even shadowless ecommerce catalogue lighting and a clean simple neutral-styled young model wearing the uploaded jewellery. Never dark, coloured, textured, prop-heavy or editorial.",
      );
    }

    // Background theme box (Outdoor Premium / Luxury Editorial)
    if (
      (resolvedShootStyle === "Outdoor Premium" ||
        resolvedShootStyle === "Luxury Editorial") &&
      jewelOutdoorBg
    ) {
      styleDirectives.push(
        `BACKGROUND_THEME (${jewelOutdoorBg}): Place the shoot in a premium, clean, aspirational ${jewelOutdoorBg} setting with a high-budget brand-campaign look. Keep the background softly out of focus so it complements the jewellery and never competes. STRICTLY NO old, broken, dilapidated or rundown houses or walls, no slums, no messy streets.`,
      );
    }

    // Studio pose box (Studio Professional)
    if (
      resolvedShootStyle === "Studio Professional" &&
      jewelStudioPose &&
      jewelStudioPose !== "Auto"
    ) {
      styleDirectives.push(
        `STUDIO_POSE (${jewelStudioPose}): Direct the model into a clean, professional "${jewelStudioPose}" studio pose while keeping the uploaded jewellery clearly visible and the hero of the frame.`,
      );
    }

    if (resolvedShootStyle === "Luxury Studio") {
      styleDirectives.push(
        "YOUNG_MODEL_STUDIO: ALWAYS include a YOUNG (20–28 yr) Indian female model. Match model archetype to jewellery type — bridal pieces → young bride; daily-wear → young everyday woman; festive → young festive-styled woman. Set inside a premium jewellery studio with professional softbox + key + rim lights, dark velvet or gradient grey backdrop. Jewellery is hero, lit for metal reflections and stone brilliance.",
      );
    }

    if (resolvedShootStyle === "White Catalogue") {
      styleDirectives.push(
        "YOUNG_MODEL_WHITE_BG: ALWAYS include a YOUNG (20–28 yr) Indian female model on a PURE WHITE seamless background. Match model archetype to jewellery type — bridal pieces → young bride; daily-wear → young casual woman; statement → young fusion-styled woman. Even shadowless soft ecommerce lighting (Amazon / Meesho catalogue safe). Clean natural makeup, neutral plain outfit. Jewellery clearly visible and centered.",
      );
    }

    if (resolvedShootStyle === "Bridal Editorial") {
      styleDirectives.push(
        "YOUNG_BRIDE_EDITORIAL: ALWAYS include a YOUNG (20–28 yr) Indian bride model in editorial bridal styling. Match wedding attire to jewellery type — heavy bridal sets → full lehenga + dupatta drape; lighter bridal pieces → engagement-style saree or anarkali. Rich warm gold tones, ornate silk fabric backdrop, candlelight + softbox lighting mix. Vogue Bridal magazine wedding-rich feel. Combine with whatever pose and accessory the user selected.",
      );
    }

    // Model Look box (Step 3) — who wears the jewellery.
    if (isNoModelLook) {
      styleDirectives.push(
        "PRODUCT_ONLY: No human model and no body part in the image. Show ONLY the uploaded jewellery in a premium product composition (flat-lay, surface or prop as per accessories). This overrides any model instruction from the shoot style.",
      );
    } else {
      styleDirectives.push(
        `MODEL_LOOK (${resolvedModelLook}): The model wearing the jewellery must clearly have ${resolvedModelLook} features and skin tone, rendered naturally and realistically. Style, makeup and outfit still adapt to suit the jewellery, but the model ethnicity/look matches this selection.`,
      );
    }

    const sharedSettings = {
      source_image_url: firstImageUrl,
      model_image_url: modelPhotoUrl || "",
      model_photo_url: modelPhotoUrl || "",
      has_uploaded_model: Boolean(modelPhotoUrl),
      reference_scene_url: referenceSceneUrl || "",
      has_uploaded_scene: Boolean(referenceSceneUrl),
      plan: String(profile.plan || "starter").toLowerCase(),
      is_pro: String(profile.plan || "").toLowerCase().includes("pro"),
      is_empire: String(profile.plan || "").toLowerCase().includes("empire"),
      jewellery_type: selectedJewelleryLabel,
      more_jewellery: moreJewellery,
      output_type: resolvedShootStyle,
      // Model usage is driven by the Model Look box now: No Model = product-only,
      // anything else = a human model wearing the jewellery.
      model_type: isNoModelLook ? "No Model" : "Female Model",
      pose: customPose || pose,
      model_look: resolvedModelLook,
      face_expression: faceExpression,
      shoot_style: resolvedShootStyle,
      outdoor_background:
        resolvedShootStyle === "Outdoor Premium" ||
        resolvedShootStyle === "Luxury Editorial"
          ? jewelOutdoorBg
          : "",
      studio_pose:
        resolvedShootStyle === "Studio Professional" ? jewelStudioPose : "",
      accessories: resolvedAccessory,
      camera_angle: customCameraAngle || cameraAngle,
      output_size: resolvedOutputSize,
      output_quality: quality,
      jewellery_notes: jewelleryDetails,
      model_notes: modelNotes,
      custom_instruction: customInstruction,
      // Hidden strict directives the n8n agent should weave into the prompt.
      // These are NOT shown to the user — they enforce the behaviour the UI
      // hints describe (e.g. "Strict — only uploaded jewellery, nothing extra").
      style_directives: styleDirectives.join(" | "),
      required_credits: credits,
      af_watermark: isFreeAccount,
      company_details: {
        // Branding text is composited on the frontend (canvas) — AI must not render it.
        logo_url: "",
        company_name: "",
        website: "",
        phone: "",
        address: "",
        positions: {
          company_name: companyNamePosition,
          phone: companyPhonePosition,
          website: companyWebsitePosition,
          address: companyAddressPosition,
          logo: logoPosition,
        },
      },
      company_name_position: companyNamePosition,
      company_phone_position: companyPhonePosition,
      company_website_position: companyWebsitePosition,
      company_address_position: companyAddressPosition,
      logo_position: logoPosition,
    };

    const generationMode =
  uploadedImageUrls.length > 1 ? "bulk" : "single";

    const payload = {
  generation_mode: generationMode,

  generation_id: generationId,
  user_id: authUser.id,
  required_credits: credits,
  team_id: teamId ?? null,

  source_image_url: uploadedImageUrls[0]?.source_image_url,

  batch_id:
    generationMode === "bulk"
      ? `jewellery-${Date.now()}`
      : null,

  items: uploadedImageUrls.map((item, index) => ({
    generation_id: index === 0 ? generationId : newId(),
    source_image_url: item.source_image_url,
    model_image_url: modelPhotoUrl || "",
    model_photo_url: modelPhotoUrl || "",
    reference_scene_url: referenceSceneUrl || "",
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

// Attach the JWT so the server can verify the caller. Without
// this the server returns 401 and no credits are deducted.
const { data: sessionData } = await supabase.auth.getSession();
const accessToken = sessionData.session?.access_token;
if (!accessToken) {
  alert("Session expired. Please sign in again.");
  return;
}

let response;

try {
  response = await fetch("/api/jewellery/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  },
  body: JSON.stringify(payload),
});
} catch (err) {
  console.error("Fetch error:", err);
  throw new Error("Unable to connect to Jewellery AI server");
}

if (!response.ok) {
  // Try to parse the server's structured error so we can surface
  // a useful message instead of the generic catch-all alert.
  const errorText = await response.text();
  let serverError: any = null;
  try {
    serverError = JSON.parse(errorText);
  } catch {
    /* leave serverError null */
  }
  const errorMessage =
    serverError?.error ||
    serverError?.message ||
    errorText ||
    `HTTP ${response.status}`;

  console.error("[jewellery-generate] server returned non-OK", {
    status: response.status,
    code: serverError?.code,
    error: errorMessage,
    raw: errorText,
  });

  // Friendly mapping for common failure codes.
  if (response.status === 401) {
    alert("Session expired. Please log out and sign in again.");
    return;
  }
  if (response.status === 402 || serverError?.code === "INSUFFICIENT_CREDITS") {
    alert("Not enough credits. Please recharge to continue.");
    return;
  }

  throw new Error(`Server Error ${response.status}: ${errorMessage}`);
}

    const data = await response.json().catch(() => ({}));

    // Note: when the server returns non-OK above, it has already
    // refunded credits internally (see app/api/jewellery/generate/route.ts).
    // This block is reached only if the throw at line ~1581 was
    // somehow bypassed; double-refunds are blocked by the server's
    // idempotency check, so calling refund here is safe.
    if (!response.ok) {
      track({
        name: "generation_failed",
        agent: "jewellery",
        stage: "n8n",
        reason: (data as any)?.code || (data as any)?.error || "server_error",
      });
      await refundCredits(authUser.id, credits, generationId);
      console.error(data);
      alert("Generation failed. Credits refunded. Check n8n.");
      return;
    }

    // Server returns the new balance — refresh the UI immediately.
    if (typeof (data as any)?.new_balance === "number") {
      refreshProfile?.();
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
        logoPosition,
        textOverlay: {
          lines: [
            { text: useCompanyName ? companyName.trim() : "", position: companyNamePosition },
            { text: useCompanyPhone ? companyPhone.trim() : "", position: companyPhonePosition },
            { text: useCompanyWebsite ? companyWebsite.trim() : "", position: companyWebsitePosition },
            { text: useCompanyAddress ? companyAddress.trim() : "", position: companyAddressPosition },
          ],
          color: "white",
        },
      });

      track({
        name: "generation_completed",
        agent: "jewellery",
        generation_id: generationId,
        duration_ms: Date.now() - generationStartedAt,
      });

      setGeneratedOutputUrl(finalUrl);
      setGenerationProgress(100);
      refreshProfile?.();
      setRatingGenerationId(generationId);
      // Show ONLY the output popup now. The rating popup is deferred until
      // the user actually clicks Download (see requestDownload).
      setResultModalOpen(true);
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
          logoPosition,
          textOverlay: {
            lines: [
              { text: useCompanyName ? companyName.trim() : "", position: companyNamePosition },
              { text: useCompanyPhone ? companyPhone.trim() : "", position: companyPhonePosition },
              { text: useCompanyWebsite ? companyWebsite.trim() : "", position: companyWebsitePosition },
              { text: useCompanyAddress ? companyAddress.trim() : "", position: companyAddressPosition },
            ],
            color: "white",
          },
        });
        track({
          name: "generation_completed",
          agent: "jewellery",
          generation_id: generationId,
          duration_ms: Date.now() - generationStartedAt,
        });
        setGeneratedOutputUrl(finalUrl);
        setGenerationProgress(100);
        refreshProfile?.();
        setRatingGenerationId(generationId);
        // Defer rating popup to Download click; just show the output now.
        setResultModalOpen(true);
        window.setTimeout(() => setIsGenerating(false), 900);
        return;
      }

      if (row?.status === "failed") {
        // Polling detected an n8n worker failure AFTER our server
        // route already returned 200 and deducted. Ask the server
        // to refund — it gates on ownership + status='failed' +
        // idempotency.
        track({
          name: "generation_failed",
          agent: "jewellery",
          stage: "polling",
          reason: "n8n_marked_failed",
        });
        await refundCredits(authUser.id, credits, generationId);
        alert("Generation failed in n8n. Credits refunded.");
        return;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 5000));
    }

    setGenerationProgress(94);
    alert("Generation started. It is taking longer than expected. You can check My Creations shortly.");
  } catch (error) {
    console.error("[jewellery-generate] caught error:", error);
    // Refund only if the server actually deducted (server route
    // already refunds on its own failures, so this attempts a
    // gated refund tied to this generationId — server checks the
    // row's status and idempotency before crediting).
    if (authUser?.id) {
      await refundCredits(authUser.id, credits, generationId);
    }
    // Surface the actual error message so the user (and our logs)
    // know what really happened.
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong";
    alert(`${message}\n\nCredits refunded if they were deducted.`);
  } finally {
    setIsGenerating(false);
  }
};

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#fff8e8] pb-28 text-[#111827] dark:bg-[#070b14] dark:text-white sm:pb-0">
      {/* Gradient Glow Layer — same as home screen */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee66,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf655,transparent_35%),radial-gradient(circle_at_bottom,#0ea5e955,transparent_30%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.08))]" />

      {/* Grid Overlay — same as home screen */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.10] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

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

      {showRatingModal && (
        <RatingFeedbackModal
          generationId={ratingGenerationId}
          agent="jewellery"
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
            refreshProfile?.();
            if (downloadAfterReview) { setDownloadAfterReview(false); handleDownloadResult(); }
          }}
        />
      )}
      {/* Output popup — blurred page behind, just the result + actions (textile-style) */}
      {resultModalOpen && generatedOutputUrl && (
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
                src={generatedOutputUrl}
                alt="Generated jewellery visual"
                className="mx-auto max-h-[62vh] w-auto rounded-2xl object-contain shadow-2xl shadow-cyan-400/20"
              />
            </div>

            <div className="p-4 sm:p-6">
              <h3 className="mb-4 text-center text-xl font-black sm:text-2xl">Your jewellery visual is ready ✨</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={requestDownload}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-black text-white shadow-lg shadow-emerald-500/20 transition hover:scale-105 active:scale-95"
                >
                  Download HD
                </button>
                <button
                  type="button"
                  onClick={handleShareResult}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 font-black text-white shadow-lg shadow-blue-500/20 transition hover:scale-105 active:scale-95"
                >
                  Share Now
                </button>
              </div>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`AI Jewellery visual ready: ${generatedOutputUrl}`)}`}
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

      {showCongratsPopup && (
        <CongratulationsPopup
          credits={congratsCredits}
          onClose={() => setShowCongratsPopup(false)}
        />
      )}

      <StickyMobileCTA
        ctaName="jewellery_sticky_mobile"
        label={
          authUser?.id
            ? uploads.length > 0
              ? `Generate Visual · ${credits} credits`
              : "Upload jewellery photo →"
            : "Start with free credits"
        }
        subLabel={authUser?.id ? "AI Visual Studio" : "100 free credits on signup"}
        hidden={isGenerating || uploads.length > 0}
        onClick={() => {
          if (!authUser?.id) {
            setShowSignupPopup(true);
            return;
          }
          if (uploads.length > 0) {
            void handleGenerate();
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.14] dark:opacity-[0.06]"
        style={{
          backgroundImage: "linear-gradient(45deg,currentColor 1px,transparent 1px),linear-gradient(-45deg,currentColor 1px,transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      {/* Floating Doodles — jewellery themed */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Top band */}
        <div className="float-slow absolute left-[6%] top-[6%] text-4xl opacity-65 sm:text-5xl">💎</div>
        <div className="float-medium absolute right-[8%] top-[10%] text-4xl opacity-65 sm:text-5xl">💍</div>
        <div className="float-fast absolute left-[22%] top-[14%] text-2xl opacity-55 sm:text-3xl">✨</div>
        <div className="float-medium absolute right-[24%] top-[6%] text-3xl opacity-60 sm:text-4xl">👑</div>
        <div className="float-slow absolute left-[42%] top-[3%] text-2xl opacity-50 sm:text-3xl">⭐</div>
        <div className="float-fast absolute right-[42%] top-[18%] text-3xl opacity-60 sm:text-4xl">📿</div>

        {/* Side accents */}
        <div className="float-medium absolute left-[3%] top-[28%] text-3xl opacity-55 sm:text-4xl">🪙</div>
        <div className="float-slow absolute right-[4%] top-[32%] text-3xl opacity-55 sm:text-4xl">🥇</div>
        <div className="float-fast absolute left-[8%] top-[44%] text-3xl opacity-55 sm:text-4xl">⚡</div>
        <div className="float-medium absolute right-[6%] top-[46%] text-3xl opacity-55 sm:text-4xl">🏆</div>

        {/* Middle band */}
        <div className="float-slow absolute left-[35%] top-[52%] text-2xl opacity-50 sm:text-3xl">💍</div>
        <div className="float-medium absolute right-[30%] top-[58%] text-2xl opacity-55 sm:text-3xl">💎</div>
        <div className="float-fast absolute left-[14%] top-[62%] text-3xl opacity-55 sm:text-4xl">✦</div>
        <div className="float-slow absolute right-[14%] top-[66%] text-3xl opacity-55 sm:text-4xl">🌟</div>

        {/* Lower band */}
        <div className="float-fast absolute left-[20%] top-[78%] text-2xl opacity-55 sm:text-3xl">✧</div>
        <div className="float-medium absolute right-[18%] top-[82%] text-3xl opacity-60 sm:text-4xl">💫</div>
        <div className="float-slow absolute left-[48%] top-[88%] text-2xl opacity-50 sm:text-3xl">✨</div>
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

        <section className="mx-auto grid w-full max-w-7xl items-start gap-5 px-3 py-5 sm:px-4 lg:grid-cols-[0.95fr_1.05fr] lg:py-8">
          {/* ───────── Left: jewellery hero text ───────── */}
          <div>
            {/* Category eyebrow pill */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-gradient-to-r from-amber-50 via-white to-rose-50 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-amber-700 shadow-md shadow-amber-200/40 dark:border-amber-400/30 dark:bg-gradient-to-r dark:from-amber-500/10 dark:via-white/5 dark:to-rose-500/10 dark:text-amber-200">
              <Sparkles className="h-3 w-3" />
              Rings · Necklaces · Earrings · Bridal · Luxury Shoots
            </div>

            <h1 className="max-w-xl text-3xl font-black leading-[1.02] tracking-[-0.03em] lg:text-5xl">
              <span className="block">Luxury Jewellery Shoots.</span>
              <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                Without the Studio.
              </span>
            </h1>

            <p className="mt-3 max-w-xl text-base font-bold leading-6 lg:text-lg lg:leading-7">
              <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Mobile photo → Catalogue-ready jewellery shot.
              </span>{" "}
              <span className="text-slate-600 dark:text-white/60">In 30 seconds.</span>
            </p>

            <p className="mt-4 max-w-lg text-justify text-sm leading-6 text-slate-600 hyphens-auto dark:text-white/60 lg:text-base">
              Rings, necklaces, earrings, bangles, bridal sets, pearls — upload from
              your phone and get DSLR-quality studio shots, bridal campaign creatives,
              luxury catalogue images and Instagram-ready visuals for Amazon, Flipkart,
              Tanishq-style D2C sites and Meta Ads.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  if (typeof document !== "undefined") {
                    document.getElementById("try")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className="group relative cursor-pointer overflow-hidden rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-pink-500 px-6 py-3 text-sm font-black text-white shadow-xl shadow-rose-500/30 transition hover:scale-105 active:scale-95"
              >
                <span className="relative inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Start Jewellery Shoot
                </span>
              </button>
              <button
                type="button"
                onClick={() => setGenerationMode(generationMode === "single" ? "bulk" : "single")}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-black shadow-lg transition hover:scale-105 active:scale-95 dark:bg-white/10 dark:text-white"
              >
                {generationMode === "single" ? "Switch to Bulk" : "Switch to Single"}
                <ChevronRight className="h-4 w-4" />
              </button>
              <Link
                href="/gallery"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/5 bg-white px-6 py-3 text-sm font-black text-black shadow-sm transition hover:scale-105 active:scale-95 dark:border-white/10 dark:bg-white/10 dark:text-white"
              >
                View Gallery
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Trust strip — jewellery focused */}
            <div className="mt-6 grid max-w-xl grid-cols-3 gap-2 rounded-2xl border border-black/10 bg-white/80 p-2.5 text-center backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
              <div>
                <p className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-sm font-black text-transparent sm:text-base">
                  Bridal Ready
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">
                  Editorial-grade
                </p>
              </div>
              <div className="border-x border-black/10 dark:border-white/10">
                <p className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-sm font-black text-transparent sm:text-base">
                  DSLR Quality
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">
                  Diamond &amp; gold detail
                </p>
              </div>
              <div>
                <p className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-sm font-black text-transparent sm:text-base">
                  ~30 sec
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">
                  Per shoot
                </p>
              </div>
            </div>
          </div>

          {/* ───────── Right: jewellery showcase + slider ───────── */}
          <div className="relative flex h-fit flex-col overflow-hidden rounded-[1.5rem] border border-amber-200/40 bg-gradient-to-br from-amber-50/60 via-white to-rose-50/40 p-3 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-gradient-to-br dark:from-slate-900/70 dark:via-slate-900/50 dark:to-slate-950/70 sm:rounded-[2rem] sm:p-5">
            {/* Decorative blurs */}
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-rose-400/20 blur-3xl" />

            {/* Header */}
            <div className="relative mb-3 flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-600">
                Premium Showcase
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-black px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white dark:bg-white/10 dark:text-white/75">
                <span className="h-1 w-1 rounded-full bg-amber-400" />
                Luxury Shoots
              </span>
            </div>

            {/* Product slider — auto-rotating, arrows on the sides */}
            <div className="relative">
              {/* Prev arrow */}
              <button
                type="button"
                aria-label="Previous slide"
                onClick={() =>
                  setHeroSlide((p) => (p - 1 + HERO_JEWEL_SLIDES.length) % HERO_JEWEL_SLIDES.length)
                }
                className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white text-black/70 shadow-lg backdrop-blur transition hover:scale-110 active:scale-95 dark:border-white/15 dark:bg-slate-900/80 dark:text-white/80"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Next arrow */}
              <button
                type="button"
                aria-label="Next slide"
                onClick={() => setHeroSlide((p) => (p + 1) % HERO_JEWEL_SLIDES.length)}
                className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 translate-x-1/2 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white text-black/70 shadow-lg backdrop-blur transition hover:scale-110 active:scale-95 dark:border-white/15 dark:bg-slate-900/80 dark:text-white/80"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="relative overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${heroSlide * 100}%)` }}
                >
                  {HERO_JEWEL_SLIDES.map((slide, slideIdx) => (
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
                          className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-black/10 bg-white p-2.5 shadow-sm transition hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-lg active:scale-95 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-amber-400/40"
                        >
                          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 via-white to-rose-50 dark:from-white/[0.08] dark:via-white/[0.04] dark:to-white/[0.02]">
                            <img
                              src={cat.icon}
                              alt={`AI ${cat.label} ${cat.tag.toLowerCase()} — generated jewellery catalogue example by AgentForge AI`}
                              width={200}
                              height={200}
                              loading="lazy"
                              decoding="async"
                              className="h-3/4 w-3/4 object-contain transition group-hover:scale-110"
                              style={{ mixBlendMode: "multiply" }}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                            {/* Luxury rating strip */}
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
                              <p className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">
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
              {HERO_JEWEL_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={() => setHeroSlide(idx)}
                  className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
                    heroSlide === idx
                      ? "w-6 bg-gradient-to-r from-amber-400 to-rose-500"
                      : "w-1.5 bg-black/20 hover:bg-black/40 dark:bg-white/25 dark:hover:bg-white/40"
                  }`}
                />
              ))}
            </div>

            {/* Built for — brand logos */}
            <div className="relative mt-3 rounded-[1.25rem] border border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-black/25 sm:p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-600">
                Built for
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {/* Amazon */}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 dark:border-white/10 dark:bg-white/[0.05]" title="Amazon">
                  <span className="text-[13px] font-black leading-none tracking-tight text-[#232F3E] dark:text-white">
                    amazon
                  </span>
                  <span className="block h-1 w-3 -translate-y-0.5 rounded-full bg-[#FF9900]" />
                </span>

                {/* Flipkart */}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 dark:border-white/10 dark:bg-white/[0.05]" title="Flipkart">
                  <SiFlipkart className="h-3.5 w-3.5 text-[#2874F0]" />
                  <span className="text-[11px] font-black text-[#2874F0]">Flipkart</span>
                </span>

                {/* Tanishq-style D2C — gold pill */}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 dark:border-white/10 dark:bg-white/[0.05]" title="Tanishq / Jewellery D2C">
                  <Crown className="h-3.5 w-3.5 text-[#B8860B]" />
                  <span className="text-[11px] font-black text-[#B8860B]">Jewellery D2C</span>
                </span>

                {/* Instagram */}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 dark:border-white/10 dark:bg-white/[0.05]" title="Instagram">
                  <SiInstagram className="h-3.5 w-3.5 text-[#E1306C]" />
                  <span className="text-[11px] font-black text-[#E1306C]">Instagram</span>
                </span>

                {/* Shopify */}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 dark:border-white/10 dark:bg-white/[0.05]" title="Shopify · D2C">
                  <SiShopify className="h-3.5 w-3.5 text-[#96BF48]" />
                  <span className="text-[11px] font-black text-[#5E8E3E] dark:text-[#96BF48]">Shopify</span>
                </span>

                {/* Meta Ads */}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 dark:border-white/10 dark:bg-white/[0.05]" title="Meta Ads">
                  <SiMeta className="h-3.5 w-3.5 text-[#0866FF]" />
                  <span className="text-[11px] font-black text-[#0866FF]">Meta Ads</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="try" className="mx-auto max-w-7xl px-3 py-5 sm:px-5 sm:py-8">
          <div className="rounded-[1.25rem] border border-black/10 bg-white/80 p-3 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] sm:rounded-[1.75rem] sm:p-4 lg:p-6">
            <div className="mb-5 sm:mb-6">
              <h2 className="text-2xl font-black sm:text-3xl">Create Your AI Jewellery Photoshoot</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/60 sm:text-base">
                Same practical flow as the Textile page — upload on the left, step-wise controls on the right, and final summary.
              </p>
              <div className="mt-4 inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black text-amber-600">
                Bulk creation — available on Pro & Empire packs
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
              <div className="lg:sticky lg:top-24">
                <label className={`relative flex h-[240px] cursor-pointer overflow-hidden rounded-[1.5rem] border-2 border-dashed transition-all ${uploads[0]?.preview ? "border-cyan-300/60 dark:border-cyan-400/40" : "items-center justify-center bg-[#fffaf0] p-5 text-center border-black/15 dark:bg-black/20 dark:border-white/15"}`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple={generationMode === "bulk"}
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  {uploads[0]?.preview ? (
                    <>
                      <img src={uploads[0].preview} alt="Uploaded jewellery preview" className="h-full w-full object-contain" />
                      <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent p-3">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-black/70">Tap to change</span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-400 text-white shadow-lg shadow-cyan-400/25">
                        <Upload className="h-7 w-7" />
                      </div>
                      <p className="text-lg font-semibold">Upload jewellery image</p>
                      <p className="mt-2 text-sm text-slate-500 dark:text-white/50">PNG, JPG, WEBP supported</p>
                      <p className="mt-2 text-xs font-semibold text-cyan-700 dark:text-cyan-200">Image uploading — you can fill options while we prepare the file.</p>
                    </div>
                  )}
                </label>

                {/* ───────── AI Guidance card ─────────
                    Appears after upload when guidance is enabled. Shows what the AI
                    detected + which Step 1–3 options it auto-filled, with a reason
                    line. User can ✕ to dismiss (persists in localStorage). When
                    disabled, a small "Enable AI guide" link replaces it. */}
                {uploads.length > 0 && showGuidance && (
                  <div className="mt-4 rounded-[1.35rem] border border-amber-300/60 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-4 shadow-md shadow-amber-200/30 dark:border-amber-400/30 dark:from-amber-500/10 dark:via-white/5 dark:to-rose-500/10">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-md"
                          style={{ animation: isAnalyzing ? "pulse 1.4s ease-in-out infinite" : undefined }}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                        </span>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">
                          AI Suggests
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={dismissGuidance}
                        title="Hide guidance (you can re-enable below)"
                        className="rounded-full p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {isAnalyzing ? (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-slate-700 dark:text-white/80">
                          Analyzing your jewellery…
                        </p>
                        <p className="text-xs text-slate-500 dark:text-white/50">
                          Picking the best shoot style, model and props.
                        </p>
                      </div>
                    ) : aiSuggestion ? (
                      <>
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          Detected: <span className="text-amber-700 dark:text-amber-200">{aiSuggestion.detected_piece}</span>
                        </p>
                        <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-white/65">
                          {aiSuggestion.reason}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {[
                            { label: "Type", value: aiSuggestion.jewellery_type },
                            { label: "Style", value: aiSuggestion.shoot_style },
                            { label: "Model", value: aiSuggestion.model_type },
                            { label: "Pose", value: aiSuggestion.pose },
                            { label: "Props", value: aiSuggestion.accessories },
                            { label: "Camera", value: aiSuggestion.camera_angle },
                          ].map((chip) => (
                            <span
                              key={chip.label}
                              className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black text-slate-700 ring-1 ring-amber-200 dark:bg-white/10 dark:text-white/80 dark:ring-amber-400/30"
                            >
                              <span className="text-amber-600 dark:text-amber-300">{chip.label}:</span>
                              {chip.value}
                            </span>
                          ))}
                        </div>
                        <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                          Auto-filled — change anything you want in steps below.
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-white/50">
                        Guidance ready. Upload an image to see suggestions.
                      </p>
                    )}
                  </div>
                )}

                {/* Enable-guidance link when off */}
                {uploads.length > 0 && !showGuidance && (
                  <button
                    type="button"
                    onClick={enableGuidance}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-black text-amber-700 transition hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Need help? Enable AI guide
                  </button>
                )}

                {uploads.length > 1 && (
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

                {/* Company / Brand details card */}
                <div className="mt-4 rounded-[1.35rem] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.045]">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-widest text-cyan-600">Company / Branding</p>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1.5 text-[11px] font-black text-cyan-700 dark:bg-white/10 dark:text-cyan-200"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload Logo
                    </button>
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => handleLogoUpload(e.target.files)} />

                  <div className="mb-3 flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-cyan-50 text-cyan-700 dark:bg-white/10 dark:text-cyan-200">
                      {companyLogoPreview ? (
                        <img src={companyLogoPreview} alt="Company logo" className="h-full w-full object-cover" />
                      ) : (
                        <Crown className="h-6 w-6" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold">Logo on output</p>
                      <p className="text-[11px] text-slate-500 dark:text-white/45">
                        {companyLogoPreview ? "Uploaded — appears top-right of generated image" : "Optional. Will overlay top-right corner."}
                      </p>
                    </div>
                    {companyLogoPreview && (
                      <button
                        type="button"
                        onClick={() => { setCompanyLogoPreview(""); setUseCompanyLogo(false); }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-500/10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {(() => {
                      const selCls =
                        "max-w-[130px] rounded-lg border px-2 py-1.5 text-[11px] font-bold outline-none border-black/10 bg-white text-black dark:border-white/10 dark:bg-black/30 dark:text-white disabled:opacity-40";
                      return (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-white/60">
                              <input type="checkbox" checked={useCompanyLogo} onChange={(e) => setUseCompanyLogo(e.target.checked)} />
                              Use logo on output
                            </label>
                            <select value={logoPosition} disabled={!useCompanyLogo} onChange={(e) => setLogoPosition(e.target.value)} aria-label="Logo position" className={selCls}>
                              {brandPositions.map(([v, t]) => (<option key={v} value={v}>{t}</option>))}
                            </select>
                          </div>

                          <input
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Company name"
                            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-black/20 dark:text-white"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-white/60">
                              <input type="checkbox" checked={useCompanyName} onChange={(e) => setUseCompanyName(e.target.checked)} />
                              Show company name
                            </label>
                            <select value={companyNamePosition} disabled={!useCompanyName} onChange={(e) => setCompanyNamePosition(e.target.value)} aria-label="Company name position" className={selCls}>
                              {brandPositions.map(([v, t]) => (<option key={v} value={v}>{t}</option>))}
                            </select>
                          </div>

                          <input
                            value={companyWebsite}
                            onChange={(e) => setCompanyWebsite(e.target.value)}
                            placeholder="Website"
                            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-black/20 dark:text-white"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-white/60">
                              <input type="checkbox" checked={useCompanyWebsite} onChange={(e) => setUseCompanyWebsite(e.target.checked)} />
                              Show website
                            </label>
                            <select value={companyWebsitePosition} disabled={!useCompanyWebsite} onChange={(e) => setCompanyWebsitePosition(e.target.value)} aria-label="Website position" className={selCls}>
                              {brandPositions.map(([v, t]) => (<option key={v} value={v}>{t}</option>))}
                            </select>
                          </div>

                          <input
                            value={companyPhone}
                            onChange={(e) => setCompanyPhone(e.target.value)}
                            placeholder="Phone / WhatsApp"
                            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-black/20 dark:text-white"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-white/60">
                              <input type="checkbox" checked={useCompanyPhone} onChange={(e) => setUseCompanyPhone(e.target.checked)} />
                              Show phone
                            </label>
                            <select value={companyPhonePosition} disabled={!useCompanyPhone} onChange={(e) => setCompanyPhonePosition(e.target.value)} aria-label="Phone position" className={selCls}>
                              {brandPositions.map(([v, t]) => (<option key={v} value={v}>{t}</option>))}
                            </select>
                          </div>

                          <input
                            value={companyAddress}
                            onChange={(e) => setCompanyAddress(e.target.value)}
                            placeholder="Address (optional)"
                            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-black/20 dark:text-white"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-white/60">
                              <input type="checkbox" checked={useCompanyAddress} onChange={(e) => setUseCompanyAddress(e.target.checked)} />
                              Show address
                            </label>
                            <select value={companyAddressPosition} disabled={!useCompanyAddress} onChange={(e) => setCompanyAddressPosition(e.target.value)} aria-label="Address position" className={selCls}>
                              {brandPositions.map(([v, t]) => (<option key={v} value={v}>{t}</option>))}
                            </select>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

              </div>

              <div>
                <div ref={stepTopRef} className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
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
                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/50">Tap to select one or more. Pick &quot;Other&quot; and the AI will auto-detect the piece from your upload.</p>
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                          {MORE_JEWELLERY_OPTIONS.map((item) => {
                            const isActive = moreJewellery.includes(item);
                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => toggleMoreJewellery(item)}
                                className={clsx(
                                  "group relative flex min-h-[110px] flex-col items-center justify-center rounded-[22px] border p-3 text-center transition-all duration-300 active:scale-[0.97] sm:min-h-[128px] sm:rounded-[24px]",
                                  isActive
                                    ? "scale-[1.025] border-cyan-300 bg-gradient-to-br from-cyan-400/20 via-blue-500/15 to-purple-500/15 shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-300/60"
                                    : "border-slate-200 bg-white/90 hover:-translate-y-1 hover:border-cyan-300 hover:bg-white hover:shadow-lg dark:border-white/10 dark:bg-white/[0.045] dark:hover:bg-white/[0.08]",
                                )}
                              >
                                <div className="mb-2 flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] bg-white sm:h-16 sm:w-16">
                                  <img src={MORE_JEWELLERY_ICONS[item]} alt="" className="block h-full w-full object-contain transition duration-300 group-hover:scale-105" />
                                </div>
                                <p className={clsx("text-[12px] font-black leading-4 sm:text-sm", isActive ? "text-cyan-700 dark:text-cyan-200" : "text-slate-700 dark:text-white/75")}>{item}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

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
                    {/* Shoot Style — now includes both shoot atmosphere AND model look */}
                    <SelectionGrid title="Shoot Style &amp; Model Look" subtitle="One unified pick — lighting, background, presentation, plus Indian/bridal/luxury model aesthetic." options={SHOOT_STYLE_OPTIONS} value={shootStyle} onChange={setShootStyle} />

                    {/* Upload Your Scene — composite the jewellery into your own background */}
                    <div className="rounded-[1.35rem] border border-cyan-300/40 bg-cyan-400/10 p-4 dark:border-cyan-400/20">
                      <p className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-300">Upload Your Scene <span className="ml-2 rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-black text-cyan-700 dark:bg-cyan-400/20 dark:text-cyan-300">+2 Credits</span></p>
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/50">Upload your own background scene — AI will place the jewellery naturally into it, matching the scene&apos;s lighting and perspective.</p>
                      <div className="mt-3">
                        <label
                          className={`group relative flex min-h-[116px] min-w-0 max-w-[160px] cursor-pointer flex-col items-center justify-center rounded-[22px] p-3 text-center transition-all duration-300 active:scale-[0.97] sm:min-h-[145px] sm:rounded-[28px] sm:p-4 ${
                            referenceSceneUrl
                              ? "scale-[1.025] bg-gradient-to-br from-cyan-400/20 via-blue-500/15 to-purple-500/15 shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-300/70"
                              : "bg-gradient-to-br from-cyan-50/80 via-white to-blue-50/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 dark:bg-white/[0.045] dark:hover:bg-white/[0.08]"
                          } ${sceneUploading ? "pointer-events-none opacity-60" : ""}`}
                        >
                          <div className={`mb-2 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-white sm:mb-3 sm:h-[80px] sm:w-[80px] sm:rounded-[24px] ${referenceSceneUrl ? "shadow-lg shadow-cyan-400/25" : "shadow-sm"}`}>
                            {referenceSceneUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={referenceSceneUrl} alt="" className="block h-full w-full object-cover" />
                            ) : (
                              <span className="text-3xl" aria-hidden="true">📷</span>
                            )}
                          </div>
                          <p className={`max-w-full break-words text-center text-[12px] font-black leading-4 sm:text-sm ${referenceSceneUrl ? "text-[#0077b6]" : "text-black/70 dark:text-white/70"}`}>
                            {sceneUploading ? "Uploading…" : referenceSceneUrl ? "Scene Ready ✓" : "Upload Your Scene"}
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={sceneUploading}
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              if (!f.type.startsWith("image/")) {
                                alert("Please upload an image file.");
                                e.target.value = "";
                                return;
                              }
                              setSceneUploading(true);
                              try {
                                const url = await uploadFileToSupabase(f, "jewellery-scenes");
                                setReferenceSceneUrl(url);
                              } catch {
                                alert("Scene upload failed. Please try again.");
                              } finally {
                                setSceneUploading(false);
                                e.target.value = "";
                              }
                            }}
                          />
                          {referenceSceneUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setReferenceSceneUrl("");
                              }}
                              className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow"
                              aria-label="Remove scene"
                            >
                              ✕
                            </button>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Outdoor Premium / Luxury Editorial → background theme box */}
                    {(shootStyle === "Outdoor Premium" || shootStyle === "Luxury Editorial") && (
                      <div className="rounded-[1.35rem] border border-cyan-300/40 bg-cyan-400/10 p-4 dark:border-cyan-400/20">
                        <p className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-300">Select Background Theme</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/50">Pick the {shootStyle === "Luxury Editorial" ? "editorial" : "outdoor"} backdrop. Default Royal Palace — premium, never old/rundown.</p>
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                          {JEWEL_OUTDOOR_BG_OPTIONS.map((item) => {
                            const isActive = jewelOutdoorBg === item;
                            return (
                              <button key={item} type="button" onClick={() => setJewelOutdoorBg(item)}
                                className={clsx(
                                  "group flex min-h-[108px] flex-col items-center justify-center rounded-[20px] border p-3 text-center transition-all duration-300 active:scale-[0.97] sm:min-h-[124px]",
                                  isActive ? "scale-[1.02] border-cyan-300 bg-gradient-to-br from-cyan-400/20 via-blue-500/15 to-purple-500/15 shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-300/60" : "border-slate-200 bg-white/90 hover:-translate-y-1 hover:border-cyan-300 hover:bg-white hover:shadow-lg dark:border-white/10 dark:bg-white/[0.045] dark:hover:bg-white/[0.08]",
                                )}>
                                <div className="mb-2 flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] bg-white sm:h-16 sm:w-16"><img src={JEWEL_BG_THEME_ICONS[item]} alt="" className="block h-full w-full object-contain transition duration-300 group-hover:scale-105" /></div>
                                <p className={clsx("text-[12px] font-black leading-4 sm:text-sm", isActive ? "text-cyan-700 dark:text-cyan-200" : "text-slate-700 dark:text-white/75")}>{item}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Studio Professional → studio pose box */}
                    {shootStyle === "Studio Professional" && (
                      <div className="rounded-[1.35rem] border border-cyan-300/40 bg-cyan-400/10 p-4 dark:border-cyan-400/20">
                        <p className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-300">Select Studio Pose</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/50">How the model is posed in the studio jewellery shot.</p>
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                          {JEWEL_STUDIO_POSE_OPTIONS.map((item) => {
                            const isActive = jewelStudioPose === item;
                            return (
                              <button key={item} type="button" onClick={() => setJewelStudioPose(item)}
                                className={clsx(
                                  "group flex min-h-[108px] flex-col items-center justify-center rounded-[20px] border p-3 text-center transition-all duration-300 active:scale-[0.97] sm:min-h-[124px]",
                                  isActive ? "scale-[1.02] border-cyan-300 bg-gradient-to-br from-cyan-400/20 via-blue-500/15 to-purple-500/15 shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-300/60" : "border-slate-200 bg-white/90 hover:-translate-y-1 hover:border-cyan-300 hover:bg-white hover:shadow-lg dark:border-white/10 dark:bg-white/[0.045] dark:hover:bg-white/[0.08]",
                                )}>
                                <div className="mb-2 flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] bg-white sm:h-16 sm:w-16"><img src={JEWEL_STUDIO_POSE_ICONS[item]} alt="" className="block h-full w-full object-contain transition duration-300 group-hover:scale-105" /></div>
                                <p className={clsx("text-[12px] font-black leading-4 sm:text-sm", isActive ? "text-cyan-700 dark:text-cyan-200" : "text-slate-700 dark:text-white/75")}>{item}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Accessories & Props (10 options after removing Bridal Red Pillow) */}
                    <SelectionGrid title="Accessories &amp; Props" subtitle="Background props — temple, diamond, bridal, flat-lay setups." options={ACCESSORY_OPTIONS} value={accessory} onChange={setAccessory} />
                    <TextInputBox label="Custom Accessories" value={customAccessory} onChange={setCustomAccessory} placeholder="Example: silk cloth, jewellery box, flowers, diya, mirror, brass bell..." />
                  </div>
                )}

                {builderStep === 3 && (
                  <div className="space-y-4">
                    {/* Model Look — which kind of model wears the jewellery */}
                    <SelectionGrid title="Model Look" subtitle="Which model wears your jewellery — No Model for product-only, or Upload Your Model for your own photo." options={JEWEL_MODEL_LOOK_OPTIONS} value={modelLook} onChange={setModelLook} />

                    {/* Upload Your Model — virtual try-on with user's own photo */}
                    {modelLook === "Upload Your Model" && (
                    <div className="rounded-[1.35rem] border border-cyan-300/40 bg-cyan-400/10 p-4 dark:border-cyan-400/20">
                      <p className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-300">Upload Your Model <span className="ml-2 rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-black text-cyan-700 dark:bg-cyan-400/20 dark:text-cyan-300">+2 Credits</span></p>
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/50">Upload your own model photo — the AI will render the jewellery on the exact person in your photo. Face and identity preserved.</p>
                      <div className="mt-3">
                        <label
                          className={`group relative flex min-h-[116px] min-w-0 cursor-pointer flex-col items-center justify-center rounded-[22px] p-3 text-center transition-all duration-300 active:scale-[0.97] sm:min-h-[145px] sm:rounded-[28px] sm:p-4 ${
                            modelPhotoUrl
                              ? "scale-[1.025] bg-gradient-to-br from-cyan-400/20 via-blue-500/15 to-purple-500/15 shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-300/70"
                              : "bg-gradient-to-br from-cyan-50/80 via-white to-blue-50/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 dark:bg-white/[0.045] dark:hover:bg-white/[0.08]"
                          } ${modelPhotoUploading ? "pointer-events-none opacity-60" : ""} max-w-[160px]`}
                        >
                          <div className={`mb-2 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-white sm:mb-3 sm:h-[80px] sm:w-[80px] sm:rounded-[24px] ${modelPhotoUrl ? "shadow-lg shadow-cyan-400/25" : "shadow-sm"}`}>
                            {modelPhotoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={modelPhotoUrl} alt="" className="block h-full w-full object-cover" />
                            ) : (
                              <Upload className="h-9 w-9 text-cyan-500" aria-hidden="true" />
                            )}
                          </div>
                          <p className={`max-w-full break-words text-center text-[12px] font-black leading-4 sm:text-sm ${modelPhotoUrl ? "text-[#0077b6]" : "text-black/70 dark:text-white/70"}`}>
                            {modelPhotoUploading ? "Uploading…" : modelPhotoUrl ? "Your Photo ✓" : "Upload Your Model"}
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={modelPhotoUploading}
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              if (!f.type.startsWith("image/")) {
                                alert("Please upload an image file.");
                                e.target.value = "";
                                return;
                              }
                              setModelPhotoUploading(true);
                              try {
                                const url = await uploadFileToSupabase(f, "jewellery-model-photos");
                                setModelPhotoUrl(url);
                                setTryOnConsent(false);
                              } catch {
                                alert("Photo upload failed. Please try again.");
                              } finally {
                                setModelPhotoUploading(false);
                                e.target.value = "";
                              }
                            }}
                          />
                          {modelPhotoUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setModelPhotoUrl("");
                                setTryOnConsent(false);
                              }}
                              className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow"
                              aria-label="Remove photo"
                            >
                              ✕
                            </button>
                          )}
                        </label>
                      </div>
                      {modelPhotoUrl && (
                        <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-50/60 p-3 text-xs text-slate-600 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/75">
                          <input
                            type="checkbox"
                            checked={tryOnConsent}
                            onChange={(e) => setTryOnConsent(e.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-600"
                          />
                          <span>
                            This is my own photo (or I have permission to use it), and I will use it only for this jewellery preview. AgentForge will delete it after the result is generated.
                          </span>
                        </label>
                      )}
                    </div>
                    )}

                    {/* Pose */}
                    <SelectionGrid title="Pose" subtitle="Body, hand, neck or ear pose for jewellery presentation." options={POSE_OPTIONS} value={pose} onChange={setPose} />
                    <TextInputBox label="Custom Pose" value={customPose} onChange={setCustomPose} placeholder="Example: hand near face, neck close-up, bride looking side..." />
                  </div>
                )}

                {builderStep === 4 && (
  <div className="space-y-4">

    {/* Face Expression — placed before Frame & Quality */}
    <SelectionGrid title="Face Expression" subtitle="Useful when model face is visible — picks the mood of the shot." options={FACE_EXPRESSION_OPTIONS} value={faceExpression} onChange={setFaceExpression} />

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

                        
                    <TeamCreditToggle
                      useTeamCredits={!!teamId}
                      onChange={(val, id) => setTeamId(id)}
                    />

                    <div className="rounded-[1.35rem] border border-cyan-300/40 bg-gradient-to-br from-cyan-400/10 via-blue-500/10 to-purple-500/10 p-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <SummaryRow label="Jewellery" value={selectedJewelleryLabel} />
                        <SummaryRow label="Shoot Style" value={customShootStyle || shootStyle} />
                        <SummaryRow label="Model Look" value={modelLook === "Upload Your Model" ? "Your Photo" : modelLook} />
                        <SummaryRow label="Pose" value={customPose || pose} />
                        <SummaryRow label="Face Expression" value={faceExpression} />
                        <SummaryRow label="Accessories" value={customAccessory || accessory} />
                        <SummaryRow label="Frame" value={`${outputSize} / ${quality}`} />
                        <SummaryRow label="Uploads" value={String(uploads.length)} />
                        {modelPhotoUrl && (
                          <SummaryRow label="Upload Your Model" value="+2 credits" />
                        )}
                        {referenceSceneUrl && (
                          <SummaryRow label="Upload Your Scene" value="+2 credits" />
                        )}
                        {teamId && (
                          <SummaryRow label="Team Credits" value="Active" />
                        )}
                      </div>
                      <button type="button" onClick={handleGenerate} disabled={isGenerating || !uploads.length} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
                        {isGenerating ? "Generating..." : `Generate Jewellery Visual • ${credits} Credits`}
                        <ArrowRight className="h-4 w-4" />
                      </button>

                      {generatedOutputUrl && (
                        <div ref={resultRef} className="mt-5 overflow-hidden rounded-[1.5rem] border border-cyan-300/40 bg-white/90 p-4 shadow-xl shadow-cyan-500/10 dark:bg-slate-950/60">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-300">Generated Output</p>
                            </div>
                            <BadgeCheck className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="text-center">
                              {previewImage ? (
                                <img src={previewImage} alt="Uploaded jewellery photo" className="mx-auto max-h-[220px] w-full rounded-[1.25rem] object-cover shadow-lg sm:max-h-[320px]" />
                              ) : (
                                <div className="flex h-[200px] w-full items-center justify-center rounded-[1.25rem] border-2 border-dashed border-black/15 dark:border-white/20"><span className="text-3xl opacity-30">📷</span></div>
                              )}
                              <p className="mt-2 text-xs font-bold text-slate-500 dark:text-white/50">Your Photo</p>
                            </div>
                            <div className="text-center">
                              <img src={generatedOutputUrl} alt="Generated jewellery output" className="mx-auto max-h-[320px] w-full rounded-[1.25rem] object-contain shadow-lg shadow-cyan-400/20" />
                              <p className="mt-2 text-xs font-bold text-slate-500 dark:text-white/50">AI Visual</p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={requestDownload}
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
                          <button
                            type="button"
                            onClick={handleDownloadPDF}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-300/50 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-700 transition hover:scale-[1.02] dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300"
                          >
                            📄 Download as PDF
                          </button>

                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(`AI Jewellery visual ready: ${generatedOutputUrl}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 text-sm font-black text-white shadow-lg shadow-green-500/20 transition hover:scale-[1.02]"
                          >
                            Share on WhatsApp
                          </a>

                          <Link
                            href="/my-creations"
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-cyan-50/70 px-4 py-3 text-sm font-bold text-black/70 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 dark:hover:border-cyan-400/30 dark:hover:text-cyan-300"
                          >
                            🎨 Your old creations are saved in <span className="ml-1 font-black text-cyan-600">My Creations</span>
                          </Link>
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

        {/* ───────── Customer Testimonials ───────── */}
        <TestimonialsSlider
          agentType="jewellery"
          seed={JEWELLERY_SEED_TESTIMONIALS}
          heading="What early jewellery brands are saying"
          subtitle="Real WhatsApp & in-app feedback from jewellery showrooms, goldsmiths and boutique stores — names masked for privacy."
        />
      </div>

      {/* Mobile floating Generate bar — only appears on Step 4 (after all
          settings done). Hidden on Steps 1-3 to keep the screen clean and
          avoid users tapping Generate before configuring. */}
      {builderStep === 4 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/90 px-3 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90 sm:hidden">
          <button type="button" onClick={handleGenerate} disabled={isGenerating || !uploads.length} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50">
            {isGenerating ? "Generating..." : `Generate • ${credits} Credits`}
            <Wand2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </main>
  );
}
