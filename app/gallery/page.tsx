"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";
import { hasBulkAccess, hasUnlimitedAccess } from "@/lib/plans";
import { ChevronRight, Gem, Shirt, Sparkles, SprayCan } from "lucide-react";

type Tab = "All" | "Textile" | "Jewellery" | "Productography";
type Category = "Textile" | "Jewellery" | "Productography";

type GalleryItem = {
  url: string;
  category: Category;
  title: string;
  desc: string;
};


const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  const today = new Date().toDateString();

  let seed = 0;
  for (let i = 0; i < today.length; i++) {
    seed += today.charCodeAt(i);
  }

  for (let i = shuffled.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};


const dailyShuffle = <T,>(items: T[]): T[] => {
  const shuffled = [...items];
  const today = new Date().toISOString().slice(0, 10);

  let seed = 0;
  for (let i = 0; i < today.length; i++) {
    seed = (seed * 31 + today.charCodeAt(i)) >>> 0;
  }

  for (let i = shuffled.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

const makeItems = (category: Category, folder: string, titlePrefix: string): GalleryItem[] =>
  Array.from({ length: 28 }, (_, i) => ({
    url: `/gallery/${folder}/design-${i + 1}.png`,
    category,
    title: `${titlePrefix} ${i + 1}`,
    desc:
      category === "Textile"
        ? "Pattern to premium model mockup"
        : category === "Jewellery"
          ? "Jewellery to premium model shoot"
          : "Product to ad-ready visual",
  }));

// IMAGE FOLDER STRUCTURE
// public/gallery/textile/design-1.png to design-28.png
// public/gallery/jewellery/design-1.png to design-28.png
// public/gallery/productography/design-1.png to design-28.png

const textileItems = makeItems("Textile", "textile", "Textile Design");
const jewelleryItems = makeItems("Jewellery", "jewellery", "Jewellery Design");
const productItems = makeItems("Productography", "productography", "Product Design");

const tabs: Tab[] = ["All", "Textile", "Jewellery", "Productography"];

function CtaCard({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="flex aspect-[4/5] flex-col items-center justify-center overflow-hidden rounded-[1.35rem] border border-cyan-400/35 bg-[#07111f] p-4 text-center text-white shadow-lg shadow-cyan-500/20">
      <p className="mb-3 rounded-full bg-white/10 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200">
        AgentForge
      </p>

      <h3 className="max-w-[130px] text-xl font-black leading-[1.05]">
        Want visuals like this?
      </h3>

      <p className="mt-3 line-clamp-3 text-xs leading-5 text-white/75">
        Upload your product and generate premium visuals in minutes.
      </p>

      <Link
        href={isLoggedIn ? "/pricing" : "/signup"}
        className="mt-4 rounded-full bg-white px-5 py-2.5 text-xs font-black text-black transition hover:scale-105"
      >
        {isLoggedIn ? "Upgrade Plan" : "Sign Up Now"}
      </Link>
    </div>
  );
}

function ImageCard({
  item,
  onOpen,
}: {
  item: GalleryItem;
  onOpen: (item: GalleryItem) => void;
}) {
  return (
    <button
      onClick={() => onOpen(item)}
      className="group relative block aspect-[4/5] overflow-hidden rounded-[1.35rem] bg-white shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-white/10"
    >
      <img
        src={item.url}
        alt={`${item.title} created using AgentForge AI`}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />

      <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-4 text-left opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
       <h3 className="text-base font-black text-white">Premium AI Visual</h3>
        <p className="mt-1 text-xs text-white/75">{item.desc}</p>
      </div>
    </button>
  );
}

export default function GalleryPage() {
  const { darkMode } = useTheme();
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Textile");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setIsLoggedIn(Boolean(data.session?.user));
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const items = useMemo(() => {
    // ALL tab = fixed mix preview (no shuffle)
    if (activeTab === "All") {
      return [
        ...textileItems.slice(0, 9),
        ...jewelleryItems.slice(0, 9),
        ...productItems.slice(0, 9),
      ];
    }

    // Individual tabs = daily shuffle
    if (activeTab === "Jewellery") {
      return dailyShuffle(jewelleryItems);
    }

    if (activeTab === "Productography") {
      return dailyShuffle(productItems);
    }

    return dailyShuffle(textileItems);
  }, [activeTab]);


  return (
    <main
      className={`relative min-h-screen overflow-hidden ${
        darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]"
      }`}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee35,transparent_34%),radial-gradient(circle_at_top_right,#8b5cf635,transparent_32%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.04))]" />
      <div
        className={`pointer-events-none fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.13]"}`}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      {/* Floating Doodles — gallery themed */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="float-slow absolute left-[6%] top-[6%] text-4xl opacity-65 sm:text-5xl">🖼️</div>
        <div className="float-medium absolute right-[8%] top-[10%] text-4xl opacity-65 sm:text-5xl">📸</div>
        <div className="float-fast absolute left-[22%] top-[14%] text-2xl opacity-55 sm:text-3xl">✨</div>
        <div className="float-medium absolute right-[24%] top-[6%] text-3xl opacity-60 sm:text-4xl">🎨</div>
        <div className="float-slow absolute left-[42%] top-[3%] text-2xl opacity-50 sm:text-3xl">✦</div>
        <div className="float-fast absolute right-[42%] top-[18%] text-3xl opacity-60 sm:text-4xl">🌟</div>

        <div className="float-medium absolute left-[3%] top-[28%] text-3xl opacity-55 sm:text-4xl">👕</div>
        <div className="float-slow absolute right-[4%] top-[32%] text-3xl opacity-55 sm:text-4xl">💍</div>
        <div className="float-fast absolute left-[8%] top-[44%] text-3xl opacity-55 sm:text-4xl">🪄</div>
        <div className="float-medium absolute right-[6%] top-[46%] text-3xl opacity-55 sm:text-4xl">🎬</div>

        <div className="float-slow absolute left-[35%] top-[52%] text-2xl opacity-50 sm:text-3xl">⭐</div>
        <div className="float-medium absolute right-[30%] top-[58%] text-2xl opacity-55 sm:text-3xl">💎</div>
        <div className="float-fast absolute left-[14%] top-[62%] text-3xl opacity-55 sm:text-4xl">📷</div>
        <div className="float-slow absolute right-[14%] top-[66%] text-3xl opacity-55 sm:text-4xl">🎁</div>

        <div className="float-fast absolute left-[20%] top-[78%] text-2xl opacity-55 sm:text-3xl">✧</div>
        <div className="float-medium absolute right-[18%] top-[82%] text-3xl opacity-60 sm:text-4xl">✨</div>
        <div className="float-slow absolute left-[48%] top-[88%] text-2xl opacity-50 sm:text-3xl">💫</div>
      </div>

      <section className="relative z-10 mx-auto max-w-[1500px] px-4 py-8 md:px-8 md:py-12">
        <div className="relative mb-8 overflow-hidden rounded-[2.4rem] border border-black/10 bg-white/85 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
          {/* Soft glow inside the hero card */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[10%] top-1/2 -z-0 h-[420px] w-[520px] max-w-[80%] -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, rgba(34,211,238,0.22), rgba(59,130,246,0.10) 55%, transparent 75%)",
              filter: "blur(8px)",
            }}
          />

          <div className="relative grid gap-0 lg:grid-cols-[1fr_1fr]">
            <div className="p-8 md:p-12">
              {/* Eyebrow */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-white/80 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-700 shadow-md shadow-cyan-300/30 backdrop-blur sm:text-[11px] dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-500" />
                AgentForge Showcase
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-blue-500" />
              </div>

              <h1 className="max-w-3xl text-[28px] font-black leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
                <span className="block">AI Mockup &amp; Product</span>
                <span className="block">Photography Gallery</span>
                <span className="af-shimmer-text mt-3 block text-[22px] sm:text-3xl md:text-4xl">
                  Textile, Jewellery &amp; Product Visuals
                </span>
              </h1>

              <p className={`mt-5 max-w-2xl text-sm leading-7 sm:text-base sm:leading-8 ${darkMode ? "text-white/65" : "text-black/60"}`}>
                Explore AI-generated textile mockups, jewellery photoshoots,
                fashion visuals, and catalogue-ready product photography —
                sab AgentForge AI ke andar bani hui live examples.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={isLoggedIn ? "/pricing" : "/signup"}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-3 text-sm font-black text-white shadow-xl shadow-cyan-500/40 transition hover:scale-105"
                  style={{ animation: "afCtaPulse 2.6s ease-in-out infinite" }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    style={{ animation: "afShine 2.8s ease-in-out infinite" }}
                  />
                  <Sparkles className="relative h-4 w-4 animate-pulse" />
                  <span className="relative">{isLoggedIn ? "Upgrade Plan" : "Start Creating"}</span>
                </Link>

                <Link
                  href="/pricing"
                  className="group inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-7 py-3 text-sm font-black text-black transition hover:scale-105 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  View Pricing
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
              </div>

              {/* Live info banner */}
              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3.5 py-1.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
                </span>
                Fresh AI visuals · Daily shuffled · Tap any card to preview
              </p>

              {/* Trust strip */}
              <div className={`mt-6 grid grid-cols-3 gap-2 rounded-2xl border px-3 py-3 text-center backdrop-blur sm:gap-4 sm:px-4 ${
                darkMode ? "border-white/10 bg-white/[0.05]" : "border-black/10 bg-white/70"
              }`}>
                <div>
                  <p className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-lg font-black text-transparent sm:text-2xl">
                    80+
                  </p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider sm:text-xs ${darkMode ? "text-white/55" : "text-black/55"}`}>
                    Live samples
                  </p>
                </div>
                <div className={`border-x ${darkMode ? "border-white/10" : "border-black/10"}`}>
                  <p className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-lg font-black text-transparent sm:text-2xl">
                    3 Agents
                  </p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider sm:text-xs ${darkMode ? "text-white/55" : "text-black/55"}`}>
                    Textile · Jewel · Product
                  </p>
                </div>
                <div>
                  <p className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-lg font-black text-transparent sm:text-2xl">
                    HD 1080
                  </p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider sm:text-xs ${darkMode ? "text-white/55" : "text-black/55"}`}>
                    Catalogue ready
                  </p>
                </div>
              </div>

              {/* Inside this gallery — categories chip cloud */}
              <div className="mt-7">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
                  Inside this gallery
                </p>
                <h3 className="mt-2 text-xl font-black leading-snug sm:text-2xl md:text-3xl">
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                    80+ live AI visuals
                  </span>{" "}
                  — fashion, jewellery &amp; product all in one place.
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { label: "Saree mockups", accent: "from-cyan-400 to-blue-500" },
                    { label: "Kurta & suit shoots", accent: "from-cyan-400 to-blue-500" },
                    { label: "Kidswear", accent: "from-cyan-400 to-blue-500" },
                    { label: "Lehenga & bridal", accent: "from-cyan-400 to-blue-500" },
                    { label: "Necklace sets", accent: "from-amber-400 to-orange-500" },
                    { label: "Rings & earrings", accent: "from-amber-400 to-orange-500" },
                    { label: "Diamond / kundan", accent: "from-amber-400 to-orange-500" },
                    { label: "Bridal jewellery", accent: "from-amber-400 to-orange-500" },
                    { label: "Skincare & perfume", accent: "from-violet-400 to-fuchsia-500" },
                    { label: "Gadgets & packaging", accent: "from-violet-400 to-fuchsia-500" },
                    { label: "Food & beverage", accent: "from-violet-400 to-fuchsia-500" },
                    { label: "Banner & ad creatives", accent: "from-violet-400 to-fuchsia-500" },
                  ].map((chip) => (
                    <span
                      key={chip.label}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black backdrop-blur sm:text-xs ${
                        darkMode ? "border-white/10 bg-white/[0.05] text-white/80" : "border-black/10 bg-white/80 text-black/75"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${chip.accent}`} />
                      {chip.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative min-h-[360px] overflow-hidden p-4">
              <div className="grid h-full min-h-[340px] grid-cols-2 gap-3">
                <div className="group relative row-span-2 overflow-hidden rounded-[1.6rem] bg-black/5">
                  <img
                    src="/gallery/textile/design-1.png"
                    alt="AI textile mockup example created with AgentForge AI"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur">
                    <Shirt className="h-3 w-3 text-cyan-300" />
                    Textile
                  </span>
                </div>

                <div className="group relative overflow-hidden rounded-[1.6rem] bg-black/5">
                  <img
                    src="/gallery/jewellery/design-1.png"
                    alt="AI jewellery photoshoot example created with AgentForge AI"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur">
                    <Gem className="h-3 w-3 text-amber-300" />
                    Jewellery
                  </span>
                </div>

                <div className="group relative overflow-hidden rounded-[1.6rem] bg-black/5">
                  <img
                    src="/gallery/productography/design-1.png"
                    alt="AI product photography example created with AgentForge AI"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur">
                    <SprayCan className="h-3 w-3 text-violet-300" />
                    Product
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Inline keyframes */}
          <style>{`
            @keyframes afShimmerText {
              0%, 100% { background-position: 0% 50%; }
              50%      { background-position: 100% 50%; }
            }
            .af-shimmer-text {
              background-image: linear-gradient(90deg, #22d3ee, #06b6d4, #3b82f6, #6366f1, #3b82f6, #22d3ee);
              background-size: 240% 240%;
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
              animation: afShimmerText 6s ease-in-out infinite;
            }
            @keyframes afCtaPulse {
              0%, 100% { box-shadow: 0 14px 32px -10px rgba(34,211,238,0.55); }
              50%      { box-shadow: 0 18px 42px -8px rgba(59,130,246,0.7); }
            }
            @keyframes afShine {
              0%   { transform: translateX(-120%); }
              60%  { transform: translateX(120%); }
              100% { transform: translateX(120%); }
            }
          `}</style>
        </div>

        <div className="mt-8 rounded-[1.5rem] bg-white/90 p-2 shadow-lg">
  <div className="flex items-center justify-between gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-3 py-2 text-[13px] font-black transition whitespace-nowrap ${
  activeTab === tab
    ? "bg-black text-white"
    : "text-black/60 hover:bg-black/5"
}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {items.slice(0, 8).map((item, index) => (
            <ImageCard key={`${item.url}-${index}`} item={item} onOpen={setSelected} />
          ))}

          <CtaCard isLoggedIn={isLoggedIn} />

          {items.slice(8, 28).map((item, index) => (
            <ImageCard key={`${item.url}-${index + 8}`} item={item} onOpen={setSelected} />
          ))}

          <CtaCard isLoggedIn={isLoggedIn} />
        </div>


        <section className="mt-12 pb-4">
          <div
            className={`rounded-[2rem] border p-8 backdrop-blur-xl ${
              darkMode
                ? "border-white/10 bg-white/5"
                : "border-black/10 bg-white/70"
            }`}
          >
            <div className="text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
                Powered by 3 AI agents
              </p>
              <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
                <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  AI Gallery for Modern Businesses
                </span>
              </h2>

              <p
                className={`mx-auto mt-4 max-w-3xl text-sm leading-7 sm:text-base sm:leading-8 ${
                  darkMode ? "text-white/65" : "text-black/60"
                }`}
              >
                AgentForge helps textile manufacturers, jewellery brands,
                wholesalers, fashion sellers, and ecommerce businesses generate
                catalogue-ready visuals using AI. Har category ke liye ek
                dedicated agent — neeche dekho kya kya bana sakte ho.
              </p>
            </div>

            {/* Agent cards */}
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                {
                  tag: "Textile AI",
                  title: "TextilePrints to Mockup AI",
                  link: "/textileprints-to-mockup",
                  Icon: Shirt,
                  accent: "from-cyan-400 to-blue-500",
                  shadow: "shadow-cyan-500/30",
                  ring: "ring-cyan-400/40",
                  glow: "bg-cyan-400/15",
                  desc: "Apne motif ya design ko model-worn premium mockups mein turn karo — article code overlay ke saath, catalogue ready.",
                  bullets: [
                    "Kurta, saree, suit, kidswear",
                    "Men & women fashion mockups",
                    "Festive & seasonal looks",
                    "Bulk catalogue (Empire plan)",
                  ],
                },
                {
                  tag: "Jewellery AI",
                  title: "Jewellery AI Studio",
                  link: "/jewellery-ai",
                  Icon: Gem,
                  accent: "from-amber-400 to-orange-500",
                  shadow: "shadow-amber-500/30",
                  ring: "ring-amber-400/40",
                  glow: "bg-amber-400/15",
                  desc: "Luxury jewellery photoshoots — model ke saath bhi aur sirf product ke bhi. Bridal se daily-wear tak sab covered.",
                  bullets: [
                    "Necklace · ring · earring · bangle",
                    "Bridal & festive shoots",
                    "Studio + lifestyle backgrounds",
                    "Diamond, gold, kundan, oxidised",
                  ],
                },
                {
                  tag: "Productography AI",
                  title: "Productography AI",
                  link: "/productography-ai",
                  Icon: SprayCan,
                  accent: "from-violet-400 to-fuchsia-500",
                  shadow: "shadow-violet-500/30",
                  ring: "ring-violet-400/40",
                  glow: "bg-violet-400/15",
                  desc: "Product photos ko catalogue-ready hero shots aur Instagram ad creatives mein convert karo — bina shoot ke.",
                  bullets: [
                    "Skincare · perfume · cosmetics",
                    "Gadgets · electronics · packaging",
                    "Food & beverage hero shots",
                    "Carousels, banners, ad creatives",
                  ],
                },
              ].map((g) => {
                const Icon = g.Icon;
                return (
                  <Link
                    key={g.tag}
                    href={g.link}
                    className={`group relative overflow-hidden rounded-[1.5rem] border p-5 backdrop-blur-xl transition hover:-translate-y-1 ${
                      darkMode
                        ? "border-white/10 bg-white/[0.05]"
                        : "border-black/10 bg-white/80"
                    }`}
                  >
                    <span
                      className={`pointer-events-none absolute -inset-px rounded-[1.5rem] opacity-0 ring-2 transition group-hover:opacity-100 ${g.ring}`}
                    />
                    <span
                      className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full ${g.glow} blur-2xl transition group-hover:scale-125`}
                    />

                    <div className="relative">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${g.accent} text-white shadow-lg ${g.shadow}`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`text-[10px] font-black uppercase tracking-[0.22em] bg-gradient-to-r ${g.accent} bg-clip-text text-transparent`}
                          >
                            {g.tag}
                          </p>
                          <h3 className="text-base font-black sm:text-lg">
                            {g.title}
                          </h3>
                        </div>
                      </div>

                      <p
                        className={`mt-3 text-sm leading-6 ${
                          darkMode ? "text-white/65" : "text-black/60"
                        }`}
                      >
                        {g.desc}
                      </p>

                      <ul className="mt-4 space-y-1.5">
                        {g.bullets.map((b) => (
                          <li
                            key={b}
                            className={`flex items-start gap-2 text-xs sm:text-sm ${
                              darkMode ? "text-white/70" : "text-black/70"
                            }`}
                          >
                            <span
                              className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r ${g.accent}`}
                            />
                            {b}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-5 flex items-center justify-between">
                        <span
                          className={`text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r ${g.accent} bg-clip-text text-transparent`}
                        >
                          Open {g.tag}
                        </span>
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r ${g.accent} text-white shadow-md ${g.shadow} transition group-hover:translate-x-1`}
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Bottom mini-callout */}
            <div className={`mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-center sm:flex-row sm:text-left ${
              darkMode ? "border-white/10 bg-white/[0.04]" : "border-cyan-400/30 bg-gradient-to-r from-cyan-50 to-blue-50"
            }`}>
              <div className="min-w-0">
                <p className="text-sm font-black sm:text-base">
                  Apne products pe bhi try karna chahte ho?
                </p>
                <p className={`mt-1 text-xs sm:text-sm ${darkMode ? "text-white/55" : "text-black/55"}`}>
                  Signup karke 100 free credits le lo · No card required
                </p>
              </div>
              <Link
                href={isLoggedIn ? "/pricing" : "/signup"}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/30 transition hover:scale-105"
              >
                {isLoggedIn ? "Choose Plan" : "Get Free Credits"}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </section>

      {selected && (
        <div
          onClick={() => setSelected(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[92vh] max-w-[92vw] items-center justify-center overflow-visible rounded-[1.5rem] bg-transparent"
          >
            <button
              onClick={() => setSelected(null)}
              aria-label="Close preview"
              className="absolute -right-4 -top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/80 text-2xl font-black leading-none text-white shadow-xl backdrop-blur transition hover:scale-105 hover:bg-black"
            >
              ×
            </button>

            <img
              src={selected.url}
              alt={`${selected.title} created using AgentForge AI`}
              className="block max-h-[92vh] max-w-[92vw] rounded-[1.5rem] object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </main>
  );
}
