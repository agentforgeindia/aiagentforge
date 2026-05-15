"use client";

import Link from "next/link"; import { useEffect, useState, useRef } from "react"; import { supabase } from "@/lib/supabase"; import { useTheme } from "@/app/components/ThemeProvider"; import { useAuth } from "@/app/components/AuthProvider"; import { Sparkles } from "lucide-react"; import { canGenerate } from "@/lib/checkCredits"; import { shouldDeductCredits } from "@/lib/deductCredits"; import { hasBulkAccess, hasUnlimitedAccess } from "@/lib/plans";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_PRODUCTION_WEBHOOK || "/api/generate-mockup";

const isEmpireProfile = (profile: any) => { const planText = String( profile?.plan || profile?.package || profile?.current_plan || profile?.subscription_plan || profile?.plan_name || "", ).toLowerCase();

return Boolean( profile?.is_empire || profile?.empire_pack || profile?.has_empire || planText.includes("empire"), ); };

type IconName = | "pattern" | "mensWear" | "ladiesWear" | "kidsWear" | "homeTextile" | "decor" | "universalFabric" | "shirt" | "kurta" | "suit3Piece" | "salwarKameez" | "saree" | "bedsheet" | "curtain" | "pillow" | "cushion" | "towel" | "blanket" | "indianModel" | "westernModel" | "asianModel" | "middleEastern" | "african" | "european" | "singleModel" | "couple" | "family" | "frontPose" | "sidePose" | "walking" | "sitting" | "closeup" | "lifestyle" | "hotel" | "happy" | "confident" | "chill" | "serious" | "smiling" | "soft" | "luxury" | "studio" | "outdoor" | "whiteBg" | "mobile" | "square" | "premium" | "ultraHd";

function AFVectorIcon({ name, className = "h-10 w-10", }: { name: IconName; className?: string; }) { const gradientId = grad-${name};

return ( <svg
viewBox="0 0 64 64"
className={className}
fill="none"
xmlns="http://www.w3.org/2000/svg"
> <defs> <linearGradient id={gradientId} x1="0" y1="0" x2="64" y2="64"> <stop offset="0%" stopColor="#22d3ee" /> <stop offset="55%" stopColor="#3b82f6" /> <stop offset="100%" stopColor="#9333ea" /> </linearGradient> </defs>

<rect
    x="6"
    y="6"
    width="52"
    height="52"
    rx="18"
    fill={`url(#${gradientId})`}
    opacity="0.15"
  />

  <path
    d="M20 20H44V44H20Z"
    stroke={`url(#${gradientId})`}
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</svg>

); }

export default function TextilePrintsToMockup() { const { darkMode } = useTheme(); const { user, profile } = useAuth();

const [selectedCategory, setSelectedCategory] = useState("mens"); const [selectedProduct, setSelectedProduct] = useState("shirt"); const [selectedModelLook, setSelectedModelLook] = useState("indian"); const [selectedPose, setSelectedPose] = useState("front"); const [selectedExpression, setSelectedExpression] = useState("confident"); const [selectedStyle, setSelectedStyle] = useState("luxury"); const [selectedSize, setSelectedSize] = useState("square"); const [selectedQuality, setSelectedQuality] = useState("premium"); const [articleNumber, setArticleNumber] = useState(""); const [customInstruction, setCustomInstruction] = useState(""); const [previewImage, setPreviewImage] = useState<string | null>(null);

return ( <main className={min-h-screen px-4 py-10 md:px-8 ${ darkMode ? "bg-[#070b14] text-white" : "bg-[#fff9ef] text-[#111827]" }} > <div className="mx-auto max-w-7xl"> <section className="mb-10 text-center"> <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-5 py-2 text-sm font-black text-cyan-400"> <Sparkles className="h-4 w-4" /> TextilePrints to Mockup AI </div>

<h1 className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-5xl font-black tracking-[-0.04em] text-transparent md:text-7xl">
        Upload. Generate. Done.
      </h1>

      <p
        className={`mx-auto mt-5 max-w-3xl text-sm leading-7 md:text-base ${
          darkMode ? "text-white/60" : "text-black/60"
        }`}
      >
        Generate premium catalogue-ready textile mockups with AI fashion
        models, luxury room setups, curtain lifestyle scenes, bedsheet
        couple previews and commercial textile visuals.
      </p>
    </section>
  </div>
</main>

); }