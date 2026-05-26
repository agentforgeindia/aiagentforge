"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/app/components/ThemeProvider";
import {
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Headphones,
  HelpCircle,
  ImageIcon,
  Mail,
  MessageSquare,
  Phone,
  PlayCircle,
  Settings,
  ShoppingBag,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPinterestP,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

/* ─────────────────────────── Data ─────────────────────────── */

const stepFlow = [
  {
    num: "01",
    title: "Generate Mockups",
    desc: "Upload your design and create AI model-based premium mockups in seconds.",
    Icon: Wand2,
    tint: "from-cyan-300 to-cyan-500",
  },
  {
    num: "02",
    title: "Credits System",
    desc: "Credits are visible only after login and are deducted on each generation.",
    Icon: CreditCard,
    tint: "from-cyan-400 to-blue-500",
  },
  {
    num: "03",
    title: "Design / Article Code",
    desc: "Enable article numbers or textile design codes as an overlay on your output.",
    Icon: Settings,
    tint: "from-blue-400 to-blue-600",
  },
  {
    num: "04",
    title: "Better Output",
    desc: "Use clear, straight, HD reference images — the cleaner the input, the better the output.",
    Icon: ImageIcon,
    tint: "from-blue-500 to-indigo-500",
  },
  {
    num: "05",
    title: "Billing & Plans",
    desc: "Choose a plan based on your monthly volume — credits never expire.",
    Icon: ShoppingBag,
    tint: "from-indigo-400 to-indigo-600",
  },
  {
    num: "06",
    title: "Usage Rights",
    desc: "Safely use generated visuals in ads, catalogues, and social media — fully commercial.",
    Icon: BadgeCheck,
    tint: "from-indigo-500 to-blue-600",
  },
];

const tutorials = [
  {
    title: "How to Upload a Textile Design",
    desc: "Learn the correct upload process for a clean, accurate AI output.",
    youtubeId: "IbLgfPJCzao",
  },
  {
    title: "How to Generate AI Mockups",
    desc: "Select a style, add details, and create your very first AI mockup.",
    youtubeId: "1qmLLUqhvP8",
  },
  {
    title: "How to Add Article Number",
    desc: "Display your design identity and article code on the final mockup.",
    youtubeId: "ORKxrasItIM",
  },
];

const bestPractices = [
  "Upload clear, high-resolution textile images",
  "Use front-facing flat design images",
  "Avoid blurred or folded fabric photos",
  "Keep the full pattern visible in the image",
  "Use proper lighting in reference images",
  "Keep design alignment straight before uploading",
];

const faqs: Array<{ q: string; a: string }> = [
  {
    q: "What image format should I upload?",
    a: "JPG, PNG, JPEG, or WEBP — any format works. For the best results, we recommend high-resolution images (1024px or higher).",
  },
  {
    q: "How long does image generation take?",
    a: "Usually 10–30 seconds, depending on image size and server load. The Empire plan's priority queue makes it even faster.",
  },
  {
    q: "Will my textile design change?",
    a: "The system is designed to preserve your uploaded design as closely as possible. Patterns and colours are kept intact.",
  },
  {
    q: "Can I add my article / design code?",
    a: "Yes. Enable the article number or design code in your generation settings — it will be overlaid on the final output.",
  },
  {
    q: "Can I use generated images commercially?",
    a: "Yes, 100%. Unlimited commercial use is allowed across ads, catalogues, social media, and sales channels.",
  },
  {
    q: "What if the output is not correct?",
    a: "Try a clearer input image, better lighting, or more specific instructions. Unlimited regeneration is available on Pro plans.",
  },
];

/* ─────────────────── Social Platforms ─────────────────── */

type SocialPlatform = {
  name: string;
  handle: string;
  displayName: string;
  url: string;
  Icon: IconType;
  headerGradient: string;
  iconColor: string;
  cta: string;
  embed:
    | { kind: "fb"; pageHref: string }
    | { kind: "twitter"; handle: string }
    | { kind: "pinterest"; user: string; profileUrl: string }
    | { kind: "instagram"; permalink: string }
    | { kind: "youtube"; uploadsPlaylistId: string }
    | { kind: "none"; tagline: string };
};

const socialPlatforms: SocialPlatform[] = [
  {
    name: "Instagram",
    handle: "@agentforgeindia",
    displayName: "AgentForge India",
    url: "https://www.instagram.com/agentforgeindia/",
    Icon: FaInstagram,
    headerGradient:
      "bg-[linear-gradient(135deg,#f59e0b_0%,#ec4899_45%,#8b5cf6_100%)]",
    iconColor: "text-white",
    cta: "Open Instagram profile",
    embed: {
      kind: "instagram",
      permalink:
        "https://www.instagram.com/agentforgeindia/?utm_source=ig_embed&utm_campaign=loading",
    },
  },
  {
    name: "YouTube",
    handle: "@agentforgeindia",
    displayName: "AgentForge India",
    url: "https://www.youtube.com/@agentforgeindia",
    Icon: FaYoutube,
    headerGradient: "bg-[linear-gradient(135deg,#FF0000_0%,#b91c1c_100%)]",
    iconColor: "text-white",
    cta: "Open YouTube channel",
    embed: { kind: "youtube", uploadsPlaylistId: "UUtA6G7quYS8CGnB6YxfGBng" },
  },
  {
    name: "Pinterest",
    handle: "agentforgeindia",
    displayName: "AgentForge India",
    url: "https://in.pinterest.com/agentforgeindia/",
    Icon: FaPinterestP,
    headerGradient: "bg-[linear-gradient(135deg,#E60023_0%,#9a0019_100%)]",
    iconColor: "text-white",
    cta: "Explore on Pinterest",
    embed: {
      kind: "pinterest",
      user: "agentforgeindia",
      profileUrl: "https://in.pinterest.com/agentforgeindia/",
    },
  },
  {
    name: "Facebook",
    handle: "Agentforgeindia",
    displayName: "AgentForge India",
    url: "https://facebook.com/Agentforgeindia",
    Icon: FaFacebookF,
    headerGradient: "bg-[linear-gradient(135deg,#1877F2_0%,#0b5ed7_100%)]",
    iconColor: "text-white",
    cta: "Visit Facebook page",
    embed: { kind: "fb", pageHref: "https://www.facebook.com/Agentforgeindia" },
  },
  {
    name: "X",
    handle: "@Agentforgeindia",
    displayName: "AgentForge India",
    url: "https://x.com/Agentforgeindia",
    Icon: FaXTwitter,
    headerGradient: "bg-[linear-gradient(135deg,#0f172a_0%,#000000_100%)]",
    iconColor: "text-white",
    cta: "Follow on X",
    embed: { kind: "twitter", handle: "Agentforgeindia" },
  },
  {
    name: "LinkedIn",
    handle: "agentforgeindia",
    displayName: "Agent Forge",
    url: "https://www.linkedin.com/in/agentforgeindia/",
    Icon: FaLinkedinIn,
    headerGradient: "bg-[linear-gradient(135deg,#0A66C2_0%,#004182_100%)]",
    iconColor: "text-white",
    cta: "Connect on LinkedIn",
    embed: {
      kind: "none",
      tagline: "Updates, launches & behind-the-scenes from the AgentForge team.",
    },
  },
];

/* ─────────────────────────── Page ─────────────────────────── */

export default function SupportPage() {
  const { darkMode } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Social slider state
  const socialSliderRef = useRef<HTMLDivElement>(null);
  const [activeSocialSlide, setActiveSocialSlide] = useState(0);
  const [socialPaused, setSocialPaused] = useState(false);

  // Twitter widgets.js
  useEffect(() => {
    if (typeof window === "undefined") return;
    const scriptId = "twitter-wjs";
    const reload = () => (window as any).twttr?.widgets?.load?.();
    if (document.getElementById(scriptId)) {
      reload();
      return;
    }
    const s = document.createElement("script");
    s.id = scriptId;
    s.src = "https://platform.twitter.com/widgets.js";
    s.async = true;
    s.onload = reload;
    document.body.appendChild(s);
  }, []);

  // Pinterest pinit.js
  useEffect(() => {
    if (typeof window === "undefined") return;
    const scriptId = "pinterest-pinit";
    if (document.getElementById(scriptId)) {
      (window as any).PinUtils?.build?.();
      return;
    }
    const s = document.createElement("script");
    s.id = scriptId;
    s.src = "https://assets.pinterest.com/js/pinit.js";
    s.async = true;
    s.setAttribute("data-pin-build", "doBuild");
    s.onload = () => (window as any).doBuild?.();
    document.body.appendChild(s);
  }, []);

  // Instagram embeds.js
  useEffect(() => {
    if (typeof window === "undefined") return;
    const scriptId = "instagram-embeds";
    const process = () => (window as any).instgrm?.Embeds?.process?.();
    if (document.getElementById(scriptId)) {
      process();
      return;
    }
    const s = document.createElement("script");
    s.id = scriptId;
    s.src = "https://www.instagram.com/embed.js";
    s.async = true;
    s.onload = process;
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    if (socialPaused) return;
    const id = window.setInterval(() => {
      setActiveSocialSlide((prev) => (prev + 1) % socialPlatforms.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [socialPaused]);

  useEffect(() => {
    const container = socialSliderRef.current;
    if (!container) return;
    const track = container.firstElementChild as HTMLElement | null;
    const target = track?.children[activeSocialSlide] as HTMLElement | undefined;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const left = container.scrollLeft + (rect.left - containerRect.left);
    container.scrollTo({ left, behavior: "smooth" });
  }, [activeSocialSlide]);

  const stepSocial = (dir: -1 | 1) => {
    setActiveSocialSlide((prev) => {
      const next = (prev + dir + socialPlatforms.length) % socialPlatforms.length;
      return next;
    });
  };

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.07] shadow-black/40"
    : "border-black/10 bg-white/80 shadow-black/10";
  const muted = darkMode ? "text-white/60" : "text-black/60";
  const softCard = darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white/70";

  return (
    <main className={`relative min-h-screen overflow-hidden ${bg}`}>
      {/* Gradient glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.08))]" />

      {/* Grid overlay */}
      <div
        className={`fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.14]"}`}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      {/* Floating Doodles — support themed */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="float-slow absolute left-[6%] top-[6%] text-4xl opacity-60 sm:text-5xl">💬</div>
        <div className="float-medium absolute right-[8%] top-[10%] text-4xl opacity-60 sm:text-5xl">❓</div>
        <div className="float-fast absolute left-[22%] top-[14%] text-2xl opacity-55 sm:text-3xl">✨</div>
        <div className="float-medium absolute right-[24%] top-[6%] text-3xl opacity-60 sm:text-4xl">📚</div>
        <div className="float-slow absolute left-[42%] top-[3%] text-2xl opacity-50 sm:text-3xl">🛟</div>
        <div className="float-fast absolute right-[42%] top-[18%] text-3xl opacity-60 sm:text-4xl">🎥</div>

        <div className="float-medium absolute left-[3%] top-[28%] text-3xl opacity-55 sm:text-4xl">📖</div>
        <div className="float-slow absolute right-[4%] top-[32%] text-3xl opacity-55 sm:text-4xl">💡</div>
        <div className="float-fast absolute left-[8%] top-[44%] text-3xl opacity-55 sm:text-4xl">🧑‍💻</div>
        <div className="float-medium absolute right-[6%] top-[46%] text-3xl opacity-55 sm:text-4xl">🤝</div>

        <div className="float-slow absolute left-[35%] top-[52%] text-2xl opacity-50 sm:text-3xl">⚙️</div>
        <div className="float-medium absolute right-[30%] top-[58%] text-2xl opacity-55 sm:text-3xl">🎯</div>
        <div className="float-fast absolute left-[14%] top-[62%] text-3xl opacity-55 sm:text-4xl">✉️</div>
        <div className="float-slow absolute right-[14%] top-[66%] text-3xl opacity-55 sm:text-4xl">📞</div>

        <div className="float-fast absolute left-[20%] top-[78%] text-2xl opacity-55 sm:text-3xl">⭐</div>
        <div className="float-medium absolute right-[18%] top-[82%] text-3xl opacity-60 sm:text-4xl">🚀</div>
        <div className="float-slow absolute left-[48%] top-[88%] text-2xl opacity-50 sm:text-3xl">💫</div>
      </div>

      <div className="relative z-10">
        {/* ───────── Hero ───────── */}
        <section className="relative mx-auto max-w-6xl px-4 py-12 text-center sm:px-5 sm:py-20">
          {/* Glow aura */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-20 -z-10 h-[420px] w-[720px] max-w-[95vw] -translate-x-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, rgba(34,211,238,0.28), rgba(59,130,246,0.12) 55%, transparent 75%)",
              filter: "blur(8px)",
            }}
          />

          {/* Eyebrow */}
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-white/80 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-700 shadow-md shadow-cyan-300/30 backdrop-blur sm:text-[11px] dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-500" />
            Support &amp; Tutorials
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-blue-500" />
          </div>

          {/* Heading */}
          <h1 className="mx-auto max-w-4xl text-[28px] font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            <span className="block">Everything You Need</span>
            <span className="af-shimmer-text mt-3 block text-[22px] sm:text-4xl md:text-5xl">
              Step by Step
            </span>
          </h1>

          <p className={`mx-auto mt-5 max-w-2xl text-sm leading-7 sm:mt-6 sm:text-base sm:leading-8 ${muted}`}>
            Learn how to use AgentForge, watch tutorials, and understand credits
            and output quality — all on one page, with zero confusion.
          </p>

          {/* Live banner */}
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3.5 py-1.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
            </span>
            6 step flow · 3 video tutorials · Custom demo on request
          </p>

          {/* Trust strip */}
          <div className={`mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-2 rounded-2xl border px-3 py-3 text-center backdrop-blur sm:mt-10 sm:gap-4 sm:px-4 ${
            darkMode ? "border-white/10 bg-white/[0.05]" : "border-black/10 bg-white/70"
          }`}>
            <div>
              <p className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-lg font-black text-transparent sm:text-2xl">
                6 Steps
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-wider sm:text-xs ${muted}`}>
                Full flow
              </p>
            </div>
            <div className={`border-x ${darkMode ? "border-white/10" : "border-black/10"}`}>
              <p className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-lg font-black text-transparent sm:text-2xl">
                3 Videos
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-wider sm:text-xs ${muted}`}>
                Tutorials
              </p>
            </div>
            <div>
              <p className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-lg font-black text-transparent sm:text-2xl">
                24×7
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-wider sm:text-xs ${muted}`}>
                Help available
              </p>
            </div>
          </div>

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
            @keyframes afFlowMove {
              0%   { background-position: 0 0; }
              100% { background-position: 22px 0; }
            }
          `}</style>
        </section>

        {/* ───────── Step-by-Step Flow Graph ───────── */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-12">
          <div className={`relative overflow-hidden rounded-[1.5rem] border p-5 backdrop-blur-xl sm:rounded-[2rem] sm:p-10 ${card}`}>
            {/* Decorative blurs */}
            <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="relative mb-10 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
                The Support Flow
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
                <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  How AgentForge support works
                </span>
              </h2>
              <p className={`mx-auto mt-3 max-w-xl text-sm sm:text-base ${muted}`}>
                Six clear steps to go from zero → premium AI visuals — without confusion.
              </p>
            </div>

            {/* Two separate rows of 3 — each row has its own connecting line aligned with its icons */}
            {[stepFlow.slice(0, 3), stepFlow.slice(3, 6)].map((row, rowIdx) => (
              <div
                key={rowIdx}
                className={`relative ${rowIdx === 1 ? "mt-12 sm:mt-14 lg:mt-16" : ""}`}
              >
                {/* Horizontal animated dashed line for this row (desktop) */}
                <div className="pointer-events-none absolute left-[16%] right-[16%] top-[58px] hidden lg:block">
                  <div
                    className="h-0.5 w-full rounded-full opacity-60"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(90deg, rgb(34 211 238) 0 12px, transparent 12px 22px)",
                      animation: "afFlowMove 1.6s linear infinite",
                      backgroundSize: "22px 100%",
                    }}
                  />
                </div>

                {/* Vertical dashed line (mobile/tablet) */}
                <div
                  className="pointer-events-none absolute left-1/2 top-12 bottom-4 -ml-px hidden w-0.5 sm:block lg:hidden"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(180deg, rgb(34 211 238) 0 10px, transparent 10px 20px)",
                    opacity: 0.5,
                  }}
                />

                <div className="relative grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-3 lg:gap-x-4">
                  {row.map((step, i) => {
                    const Icon = step.Icon;
                    const isLast = i === row.length - 1;
                    return (
                      <div
                        key={step.title}
                        className="group relative flex flex-col items-center text-center"
                      >
                        <span className="absolute top-0 z-20 -translate-y-2 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-black tracking-widest text-cyan-600 shadow-md ring-1 ring-cyan-300/50 dark:bg-[#0b1220] dark:text-cyan-300 dark:ring-cyan-500/30">
                          STEP {step.num}
                        </span>

                        <div className="relative mt-3 mb-5">
                          <span
                            className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.tint} opacity-30 blur-xl`}
                          />
                          <div
                            className={`relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br ${step.tint} text-white shadow-2xl shadow-cyan-500/30 ring-4 ring-white/70 transition group-hover:-translate-y-1 group-hover:rotate-3 dark:ring-[#0b1220]`}
                          >
                            <Icon className="h-10 w-10" />
                          </div>
                        </div>

                        {!isLast && (
                          <span className="pointer-events-none absolute right-[-14px] top-[44px] hidden h-8 w-8 items-center justify-center rounded-full bg-white text-cyan-500 shadow-md ring-1 ring-cyan-300/40 lg:flex dark:bg-[#0b1220] dark:ring-cyan-500/30">
                            <ChevronRight className="h-5 w-5" />
                          </span>
                        )}

                        <h4 className="text-lg font-black sm:text-xl">{step.title}</h4>
                        <p className={`mt-2 max-w-[240px] text-sm leading-6 ${muted}`}>
                          {step.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ───────── Tutorials ───────── */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-12">
          <div className={`rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl md:p-8 ${card}`}>
            <div className="mx-auto mb-6 max-w-2xl text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
                Watch &amp; Learn
              </p>
              <h3 className="mt-2 text-2xl font-black sm:text-3xl md:text-4xl">
                <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  Tutorials in 3 short videos
                </span>
              </h3>
              <p className={`mt-2 text-sm leading-6 ${muted}`}>
                Three simple walkthroughs — upload, generate, and add an article code.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {tutorials.map((item, index) => (
                <div key={item.title} className={`group overflow-hidden rounded-3xl border transition hover:-translate-y-1 ${softCard}`}>
                  <div className="relative aspect-video w-full overflow-hidden bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${item.youtubeId}?rel=0&modestbranding=1`}
                      title={item.title}
                      className="h-full w-full"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  <div className="p-5">
                    <p className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700 dark:bg-white/10 dark:text-cyan-200">
                      <PlayCircle className="h-3 w-3" />
                      Video {index + 1}
                    </p>
                    <h4 className="mt-2 text-lg font-black">{item.title}</h4>
                    <p className={`mt-2 text-sm leading-6 ${muted}`}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── Best Practices ───────── */}
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-12">
          <div className={`rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl md:p-8 ${card}`}>
            <div className="mx-auto mb-6 max-w-2xl text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
                Pro tips
              </p>
              <h3 className="mt-2 text-2xl font-black sm:text-3xl">Best Practices</h3>
              <p className={`mt-2 text-sm leading-6 ${muted}`}>Better input gives better AI output.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {bestPractices.map((item) => (
                <div key={item} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold ${softCard}`}>
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-white">
                    <BadgeCheck className="h-3.5 w-3.5" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── Custom Demo ───────── */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-12">
          <div className="relative overflow-hidden rounded-[2rem] border-2 border-cyan-400 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-6 shadow-2xl shadow-cyan-500/20 sm:p-10 dark:from-white/[0.06] dark:via-white/[0.04] dark:to-white/[0.03]">
            <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-blue-500/30 blur-3xl" />

            <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
                  Personalised walkthrough
                </p>
                <h3 className="mt-2 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                    Ask for a Custom Demo
                  </span>
                </h3>
                <p className={`mt-4 max-w-xl text-sm leading-7 sm:text-base ${muted}`}>
                  For factories, agencies, wholesalers, or bulk teams — see
                  AgentForge in action live on your own products. We arrange a
                  customised walkthrough tailored to your use case.
                </p>

                <ul className={`mt-5 space-y-2 text-sm sm:text-base ${darkMode ? "text-white/75" : "text-black/75"}`}>
                  <li className="flex items-start gap-2.5">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
                    1-on-1 video session at your convenience
                  </li>
                  <li className="flex items-start gap-2.5">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
                    Live generation on your actual products
                  </li>
                  <li className="flex items-start gap-2.5">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
                    Plan and workflow guidance for your team size
                  </li>
                </ul>
              </div>

              <div className="grid gap-3">
                <a
                  href="https://wa.me/919041635032?text=Hi%20AgentForge%2C%20I%20would%20like%20to%20request%20a%20custom%20demo."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-emerald-300/50 bg-emerald-50 px-5 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/20 dark:border-emerald-400/30 dark:bg-emerald-500/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/40">
                      <MessageSquare className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-emerald-700 dark:text-emerald-200">WhatsApp Chat</p>
                      <p className="text-[11px] font-semibold text-emerald-700/70 dark:text-emerald-200/70">+91 90416 35032 · Fastest reply</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-emerald-700 transition group-hover:translate-x-1 dark:text-emerald-200" />
                </a>

                <a
                  href="mailto:support@agentforge.in?subject=Custom%20Demo%20Request"
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-cyan-300/50 bg-cyan-50 px-5 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/20 dark:border-cyan-400/30 dark:bg-cyan-500/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-md shadow-cyan-500/40">
                      <Mail className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-cyan-700 dark:text-cyan-200">Email Support</p>
                      <p className="text-[11px] font-semibold text-cyan-700/70 dark:text-cyan-200/70">support@agentforge.in</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-cyan-700 transition group-hover:translate-x-1 dark:text-cyan-200" />
                </a>

                <a
                  href="tel:+919041635032"
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-violet-300/50 bg-violet-50 px-5 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/20 dark:border-violet-400/30 dark:bg-violet-500/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white shadow-md shadow-violet-500/40">
                      <Phone className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-violet-700 dark:text-violet-200">Call Us</p>
                      <p className="text-[11px] font-semibold text-violet-700/70 dark:text-violet-200/70">+91 90416 35032 · Mon – Sat · 10am – 7pm IST</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-violet-700 transition group-hover:translate-x-1 dark:text-violet-200" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── FAQ ───────── */}
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-12">
          <div className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl md:p-10 ${card}`}>
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="relative mb-8 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
                Got questions?
              </p>
              <h3 className="mt-2 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
                <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  Frequently Asked Questions
                </span>
              </h3>
              <p className={`mx-auto mt-3 max-w-xl text-sm sm:text-base ${muted}`}>
                Everything you might want to ask — all in one place.
              </p>
            </div>

            <div className="relative space-y-3">
              {faqs.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={item.q}
                    className={`group overflow-hidden rounded-2xl border transition-all duration-300 ${
                      isOpen
                        ? "border-cyan-400/60 bg-gradient-to-r from-cyan-50/80 to-blue-50/60 shadow-lg shadow-cyan-500/15 dark:from-cyan-500/10 dark:to-blue-500/5"
                        : softCard
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 p-5 text-left"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black transition ${
                            isOpen
                              ? "bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-md shadow-cyan-500/40"
                              : "bg-cyan-50 text-cyan-600 dark:bg-white/10 dark:text-cyan-300"
                          }`}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm font-black sm:text-base">{item.q}</span>
                      </span>
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                          isOpen
                            ? "rotate-180 bg-gradient-to-br from-cyan-400 to-blue-600 text-white"
                            : "bg-cyan-50 text-cyan-600 dark:bg-white/10 dark:text-cyan-300"
                        }`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </span>
                    </button>

                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-5 pb-5">
                          <div className={`flex gap-3 rounded-xl border-l-2 border-cyan-400 bg-cyan-50/50 px-4 py-3 text-sm leading-7 ${muted} dark:bg-white/[0.04]`}>
                            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
                            <span>{item.a}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ───────── Social Media Slider ───────── */}
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-5">
          <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-600">
                Live on socials
              </p>
              <h3 className="mt-1 text-2xl font-black sm:text-3xl">
                Follow AgentForge across the web
              </h3>
              <p className={`mt-1 text-sm ${muted}`}>
                Tap any dashboard to open our profile in a new tab.
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                aria-label="Previous social"
                onClick={() => stepSocial(-1)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition hover:scale-105 ${
                  darkMode
                    ? "border-white/15 bg-white/[0.06] text-white"
                    : "border-black/10 bg-white text-black shadow-sm"
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Next social"
                onClick={() => stepSocial(1)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition hover:scale-105 ${
                  darkMode
                    ? "border-white/15 bg-white/[0.06] text-white"
                    : "border-black/10 bg-white text-black shadow-sm"
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div
            ref={socialSliderRef}
            onMouseEnter={() => setSocialPaused(true)}
            onMouseLeave={() => setSocialPaused(false)}
            onTouchStart={() => setSocialPaused(true)}
            onTouchEnd={() => setSocialPaused(false)}
            className="-mx-4 overflow-x-auto scroll-smooth px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollSnapType: "x mandatory" }}
          >
            <div className="flex gap-4 pb-3">
              {socialPlatforms.map((platform) => {
                const Icon = platform.Icon;
                return (
                  <div
                    key={platform.name}
                    style={{ scrollSnapAlign: "start" }}
                    className={`group relative flex w-[85vw] shrink-0 flex-col overflow-hidden rounded-[1.5rem] border shadow-xl transition hover:-translate-y-1 hover:shadow-2xl sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)] ${
                      darkMode
                        ? "border-white/10 bg-white/[0.04] shadow-black/40"
                        : "border-black/10 bg-white shadow-cyan-500/10"
                    }`}
                  >
                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`relative block h-24 ${platform.headerGradient}`}
                    >
                      <div className="absolute left-3 top-3 flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-white/60" />
                        <span className="h-2.5 w-2.5 rounded-full bg-white/60" />
                        <span className="h-2.5 w-2.5 rounded-full bg-white/60" />
                      </div>
                      <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                        <Icon className={`h-5 w-5 ${platform.iconColor}`} />
                      </div>
                      <div className="absolute -bottom-7 left-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg dark:border-[#0b1220]">
                        <img src="/af-logo.png" alt="AgentForge" className="h-full w-full object-cover" />
                      </div>
                    </a>

                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 pt-9"
                    >
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-black">{platform.displayName}</p>
                        <BadgeCheck className="h-4 w-4 shrink-0 text-cyan-500" />
                      </div>
                      <p className={`truncate text-[11px] font-bold ${muted}`}>
                        {platform.handle} · {platform.name}
                      </p>
                    </a>

                    <div className={`relative mx-4 mt-3 overflow-hidden rounded-2xl border ${
                      darkMode ? "border-white/10 bg-white/[0.04]" : "border-black/5 bg-white"
                    }`}>
                      {platform.embed.kind === "fb" && (
                        <iframe
                          title={`${platform.name} page`}
                          src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
                            platform.embed.pageHref,
                          )}&tabs=timeline&width=340&height=360&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true&appId`}
                          width="340"
                          height="360"
                          loading="lazy"
                          allow="encrypted-media"
                          className="block h-[360px] w-full border-0"
                        />
                      )}

                      {platform.embed.kind === "twitter" && (
                        <div className="h-[360px] overflow-hidden">
                          <a
                            className="twitter-timeline"
                            data-height="360"
                            data-theme={darkMode ? "dark" : "light"}
                            data-chrome="noheader nofooter noborders transparent"
                            href={`https://twitter.com/${platform.embed.handle}`}
                          >
                            Tweets by @{platform.embed.handle}
                          </a>
                        </div>
                      )}

                      {platform.embed.kind === "pinterest" && (
                        <div className="flex h-[360px] items-start justify-center overflow-auto bg-white p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          <a
                            data-pin-do="embedUser"
                            data-pin-board-width="300"
                            data-pin-scale-height="340"
                            data-pin-scale-width="80"
                            href={platform.embed.profileUrl}
                          >
                            View on Pinterest
                          </a>
                        </div>
                      )}

                      {platform.embed.kind === "instagram" && (
                        <div className="flex h-[360px] items-start justify-center overflow-auto bg-white p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          <blockquote
                            className="instagram-media"
                            data-instgrm-permalink={platform.embed.permalink}
                            data-instgrm-version="14"
                            style={{
                              background: "#FFF",
                              border: 0,
                              borderRadius: 3,
                              margin: 1,
                              maxWidth: 540,
                              minWidth: 280,
                              padding: 0,
                              width: "calc(100% - 2px)",
                            }}
                          >
                            <a
                              href={platform.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View profile on Instagram
                            </a>
                          </blockquote>
                        </div>
                      )}

                      {platform.embed.kind === "youtube" && (
                        <iframe
                          title={`${platform.name} channel`}
                          src={`https://www.youtube.com/embed/videoseries?list=${platform.embed.uploadsPlaylistId}&rel=0&modestbranding=1`}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="block h-[360px] w-full border-0"
                        />
                      )}

                      {platform.embed.kind === "none" && (
                        <a
                          href={platform.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-[360px] flex-col items-center justify-center gap-3 p-6 text-center"
                        >
                          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-white ${platform.headerGradient}`}>
                            <Icon className="h-8 w-8" />
                          </div>
                          <p className="text-sm font-black">
                            {platform.displayName} on {platform.name}
                          </p>
                          <p className={`max-w-[260px] text-xs leading-5 ${muted}`}>
                            {platform.embed.tagline}
                          </p>
                          <p className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${muted}`}>
                            {platform.name} doesn&apos;t allow profile embeds — click to view
                          </p>
                        </a>
                      )}
                    </div>

                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex items-center justify-between gap-3 px-4 pb-4"
                    >
                      <span className={`text-[11px] font-bold ${muted}`}>
                        Live · {platform.name}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-black text-white transition group-hover:opacity-95 ${platform.headerGradient}`}>
                        {platform.cta}
                        <ChevronRight className="h-3 w-3" />
                      </span>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5">
            {socialPlatforms.map((p, i) => (
              <button
                key={p.name}
                type="button"
                aria-label={`Go to ${p.name}`}
                onClick={() => setActiveSocialSlide(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeSocialSlide
                    ? "w-6 bg-cyan-500"
                    : darkMode ? "w-1.5 bg-white/30" : "w-1.5 bg-black/20"
                }`}
              />
            ))}
          </div>
        </section>

        {/* ───────── Still need help CTA ───────── */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-5">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-cyan-400 to-blue-600 p-8 text-center text-white shadow-2xl shadow-cyan-500/30 md:p-10">
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

            <div className="relative">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Headphones className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-black md:text-4xl">Still need help?</h3>
              <p className="mx-auto mt-3 max-w-2xl text-white/85">
                Our team is always here for you — log in and start creating
                premium AI visuals right away.
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-4">
                <a
                  href="mailto:support@agentforge.in"
                  className="rounded-full bg-white px-8 py-4 font-black text-black transition hover:scale-105"
                >
                  Contact Support
                </a>
                <Link
                  href="/login"
                  className="rounded-full bg-black/20 px-8 py-4 font-black text-white transition hover:scale-105"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
