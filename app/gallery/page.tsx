"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/components/ThemeProvider";
import { hasBulkAccess, hasUnlimitedAccess } from "@/lib/plans";

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

      <section className="relative z-10 mx-auto max-w-[1500px] px-4 py-8 md:px-8 md:py-12">
        <div className="mb-8 overflow-hidden rounded-[2.4rem] border border-black/10 bg-white/85 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
          <div className="grid gap-0 lg:grid-cols-[1fr_1fr]">
            <div className="p-8 md:p-12">
              <p className="mb-5 inline-flex rounded-full bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-cyan-600">
                AgentForge Showcase
              </p>

              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                AI Mockup & Product Photography Gallery
                <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Textile, Jewellery & Product Visuals
                </span>
              </h1>

              <p className={`mt-5 max-w-2xl text-base leading-8 md:text-lg ${darkMode ? "text-white/65" : "text-black/60"}`}>
                Explore AI generated textile mockups, jewellery photoshoots,
                fashion visuals, and catalogue-ready product photography examples
                created using AgentForge AI.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={isLoggedIn ? "/pricing" : "/signup"}
                  className="rounded-full bg-black px-7 py-3 text-sm font-black text-white transition hover:scale-105 dark:bg-white dark:text-black"
                >
                  {isLoggedIn ? "Upgrade Plan" : "Start Creating"}
                </Link>

                <Link
                  href="/pricing"
                  className="rounded-full border border-black/10 bg-white px-7 py-3 text-sm font-black text-black transition hover:scale-105 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  View Pricing
                </Link>
              </div>
            </div>

            <div className="relative min-h-[360px] overflow-hidden p-4">
              <div className="grid h-full min-h-[340px] grid-cols-2 gap-3">
                <div className="relative row-span-2 overflow-hidden rounded-[1.6rem] bg-black/5">
                  <img
                    src="/gallery/textile/design-1.png"
                    alt="AI textile mockup example created with AgentForge AI"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="relative overflow-hidden rounded-[1.6rem] bg-black/5">
                  <img
                    src="/gallery/jewellery/design-1.png"
                    alt="AI jewellery photoshoot example created with AgentForge AI"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="relative overflow-hidden rounded-[1.6rem] bg-black/5">
                  <img
                    src="/gallery/productography/design-1.png"
                    alt="AI product photography example created with AgentForge AI"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
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


        <section className="mx-auto mt-12 max-w-6xl pb-4">
          <div
            className={`rounded-[2rem] border p-8 backdrop-blur-xl ${
              darkMode
                ? "border-white/10 bg-white/5"
                : "border-black/10 bg-white/70"
            }`}
          >
            <h2 className="text-3xl font-black md:text-4xl">
              AI Gallery for Modern Businesses
            </h2>

            <p
              className={`mt-5 leading-8 ${
                darkMode ? "text-white/65" : "text-black/60"
              }`}
            >
              AgentForge helps textile manufacturers, jewellery brands,
              wholesalers, fashion sellers, and ecommerce businesses generate
              catalogue-ready visuals using AI. Explore textile mockups, AI
              jewellery photography, product photoshoots, fashion model visuals,
              and advertising creatives generated with AgentForge AI.
            </p>
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
