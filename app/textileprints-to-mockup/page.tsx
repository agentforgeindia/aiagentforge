"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";
import { useAuth } from "@/app/components/AuthProvider";
import { Crown, Sparkles, Upload, UploadCloud, X } from "lucide-react";
import { track } from "@/lib/analytics";
import StickyMobileCTA from "@/app/components/StickyMobileCTA";
import { canGenerate } from "@/lib/checkCredits";
import { shouldDeductCredits } from "@/lib/deductCredits";
import { hasBulkAccess, hasUnlimitedAccess } from "@/lib/plans";
import SignupPromptPopup from "@/app/components/SignupPromptPopup";
import AIThinkingSteps from "@/app/components/AIThinkingSteps";
import TestimonialsSlider, {
  type Testimonial,
} from "@/app/components/TestimonialsSlider";
import RatingFeedbackModal from "@/app/components/RatingFeedbackModal";
import CongratulationsPopup from "@/app/components/CongratulationsPopup";

const TEXTILE_THINKING_STEPS = [
  "Reading your design file",
  "Matching textile folds",
  "Mapping pattern to fabric",
  "Applying luxury studio lighting",
  "Posing the model",
  "Generating DSLR-quality details",
  "Adding article code overlay",
  "Polishing the final mockup",
];

// Seed testimonials — short, raw, WhatsApp-style. Real submissions from the
// DB (table: `testimonials`, status: 'approved') replace these once available.
const TEXTILE_SEED_TESTIMONIALS: Testimonial[] = [
  {
    id: "seed-1",
    name: "Rajesh K****",
    city: "Surat",
    message: "Amazing output 🔥 — sent it to the client right away, order confirmed.",
    rating: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    source: "whatsapp",
  },
  {
    id: "seed-2",
    name: "Priya S****",
    city: "Mumbai",
    message:
      "Catalogue-ready images in 30 sec — saved a lot of time. The article code feature is genius.",
    rating: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    source: "in-app",
  },
  {
    id: "seed-3",
    name: "Anil M****",
    city: "Erode",
    message:
      "Sample stitching used to take 5 days. Now we send the client a preview the same day.",
    rating: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    source: "whatsapp",
  },
  {
    id: "seed-4",
    name: "Meera D****",
    city: "Jaipur",
    message:
      "Just tried it — quality is really good. Saree mockups look real on the model. Recommended!",
    rating: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    source: "in-app",
  },
  {
    id: "seed-5",
    name: "Vikas T****",
    city: "Ludhiana",
    message:
      "Article number overlay is a game-changer. Zero confusion now when sending to wholesalers.",
    rating: 4,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    source: "whatsapp",
  },
  {
    id: "seed-6",
    name: "Suresh P****",
    city: "Bhilwara",
    message:
      "After seeing the mockups, the client ordered 12 designs in one go 💯 — has never happened before.",
    rating: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    source: "whatsapp",
  },
];

const WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_PRODUCTION_WEBHOOK || "/api/generate-mockup";

const isEmpireProfile = (profile: any) => {
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
    planText.includes("empire"),
  );
};

type IconName =
  | "pattern"
  | "mensWear"
  | "ladiesWear"
  | "kidsWear"
  | "homeTextile"
  | "decor"
  | "universalFabric"
  | "indianMale"
  | "indianFemale"
  | "westernMale"
  | "westernFemale"
  | "asianModel"
  | "africanModel"
  | "europeanModel"
  | "middleEasternModel"
  | "shirt"
  | "kurta"
  | "suit"
  | "dress"
  | "saree"
  | "tshirt"
  | "bedsheet"
  | "curtain"
  | "pillow"
  | "cushion"
  | "towel"
  | "blanket"
  | "rug"
  | "bag"
  | "scarf"
  | "wallPanel"
  | "fabricRoll"
  | "camera"
  | "outdoor"
  | "studio"
  | "whitebg"
  | "luxury"
  | "none"
  | "watch"
  | "sunglasses"
  | "bracelet"
  | "square"
  | "mobile"
  | "premium"
  | "ultra"
  | "frontPose"
  | "sidePose"
  | "backPose"
  | "autoPose"
  | "walkingPose"
  | "sittingPose"
  | "closeup"
  | "happy"
  | "confident"
  | "chill"
  | "serious"
  | "softLook"
  | "couple"
  | "family"
  | "holding"
  | "pointing"
  | "fullBody"
  | "halfBody"
  | "closeupShot"
  | "smiling";

const iconFileByVisualIcon: Partial<Record<IconName, string>> = {
  pattern: "flat fabric layout",
  mensWear: "mens ware",
  ladiesWear: "female ware",
  kidsWear: "kids ware",
  homeTextile: "home textile",
  decor: "decor-_-accessories",
  universalFabric: "universal febric",
  indianMale: "indian model",
  indianFemale: "indian model",
  westernMale: "western model",
  westernFemale: "western model",
  asianModel: "middle asian model",
  africanModel: "african models",
  europeanModel: "european model",
  middleEasternModel: "middle eastern models",
  shirt: "mens shirt",
  kurta: "male kurta",
  suit: "two piece",
  dress: "dress",
  saree: "saree",
  tshirt: "tshirt",
  bedsheet: "bedsheet",
  curtain: "curtain",
  pillow: "pillow-cover",
  cushion: "cushion cover",
  towel: "towel",
  blanket: "blanket",
  rug: "sofa cover",
  bag: "fabric bag",
  scarf: "scarf",
  wallPanel: "wall fabric panel",
  fabricRoll: "rolled fabric",
  camera: "photo studio setup",
  outdoor: "outdoor premium",
  studio: "photo studio setup",
  whitebg: "white background",
  luxury: "luxury editorial",
  none: "no model",
  watch: "wrist watch",
  sunglasses: "sunglasses",
  bracelet: "bracelet",
  square: "square",
  mobile: "mobile",
  premium: "premium",
  ultra: "ultra hd",
  frontPose: "front view",
  sidePose: "standing beside product",
  backPose: "front view",
  autoPose: "none",
  walkingPose: "model pointing toward product",
  sittingPose: "model sitting with product",
  closeup: "close-up texture",
  happy: "happy",
  confident: "confident",
  chill: "chill",
  serious: "serious",
  smiling: "smiling",
  softLook: "soft look",
  couple: "model holding product",
  family: "family lifestyle scene",
  holding: "model holding product",
  pointing: "model pointing toward product",
  fullBody: "full body",
  halfBody: "half body",
  closeupShot: "close-up shot",
};

const exactIconFileByTitle: Record<string, string> = {
  "men's wear": "mens ware",
  "mens wear": "mens ware",
  "ladies wear": "female ware",
  "kids wear": "kids ware",
  "home textile": "home textile",
  "decor & accessories": "decor-_-accessories",
  "universal fabric": "universal febric",
  "men's shirt": "mens shirt",
  "male kurta": "male kurta",
  "pathani suit": "pathani suit",
  "2 piece suit": "two piece",
  "3 piece suit": "three piece suit",
  blazer: "blazer",
  waistcoat: "waistcoat",
  "t-shirt": "tshirt",
  hoodie: "hoodie",
  "co-ord set": "co-ord set",
  "ladies suit": "ladies suits",
  "salwar kameez": "salwar kameez",
  kurti: "kurti",
  saree: "saree",
  lehenga: "lehenga",
  gown: "gown",
  dress: "dress",
  dupatta: "dupatta",
  blouse: "blouse",
  "sharara suit": "sharara suit",
  "palazzo suit": "palazzo suit",
  "boys shirt": "boys-shirt",
  "boys kurta": "kids-kurta",
  "kids t-shirt": "kids-T-shirt",
  "girls frock": "girls-frok",
  "kids suit": "kids-suits",
  "kids night suit": "kids-night-suit",
  bedsheet: "bedsheet",
  curtain: "curtain",
  "pillow cover": "pillow-cover",
  "cushion cover": "cushion cover",
  "sofa cover": "sofa cover",
  "table cover": "table cover",
  towel: "towel",
  blanket: "blanket",
  quilt: "quilt",
  bathrobe: "bathrobe",
  "luxury bedroom setup": "luxury bedroom setup",
  "fabric bag": "fabric bag",
  scarf: "scarf",
  stole: "stole",
  "wall fabric panel": "wall fabric panel",
  "carpet / rug": "sofa cover",
  "upholstery fabric": "upholstery fabric",
  "interior styled setup": "interior styled setup",
  "flat fabric layout": "flat fabric layout",
  "hanging fabric": "hanging fabric",
  "rolled fabric": "rolled fabric",
  "folded fabric stack": "folded fabeic stack",
  "close-up texture": "close-up texture",
  "fabric hanging display": "fabric hanging display",
  "single model": "indian model",
  "couple model": "model holding product",
  "family scene": "family lifestyle scene",
  "no model / flat lay": "no model",
  mannequin: "mannequin",
  "no model": "no model",
  "model standing beside product": "standing beside product",
  "model holding product": "model holding product",
  "model pointing toward product": "model pointing toward product",
  "model sitting with product": "model sitting with product",
  "couple with product": "model holding product",
  "family lifestyle scene": "family lifestyle scene",
  "indian model": "indian model",
  "western model": "western model",
  "asian model": "middle asian model",
  "middle eastern model": "middle eastern models",
  "african model": "african models",
  "european model": "european model",
  "custom-look": "custom-look",
  "lifestyle room view": "lifestyle room view",
  "front view": "front view",
  "top view": "top view",
  "folded product view": "folded product view",
  "close-up texture view": "close up texture view",
  "room corner setup": "room corner setup",
  "hotel room setup": "hotel room seutp",
  "outdoor premium": "outdoor premium",
  "studio professional": "photo studio setup",
  "white background": "white background",
  "luxury editorial": "luxury editorial",
  none: "none",
  sunglasses: "sunglasses",
  watch: "wrist watch",
  bracelet: "bracelet",
  "square (1:1)": "square",
  "mobile (9:16)": "mobile",
  premium: "premium",
  "ultra hd": "ultra hd",
  "full body": "full body",
  "half body": "half body",
  "close-up shot": "close-up shot",
  happy: "happy",
  confident: "confident",
  chill: "chill",
  serious: "serious",
  smiling: "smiling",
  "soft look": "soft look",
};

const iconPath = (file: string) => `/icons/${file}.svg`;

function FallbackLineIcon({ icon }: { icon: IconName }) {
  const stroke = "url(#afStrokeFallback)";
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-14 w-14 sm:h-16 sm:w-16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="afStrokeFallback"
          x1="10"
          y1="10"
          x2="54"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#22d3ee" />
          <stop offset="0.55" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      {icon === "none" ? (
        <>
          <circle cx="32" cy="32" r="18" stroke={stroke} strokeWidth="4" />
          <path
            d="M20 44L44 20"
            stroke={stroke}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <rect
            x="16"
            y="17"
            width="32"
            height="30"
            rx="9"
            stroke={stroke}
            strokeWidth="4"
          />
          <path
            d="M23 29c5-5 13 5 18 0M23 38c5-5 13 5 18 0"
            stroke={stroke}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

function VisualIcon({ icon, fileName }: { icon: IconName; fileName?: string }) {
  const [failed, setFailed] = useState(false);
  const finalFile = fileName || iconFileByVisualIcon[icon] || "none";

  if (failed) return <FallbackLineIcon icon={icon} />;

  return (
    <img
      src={iconPath(finalFile)}
      alt=""
      loading="lazy"
      className="block h-full w-full object-cover transition duration-300 group-hover:scale-105"
      style={{ mixBlendMode: "multiply" }}
      onError={() => setFailed(true)}
      aria-hidden="true"
    />
  );
}

function optionIcon(title: string): IconName {
  const key = title.toLowerCase();
  if (key.includes("men's wear") || key.includes("mens wear"))
    return "mensWear";
  if (key.includes("ladies wear") || key.includes("women")) return "ladiesWear";
  if (key.includes("kids")) return "kidsWear";
  if (key.includes("home textile")) return "homeTextile";
  if (key.includes("decor")) return "decor";
  if (key.includes("universal")) return "universalFabric";
  if (key.includes("sunglasses")) return "sunglasses";
  if (key.includes("watch")) return "watch";
  if (key.includes("bracelet")) return "bracelet";
  if (key.includes("bedsheet") || key.includes("bedroom")) return "bedsheet";
  if (key.includes("curtain")) return "curtain";
  if (key.includes("pillow")) return "pillow";
  if (key.includes("cushion") || key.includes("sofa")) return "cushion";
  if (key.includes("towel") || key.includes("bathrobe")) return "towel";
  if (key.includes("blanket") || key.includes("quilt")) return "blanket";
  if (key.includes("rug") || key.includes("carpet")) return "rug";
  if (key.includes("bag")) return "bag";
  if (key.includes("scarf") || key.includes("stole") || key.includes("dupatta"))
    return "scarf";
  if (key.includes("wall")) return "wallPanel";
  if (key.includes("roll")) return "fabricRoll";
  if (key.includes("saree")) return "saree";
  if (
    key.includes("dress") ||
    key.includes("gown") ||
    key.includes("lehenga") ||
    key.includes("frock")
  )
    return "dress";
  if (key.includes("kurta") || key.includes("kameez") || key.includes("salwar"))
    return "kurta";
  if (
    key.includes("suit") ||
    key.includes("blazer") ||
    key.includes("waistcoat") ||
    key.includes("pathani")
  )
    return "suit";
  if (
    key.includes("t-shirt") ||
    key.includes("hoodie") ||
    key.includes("co-ord")
  )
    return "tshirt";
  if (key.includes("shirt")) return "shirt";
  if (key.includes("indian female")) return "indianFemale";
  if (key.includes("indian male")) return "indianMale";
  if (key.includes("western female")) return "westernFemale";
  if (key.includes("western male")) return "westernMale";
  if (key.includes("asian")) return "asianModel";
  if (key.includes("african")) return "africanModel";
  if (key.includes("european")) return "europeanModel";
  if (key.includes("middle")) return "middleEasternModel";
  if (key.includes("couple")) return "couple";
  if (key.includes("family")) return "family";
  if (key.includes("holding")) return "holding";
  if (key.includes("pointing")) return "pointing";
  if (key.includes("standing") || key.includes("single")) return "frontPose";
  if (key.includes("flat lay") || key.includes("flatlay")) return "pattern";
  if (key.includes("mannequin")) return "frontPose";
  if (key.includes("outdoor")) return "outdoor";
  if (key.includes("studio")) return "studio";
  if (key.includes("white")) return "whitebg";
  if (
    key.includes("luxury") ||
    key.includes("hotel") ||
    key.includes("editorial")
  )
    return "luxury";
  if (key.includes("none") || key.includes("no model")) return "none";
  if (key.includes("9:16") || key.includes("1920") || key.includes("mobile"))
    return "mobile";
  if (key.includes("1:1") || key.includes("1080") || key.includes("square"))
    return "square";
  if (key.includes("ultra")) return "ultra";
  if (key.includes("premium")) return "premium";
  if (key.includes("front")) return "frontPose";
  if (key.includes("side")) return "sidePose";
  if (key.includes("back")) return "backPose";
  if (key.includes("walking")) return "walkingPose";
  if (key.includes("sitting")) return "sittingPose";
  if (key.includes("close-up")) return "closeupShot";
  if (key.includes("full body")) return "fullBody";
  if (key.includes("half body")) return "halfBody";
  if (key.includes("auto")) return "autoPose";
  if (key.includes("happy")) return "happy";
  if (key.includes("confident")) return "confident";
  if (key.includes("chill")) return "chill";
  if (key.includes("serious")) return "serious";
  if (key.includes("smiling")) return "smiling";
  if (key.includes("soft")) return "softLook";
  if (
    key.includes("fabric") ||
    key.includes("display") ||
    key.includes("hanging")
  )
    return "universalFabric";
  return "pattern";
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
  icon?: IconName;
  onClick: () => void;
  darkMode: boolean;
}) {
  const finalIcon = icon || optionIcon(title);
  const iconFile =
    exactIconFileByTitle[title.toLowerCase()] ||
    iconFileByVisualIcon[finalIcon] ||
    "none";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-h-[116px] min-w-0 flex-col items-center justify-center rounded-[22px] p-3 text-center transition-all duration-300 active:scale-[0.97] sm:min-h-[145px] sm:rounded-[28px] sm:p-4 ${
        active
          ? "scale-[1.025] bg-gradient-to-br from-cyan-400/20 via-blue-500/15 to-purple-500/15 shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-300/70"
          : darkMode
            ? "bg-white/[0.045] hover:-translate-y-1 hover:bg-white/[0.08] hover:shadow-lg hover:shadow-cyan-500/10"
            : "bg-gradient-to-br from-cyan-50/80 via-white to-blue-50/40 hover:-translate-y-1 hover:from-cyan-100/80 hover:via-white hover:to-blue-100/40 hover:shadow-xl hover:shadow-cyan-500/10"
      }`}
    >
      <div
        className={`mb-2 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[20px] sm:mb-3 sm:h-[80px] sm:w-[80px] sm:rounded-[24px] ${
          active
            ? "shadow-lg shadow-cyan-400/25"
            : "shadow-sm"
        }`}
      >
        <VisualIcon icon={finalIcon} fileName={iconFile} />
      </div>

      <p
        className={`max-w-full break-words text-center text-[12px] font-black leading-4 sm:text-sm ${active ? "text-[#0077b6]" : darkMode ? "text-white/70" : "text-black/70"}`}
      >
        {title}
      </p>
    </button>
  );
}

type GenStatus =
  | "uploading"
  | "ocr"
  | "ready"
  | "generating"
  | "done"
  | "failed";

type GenItem = {
  id: string;
  fileName: string;
  url: string;
  designNumber: string;
  status: GenStatus;
  resultUrl?: string;
  error?: string;
};

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2);

const extractDesignNumberFromName = (fileName: string) => {
  const cleanName = fileName.replace(/\.[^/.]+$/, "");
  const match = cleanName.match(
    /(?:design|article|art|code|pattern|pat|d|a)?[-_\s]*([A-Z0-9]{2,}[-_][A-Z0-9]{2,}|[A-Z]{1,4}\d{2,}|\d{3,})/i,
  );
  return match?.[1]?.toUpperCase().replace(/_/g, "-") || "";
};

const extractDesignNumberFromText = (text: string): string => {
  if (!text) return "";
  const cleaned = text.replace(/\s+/g, " ");
  const patterns = [
    /\b([A-Z]{1,4}[-_]\d{2,6})\b/,
    /\b([A-Z]{1,4}\d{2,6})\b/,
    /\b(\d{4,8})\b/,
    /\b([A-Z0-9]{3,}[-_][A-Z0-9]{2,})\b/,
  ];
  for (const p of patterns) {
    const m = cleaned.toUpperCase().match(p);
    if (m) return m[1].replace(/_/g, "-");
  }
  return "";
};

type TextileCategory =
  | "Men's Wear"
  | "Ladies Wear"
  | "Kids Wear"
  | "Home Textile"
  | "Decor & Accessories"
  | "Universal Fabric";

const textileCategories: {
  title: TextileCategory;
  icon: IconName;
  hint: string;
}[] = [
  { title: "Men's Wear", icon: "shirt", hint: "Shirts, kurtas, suits" },
  { title: "Ladies Wear", icon: "dress", hint: "Suits, saree, kurti" },
  { title: "Kids Wear", icon: "tshirt", hint: "Kids fashion mockups" },
  { title: "Home Textile", icon: "pattern", hint: "Bedsheets, curtains" },
  {
    title: "Decor & Accessories",
    icon: "luxury",
    hint: "Cushions, bags, rugs",
  },
  { title: "Universal Fabric", icon: "pattern", hint: "Flat fabric preview" },
];

const productOptionsByCategory: Record<TextileCategory, string[]> = {
  "Men's Wear": [
    "Men's Shirt",
    "Male Kurta",
    "Pathani Suit",
    "2 Piece Suit",
    "3 Piece Suit",
    "Blazer",
    "Waistcoat",
    "T-Shirt",
    "Hoodie",
    "Co-ord Set",
  ],
  "Ladies Wear": [
    "Ladies Suit",
    "Salwar Kameez",
    "Kurti",
    "Saree",
    "Lehenga",
    "Gown",
    "Dress",
    "Dupatta",
    "Blouse",
    "Sharara Suit",
    "Palazzo Suit",
  ],
  "Kids Wear": [
    "Boys Shirt",
    "Boys Kurta",
    "Kids T-Shirt",
    "Girls Frock",
    "Kids Suit",
    "Kids Night Suit",
  ],
  "Home Textile": [
    "Bedsheet",
    "Curtain",
    "Pillow Cover",
    "Cushion Cover",
    "Sofa Cover",
    "Table Cover",
    "Towel",
    "Blanket",
    "Quilt",
    "Bathrobe",
    "Luxury Bedroom Setup",
  ],
  "Decor & Accessories": [
    "Fabric Bag",
    "Scarf",
    "Stole",
    "Wall Fabric Panel",
    "Carpet / Rug",
    "Upholstery Fabric",
    "Interior Styled Setup",
  ],
  "Universal Fabric": [
    "Flat Fabric Layout",
    "Hanging Fabric",
    "Rolled Fabric",
    "Folded Fabric Stack",
    "Close-up Texture",
    "Fabric Hanging Display",
  ],
};

const apparelModelUsageOptions = [
  "Single Model",
  "Couple Model",
  "Family Scene",
  "No Model / Flat Lay",
  "Mannequin",
];

const homeModelUsageOptions = [
  "No Model",
  "Model Standing Beside Product",
  "Model Holding Product",
  "Model Pointing Toward Product",
  "Model Sitting With Product",
  "Couple With Product",
  "Family Lifestyle Scene",
];

const modelLookOptions = [
  "Indian Model",
  "Western Model",
  "Asian Model",
  "Middle Eastern Model",
  "African Model",
  "European Model",
  "Custom-Look",
];

const apparelPoseOptions = [
  "Front Face",
  "Side Pose",
  "Walking Pose",
  "Sitting Pose",
  "Close-up Shot",
  "Half Body",
  "Full Body",
  "Auto",
];

const homeSceneOptions = [
  "Lifestyle Room View",
  "Front View",
  "Top View",
  "Folded Product View",
  "Close-up Texture View",
  "Room Corner Setup",
  "Hotel Room Setup",
];

const faceExpressionOptions = [
  "Happy",
  "Confident",
  "Chill",
  "Serious",
  "Smiling",
  "Soft Look",
];

const articlePositions = [
  ["top-left", "TL"],
  ["top-right", "TR"],
  ["bottom-left", "BL"],
  ["bottom-right", "BR"],
] as const;

const brandPositions = [
  ["top-left", "Top Left"],
  ["top-right", "Top Right"],
  ["center", "Center"],
  ["bottom-left", "Bottom Left"],
  ["bottom-right", "Bottom Right"],
] as const;

export default function Home() {
  const { darkMode } = useTheme();
  const { user: authUser, credits: userCredits, refreshProfile } = useAuth();

  const user = {
    name:
      authUser?.user_metadata?.full_name ||
      authUser?.user_metadata?.name ||
      authUser?.email?.split("@")[0] ||
      "User",
    email: authUser?.email,
  };

  const [profile, setProfile] = useState<any>(null);
  const isEmpireUser = isEmpireProfile(profile);

  const [items, setItems] = useState<GenItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const stepTopRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [dailyGalleryImage, setDailyGalleryImage] = useState(
    "/banner-design-output.png",
  );
  const [showProfile, setShowProfile] = useState(false);
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingGenerationId, setRatingGenerationId] = useState<string | undefined>();
  const [reviewedResult, setReviewedResult] = useState(false);
  const [downloadAfterReview, setDownloadAfterReview] = useState(false);
  const [showCongratsPopup, setShowCongratsPopup] = useState(false);
  const [congratsCredits, setCongratsCredits] = useState(0);

  const [textileCategory, setTextileCategory] =
    useState<TextileCategory>("Men\'s Wear");
  const [modelUsage, setModelUsage] = useState("Single Model");
  const [modelType, setModelType] = useState("Indian Model");
  const [product, setProduct] = useState("Men\'s Shirt");
  const [shootStyle, setShootStyle] = useState("Outdoor Premium");
  const [accessories, setAccessories] = useState<string[]>(["None"]);
  const [outputSize, setOutputSize] = useState("1080x1080");
  const [quality, setQuality] = useState("Premium");
  const [customInstruction, setCustomInstruction] = useState("");

  const [customModelType, setCustomModelType] = useState("");
  const [customProduct, setCustomProduct] = useState("");
  const [customShootStyle, setCustomShootStyle] = useState("");
  const [customAccessory, setCustomAccessory] = useState("");
  const [customOutputSize, setCustomOutputSize] = useState("");
  const [customQuality, setCustomQuality] = useState("");

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
  const [companyNamePosition, setCompanyNamePosition] = useState("bottom-left");
  const [companyPhonePosition, setCompanyPhonePosition] =
    useState("bottom-left");
  const [companyWebsitePosition, setCompanyWebsitePosition] =
    useState("bottom-right");
  const [companyAddressPosition, setCompanyAddressPosition] =
    useState("bottom-left");

  const [watermarkPosition, setWatermarkPosition] = useState<
    "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
  >("bottom-right");
  const [watermarkColor, setWatermarkColor] = useState<"white" | "black">(
    "white",
  );
  const [pose, setPose] = useState("Auto");
  const [customPose, setCustomPose] = useState("");
  const [faceExpression, setFaceExpression] = useState("Happy");
  const [customFaceExpression, setCustomFaceExpression] = useState("");

  const [showPromptBox, setShowPromptBox] = useState(false);
  const [showTextBox, setShowTextBox] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const [cancelVisible, setCancelVisible] = useState(true);
  const cancelRef = useRef(false);
  const [builderStep, setBuilderStep] = useState(1);

  const activeItem =
    items.find((it) => it.id === activeId) ||
    items.find((it) => it.resultUrl) ||
    items[0] ||
    null;
  const previewImage = activeItem?.url || null;
  const previewResult = activeItem?.resultUrl || null;
  const showResult = !!previewResult;
  const readyItems = items.filter(
    (it) => it.status === "ready" || it.status === "done",
  );
  const isHomeLikeCategory =
    textileCategory === "Home Textile" ||
    textileCategory === "Decor & Accessories" ||
    textileCategory === "Universal Fabric";
  const dynamicProducts =
    productOptionsByCategory[textileCategory] ||
    productOptionsByCategory["Men's Wear"];
  const dynamicModelUsageOptions = isHomeLikeCategory
    ? homeModelUsageOptions
    : apparelModelUsageOptions;
  const dynamicPoseOptions = isHomeLikeCategory
    ? homeSceneOptions
    : apparelPoseOptions;
  const showFaceExpression = !/no model|flat lay|mannequin/i.test(modelUsage);
  const builderStepMeta = [
    { id: 1, title: "Product", sub: "Category + product" },
    { id: 2, title: "Model", sub: "Usage + look" },
    { id: 3, title: "Shoot", sub: "Pose + style" },
    { id: 4, title: "Final", sub: "Extras + generate" },
  ];
  const canGoNext =
    builderStep === 1
      ? Boolean(textileCategory && (customProduct.trim() || product))
      : builderStep === 2
        ? Boolean(modelUsage && (customModelType.trim() || modelType))
        : builderStep === 3
          ? Boolean(
              (customPose.trim() || pose) &&
              (!showFaceExpression ||
                customFaceExpression.trim() ||
                faceExpression) &&
              (customShootStyle.trim() || shootStyle),
            )
          : true;

  const textileFacts = [
    {
      title: "Premium catalogues sell faster",
      text: "Clean model mockups help buyers understand fabric fall, scale, and final garment feel before sampling.",
    },
    {
      title: "Design code discipline",
      text: "A visible article or pattern number on every output reduces confusion between sellers, factories, and clients.",
    },
    {
      title: "Square + Status format",
      text: "1080×1080 works best for product grids. 1080×1920 works best for WhatsApp status, Instagram stories, and quick buyer approvals.",
    },
    {
      title: "Pattern continuity matters",
      text: "For shirts and kurtas, placket alignment, border placement, and repeat scale make the mockup look premium instead of random.",
    },
    {
      title: "Client preview psychology",
      text: "When the buyer sees fabric on a model, decision time drops because imagination becomes visual proof.",
    },
  ];

  useEffect(() => {
    if (showResult) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
  }, [showResult]);

  useEffect(() => {
    if (!loading) {
      setFactIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setFactIndex((current) => (current + 1) % textileFacts.length);
    }, 4500);

    setCancelVisible(true);
    const timer = window.setTimeout(() => {
      setCancelVisible(false);
    }, 5000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer);
    };
  }, [loading, textileFacts.length]);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!authUser?.id) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (!mounted) return;

      if (error) {
        console.error("Profile load error:", error);
        setProfile(null);
        return;
      }

      setProfile(data);
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [authUser?.id]);

  useEffect(() => {
    let mounted = true;

    const pickDailyImage = (rows: any[]) => {
      const textileOutputs = rows
        .filter((row) => {
          const categoryText = String(
            row?.category ||
              row?.agent ||
              row?.agent_type ||
              row?.type ||
              row?.style_type ||
              row?.title ||
              "",
          ).toLowerCase();

          return (
            row?.show_in_gallery === true &&
            (categoryText.includes("textile") ||
              categoryText.includes("mockup"))
          );
        })
        .map(
          (row) =>
            row?.gallery_image_url ||
            row?.image_url ||
            row?.output_image_url ||
            row?.output_url ||
            row?.result_url ||
            row?.url,
        )
        .filter(
          (url): url is string =>
            typeof url === "string" && url.startsWith("http"),
        );

      if (!textileOutputs.length) return false;

      const dayIndex =
        Math.floor(Date.now() / 86400000) % textileOutputs.length;
      if (mounted) setDailyGalleryImage(textileOutputs[dayIndex]);
      return true;
    };

    const loadDailyGalleryImage = async () => {
      try {
        // Same source as Gallery Textile tab: only public gallery-approved textile images.
        // Not user My Creations.
        const galleryTables = ["gallery_items", "gallery", "generations"];

        for (const table of galleryTables) {
          const { data, error } = await supabase
            .from(table)
            .select("*")
            .eq("show_in_gallery", true)
            .limit(60);

          if (!error && data?.length && pickDailyImage(data as any[])) return;
        }
      } catch (error) {
        console.warn("Daily gallery image load failed:", error);
      }
    };

    loadDailyGalleryImage();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("motif_mockup_settings");
    if (!saved) return;

    const s = JSON.parse(saved);
    setTextileCategory(s.textileCategory || "Men's Wear");
    setModelUsage(s.modelUsage || "Single Model");
    setModelType(s.modelType || "Indian Model");
    setProduct(s.product || "Men's Shirt");
    setShootStyle(s.shootStyle || "Outdoor Premium");
    setAccessories(Array.isArray(s.accessories) ? s.accessories : ["None"]);
    setOutputSize(s.outputSize || "1080x1080");
    setQuality(s.quality || "Premium");
    setCustomInstruction(s.customInstruction || "");
    setCustomModelType(s.customModelType || "");
    setCustomProduct(s.customProduct || "");
    setCustomShootStyle(s.customShootStyle || "");
    setCustomAccessory(s.customAccessory || "");
    setCustomOutputSize(s.customOutputSize || "");
    setCustomQuality(s.customQuality || "");
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
    setCompanyNamePosition(s.companyNamePosition || "bottom-left");
    setCompanyPhonePosition(s.companyPhonePosition || "bottom-left");
    setCompanyWebsitePosition(s.companyWebsitePosition || "bottom-right");
    setCompanyAddressPosition(s.companyAddressPosition || "bottom-left");
    setWatermarkPosition(s.watermarkPosition || "bottom-right");
    setWatermarkColor(s.watermarkColor || "white");
    setPose(s.pose || "Auto");
    setCustomPose(s.customPose || "");
    setFaceExpression(s.faceExpression || "Happy");
    setCustomFaceExpression(s.customFaceExpression || "");
    setShowPromptBox(s.showPromptBox || false);
    setShowTextBox(s.showTextBox || false);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "motif_mockup_settings",
      JSON.stringify({
        textileCategory,
        modelUsage,
        modelType,
        product,
        shootStyle,
        accessories,
        outputSize,
        quality,
        customInstruction,
        customModelType,
        customProduct,
        customShootStyle,
        customAccessory,
        customOutputSize,
        customQuality,
        companyName,
        companyPhone,
        companyWebsite,
        companyAddress,
        useCompanyName,
        useCompanyPhone,
        useCompanyWebsite,
        useCompanyAddress,
        companyNamePosition,
        companyPhonePosition,
        companyWebsitePosition,
        companyAddressPosition,
        watermarkPosition,
        watermarkColor,
        pose,
        customPose,
        faceExpression,
        customFaceExpression,
        showPromptBox,
        showTextBox,
        darkMode,
      }),
    );
  }, [
    textileCategory,
    modelUsage,
    modelType,
    product,
    shootStyle,
    accessories,
    outputSize,
    quality,
    customInstruction,
    customModelType,
    customProduct,
    customShootStyle,
    customAccessory,
    customOutputSize,
    customQuality,
    companyName,
    companyPhone,
    companyWebsite,
    companyAddress,
    useCompanyName,
    useCompanyPhone,
    useCompanyWebsite,
    useCompanyAddress,
    useCompanyLogo,
    companyNamePosition,
    companyPhonePosition,
    companyWebsitePosition,
    companyAddressPosition,
    watermarkPosition,
    watermarkColor,
    pose,
    customPose,
    faceExpression,
    customFaceExpression,
    showPromptBox,
    showTextBox,
    darkMode,
  ]);

  const getRequiredCredits = (
    sizeValue = customOutputSize.trim() || outputSize,
    qualityValue = customQuality.trim() || quality,
    brandDetails?: {
      company_name?: string;
      phone_number?: string;
      website?: string;
      address?: string;
    },
  ) => {
    const normalizedSize = sizeValue.trim();
    const normalizedQuality = qualityValue.trim().toLowerCase();

    let baseCredits = 15;

    if (normalizedSize === "1080x1080" && normalizedQuality === "premium") {
      baseCredits = 15;
    } else if (
      normalizedSize === "1080x1080" &&
      normalizedQuality === "ultra hd"
    ) {
      baseCredits = 20;
    } else if (
      normalizedSize === "1080x1920" &&
      normalizedQuality === "premium"
    ) {
      baseCredits = 17;
    } else if (
      normalizedSize === "1080x1920" &&
      normalizedQuality === "ultra hd"
    ) {
      baseCredits = 20;
    }

    const details = brandDetails || {
      company_name: useCompanyName ? companyName.trim() : "",
      phone_number: useCompanyPhone ? companyPhone.trim() : "",
      website: useCompanyWebsite ? companyWebsite.trim() : "",
      address: useCompanyAddress ? companyAddress.trim() : "",
    };

    const extraCredits =
      (details.company_name?.trim() ? 1 : 0) +
      (details.phone_number?.trim() ? 1 : 0) +
      (details.website?.trim() ? 1 : 0) +
      (details.address?.trim() ? 1 : 0);

    return baseCredits + extraCredits;
  };

  const requiredCredits = getRequiredCredits(
    customOutputSize.trim() || outputSize,
    customQuality.trim() || quality,
    {
      company_name: useCompanyName ? companyName.trim() : "",
      phone_number: useCompanyPhone ? companyPhone.trim() : "",
      website: useCompanyWebsite ? companyWebsite.trim() : "",
      address: useCompanyAddress ? companyAddress.trim() : "",
    },
  );


  const totalCreditsNeeded = requiredCredits * Math.max(readyItems.length, 1);

  const toggleAccessory = (item: string) => {
    if (item === "None") {
      setAccessories(["None"]);
      return;
    }

    const clean = accessories.filter((x) => x !== "None");

    if (clean.includes(item)) {
      const updated = clean.filter((x) => x !== item);
      setAccessories(updated.length ? updated : ["None"]);
    } else {
      setAccessories([...clean, item]);
    }
  };

  const resolveAccessories = () => {
    const base = accessories.filter((a) => a !== "None");
    const extra = customAccessory
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    const merged = [...base, ...extra];
    return merged.length ? merged.join(", ") : "None";
  };

  const runOcrOnFile = async (file: File): Promise<string> => {
    try {
      const mod: any = await import("tesseract.js");
      const Tesseract = mod.default || mod;
      const { data } = await Tesseract.recognize(file, "eng");
      return extractDesignNumberFromText(data?.text || "");
    } catch (err) {
      console.warn("OCR failed:", err);
      return "";
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
    const filePath = `textile-designs/${Date.now()}-${newId().slice(0, 6)}-${safeFileName}`;

    const { error } = await supabase.storage
      .from("designs")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from("designs")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const uploadBrandLogo = async (file: File): Promise<string> => {
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
    const filePath = `brand-logos/${authUser?.id || "guest"}/${Date.now()}-${newId().slice(0, 6)}-${safeFileName}`;

    const { error } = await supabase.storage
      .from("designs")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from("designs")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  // ============================================================
  // LOGO OVERLAY (Canvas-based post-processing)
  // FAL/n8n output + company logo (+ AF logo for free accounts)
  // → composite → upload → public URL
  // Same system as jewellery page
  // ============================================================

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

  const compositeLogoOnImage = async (
    baseImageUrl: string,
    companyLogoUrl: string | null,
    showAfWatermark: boolean,
  ): Promise<Blob | null> => {
    try {
      const baseImg = await loadImageAsElement(baseImageUrl);

      // Load both logos in parallel; tolerate individual failures
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

      if (!companyLogoImg && !afLogoImg) return null;

      const canvas = document.createElement("canvas");
      canvas.width = baseImg.naturalWidth;
      canvas.height = baseImg.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // 1. Base output
      ctx.drawImage(baseImg, 0, 0);

      // 2. Company logo — top-right, 14% width
      if (companyLogoImg) {
        drawLogoInCorner(ctx, canvas.width, canvas.height, companyLogoImg, "top-right", 0.14, 1);
      }

      // 3. AF logo — bottom-right, 10% width, slightly translucent
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

  const uploadCompositeBlobToSupabase = async (
    blob: Blob,
    folder: string,
  ): Promise<string> => {
    const filePath = `${folder}/${authUser?.id || "guest"}/${Date.now()}-${newId().slice(0, 6)}-composite.png`;
    const file = new File([blob], "composite.png", { type: "image/png" });
    const { error } = await supabase.storage
      .from("designs")
      .upload(filePath, file, {
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

    const safeCompanyLogo =
      companyLogoUrl &&
      !companyLogoUrl.startsWith("data:") &&
      !companyLogoUrl.startsWith("blob:")
        ? companyLogoUrl
        : null;

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

      const compositeUrl = await uploadCompositeBlobToSupabase(
        compositeBlob,
        "textile-outputs",
      );

      // Persist composite URL in generations row
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
      console.error(
        "Logo overlay pipeline failed, falling back to raw output:",
        error,
      );
      return rawOutputUrl;
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a logo image only.");
      e.target.value = "";
      return;
    }

    setUploadingLogo(true);

    try {
      const logoUrl = await uploadBrandLogo(file);
      setCompanyLogoUrl(logoUrl);
      setUseCompanyLogo(true);
    } catch (err: any) {
      console.error("Logo upload error:", err);
      alert(err?.message || "Logo upload failed.");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    // Fresh upload → send the user back to Step 1 so they configure
    // category, model, shoot etc. for the NEW design from scratch.
    setBuilderStep(1);
    setTimeout(() => {
      stepTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    const planText = String(
      profile?.plan ||
        profile?.package ||
        profile?.current_plan ||
        profile?.subscription_plan ||
        profile?.plan_name ||
        "",
    ).toLowerCase();

    const canUseBulk =
      planText.includes("empire") ||
      planText.includes("founder") ||
      planText.includes("unlimited");

    if (files.length > 1 && !canUseBulk) {
      alert(
        "Bulk generation is available only with Empire, Founder Unlimited, or Unlimited plans. Please upload one design at a time or upgrade for bulk creation.",
      );

      e.target.value = "";
      return;
    }

    const invalidFile = files.find((file) => !file.type.startsWith("image/"));

    if (invalidFile) {
      alert("Please upload image files only.");
      e.target.value = "";
      return;
    }

    setUploading(true);

    for (const file of files) {
      const id = newId();
      const initial: GenItem = {
        id,
        fileName: file.name,
        url: "",
        designNumber: "",
        status: "uploading",
      };
      setItems((prev) => [...prev, initial]);
      setActiveId((curr) => curr || id);

      try {
        const url = await uploadFile(file);
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, url, status: "ocr" } : it)),
        );

        let detected = extractDesignNumberFromName(file.name);
        if (!detected) {
          detected = await runOcrOnFile(file);
        }

        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? { ...it, designNumber: detected, status: "ready" }
              : it,
          ),
        );

        if (detected) setShowTextBox(true);
      } catch (err: any) {
        console.error("Upload error:", err);
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? {
                  ...it,
                  status: "failed",
                  error: err?.message || "Upload failed",
                }
              : it,
          ),
        );
      }
    }

    setUploading(false);
    if (e.target) e.target.value = "";
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setActiveId((curr) => (curr === id ? null : curr));
  };

  const updateItemDesignNumber = (id: string, value: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, designNumber: value.toUpperCase() } : it,
      ),
    );
  };

  const pollGenerationResult = async (id: string) => {
    for (let attempt = 0; attempt < 36; attempt += 1) {
      if (cancelRef.current) return null;

      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Polling error:", error);
      }

      const row = data as any;
      const finalImage =
        row?.output_image_url || row?.output_url || row?.image_url;

      if (row?.status === "completed" && finalImage) {
        return finalImage as string;
      }

      if (row?.status === "failed") {
        throw new Error("Generation failed in n8n.");
      }

      await new Promise((resolve) => window.setTimeout(resolve, 5000));
    }

    throw new Error(
      "Generation is taking longer than expected. Please keep this page open and check n8n execution if needed.",
    );
  };

  const generateOne = async (item: GenItem, userId: string): Promise<void> => {
    const generationId = newId();
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id ? { ...it, status: "generating" } : it,
      ),
    );

    const resolvedModelType = customModelType.trim() || modelType;
    const resolvedProduct = customProduct.trim() || product;
    const resolvedShootStyle = customShootStyle.trim() || shootStyle;
    const resolvedOutputSize = customOutputSize.trim() || outputSize;
    const resolvedQuality = customQuality.trim() || quality;
    const resolvedPose = customPose.trim() || pose;
    const resolvedAccessories = resolveAccessories();
    const selectedBrandDetails = {
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
      },
    };
    const itemCredits = getRequiredCredits(
      resolvedOutputSize,
      resolvedQuality,
      selectedBrandDetails,
    );

    const resolvedFaceExpression = showFaceExpression
      ? customFaceExpression.trim() || faceExpression
      : "Not applicable";

    const payload = {
      generation_id: generationId,
      user_id: userId,
      design_url: item.url,
      brand_details: selectedBrandDetails,
      company_name: selectedBrandDetails.company_name,
      company_phone: selectedBrandDetails.phone_number,
      company_website: selectedBrandDetails.website,
      company_address: selectedBrandDetails.address,
      company_name_position: companyNamePosition,
      company_phone_position: companyPhonePosition,
      company_website_position: companyWebsitePosition,
      company_address_position: companyAddressPosition,
      textile_category: textileCategory,
      model_usage: modelUsage,
      model_type: resolvedModelType,
      product_type: resolvedProduct,
      shoot_style: resolvedShootStyle,
      accessories: resolvedAccessories,
      output_size: resolvedOutputSize,
      quality: resolvedQuality,
      required_credits: itemCredits,
      credits_required: itemCredits,
      face_expression: resolvedFaceExpression,
      model_expression: resolvedFaceExpression,
      model_pose: resolvedPose,
      custom_pose: resolvedPose,
      pose: resolvedPose,
      design_number: item.designNumber.trim(),
      text_on_image: item.designNumber.trim(),
      article_number: item.designNumber.trim(),
      watermark_position: watermarkPosition,
      article_position: watermarkPosition,
      watermark_color: "auto",
      article_color: "auto",
      custom_instruction: [
        customInstruction,
        `Category: ${textileCategory}`,
        `Model usage / interaction: ${modelUsage}`,
        showFaceExpression
          ? `Model face expression: ${resolvedFaceExpression}`
          : "No face expression needed because no human face/model is selected.",
        `Article number color must be auto-selected according to final creative contrast.`,
        selectedBrandDetails.company_name
          ? `Add company name "${selectedBrandDetails.company_name}" at ${companyNamePosition}.`
          : "",
        selectedBrandDetails.phone_number
          ? `Add phone number "${selectedBrandDetails.phone_number}" at ${companyPhonePosition}.`
          : "",
        selectedBrandDetails.website
          ? `Add website "${selectedBrandDetails.website}" at ${companyWebsitePosition}.`
          : "",
        selectedBrandDetails.address
          ? `Add address "${selectedBrandDetails.address}" at ${companyAddressPosition}.`
          : "",
      ]
        .filter(Boolean)
        .join(" | "),
    };

    // Funnel: per-item generation started. Bulk generates fire
    // one event per item; matches the per-item billing model.
    const generationStartedAt = Date.now();
    track({ name: "generation_started", agent: "textile", credits: itemCredits });

    // Insert + n8n forwarding both happen inside /api/textile/generate.
    // The browser no longer touches the n8n webhook URL directly,
    // which closes the public-internet exploit on n8n.
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      track({
        name: "generation_failed",
        agent: "textile",
        stage: "deduct",
        reason: "no_session",
      });
      throw new Error("Session expired. Please sign in again.");
    }

    const response = await fetch("/api/textile/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        generation_id: generationId,
        // user_id deliberately omitted — server stamps it from JWT.
        design_url: item.url,

        textile_category: textileCategory,
        model_usage: modelUsage,
        model_type: resolvedModelType,
        product_type: resolvedProduct,
        shoot_style: resolvedShootStyle,
        accessories: resolvedAccessories,
        output_size: resolvedOutputSize,
        quality: resolvedQuality,
        required_credits: itemCredits,
        credits_required: itemCredits,

        face_expression: resolvedFaceExpression,
        model_expression: resolvedFaceExpression,
        model_pose: resolvedPose,
        custom_pose: resolvedPose,
        pose: resolvedPose,

        design_number: item.designNumber.trim(),
        text_on_image: item.designNumber.trim(),
        article_number: item.designNumber.trim(),

        watermark_position: watermarkPosition,
        article_position: watermarkPosition,
        watermark_color: "auto",
        article_color: "auto",

        company_name: selectedBrandDetails.company_name,
        company_phone: selectedBrandDetails.phone_number,
        company_website: selectedBrandDetails.website,
        company_address: selectedBrandDetails.address,

        company_name_position: companyNamePosition,
        company_phone_position: companyPhonePosition,
        company_website_position: companyWebsitePosition,
        company_address_position: companyAddressPosition,

        brand_details: selectedBrandDetails,
        custom_instruction: payload.custom_instruction,
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      track({
        name: "generation_failed",
        agent: "textile",
        stage: "n8n",
        reason: `status_${response.status}`,
      });
      throw new Error(`Server error ${response.status}: ${text}`);
    }

    const data = text ? JSON.parse(text) : {};
    // n8n's reply is nested inside webhook_response now that the
    // request flows through our adapter route; fall back to top-
    // level keys so this stays compatible if the server ever
    // unwraps the payload.
    const inner = data?.webhook_response ?? data;
    const immediateImage =
      inner?.image_url ||
      inner?.output_image_url ||
      inner?.image ||
      inner?.url;
    const rawFinalImage =
      immediateImage || (await pollGenerationResult(generationId));

    if (!rawFinalImage && cancelRef.current) return;

    // Determine free account (no Empire / Founder / Unlimited plan)
    const planText = String(
      profile?.plan ||
        profile?.package ||
        profile?.current_plan ||
        profile?.subscription_plan ||
        profile?.plan_name ||
        "",
    ).toLowerCase();
    const isPaidAccount =
      planText.includes("empire") ||
      planText.includes("founder") ||
      planText.includes("unlimited") ||
      planText.includes("pro") ||
      planText.includes("growth") ||
      planText.includes("creator");
    const isFreeAccount = !isPaidAccount;

    // Apply Canvas-based logo overlay — company logo (top-right) + AF logo (bottom-right for free accounts)
    const finalImage = rawFinalImage
      ? await applyLogoOverlay(rawFinalImage, {
          companyLogoUrl: useCompanyLogo ? companyLogoUrl : undefined,
          afWatermark: isFreeAccount,
          generationId,
        })
      : rawFinalImage;

    track({
      name: "generation_completed",
      agent: "textile",
      generation_id: generationId,
      duration_ms: Date.now() - generationStartedAt,
    });

    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id
          ? { ...it, resultUrl: finalImage || "", status: "done" }
          : it,
      ),
    );
    setActiveId(item.id);

    // Show rating/feedback modal after generation completes
    setRatingGenerationId(generationId);
    setShowRatingModal(true);
  };

  const hasSavedPhoneNumber = (profileData: any) => {
    const phoneText = String(
      profileData?.phone ||
        profileData?.mobile ||
        profileData?.phone_number ||
        profileData?.whatsapp ||
        "",
    ).trim();

    return phoneText.length >= 10;
  };

  const savePhoneNumber = async () => {
    const cleanPhone = phoneInput.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      alert("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    const userId = authUser?.id;

    if (!userId) {
      alert("Please login first.");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ phone: cleanPhone })
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      console.error("Phone save error:", error);
      alert("Phone number save failed. Please try again.");
      return;
    }

    setProfile(data);
    refreshProfile?.();
    setShowPhonePopup(false);
    setPhoneInput("");

    setTimeout(() => {
      handleGenerate();
    }, 100);
  };

  const handleGenerate = async () => {
    const queue = items.filter((it) => it.status === "ready");

    if (!queue.length) {
      alert("Please upload your textile design before starting generation.");
      setBuilderStep(1);

      setTimeout(() => {
        stepTopRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);

      return;
    }

    const userId = authUser?.id;

    if (!userId) {
      setShowSignupPopup(true);
      return;
    }

    if (!hasSavedPhoneNumber(profile)) {
      setShowPhonePopup(true);
      return;
    }

    setLoading(true);
    cancelRef.current = false;

    try {
      const { data: latestProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError || !latestProfile) {
        alert("Unable to verify your profile. Please refresh and try again.");
        setLoading(false);
        return;
      }

      setProfile(latestProfile);

      if (!hasSavedPhoneNumber(latestProfile)) {
        setShowPhonePopup(true);
        setLoading(false);
        return;
      }

      const needed = requiredCredits * queue.length;

      if (!canGenerate(latestProfile, needed)) {
        track({
          name: "insufficient_credits",
          agent: "textile",
          required: needed,
        });
        alert(
          `You don't have enough credits (${needed} required for ${queue.length} mockup${queue.length > 1 ? "s" : ""}). Please recharge to continue.`,
        );
        setLoading(false);
        return;
      }

      // ❌ REMOVE KIYA — ab n8n deduct karega via RPC (double deduction avoid)
      // if (shouldDeductCredits(latestProfile)) {
      //   const { error: deductError } = await supabase
      //     .from("profiles")
      //     .update({
      //       credits: (latestProfile.credits || 0) - needed,
      //     })
      //     .eq("id", userId);
      //   if (!deductError) {
      //     refreshProfile?.();
      //   }
      // }

      for (const item of queue) {
        if (cancelRef.current) break;

        try {
          await generateOne(item, userId);
        } catch (err: any) {
          console.error("Generate error for", item.id, err);
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    status: "failed",
                    error: err?.message || "Generation failed",
                  }
                : it,
            ),
          );
        }
      }
    } catch (error: any) {
      console.error("Webhook error:", error);
      alert(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
      refreshProfile?.(); // ✅ generation ke baad UI credits refresh karo
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfile(false);
  };

  const handleNativeShare = async () => {
    if (!previewResult) return;

    if (navigator.share) {
      await navigator.share({
        title: "TextilePrints to Mockup AI",
        text: "Generated with AgentForge",
        url: previewResult,
      });
    } else {
      await navigator.clipboard.writeText(previewResult);
      alert("Image link copied.");
    }
  };

  const whatsappLink = previewResult
    ? `https://wa.me/?text=${encodeURIComponent(`Generated with AgentForge\n${previewResult}`)}`
    : "#";

  const requestDownload = () => {
    if (!reviewedResult) { setDownloadAfterReview(true); setShowRatingModal(true); return; }
    handleDownloadResult();
  };

  const handleDownloadResult = async () => {
    if (!previewResult) return;

    try {
      const response = await fetch(previewResult);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `agentforge-mockup-${activeItem?.id || Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      window.open(previewResult, "_blank", "noopener,noreferrer");
    }
  };

  const pageBg = darkMode
    ? "bg-[#070b14] text-white"
    : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.07] shadow-black/40"
    : "border-black/10 bg-white/75 shadow-black/10";
  const muted = darkMode ? "text-white/55" : "text-black/55";
  const inputClass = darkMode
    ? "border-white/10 bg-black/30 text-white placeholder:text-white/35"
    : "border-black/10 bg-white text-black placeholder:text-black/40";

  const statusLabel: Record<GenStatus, string> = {
    uploading: "Uploading...",
    ocr: "Reading code...",
    ready: "Ready",
    generating: "Generating...",
    done: "Done",
    failed: "Failed",
  };

  const statusColor: Record<GenStatus, string> = {
    uploading: "bg-amber-500/15 text-amber-700",
    ocr: "bg-amber-500/15 text-amber-700",
    ready: "bg-emerald-500/15 text-emerald-700",
    generating: "bg-blue-500/15 text-blue-700",
    done: "bg-emerald-500/20 text-emerald-800",
    failed: "bg-rose-500/15 text-rose-700",
  };

  const renderCustomInput = (
    placeholder: string,
    value: string,
    onChange: (v: string) => void,
  ) => (
    <div className="mt-3">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-400 ${inputClass}`}
      />
    </div>
  );

  return (
    <main
      className={`relative min-h-screen overflow-x-hidden pb-28 sm:pb-0 ${pageBg}`}
    >
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

      {/* Floating Doodles — textile themed */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Top band */}
        <div className="float-slow absolute left-[6%] top-[6%] text-4xl opacity-65 sm:text-5xl">👕</div>
        <div className="float-medium absolute right-[8%] top-[10%] text-4xl opacity-65 sm:text-5xl">🥻</div>
        <div className="float-fast absolute left-[22%] top-[14%] text-2xl opacity-55 sm:text-3xl">✨</div>
        <div className="float-medium absolute right-[24%] top-[6%] text-3xl opacity-60 sm:text-4xl">🧵</div>
        <div className="float-slow absolute left-[42%] top-[3%] text-2xl opacity-50 sm:text-3xl">⭐</div>
        <div className="float-fast absolute right-[42%] top-[18%] text-3xl opacity-60 sm:text-4xl">👗</div>

        {/* Side accents */}
        <div className="float-medium absolute left-[3%] top-[28%] text-3xl opacity-55 sm:text-4xl">🧥</div>
        <div className="float-slow absolute right-[4%] top-[32%] text-3xl opacity-55 sm:text-4xl">🪡</div>
        <div className="float-fast absolute left-[8%] top-[44%] text-3xl opacity-55 sm:text-4xl">⚡</div>
        <div className="float-medium absolute right-[6%] top-[46%] text-3xl opacity-55 sm:text-4xl">👚</div>

        {/* Middle band */}
        <div className="float-slow absolute left-[35%] top-[52%] text-2xl opacity-50 sm:text-3xl">🎨</div>
        <div className="float-medium absolute right-[30%] top-[58%] text-2xl opacity-55 sm:text-3xl">👔</div>
        <div className="float-fast absolute left-[14%] top-[62%] text-3xl opacity-55 sm:text-4xl">🧣</div>
        <div className="float-slow absolute right-[14%] top-[66%] text-3xl opacity-55 sm:text-4xl">🛍️</div>

        {/* Lower band */}
        <div className="float-fast absolute left-[20%] top-[78%] text-2xl opacity-55 sm:text-3xl">✦</div>
        <div className="float-medium absolute right-[18%] top-[82%] text-3xl opacity-60 sm:text-4xl">🌟</div>
        <div className="float-slow absolute left-[48%] top-[88%] text-2xl opacity-50 sm:text-3xl">💫</div>
      </div>

      <div className="relative z-10">
        {showPhonePopup && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-md">
            <div
              className={`w-full max-w-md rounded-[2rem] border p-6 shadow-2xl ${
                darkMode
                  ? "border-cyan-400/30 bg-[#07111f] text-white"
                  : "border-cyan-300/40 bg-white text-[#111827]"
              }`}
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl font-black text-white">
                AF
              </div>

              <h2 className="text-2xl font-black">Add your phone number</h2>

              <p
                className={`mt-2 text-sm ${darkMode ? "text-white/60" : "text-black/60"}`}
              >
                Please add your WhatsApp/mobile number before creating AI
                mockups.
              </p>

              <input
                value={phoneInput}
                onChange={(e) =>
                  setPhoneInput(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="Enter 10-digit mobile number"
                inputMode="numeric"
                maxLength={10}
                className={`mt-5 w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-cyan-400 ${
                  darkMode
                    ? "border-white/10 bg-white/5 text-white placeholder:text-white/35"
                    : "border-black/10 bg-white text-black placeholder:text-black/35"
                }`}
              />

              <button
                type="button"
                onClick={savePhoneNumber}
                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-cyan-500/20"
              >
                Save & Continue
              </button>
            </div>
          </div>
        )}

        <section className="mx-auto grid w-full max-w-7xl items-start gap-5 px-3 py-5 sm:px-4 lg:grid-cols-[0.9fr_1.1fr] lg:py-8">
          <div>
            <div
              className={`mb-5 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${darkMode ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-200" : "border border-cyan-700/20 bg-cyan-500/15 text-cyan-900"}`}
            >
              Textile design to premium model mockup
            </div>

            <h1 className="max-w-xl text-3xl font-black leading-[1.02] tracking-[-0.04em] lg:text-5xl">
              AI Textile Mockup Generator
              <span className="block bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Upload. Generate. Done.
              </span>
              Sell Faster.
            </h1>

            <p
              className={`mt-4 max-w-lg text-sm leading-6 lg:text-base ${muted}`}
            >
              Generate catalogue-ready textile mockups, AI fashion model photos,
              kurti mockups, saree mockups, shirt mockups, and client preview
              images without stitching samples or expensive photoshoots.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#try"
                className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-black text-black shadow-xl shadow-cyan-500/25 transition hover:scale-105"
              >
                Start Generating
              </a>
              <Link
                href="/gallery"
                className={`rounded-full px-6 py-3 text-sm font-black ${darkMode ? "bg-white/10 text-white" : "bg-white text-black"}`}
              >
                View Gallery
              </Link>
            </div>

            {/* SEO category chips */}
            <div className="mt-6">
              <p className={`mb-3 text-[11px] font-black uppercase tracking-[0.18em] ${darkMode ? "text-white/40" : "text-black/40"}`}>
                Popular categories
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Men's Shirt Mockup", emoji: "👔" },
                  { label: "Kurta Mockup", emoji: "🧥" },
                  { label: "Saree Mockup", emoji: "🥻" },
                  { label: "Kurti Mockup", emoji: "👘" },
                  { label: "Cushion Cover", emoji: "🛋️" },
                  { label: "Curtain Mockup", emoji: "🪟" },
                  { label: "Bedsheet Mockup", emoji: "🛏️" },
                  { label: "Lehenga Mockup", emoji: "👗" },
                  { label: "T-Shirt Mockup", emoji: "👕" },
                ].map((cat) => (
                  <a
                    key={cat.label}
                    href="#try"
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:scale-105 hover:border-cyan-400/60 hover:text-cyan-600 ${
                      darkMode
                        ? "border-white/10 bg-white/[0.05] text-white/60"
                        : "border-black/10 bg-white/70 text-black/60"
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    {cat.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div
            className={`flex h-fit flex-col rounded-[1.5rem] border p-3 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-4 ${card}`}
          >
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`flex w-full min-h-[170px] items-center justify-center rounded-[1.25rem] border p-3 sm:min-h-[210px] sm:rounded-[1.5rem] sm:p-4 ${
                  darkMode
                    ? "border-white/10 bg-black/25"
                    : "border-black/10 bg-[#fffaf0]"
                }`}
              >
                <div className="text-center">
                  {previewImage?.startsWith("blob:") ||
                  previewImage?.startsWith("http") ? (
                    <img
                      src={previewImage}
                      alt="Uploaded textile pattern preview"
                      className="mx-auto mb-3 h-28 w-28 rounded-2xl object-cover shadow-lg sm:h-36 sm:w-36 sm:rounded-3xl"
                    />
                  ) : (
                    <img
                      src="/banner-design.png"
                      alt="Textile design pattern upload preview for AI mockup generation"
                      className="mx-auto mb-3 h-28 w-28 rounded-2xl object-cover shadow-lg sm:h-36 sm:w-36 sm:rounded-3xl"
                    />
                  )}

                  </div>
              </div>

              <div className="flex w-full min-h-[170px] items-center justify-center rounded-[1.25rem] border border-cyan-300/30 bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-purple-500/20 p-3 sm:min-h-[210px] sm:rounded-[1.5rem] sm:p-4">
                <div className="text-center">
                  {previewResult && previewResult.startsWith("http") ? (
                    <img
                      src={previewResult}
                      alt="Generated model mockup preview"
                      className="mx-auto mb-3 h-32 w-28 rounded-2xl object-cover shadow-lg shadow-cyan-400/30 sm:h-44 sm:w-36 sm:rounded-3xl"
                    />
                  ) : (
                    <img
                      src="/banner-design-output.png"
                      alt="AI generated textile fashion model mockup preview"
                      className="mx-auto mb-3 h-32 w-28 rounded-2xl object-cover shadow-lg shadow-cyan-400/30 sm:h-44 sm:w-36 sm:rounded-3xl"
                    />
                  )}

                  <p className="font-semibold">Model Mockup</p>

                  <p className={`mt-1 text-sm ${muted}`}>
                    {previewResult
                      ? "Latest AI fashion output"
                      : "AI fashion output"}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`mt-4 flex items-center justify-center overflow-hidden rounded-[1.5rem] border ${
                darkMode
                  ? "border-white/10 bg-black/25"
                  : "border-black/10 bg-white/80"
              }`}
            >
              <img
                src="/gallery/textile/banner.png"
                alt="AgentForge textile gallery"
                onError={(event) => {
                  event.currentTarget.src = "/banner.png";
                }}
                className="h-auto max-h-[260px] w-full object-contain"
              />
            </div>
          </div>
        </section>

        <section id="try" className="mx-auto max-w-7xl px-3 py-5 sm:px-5 sm:py-8">
          <div
            className={`rounded-[1.25rem] border p-3 shadow-2xl backdrop-blur-xl sm:rounded-[1.75rem] sm:p-4 lg:p-6 ${card}`}
          >
            <div className="mb-5 sm:mb-6">
              <h2 className="text-2xl font-black sm:text-3xl">Create Your AI Textile Mockup</h2>
              <p className={`mt-2 text-sm sm:text-base ${muted}`}>
                Upload one textile design on normal packs. Bulk creation is
                unlocked for Empire Pack users only.
              </p>
              <div
                className={`mt-4 inline-flex rounded-full px-4 py-2 text-xs font-black ${
                  isEmpireUser
                    ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-600"
                    : "border border-amber-400/30 bg-amber-400/10 text-amber-600"
                }`}
              >
                {isEmpireUser
                  ? "Empire Pack Active — Bulk Unlocked"
                  : "Bulk Locked — Upgrade to Empire Pack"}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
              <div className="lg:sticky lg:top-24">
                <label
                  className={`relative flex min-h-[190px] cursor-pointer overflow-hidden rounded-[1.5rem] border-2 border-dashed transition-all ${
                    items[0]?.url
                      ? darkMode ? "border-cyan-400/40" : "border-cyan-300/60"
                      : darkMode ? "items-center justify-center bg-black/20 p-5 text-center border-white/15" : "items-center justify-center bg-[#fffaf0] p-5 text-center border-black/15"
                  }`}
                >
                  {items[0]?.url ? (
                    <>
                      <img
                        src={items[0].url}
                        alt="Uploaded textile design preview"
                        className="min-h-[190px] w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent p-3">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-black/70">Tap to change</span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-400 text-white shadow-lg shadow-cyan-400/25">
                        <UploadCloud className="h-8 w-8" />
                      </div>
                      <p className="text-lg font-semibold">
                        {isEmpireUser ? "Upload Textile Design(s)" : "Upload Textile Design"}
                      </p>
                      <p className={`mt-2 text-sm ${muted}`}>
                        {isEmpireUser
                          ? "Select one or multiple files — PNG, JPG, JPEG, WEBP"
                          : "Normal packs support one design at a time — upgrade to Empire Pack for bulk creation"}
                      </p>
                      <p className="mt-2 text-xs font-bold text-cyan-600">
                        Design code on the image is auto-detected via OCR
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple={isEmpireUser}
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>

                {activeItem && (
                  <div
                    className={`mt-4 rounded-2xl border p-4 ${
                      darkMode
                        ? "border-white/10 bg-white/[0.04]"
                        : "border-black/10 bg-white/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-cyan-600">
                          Article Number
                        </p>
                        <p className={`mt-1 text-xs ${muted}`}>
                          Auto-filled from uploaded image name/OCR. User can
                          edit or clear/delete before generation.
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black ${
                          darkMode
                            ? "bg-white/10 text-white/70"
                            : "bg-cyan-50 text-cyan-800"
                        }`}
                      >
                        Auto
                      </span>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <input
                        value={activeItem.designNumber}
                        onChange={(e) =>
                          updateItemDesignNumber(activeItem.id, e.target.value)
                        }
                        placeholder="Example: ART-1023"
                        className={`min-w-0 flex-1 rounded-2xl border px-4 py-3 text-sm font-black outline-none transition focus:border-cyan-400 ${inputClass}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateItemDesignNumber(activeItem.id, "")
                        }
                        className={`rounded-2xl border px-4 text-xs font-black transition ${
                          darkMode
                            ? "border-white/10 bg-white/[0.04] text-white/70 hover:border-rose-400 hover:text-rose-300"
                            : "border-black/10 bg-white text-black/60 hover:border-rose-300 hover:text-rose-500"
                        }`}
                      >
                        Clear
                      </button>
                    </div>

                    {previewImage && (
                      <div
                        className={`relative mt-4 overflow-hidden rounded-2xl border ${
                          darkMode
                            ? "border-white/10 bg-black/20"
                            : "border-black/10 bg-white"
                        }`}
                      >
                        <img
                          src={previewImage}
                          alt="Article number position preview"
                          className="h-32 w-full object-cover"
                        />
                        {activeItem.designNumber && (
                          <span
                            className={`absolute rounded-xl bg-black/65 px-3 py-1 text-xs font-black text-white backdrop-blur ${
                              watermarkPosition === "top-left"
                                ? "left-3 top-3"
                                : watermarkPosition === "top-right"
                                  ? "right-3 top-3"
                                  : watermarkPosition === "bottom-left"
                                    ? "bottom-3 left-3"
                                    : "bottom-3 right-3"
                            }`}
                          >
                            {activeItem.designNumber}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {uploading && (
                  <div className="mt-4 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 p-4 text-sm font-semibold text-cyan-700">
                    Uploading & reading codes from your designs...
                  </div>
                )}

                {items.length > 1 && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-widest text-cyan-600">
                        Queue ({items.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => setItems([])}
                        className={`text-xs font-bold ${muted} hover:text-rose-500`}
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1">
                      {items.map((it) => (
                        <div
                          key={it.id}
                          onClick={() => setActiveId(it.id)}
                          className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-2 transition ${
                            activeId === it.id
                              ? "border-cyan-400 bg-cyan-400/10"
                              : darkMode
                                ? "border-white/10 bg-white/[0.04]"
                                : "border-black/10 bg-white/80"
                          }`}
                        >
                          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-black/10">
                            {it.url ? (
                              <img
                                src={it.url}
                                alt={`AI textile mockup result for ${it.fileName}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-black/40">
                                ...
                              </div>
                            )}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-xs font-bold">
                              {it.fileName}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${statusColor[it.status]}`}
                              >
                                {statusLabel[it.status]}
                              </span>
                              <input
                                value={it.designNumber}
                                onChange={(e) =>
                                  updateItemDesignNumber(it.id, e.target.value)
                                }
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Code"
                                className={`min-w-0 flex-1 rounded-md border px-2 py-0.5 text-[11px] font-black outline-none ${inputClass}`}
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(it.id);
                            }}
                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-base font-black text-rose-500 hover:bg-rose-500/10 sm:text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 grid gap-4">
                  <div
                    className={`rounded-2xl border p-4 ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-black/10 bg-white/80"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setShowTextBox(!showTextBox)}
                      className="flex w-full items-center justify-between gap-3 text-left font-black"
                    >
                      <span>🔢 Article Position</span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${darkMode ? "bg-white/10" : "bg-cyan-50 text-cyan-800"}`}
                      >
                        {showTextBox ? "Hide" : "Open"}
                      </span>
                    </button>

                    <p className={`mt-3 text-xs ${muted}`}>
                      Article number is auto-filled below upload. Color will be
                      selected automatically by AI according to the final
                      creative background.
                    </p>

                    {showTextBox && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-cyan-600">
                            Position on Output
                          </p>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {articlePositions.map(([val, label]) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setWatermarkPosition(val)}
                                className={`rounded-xl border py-3 text-xs font-black transition sm:py-2 ${
                                  watermarkPosition === val
                                    ? "border-cyan-400 bg-cyan-400/20 text-cyan-700"
                                    : darkMode
                                      ? "border-white/10 bg-white/[0.04]"
                                      : "border-black/10 bg-white"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div
                          className={`rounded-2xl border p-3 text-xs font-semibold ${darkMode ? "border-white/10 bg-black/20 text-white/55" : "border-black/10 bg-cyan-50 text-black/60"}`}
                        >
                          Auto color enabled: AI will pick white/black or
                          contrast color according to background.
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    className={`rounded-2xl border p-4 ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-black/10 bg-white/80"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setShowPromptBox(!showPromptBox)}
                      className="flex w-full items-center justify-between gap-3 text-left font-black"
                    >
                      <span>📝 Custom Instruction (Optional)</span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${darkMode ? "bg-white/10" : "bg-cyan-50 text-cyan-800"}`}
                      >
                        {showPromptBox ? "Hide" : "Open"}
                      </span>
                    </button>

                    {showPromptBox && (
                      <textarea
                        value={customInstruction}
                        onChange={(e) => setCustomInstruction(e.target.value)}
                        placeholder="Add specific instructions like 'Smiling model', 'Darker background', etc."
                        className={`mt-4 w-full rounded-xl border px-4 py-3 outline-none transition focus:border-cyan-400 ${inputClass}`}
                        rows={3}
                      />
                    )}
                  </div>

                  {/* Company / Brand details card */}
                  <div
                    className={`mt-4 rounded-[1.35rem] border p-4 ${
                      darkMode ? "border-white/10 bg-white/[0.045]" : "border-black/10 bg-white/80"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-widest text-cyan-600">
                        Company / Branding
                      </p>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black disabled:opacity-60 ${darkMode ? "bg-white/10 text-cyan-200" : "bg-cyan-50 text-cyan-700"}`}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {uploadingLogo ? "Uploading…" : "Upload Logo"}
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
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl ${darkMode ? "bg-white/10 text-cyan-200" : "bg-cyan-50 text-cyan-700"}`}>
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
                          onClick={() => {
                            setCompanyLogoUrl("");
                            setUseCompanyLogo(false);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-500/10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <label className={`mb-3 flex items-center gap-2 text-xs font-bold ${muted}`}>
                      <input
                        type="checkbox"
                        checked={useCompanyLogo}
                        disabled={!companyLogoUrl}
                        onChange={(e) => setUseCompanyLogo(e.target.checked)}
                      />
                      Use logo on output
                    </label>

                    {/* Merged: each field has its input + inline "Show" checkbox + position select */}
                    <div className="space-y-4">
                      {[
                        {
                          label: "Company",
                          placeholder: "Company name",
                          value: companyName,
                          onChange: setCompanyName,
                          checked: useCompanyName,
                          setChecked: setUseCompanyName,
                          position: companyNamePosition,
                          setPosition: setCompanyNamePosition,
                          inputMode: undefined as "tel" | undefined,
                          multiline: false,
                        },
                        {
                          label: "Phone",
                          placeholder: "Phone / WhatsApp number",
                          value: companyPhone,
                          onChange: setCompanyPhone,
                          checked: useCompanyPhone,
                          setChecked: setUseCompanyPhone,
                          position: companyPhonePosition,
                          setPosition: setCompanyPhonePosition,
                          inputMode: "tel" as const,
                          multiline: false,
                        },
                        {
                          label: "Website",
                          placeholder: "Website",
                          value: companyWebsite,
                          onChange: setCompanyWebsite,
                          checked: useCompanyWebsite,
                          setChecked: setUseCompanyWebsite,
                          position: companyWebsitePosition,
                          setPosition: setCompanyWebsitePosition,
                          inputMode: undefined as "tel" | undefined,
                          multiline: false,
                        },
                        {
                          label: "Address",
                          placeholder: "Address",
                          value: companyAddress,
                          onChange: setCompanyAddress,
                          checked: useCompanyAddress,
                          setChecked: setUseCompanyAddress,
                          position: companyAddressPosition,
                          setPosition: setCompanyAddressPosition,
                          inputMode: undefined as "tel" | undefined,
                          multiline: true,
                        },
                      ].map((field) => {
                        const enabled = Boolean(String(field.value).trim());
                        return (
                          <div
                            key={field.label}
                            className={`rounded-2xl border p-3 ${
                              darkMode ? "border-white/10 bg-white/[0.035]" : "border-black/10 bg-white/70"
                            }`}
                          >
                            {field.multiline ? (
                              <textarea
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                placeholder={field.placeholder}
                                rows={2}
                                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 ${inputClass}`}
                              />
                            ) : (
                              <input
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                placeholder={field.placeholder}
                                inputMode={field.inputMode}
                                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 ${inputClass}`}
                              />
                            )}

                            {/* Inline: Show <label> checkbox + position select */}
                            <div className="mt-2.5 flex items-center justify-between gap-3">
                              <label className="flex items-center gap-2 text-xs font-black">
                                <input
                                  type="checkbox"
                                  checked={field.checked}
                                  disabled={!enabled}
                                  onChange={(e) => field.setChecked(e.target.checked)}
                                  className="h-4 w-4 accent-cyan-500"
                                />
                                <span className={!enabled ? muted : undefined}>Show {field.label}</span>
                              </label>

                              <select
                                value={field.position}
                                disabled={!field.checked || !enabled}
                                onChange={(e) => field.setPosition(e.target.value)}
                                aria-label={`${field.label} position`}
                                className={`max-w-[150px] rounded-xl border px-2 py-1.5 text-[11px] font-bold outline-none ${
                                  darkMode
                                    ? "border-white/10 bg-black/30 text-white disabled:text-white/30"
                                    : "border-black/10 bg-white text-black disabled:text-black/30"
                                }`}
                              >
                                {brandPositions.map(([value, title]) => (
                                  <option key={value} value={value}>
                                    {title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0 space-y-6">
                <div
                  className={`rounded-[1.5rem] p-3 sm:rounded-[2rem] sm:p-5 ${darkMode ? "bg-white/[0.035]" : "bg-white/70"}`}
                >
                  <div ref={stepTopRef} className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-3 lg:grid-cols-4">
  {[
    { step: "STEP 1", title: "Product", desc: "Category + product" },
    { step: "STEP 2", title: "Model", desc: "Usage + look" },
    { step: "STEP 3", title: "Shoot", desc: "Pose + style" },
    { step: "STEP 4", title: "Final", desc: "Extras + generate" },
  ].map((item, index) => (
    <div
  key={item.step}
  onClick={() => {
    setBuilderStep(index + 1);

    setTimeout(() => {
      stepTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }}
  className={`relative cursor-pointer overflow-hidden rounded-3xl border p-4 shadow-sm transition-all duration-300 active:scale-[0.98] ${
    builderStep === index + 1
      ? "border-cyan-300 bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-cyan-200/60"
      : "border-cyan-100 bg-white/80 text-slate-900 hover:border-cyan-200"
  }`}
>
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-cyan-200/30 blur-2xl" />

      <div className="relative z-10 flex items-start justify-between gap-2">
        <div>
          <p className={`text-[10px] font-black tracking-[0.22em] ${
           builderStep === index + 1 ? "text-white/80" : "text-cyan-600"
          }`}>
            {item.step}
          </p>

          <h3 className="mt-1 text-lg font-black leading-none">
            {item.title}
          </h3>

          <p className={`mt-1 text-[11px] font-semibold ${
            builderStep === index + 1 ? "text-white/80" : "text-slate-500"
          }`}>
            {item.desc}
          </p>
        </div>

        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
          builderStep === index + 1
            ? "bg-white text-cyan-600"
            : "bg-cyan-400 text-white"
        }`}>
          ✓
        </div>
      </div>

      {index !== 3 && (
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-cyan-300 to-blue-400" />
      )}
    </div>
  ))}
</div>
                </div>

                {builderStep === 1 && (
                  <div className="space-y-6">
                    <section>
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-black uppercase tracking-widest text-cyan-600 sm:text-lg">
                            1. Select Category
                          </h4>
                          <p className={`mt-1 text-xs ${muted}`}>
                            Pick the category first. Product options will
                            update automatically.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                        {textileCategories.map((item) => (
                          <OptionCard
                            key={item.title}
                            title={item.title}
                            icon={item.icon}
                            active={textileCategory === item.title}
                            onClick={() => {
                              setTextileCategory(item.title);
                              const firstProduct =
                                productOptionsByCategory[item.title]?.[0] ||
                                "Men's Shirt";
                              setProduct(firstProduct);
                              setCustomProduct("");
                              setModelUsage(
                                item.title === "Home Textile" ||
                                  item.title === "Decor & Accessories" ||
                                  item.title === "Universal Fabric"
                                  ? "No Model"
                                  : "Single Model",
                              );
                              setPose(
                                item.title === "Home Textile" ||
                                  item.title === "Decor & Accessories" ||
                                  item.title === "Universal Fabric"
                                  ? "Lifestyle Room View"
                                  : "Front Face",
                              );
                              setCustomPose("");
                              setFaceExpression("Happy");
                              setCustomFaceExpression("");
                            }}
                            darkMode={darkMode}
                          />
                        ))}
                      </div>
                    </section>

                    <section>
                      <h4 className="mb-4 text-base font-black uppercase tracking-widest text-cyan-600 sm:text-lg">
                        2. Select Product Type
                      </h4>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                        {dynamicProducts.map((item) => (
                          <OptionCard
                            key={item}
                            title={item}
                            active={!customProduct.trim() && product === item}
                            onClick={() => {
                              setProduct(item);
                              setCustomProduct("");
                            }}
                            darkMode={darkMode}
                          />
                        ))}
                      </div>

                      {renderCustomInput(
                        "Or type your own — e.g. 'Men\\'s Blazer', 'Jacquard Curtain', 'Hotel Bedsheet'",
                        customProduct,
                        setCustomProduct,
                      )}
                    </section>
                  </div>
                )}

                {builderStep === 2 && (
                  <div className="space-y-6">
                    <section>
                      <h4 className="mb-4 text-base font-black uppercase tracking-widest text-cyan-600 sm:text-lg">
                        3. Model / Scene Usage
                      </h4>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                        {dynamicModelUsageOptions.map((item) => (
                          <OptionCard
                            key={item}
                            title={item}
                            active={modelUsage === item}
                            onClick={() => {
                              setModelUsage(item);
                              if (/no model|flat lay|mannequin/i.test(item)) {
                                setCustomFaceExpression("");
                              }
                            }}
                            darkMode={darkMode}
                          />
                        ))}
                      </div>
                    </section>

                    <section>
                      <h4 className="mb-4 text-base font-black uppercase tracking-widest text-cyan-600 sm:text-lg">
                        4. Model Look
                      </h4>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                        {modelLookOptions.map((item) => (
                          <OptionCard
                            key={item}
                            title={item}
                            active={
                              !customModelType.trim() && modelType === item
                            }
                            onClick={() => {
                              setModelType(item);
                              setCustomModelType("");
                            }}
                            darkMode={darkMode}
                          />
                        ))}
                      </div>

                      {renderCustomInput(
                        "Or type your own — e.g. 'Punjabi Male', 'Premium Indian Couple', 'Asian Female'",
                        customModelType,
                        setCustomModelType,
                      )}
                    </section>
                  </div>
                )}

                {builderStep === 3 && (
                  <div className="space-y-6">
                    <section>
                      <p className="mb-4 text-base font-black uppercase tracking-widest text-cyan-600 sm:text-lg">
                        5. {isHomeLikeCategory ? "Scene / View" : "Pose"}
                      </p>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                        {dynamicPoseOptions.map((item) => (
                          <OptionCard
                            key={item}
                            title={item}
                            active={!customPose.trim() && pose === item}
                            onClick={() => {
                              setPose(item);
                              setCustomPose("");
                            }}
                            darkMode={darkMode}
                          />
                        ))}
                      </div>

                      {renderCustomInput(
                        isHomeLikeCategory
                          ? "Or type your own scene — e.g. 'model pointing at curtain near window'"
                          : "Or type your own pose — e.g. 'hands on hips', 'walking', 'sitting'",
                        customPose,
                        setCustomPose,
                      )}
                    </section>

                    {showFaceExpression && (
                      <section>
                        <h4 className="mb-4 text-base font-black uppercase tracking-widest text-cyan-600 sm:text-lg">
                          6. Face Expression
                        </h4>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                          {faceExpressionOptions.map((item) => (
                            <OptionCard
                              key={item}
                              title={item}
                              active={
                                !customFaceExpression.trim() &&
                                faceExpression === item
                              }
                              onClick={() => {
                                setFaceExpression(item);
                                setCustomFaceExpression("");
                              }}
                              darkMode={darkMode}
                            />
                          ))}
                        </div>

                        {renderCustomInput(
                          "Or type expression — e.g. 'premium confident smile', 'calm luxury look'",
                          customFaceExpression,
                          setCustomFaceExpression,
                        )}
                      </section>
                    )}

                    <section>
                      <h4 className="mb-4 text-base font-black uppercase tracking-widest text-cyan-600 sm:text-lg">
                        {showFaceExpression
                          ? "7. Select Shoot Style"
                          : "6. Select Shoot Style"}
                      </h4>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                        {[
                          "Outdoor Premium",
                          "Studio Professional",
                          "White Background",
                          "Luxury Editorial",
                        ].map((item) => (
                          <OptionCard
                            key={item}
                            title={item}
                            active={
                              !customShootStyle.trim() && shootStyle === item
                            }
                            onClick={() => {
                              setShootStyle(item);
                              setCustomShootStyle("");
                            }}
                            darkMode={darkMode}
                          />
                        ))}
                      </div>
                      {renderCustomInput(
                        "Or type your own — e.g. 'Luxury bedroom', 'Boutique shop', 'Modern apartment'",
                        customShootStyle,
                        setCustomShootStyle,
                      )}
                    </section>
                  </div>
                )}

                {builderStep === 4 && (
                  <div className="space-y-6">
                    <section>
                      <h4 className="mb-4 text-base font-black uppercase tracking-widest text-cyan-600 sm:text-lg">
                        {showFaceExpression
                          ? "8. Accessories / Styling"
                          : "7. Accessories / Styling"}
                      </h4>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {["None", "Sunglasses", "Watch", "Bracelet"].map(
                          (item) => (
                            <OptionCard
                              key={item}
                              title={item}
                              active={accessories.includes(item)}
                              onClick={() => toggleAccessory(item)}
                              darkMode={darkMode}
                            />
                          ),
                        )}
                      </div>
                      {renderCustomInput(
                        isHomeLikeCategory
                          ? "Add styling — e.g. 'luxury room decor, natural sunlight, pillows'"
                          : "Add extras — e.g. 'Earrings, Necklace, Handbag'",
                        customAccessory,
                        setCustomAccessory,
                      )}
                    </section>

                    <section>
                      <h4 className="mb-4 text-base font-black uppercase tracking-widest text-cyan-600 sm:text-lg">
                        {showFaceExpression
                          ? "9. Output & Quality"
                          : "8. Output & Quality"}
                      </h4>
                      <div className="grid gap-5 lg:grid-cols-2">
                        <div className="space-y-4">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Select Size
                          </p>
                          <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {["Square (1:1)", "Mobile (9:16)"].map((item) => (
                              <OptionCard
                                key={item}
                                title={item}
                                active={
                                  !customOutputSize.trim() &&
                                  outputSize ===
                                    (item.includes("1:1")
                                      ? "1080x1080"
                                      : "1080x1920")
                                }
                                onClick={() => {
                                  setOutputSize(
                                    item.includes("1:1")
                                      ? "1080x1080"
                                      : "1080x1920",
                                  );
                                  setCustomOutputSize("");
                                }}
                                darkMode={darkMode}
                              />
                            ))}
                          </div>
                          {renderCustomInput(
                            "Or type — e.g. '4:5', '2048x2048'",
                            customOutputSize,
                            setCustomOutputSize,
                          )}
                        </div>
                        <div className="space-y-4">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Select Quality
                          </p>
                          <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {["Premium", "Ultra HD"].map((item) => (
                              <OptionCard
                                key={item}
                                title={item}
                                active={
                                  !customQuality.trim() && quality === item
                                }
                                onClick={() => {
                                  setQuality(item);
                                  setCustomQuality("");
                                }}
                                darkMode={darkMode}
                              />
                            ))}
                          </div>
                          {renderCustomInput(
                            "Or type — e.g. '4K Cinematic'",
                            customQuality,
                            setCustomQuality,
                          )}
                        </div>
                      </div>
                    </section>

                    <div className="pt-2">
                      <button
                        disabled={
                          loading || uploading || readyItems.length === 0
                        }
                        onClick={handleGenerate}
                        className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-4 text-base font-black text-black shadow-xl shadow-cyan-500/25 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 sm:gap-3 sm:py-5 sm:text-lg`}
                      >
                        {loading ? (
                          <>
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                            <span>
                              Generating {readyItems.length} Mockup
                              {readyItems.length > 1 ? "s" : ""}...
                            </span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" />
                            <span>
                              {readyItems.length > 1 && !isEmpireUser
                                ? "Upgrade to Empire Pack for Bulk"
                                : readyItems.length > 1
                                  ? `Generate ${readyItems.length} Mockups (${totalCreditsNeeded} Credits)`
                                  : `Start Royal Generation (${requiredCredits} Credits)`}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                    {showResult && (
                      <div
                        ref={resultRef}
                        className={`mt-6 overflow-hidden rounded-[1.5rem] border shadow-2xl backdrop-blur-xl sm:rounded-[2.5rem] ${card}`}
                      >
                        <div className="flex flex-col">
                          <div className="bg-black/5 p-3 sm:p-5">
                            {previewResult ? (
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="text-center">
                                  {previewImage ? (
                                    <img src={previewImage} alt="Uploaded textile design" className="mx-auto max-h-[260px] w-full rounded-2xl object-cover shadow-lg sm:max-h-[360px]" />
                                  ) : (
                                    <div className={`flex h-[200px] w-full items-center justify-center rounded-2xl border-2 border-dashed ${darkMode ? "border-white/20" : "border-black/15"}`}><span className="text-3xl opacity-30">📷</span></div>
                                  )}
                                  <p className={`mt-2 text-xs font-bold ${muted}`}>Your Design</p>
                                </div>
                                <div className="text-center">
                                  <img src={previewResult} alt="Final AI textile mockup generated using AgentForge" className="mx-auto max-h-[360px] w-full rounded-2xl object-cover shadow-2xl shadow-cyan-400/20 transition hover:scale-[1.02]" />
                                  <p className={`mt-2 text-xs font-bold ${muted}`}>AI Mockup</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex min-h-[400px] w-full flex-col items-center justify-center gap-5 p-5 text-center">
                                {/* Animated logo */}
                                <div className="relative h-20 w-20">
                                  <div className="absolute inset-0 animate-ping rounded-full bg-cyan-400 opacity-30" />
                                  <div className="absolute -inset-2 animate-pulse rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 opacity-40 blur-2xl" />
                                  <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white shadow-2xl ring-4 ring-cyan-400/60">
                                    <img
                                      src="/af-logo.png"
                                      alt="AgentForge"
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-xl font-black sm:text-2xl">
                                    <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                                      AI is crafting your mockup
                                    </span>
                                  </h4>
                                  <p className={`mt-1 text-xs ${muted}`}>
                                    Please don&apos;t refresh — your premium visual is on the way.
                                  </p>
                                </div>

                                <div className={`w-full max-w-sm rounded-2xl border p-4 text-left shadow-inner ${
                                  darkMode ? "border-white/10 bg-white/[0.04]" : "border-cyan-200/70 bg-white/80"
                                }`}>
                                  <AIThinkingSteps
                                    steps={TEXTILE_THINKING_STEPS}
                                    intervalMs={2200}
                                    darkMode={darkMode}
                                    title="Generation pipeline"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="p-4 sm:p-6 lg:p-8">
                            <div className="mb-5 sm:mb-6">
                              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-600">
                                Success
                              </span>
                              <h3 className="mt-2 text-2xl font-black sm:text-3xl">
                                Generation Complete
                              </h3>
                              <p
                                className={`mt-3 text-sm leading-relaxed ${muted}`}
                              >
                                Your premium model mockup is ready. You can now
                                download it or share it directly with your
                                clients.
                              </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <button
                                onClick={requestDownload}
                                className="flex items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-5 py-3 font-black text-white shadow-lg shadow-emerald-500/20 transition hover:scale-105 active:scale-95"
                              >
                                <span>Download HD</span>
                              </button>

                              <button
                                onClick={handleNativeShare}
                                className="flex items-center justify-center gap-3 rounded-2xl bg-blue-500 px-5 py-3 font-black text-white shadow-lg shadow-blue-500/20 transition hover:scale-105 active:scale-95"
                              >
                                <span>Share Now</span>
                              </button>
                            </div>

                            <a
                              href={whatsappLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-5 py-3 font-black text-white shadow-lg shadow-green-500/20 transition hover:scale-105 active:scale-95"
                            >
                              <span>Share on WhatsApp</span>
                            </a>

                            <Link
                              href="/my-creations"
                              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-bold transition hover:scale-[1.01] ${darkMode ? "border-white/10 bg-white/[0.04] text-white/70 hover:border-cyan-400/30 hover:text-cyan-300" : "border-black/10 bg-cyan-50/70 text-black/70 hover:border-cyan-300 hover:text-cyan-700"}`}
                            >
                              🎨 Your old creations are saved in <span className="ml-1 font-black text-cyan-600">My Creations</span>
                            </Link>

                            {items.filter((it) => it.resultUrl).length > 1 && (
                              <div className="mt-6">
                                <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-cyan-600">
                                  All Generated Mockups
                                </p>

                                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                                  {items
                                    .filter((it) => it.resultUrl)
                                    .map((it) => (
                                      <button
                                        key={it.id}
                                        type="button"
                                        onClick={() => setActiveId(it.id)}
                                        className={`overflow-hidden rounded-xl border-2 transition ${
                                          activeId === it.id
                                            ? "border-cyan-400 shadow-lg shadow-cyan-400/30"
                                            : "border-transparent"
                                        }`}
                                      >
                                        {it.resultUrl ? (
                                          <img
                                            src={it.resultUrl}
                                            alt={`Generated AI mockup ${it.fileName}`}
                                            className="aspect-square w-full object-cover"
                                          />
                                        ) : (
                                          <div className="flex aspect-square w-full items-center justify-center text-xs text-black/50">
                                            Loading...
                                          </div>
                                        )}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}

                            <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 sm:mt-8 sm:rounded-3xl sm:p-6">
                              <p className="text-[11px] font-black uppercase tracking-widest text-cyan-600">
                                Pro Tip
                              </p>
                              <p className="mt-3 text-sm font-bold leading-relaxed">
                                High-res source images with clean backgrounds
                                lead to the most royal and crisp model outputs.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={`sticky bottom-3 z-[90] mt-4 flex items-center justify-between gap-3 rounded-3xl border p-2 shadow-2xl backdrop-blur-xl sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none ${darkMode ? "border-white/10 bg-[#07111f]/92" : "border-black/10 bg-white/92"}`}
                >
                  <button
                    type="button"
                    onClick={() => {
  setBuilderStep((step) => Math.max(1, step - 1));

  setTimeout(() => {
    stepTopRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 100);
}}
                    disabled={Number(builderStep) === 1}
                    className={`rounded-2xl px-5 py-3 text-sm font-black transition disabled:opacity-40 sm:px-6 ${
                      darkMode
                        ? "bg-white/[0.06] text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    Back
                  </button>

                  {Number(builderStep) < 4 && (
                    <button
                      type="button"
                      disabled={!canGoNext}
                      onClick={() => {
  setBuilderStep((step) => Math.min(4, step + 1));

  setTimeout(() => {
    stepTopRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 100);
}}
                      className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-black text-black shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] disabled:opacity-40 sm:flex-none sm:px-8"
                    >
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
          agentType="textile"
          darkMode={darkMode}
          seed={TEXTILE_SEED_TESTIMONIALS}
          heading="What early textile users are saying"
          subtitle="Real WhatsApp & in-app feedback from manufacturers, sellers and wholesalers — names masked for privacy."
        />
      </div>

      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/40 via-white/15 to-purple-50/40 backdrop-blur-[2px] dark:from-cyan-900/20 dark:via-black/30 dark:to-purple-900/20" />

          {[
            { emoji: "👕", x: "6%", y: "10%", delay: "0s" },
            { emoji: "🥻", x: "86%", y: "14%", delay: "0.7s" },
            { emoji: "🧵", x: "10%", y: "72%", delay: "1.2s" },
            { emoji: "👗", x: "82%", y: "68%", delay: "0.4s" },
            { emoji: "✨", x: "3%", y: "42%", delay: "1.5s" },
            { emoji: "🎨", x: "92%", y: "42%", delay: "0.9s" },
            { emoji: "👔", x: "22%", y: "4%", delay: "1.8s" },
            { emoji: "🧣", x: "70%", y: "3%", delay: "0.2s" },
            { emoji: "⭐", x: "32%", y: "88%", delay: "1.4s" },
            { emoji: "💫", x: "62%", y: "88%", delay: "0.55s" },
          ].map((item, i) => (
            <div
              key={i}
              className="pointer-events-none absolute text-4xl"
              style={{ left: item.x, top: item.y, opacity: 0.5, animation: `tFloat ${4.5 + i * 0.35}s ease-in-out ${item.delay} infinite` }}
            >
              {item.emoji}
            </div>
          ))}

          <style>{`
            @keyframes tFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }
            @keyframes afLogoFloat { 0%, 100% { transform: scale(1) rotate(-4deg); } 50% { transform: scale(1.1) rotate(4deg); } }
          `}</style>

          <div className={`relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border p-7 shadow-[0_20px_60px_-15px_rgba(34,211,238,0.40)] backdrop-blur-2xl sm:p-8 ${darkMode ? "border-cyan-400/20 bg-[#0a1628]/92" : "border-cyan-200/70 bg-white/92"}`}>
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-300/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-purple-300/25 blur-3xl" />

            <div className="relative">
              <div className="relative mx-auto mb-6 h-24 w-24">
                <div className="absolute inset-0 animate-ping rounded-full bg-cyan-400 opacity-30" />
                <div className="absolute -inset-2 animate-pulse rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 opacity-40 blur-2xl" />
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white shadow-2xl ring-4 ring-cyan-400/60">
                  <img src="/logo-new.jpg" alt="AgentForge" className="h-full w-full object-cover" style={{ animation: "afLogoFloat 2.4s ease-in-out infinite" }} onError={(e) => { e.currentTarget.src = "/af-logo.png"; }} />
                </div>
              </div>

              <h3 className={`text-center text-2xl font-black tracking-tight sm:text-3xl ${darkMode ? "text-white" : "text-slate-900"}`}>
                AI is Crafting...
              </h3>
              <p className={`mt-3 text-center text-sm leading-6 ${darkMode ? "text-white/60" : "text-slate-600"}`}>
                Generating your royal fashion mockup. Please do not refresh.
              </p>

              <div className={`mt-6 overflow-hidden rounded-2xl border p-5 text-left shadow-inner ${darkMode ? "border-cyan-400/20 bg-white/[0.05]" : "border-cyan-200/70 bg-white/70"}`}>
                <AIThinkingSteps steps={TEXTILE_THINKING_STEPS} intervalMs={2200} darkMode={darkMode} title="Generation pipeline" />
              </div>

              <div className={`mt-4 overflow-hidden rounded-2xl border p-4 text-left ${darkMode ? "border-cyan-400/10 bg-cyan-400/5" : "border-cyan-100 bg-cyan-50/60"}`}>
                <p className="text-[11px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-300">
                  {textileFacts[factIndex].title}
                </p>
                <p className={`mt-2 text-sm leading-relaxed ${darkMode ? "text-white/70" : "text-slate-600"}`}>
                  {textileFacts[factIndex].text}
                </p>
              </div>

              {cancelVisible && (
                <button
                  onClick={() => { cancelRef.current = true; setLoading(false); }}
                  className={`mt-5 w-full text-center text-xs font-black uppercase tracking-widest transition ${darkMode ? "text-white/30 hover:text-rose-400" : "text-slate-400 hover:text-rose-500"}`}
                >
                  Cancel Generation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <SignupPromptPopup
        open={showSignupPopup}
        onClose={() => setShowSignupPopup(false)}
        source="textile-ai"
        context="textile mockup"
      />

      {showRatingModal && (
        <RatingFeedbackModal
          generationId={ratingGenerationId}
          agent="textile"
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
        ctaName="textile_sticky_mobile"
        label={
          authUser?.id
            ? readyItems.length > 0
              ? `Generate ${readyItems.length > 1 ? readyItems.length + " Mockups" : "Mockup"} · ${totalCreditsNeeded} credits`
              : "Upload textile design →"
            : "Start with free credits"
        }
        subLabel={authUser?.id ? "AI Textile Studio" : "100 free credits on signup"}
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
