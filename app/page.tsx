"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "./components/ThemeProvider";
import {
  Activity,
  BadgeCheck,
  Check,
  ChevronRight,
  Download,
  Gem,
  Shirt,
  Sparkles,
  SprayCan,
  TrendingUp,
  UploadCloud,
  Wand2,
  X as XIcon,
} from "lucide-react";
// LaunchOfferPopup is mounted globally in LayoutClient — no need to import here.
import TrustBadges from "@/app/components/TrustBadges";
import BookDemoButton from "@/app/components/BookDemoButton";
import { hasBulkAccess, hasUnlimitedAccess } from "@/lib/plans";

// Below-the-fold social slider — heavy because it pulls in 4
// third-party embed scripts. Dynamic-import keeps it out of the
// homepage's initial JS chunk; the IntersectionObserver inside
// the component then waits until it scrolls near the viewport.
const HomeSocialSection = dynamic(
  () => import("./components/HomeSocialSection"),
  { ssr: true, loading: () => <div className="h-[600px]" /> },
);

type Agent = {
  title: string;
  desc: string;
  link: string;
  tag: string;
  imageClass: string;
  imageSrc: string;
  icon: "textile" | "jewellery" | "product";
  isNew?: boolean;
};

export default function Home() {
  const { darkMode } = useTheme();
 const [isLoggedIn, setIsLoggedIn] = useState(false);

  /* ───────────── Live generations counter ───────────── */
  // Real counts pulled from /api/stats (Supabase aggregate over the
  // `generations` table). The counter section is HIDDEN until we
  // have authentic numbers, so we never advertise inflated proof.
  //
  // If you want the section to be visible only once you cross a
  // social-proof threshold (e.g. 500 generations), bump COUNTER_FLOOR.
  const COUNTER_FLOOR = 0;
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const [last24h, setLast24h] = useState<number | null>(null);
  const counterVisible =
    liveCount !== null && liveCount >= COUNTER_FLOOR;

  // Fetch real stats on mount + refresh every 60 s, but ONLY while
  // the tab is visible. A background tab firing setInterval keeps
  // the JS thread busy and hurts INP when the user returns. The
  // visibilitychange listener pauses + resumes the timer.
  useEffect(() => {
    let active = true;
    let interval: number | null = null;

    async function load() {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        if (typeof data?.total === "number") setLiveCount(data.total);
        if (typeof data?.last24h === "number") setLast24h(data.last24h);
      } catch {
        // swallow — section stays hidden on network errors.
      }
    }

    function start() {
      if (interval !== null) return;
      interval = window.setInterval(load, 60_000);
    }
    function stop() {
      if (interval !== null) {
        window.clearInterval(interval);
        interval = null;
      }
    }
    function onVis() {
      if (document.visibilityState === "visible") {
        load();
        start();
      } else {
        stop();
      }
    }

    load();
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      active = false;
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const agents: Agent[] = useMemo(
    () => [
      {
        title: "TextilePrints to Mockup AI",
        desc: "Convert textile motifs into premium fashion model mockups with article code placement.",
        link: "/textileprints-to-mockup",
        tag: "Textile AI",
        imageClass:
          "bg-[radial-gradient(circle_at_25%_20%,#22d3ee_0_12%,transparent_13%),repeating-linear-gradient(45deg,#0ea5e9_0_14px,#facc15_14px_28px,#a78bfa_28px_42px,#fb7185_42px_56px)]",
        imageSrc: "/textile-banner.png",
        icon: "textile",
        isNew: true,
      },
      {
        title: "Jewellery AI",
        desc: "Create realistic model shoots and luxury product photography for jewellery brands.",
        link: "/jewellery-ai",
        tag: "Jewellery AI",
        imageClass:
          "bg-[radial-gradient(circle_at_50%_38%,#fff7ad_0_8%,transparent_9%),radial-gradient(circle_at_50%_50%,#f59e0b_0_18%,transparent_19%),linear-gradient(135deg,#fde68a,#f59e0b,#78350f)]",
        imageSrc: "/jewellery-banner.png",
        icon: "jewellery",
        isNew: true,
      },
      {
        title: "Productography AI",
        desc: "Turn product images into catalogue-ready visuals, Instagram posts, and ad creatives.",
        link: "/productography-ai",
        tag: "Productography AI",
        imageClass:
          "bg-[radial-gradient(circle_at_35%_35%,#ffffffaa_0_10%,transparent_11%),linear-gradient(135deg,#67e8f9,#2563eb,#7c3aed)]",
        imageSrc: "/productography-banner.png",
        icon: "product",
        isNew: true,
      },
    ],
    [],
  );


  const AgentIcon = ({ type }: { type: Agent["icon"] }) => {
    if (type === "textile") return <Shirt className="h-5 w-5 text-cyan-500" />;
    if (type === "jewellery") return <Gem className="h-5 w-5 text-amber-500" />;
    return <SprayCan className="h-5 w-5 text-violet-500" />;
  };

  // The entire social slider — state, refs, embed-script gating
  // and auto-rotation — now lives inside HomeSocialSection, which
  // is dynamic-imported at the top of this file.

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

  const bg = darkMode
    ? "bg-[#070b14] text-white"
    : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "bg-white/[0.07] border-white/10 shadow-black/40"
    : "bg-white/80 border-black/10 shadow-black/10";
  const muted = darkMode ? "text-white/65" : "text-black/60";

 return (
  <>
    {/* LaunchOfferPopup is already rendered globally by LayoutClient.
        Removing the duplicate instance here saves an extra mount +
        two useEffects on every homepage paint. */}

    <main className={`relative min-h-screen overflow-hidden ${bg}`}>

      {/* Gradient Glow Layer */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee66,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf655,transparent_35%),radial-gradient(circle_at_bottom,#0ea5e955,transparent_30%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.08))]" />

      {/* Grid Overlay */}
      <div
        className={`fixed inset-0 ${darkMode ? "opacity-[0.05]" : "opacity-[0.10]"}`}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      {/* Floating doodles — kept to 8 (down from 17) to reduce
          continuous repaint cost. Each animated element forces
          paint+composite every frame, hurting INP on weaker phones. */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="float-slow absolute left-[6%] top-[6%] text-4xl opacity-70 sm:text-5xl">✨</div>
        <div className="float-medium absolute right-[8%] top-[10%] text-4xl opacity-70 sm:text-5xl">💎</div>
        <div className="float-medium absolute left-[3%] top-[28%] text-3xl opacity-60 sm:text-4xl">👕</div>
        <div className="float-slow absolute right-[4%] top-[32%] text-3xl opacity-60 sm:text-4xl">💍</div>
        <div className="float-fast absolute left-[8%] top-[44%] text-3xl opacity-55 sm:text-4xl">📸</div>
        <div className="float-fast absolute left-[14%] top-[62%] text-3xl opacity-55 sm:text-4xl">🚀</div>
        <div className="float-slow absolute right-[14%] top-[66%] text-3xl opacity-55 sm:text-4xl">🎁</div>
        <div className="float-medium absolute right-[18%] top-[82%] text-3xl opacity-60 sm:text-4xl">✨</div>
      </div>

      <div className="relative z-10">
        <section className="relative mx-auto max-w-6xl px-4 py-12 text-center sm:px-5 sm:py-20 md:py-24">
          {/* Soft glowing aura behind the heading */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-24 -z-10 h-[420px] w-[720px] max-w-[95vw] -translate-x-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, rgba(34,211,238,0.28), rgba(59,130,246,0.12) 55%, transparent 75%)",
              filter: "blur(8px)",
            }}
          />

          {/* AI POWERED eyebrow pill */}
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-white/80 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-700 shadow-md shadow-cyan-300/30 backdrop-blur sm:text-[11px] dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-500" />
            AI Powered Visual Studio
            <span className="hidden h-1 w-1 rounded-full bg-cyan-400 sm:inline-block" />
            <span className="hidden sm:inline">New</span>
          </div>

          {/* Heading */}
          <h1 className="mx-auto max-w-4xl text-[28px] font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            <span className="block">Turn Mobile Photos Into</span>
            <span className="block">Premium Catalogue Shoots</span>
            <span className="af-shimmer-text mt-3 block text-[24px] sm:text-4xl md:text-5xl">
              Using AI — in 60 seconds.
            </span>
          </h1>

          <p className={`mx-auto mt-5 max-w-2xl text-sm leading-7 sm:mt-6 sm:text-base sm:leading-8 ${muted}`}>
            No models. No studio. No photoshoot. Just upload your product,
            motif or jewellery photo — and get catalogue-ready visuals ready
            for ads, WhatsApp and store listings.
          </p>

          {/* CTAs */}
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:mt-9 sm:flex-row sm:gap-4">
            <Link
              href={isLoggedIn ? "/textileprints-to-mockup" : "/signup"}
              className="group relative w-full max-w-xs overflow-hidden rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-3.5 text-center text-sm font-black text-white shadow-xl shadow-cyan-500/40 transition hover:scale-[1.04] sm:w-auto sm:px-9 sm:py-4 sm:text-base"
              style={{ animation: "afCtaPulse 2.6s ease-in-out infinite" }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
                style={{ animation: "afShine 2.8s ease-in-out infinite" }}
              />
              <span className="relative inline-flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 animate-pulse" />
                Start Creating
              </span>
            </Link>
            <Link
              href="/gallery"
              className={`group inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border px-7 py-3.5 text-sm font-bold transition hover:scale-[1.02] sm:w-auto sm:px-9 sm:py-4 sm:text-base ${
                darkMode
                  ? "border-white/15 bg-white/10 text-white"
                  : "border-black/10 bg-white text-black shadow-sm"
              }`}
            >
              See Visuals
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <BookDemoButton className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-purple-500/30 transition hover:scale-[1.03] sm:w-auto sm:px-9 sm:py-4 sm:text-base" />
          </div>

          {/* Sub-info banner */}
          <p className={`mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3.5 py-1.5 text-[11px] font-semibold text-cyan-700 sm:text-xs dark:text-cyan-200`}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
            </span>
            Live credits &amp; profile shown in the top bar after login
          </p>

          {/* Trust strip */}
          <div className={`mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-2 rounded-2xl border px-3 py-3 text-center backdrop-blur sm:mt-10 sm:gap-4 sm:px-4 ${
            darkMode ? "border-white/10 bg-white/[0.05]" : "border-black/10 bg-white/70"
          }`}>
            <div>
              <p className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-lg font-black text-transparent sm:text-2xl">
                3 Agents
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-wider sm:text-xs ${muted}`}>
                Textile · Jewellery · Product
              </p>
            </div>
            <div className={`border-x ${darkMode ? "border-white/10" : "border-black/10"}`}>
              <p className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-lg font-black text-transparent sm:text-2xl">
                ~30 sec
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-wider sm:text-xs ${muted}`}>
                Per AI Visual
              </p>
            </div>
            <div>
              <p className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-lg font-black text-transparent sm:text-2xl">
                No Studio
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-wider sm:text-xs ${muted}`}>
                Zero shoot setup
              </p>
            </div>
          </div>

          {/* Trust badges */}
          <TrustBadges
            variant="grid"
            darkMode={darkMode}
            title="Trusted by businesses across India"
            className="mx-auto mt-6 max-w-4xl sm:mt-8"
          />

          {/* Inline keyframes (scoped via class) */}
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
        </section>

        {/* ───────── Live Generations Counter ─────────
            Hidden until we have authentic non-zero numbers from
            /api/stats. Better no counter than a fake one. */}
        {counterVisible && (
        <section className="mx-auto max-w-5xl px-4 pb-4 sm:px-5 sm:pb-6">
          <div className={`group relative overflow-hidden rounded-[1.5rem] border-2 p-4 shadow-xl backdrop-blur-xl sm:p-5 ${
            darkMode
              ? "border-cyan-400/40 bg-gradient-to-r from-white/[0.04] via-cyan-500/[0.06] to-blue-500/[0.06]"
              : "border-cyan-400 bg-gradient-to-r from-white via-cyan-50 to-blue-50 shadow-cyan-500/20"
          }`}>
            {/* Blurs */}
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-blue-500/30 blur-3xl" />

            <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Big counter */}
              <div className="flex items-center gap-3 text-center sm:text-left">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/40 sm:h-14 sm:w-14">
                  <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7" />
                </span>
                <div>
                  <p className="leading-none">
                    <span
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text font-black text-transparent"
                      style={{
                        fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {(liveCount ?? 0).toLocaleString("en-IN")}+
                    </span>
                  </p>
                  <p className={`mt-1 text-xs font-black uppercase tracking-[0.2em] sm:text-[13px] ${muted}`}>
                    AI Visuals Generated
                  </p>
                </div>
              </div>

              {/* Right: live indicator + last 24h */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/50 bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Live
                </span>

                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black ${
                  darkMode ? "border-white/15 bg-white/[0.06] text-white/85" : "border-black/10 bg-white text-black/75 shadow-sm"
                }`}>
                  <Activity className="h-3.5 w-3.5 text-cyan-500" />
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>
                    {(last24h ?? 0).toLocaleString("en-IN")}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${muted}`}>
                    in last 24h
                  </span>
                </span>

                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black ${
                  darkMode ? "border-white/15 bg-white/[0.06] text-white/85" : "border-black/10 bg-white text-black/75 shadow-sm"
                }`}>
                  <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                  Updated every minute
                </span>
              </div>
            </div>
          </div>
        </section>
        )}

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-12">
          <div className="mb-6 text-center sm:mb-8">
            <h2 className="text-2xl font-black sm:text-3xl md:text-4xl">Our AI Agents</h2>
            <p className={`mx-auto mt-3 max-w-2xl text-sm leading-6 sm:text-base sm:leading-7 ${muted}`}>
              Three powerful AI agents built to make product visuals faster,
              smarter, and more premium.
            </p>
          </div>

          <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
            {agents.map((item) => (
              <Link
                key={item.title}
                href={item.link}
                className={`group relative overflow-hidden rounded-[2rem] border shadow-xl backdrop-blur-xl transition hover:-translate-y-1 ${card}`}
              >
                {item.isNew && (
                  <>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-rose-500/30 ring-2 ring-white/50"
                      style={{ animation: "afNewPulse 1.8s ease-in-out infinite" }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      Newly Launched
                    </span>
                    <style>{`
                      @keyframes afNewPulse {
                        0%, 100% { transform: scale(1); box-shadow: 0 8px 22px -8px rgba(244,63,94,0.55); }
                        50%      { transform: scale(1.06); box-shadow: 0 10px 26px -6px rgba(244,63,94,0.75); }
                      }
                    `}</style>
                  </>
                )}
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={item.imageSrc}
                    alt={`${item.title} generated using AgentForge AI`}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5 sm:p-6">
                  <p className="mb-3 inline-flex rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-600">
                    {item.tag}
                  </p>
                  <h4 className="flex items-center gap-2 text-xl font-black sm:text-2xl">
                    <AgentIcon type={item.icon} />
                    {item.title}
                  </h4>
                  <p className={`mt-3 text-sm leading-6 sm:text-base sm:leading-7 ${muted}`}>{item.desc}</p>
                  <div className="mt-5 inline-flex rounded-full bg-black px-5 py-3 text-sm font-black text-white sm:mt-6">
                    Open Agent
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-12">
          <div className={`relative overflow-hidden rounded-[1.5rem] border p-5 backdrop-blur-xl sm:rounded-[2rem] sm:p-10 ${card}`}>
            {/* Decorative blurs */}
            <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />

            {/* Heading */}
            <div className="relative mb-10 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
                The Flow
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
                <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  How AgentForge Works
                </span>
              </h2>
              <p className={`mx-auto mt-3 max-w-xl text-sm sm:text-base ${muted}`}>
                Four steps. Zero setup. Business-grade output every time.
              </p>
            </div>

            {/* Flow graph */}
            <div className="relative">
              {/* Horizontal animated dashed line (desktop only)
                  Positioned to pass through the centre of the icon nodes.
                  Step chip is absolutely positioned (doesn't affect flow),
                  so icon vertical centre = mt-3 (12px) + h-24/2 (48px) = 60px
                  from the top of each step div. */}
              <div className="pointer-events-none absolute left-[12%] right-[12%] top-[60px] hidden -translate-y-1/2 lg:block">
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
                className="pointer-events-none absolute left-1/2 top-12 bottom-12 -ml-px hidden w-0.5 sm:block lg:hidden"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(180deg, rgb(34 211 238) 0 10px, transparent 10px 20px)",
                  opacity: 0.5,
                }}
              />

              <div className="relative grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-4 lg:gap-4">
                {[
                  {
                    num: "01",
                    title: "Upload",
                    desc: "Upload your product, motif, or jewellery image.",
                    Icon: UploadCloud,
                    tint: "from-cyan-300 to-cyan-500",
                  },
                  {
                    num: "02",
                    title: "Customize",
                    desc: "Choose model, style, background, and output quality.",
                    Icon: Wand2,
                    tint: "from-cyan-400 to-blue-500",
                  },
                  {
                    num: "03",
                    title: "Generate",
                    desc: "Let the AI agent create your premium visual.",
                    Icon: Sparkles,
                    tint: "from-blue-500 to-indigo-500",
                  },
                  {
                    num: "04",
                    title: "Download",
                    desc: "Download, share, or send the output to your client.",
                    Icon: Download,
                    tint: "from-indigo-500 to-blue-600",
                  },
                ].map((step, i, arr) => {
                  const Icon = step.Icon;
                  const isLast = i === arr.length - 1;
                  return (
                    <div
                      key={step.title}
                      className="group relative flex flex-col items-center text-center"
                    >
                      {/* Step number chip */}
                      <span className="absolute top-0 z-20 -translate-y-2 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-black tracking-widest text-cyan-600 shadow-md ring-1 ring-cyan-300/50 dark:bg-[#0b1220] dark:text-cyan-300 dark:ring-cyan-500/30">
                        STEP {step.num}
                      </span>

                      {/* Icon node */}
                      <div className="relative mt-3 mb-5">
                        {/* Pulse ring */}
                        <span
                          className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.tint} opacity-30 blur-xl`}
                        />
                        <div
                          className={`relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br ${step.tint} text-white shadow-2xl shadow-cyan-500/30 ring-4 ring-white/70 transition group-hover:-translate-y-1 group-hover:rotate-3 dark:ring-[#0b1220]`}
                        >
                          <Icon className="h-10 w-10" />
                        </div>
                      </div>

                      {/* Inline arrow (desktop, between nodes) — centered on the dashed line */}
                      {!isLast && (
                        <ChevronRight className="pointer-events-none absolute right-[-14px] top-[60px] hidden h-6 w-6 -translate-y-1/2 text-cyan-500 lg:block" />
                      )}

                      <h4 className="text-lg font-black sm:text-xl">{step.title}</h4>
                      <p className={`mt-2 max-w-[220px] text-sm leading-6 ${muted}`}>
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <style>{`
              @keyframes afFlowMove {
                0%   { background-position: 0 0; }
                100% { background-position: 22px 0; }
              }
            `}</style>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-12">
          <div className="mb-10 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
              Who it&apos;s for
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
              <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                Built for sellers, brands & creative teams
              </span>
            </h2>
            <p className={`mx-auto mt-3 max-w-2xl text-sm leading-7 sm:text-base ${muted}`}>
              A dedicated AI agent for every category. Pick your industry —
              jump straight into the agent and start generating.
            </p>
          </div>

          {[
            {
              tag: "Textile AI",
              tagline: "TextilePrints to Mockup AI",
              link: "/textileprints-to-mockup",
              Icon: Shirt,
              accent: "from-cyan-400 to-blue-500",
              ringColor: "ring-cyan-400/40",
              shadowColor: "shadow-cyan-500/30",
              bgGlow: "bg-cyan-400/15",
              // Muted tint for use-case card icons (less colorful overall)
              softBg: "bg-cyan-50 dark:bg-cyan-500/10",
              softText: "text-cyan-600 dark:text-cyan-300",
              uses: [
                {
                  title: "Textile Sellers & Wholesalers",
                  desc: "Catalogue mockups with article codes — bulk ready.",
                },
                {
                  title: "Fashion Designers",
                  desc: "Turn your motifs into model-worn collection visuals.",
                },
                {
                  title: "Garment Manufacturers",
                  desc: "Saree, kurta, suit, kidswear — instant model shoots on every product.",
                },
              ],
            },
            {
              tag: "Jewellery AI",
              tagline: "Jewellery AI Studio",
              link: "/jewellery-ai",
              Icon: Gem,
              accent: "from-amber-400 to-orange-500",
              ringColor: "ring-amber-400/40",
              shadowColor: "shadow-amber-500/30",
              bgGlow: "bg-amber-400/15",
              softBg: "bg-amber-50 dark:bg-amber-500/10",
              softText: "text-amber-600 dark:text-amber-300",
              uses: [
                {
                  title: "Jewellery Brands & Showrooms",
                  desc: "Luxury studio shoots without hiring a single model.",
                },
                {
                  title: "Goldsmith & Diamond Studios",
                  desc: "Necklace, ring, earring — premium catalogue images on demand.",
                },
                {
                  title: "Boutique & Online Stores",
                  desc: "Instagram-ready shots, festive campaigns, ad creatives.",
                },
              ],
            },
            {
              tag: "Productography AI",
              tagline: "Productography AI",
              link: "/productography-ai",
              Icon: SprayCan,
              accent: "from-violet-400 to-fuchsia-500",
              ringColor: "ring-violet-400/40",
              shadowColor: "shadow-violet-500/30",
              bgGlow: "bg-violet-400/15",
              softBg: "bg-violet-50 dark:bg-violet-500/10",
              softText: "text-violet-600 dark:text-violet-300",
              uses: [
                {
                  title: "E-commerce Sellers",
                  desc: "Hero product shots for Amazon, Flipkart, and Meesho listings.",
                },
                {
                  title: "Instagram Shops & D2C Brands",
                  desc: "Lifestyle ad creatives, carousels, festive launches.",
                },
                {
                  title: "Creative Agencies",
                  desc: "Client pitch decks, mood boards, fast turnaround visuals.",
                },
              ],
            },
          ].map((group) => {
            const Icon = group.Icon;
            return (
              <div key={group.tag} className="mb-8 last:mb-0">
                {/* Group header */}
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${group.accent} text-white shadow-xl ${group.shadowColor}`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className={`absolute inset-0 -z-10 rounded-2xl ${group.bgGlow} blur-xl`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[10px] font-black uppercase tracking-[0.22em] bg-gradient-to-r ${group.accent} bg-clip-text text-transparent`}
                    >
                      {group.tag}
                    </p>
                    <h4 className="text-lg font-black sm:text-xl">{group.tagline}</h4>
                  </div>
                  <Link
                    href={group.link}
                    className={`hidden shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black transition hover:-translate-y-0.5 sm:inline-flex ${group.softBg} ${group.softText}`}
                  >
                    Open agent
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Use-case cards — muted styling for less colorful overall feel */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.uses.map((u) => (
                    <Link
                      key={u.title}
                      href={group.link}
                      className={`group relative overflow-hidden rounded-3xl border p-5 backdrop-blur-xl transition hover:-translate-y-1 ${card}`}
                    >
                      {/* Subtle ring on hover only (no constant float animation) */}
                      <span
                        className={`pointer-events-none absolute -inset-px rounded-3xl opacity-0 ring-2 transition group-hover:opacity-100 ${group.ringColor}`}
                      />

                      <div className="relative flex items-start gap-3">
                        {/* Muted icon tile — soft tinted bg + colored icon (was full gradient) */}
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${group.softBg} ${group.softText}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-sm font-black sm:text-base">{u.title}</h5>
                          <p className={`mt-1 text-[12px] leading-5 sm:text-sm sm:leading-6 ${muted}`}>
                            {u.desc}
                          </p>
                        </div>
                      </div>

                      {/* Subtle CTA — plain text + small chevron (was gradient text + gradient circle) */}
                      <div className="relative mt-4 flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${group.softText}`}>
                          Open {group.tag}
                        </span>
                        <ChevronRight className={`h-4 w-4 ${group.softText} transition group-hover:translate-x-1`} />
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Mobile open-agent button */}
                <Link
                  href={group.link}
                  className={`mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r ${group.accent} px-4 py-3 text-xs font-black text-white shadow-lg ${group.shadowColor} sm:hidden`}
                >
                  Open {group.tag}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            );
          })}

          <style>{`
            @keyframes afCardFloat {
              0%, 100% { transform: translateY(0); }
              50%      { transform: translateY(-3px); }
            }
          `}</style>
        </section>

        {/* ───────── Popular AI tools (SEO internal-link hub) ───────── */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-12">
          <div className="mb-6 text-center sm:mb-8">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
              Popular AI tools
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
              Explore by what you sell
            </h2>
            <p className={`mx-auto mt-2 max-w-2xl text-sm leading-6 sm:text-base ${muted}`}>
              Jump directly to the AI tool built for your industry — already used by businesses across India.
            </p>
          </div>

          <div className="grid items-start gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
            {[
              {
                href: "/ai-textile-mockup-generator-india",
                title: "AI Textile Mockup Generator India",
                desc: "Saree, kurti, kurta, lehenga, kidswear & home textile mockups.",
                icon: "/icons/tshirt.svg",
                tintBg: darkMode ? "bg-cyan-500/10" : "bg-cyan-50",
              },
              {
                href: "/ai-jewellery-photoshoot",
                title: "AI Jewellery Photoshoot",
                desc: "Bridal, diamond, kundan, daily-wear catalogue images.",
                icon: "/jewellery-icon/necklace.svg",
                tintBg: darkMode ? "bg-amber-500/10" : "bg-amber-50",
              },
              {
                href: "/ai-saree-mockup",
                title: "AI Saree Mockup",
                desc: "Flat saree to model-worn catalogue image in 60 seconds.",
                icon: "/icons/saree.svg",
                tintBg: darkMode ? "bg-rose-500/10" : "bg-rose-50",
              },
              {
                href: "/ai-kurti-catalogue-maker",
                title: "AI Kurti Catalogue Maker",
                desc: "Daily WhatsApp & Instagram kurti drops, ready in minutes.",
                icon: "/icons/kurti.svg",
                tintBg: darkMode ? "bg-violet-500/10" : "bg-violet-50",
              },
              {
                href: "/ai-product-photography-india",
                title: "AI Product Photography India",
                desc: "Amazon-ready hero shots for D2C brands and ecommerce.",
                icon: "/Productography-icons/cosmatics.svg",
                tintBg: darkMode ? "bg-emerald-500/10" : "bg-emerald-50",
              },
            ].map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ animation: `afCardFloat 5s ease-in-out ${i * 0.3}s infinite` }}
                className={`group relative flex flex-col overflow-hidden rounded-[1.5rem] border shadow-lg backdrop-blur transition hover:-translate-y-1 hover:shadow-xl ${
                  darkMode
                    ? "border-white/10 bg-white/[0.05] hover:border-cyan-300/50"
                    : "border-black/10 bg-white/85 hover:border-cyan-300"
                }`}
              >
                <div className={`relative aspect-[16/10] w-full overflow-hidden ${item.tintBg}`}>
                  <img
                    src={item.icon}
                    alt={`${item.title} icon`}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <div className="flex flex-col p-5">
                  <h4 className="text-base font-black leading-snug sm:text-lg">{item.title}</h4>
                  <p className={`mt-2 line-clamp-2 text-xs leading-5 sm:text-sm sm:leading-6 ${muted}`}>
                    {item.desc}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-black text-cyan-600 dark:text-cyan-300">
                    Open →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <style>{`
            @keyframes afCardFloat {
              0%, 100% { transform: translateY(0); }
              50%      { transform: translateY(-6px); }
            }
          `}</style>

          <div className="mt-6 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400/10 px-5 py-2.5 text-sm font-black text-cyan-700 transition hover:scale-105 dark:text-cyan-300"
            >
              📝 Read our AI guides on the blog →
            </Link>
          </div>
        </section>

        <HomeSocialSection darkMode={darkMode} muted={muted} />

      </div>
  
      {/* ───────── Why We Built AgentForge + Why AgentForge? (compact 2-col) ───────── */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-14">
        <div className="grid items-stretch gap-5 lg:grid-cols-2">
        {/* Left — Founder note */}
        <div className={`relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border p-5 shadow-xl backdrop-blur-xl sm:p-7 ${
          darkMode
            ? "border-white/10 bg-white/[0.05]"
            : "border-black/10 bg-gradient-to-br from-white via-cyan-50/40 to-blue-50/40"
        }`}>
          {/* Subtle blurs */}
          <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />

          {/* Header row — logo + (eyebrow + heading), each on its own clean line */}
          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md shadow-cyan-500/20 sm:h-14 sm:w-14 dark:border-[#0b1220]">
              <Image
                src="/af-logo.png"
                alt="AgentForge"
                width={56}
                height={56}
                sizes="(min-width: 640px) 56px, 48px"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.22em] text-cyan-600">
                Founder note · AgentForge
              </p>
              <h2 className="mt-1 whitespace-nowrap text-xl font-black leading-tight sm:text-2xl">
                <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  Why We Built AgentForge
                </span>
              </h2>
            </div>
          </div>

          {/* Story — tight 3 paragraphs + inline quote */}
          <div className={`relative mt-5 flex-1 space-y-3 text-sm leading-6 ${muted}`}>
            <p>
              AgentForge was built after years of working closely with
              businesses through digital marketing &amp; creative services since{" "}
              <span className={`font-black ${darkMode ? "text-white" : "text-black"}`}>2018</span>.
              We saw the same problem everywhere — delays in design work,
              dependency on teams, and constant back-and-forth to create
              product visuals.
            </p>

            <p className={`rounded-xl border-l-4 border-cyan-400 px-3 py-2 text-[13px] italic ${
              darkMode ? "bg-cyan-500/5 text-white/80" : "bg-cyan-50/60 text-black/80"
            }`}>
              No one understands a product better than the business owner
              itself.
            </p>

            <p>
              So we built a system where businesses can{" "}
              <span className={`font-black ${darkMode ? "text-white" : "text-black"}`}>
                directly create premium visuals on their own
              </span>
              {" "}— without waiting for designers, studios, or models. What
              once took days now happens in{" "}
              <span className={`font-black ${darkMode ? "text-white" : "text-black"}`}>
                under 60 seconds
              </span>.
            </p>


{/* Full-width closing quote strip (below both cards) */}
        <div className={`relative mt-5 flex items-center gap-4 overflow-hidden rounded-[1.5rem] border p-5 shadow-lg backdrop-blur-xl sm:p-6 ${
          darkMode
            ? "border-cyan-400/30 bg-gradient-to-r from-white/[0.04] via-cyan-500/[0.06] to-blue-500/[0.06]"
            : "border-cyan-300/60 bg-gradient-to-r from-white via-cyan-50 to-blue-50"
        }`}>
          <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-cyan-400/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-blue-500/25 blur-3xl" />

          <span
            aria-hidden="true"
            className={`pointer-events-none relative shrink-0 font-serif text-6xl leading-none sm:text-7xl ${
              darkMode ? "text-cyan-400/30" : "text-cyan-400/60"
            }`}
          >
            &ldquo;
          </span>


          <p className={`relative flex-1 text-sm font-bold italic leading-7 sm:text-base sm:leading-7 ${
            darkMode ? "text-white/90" : "text-black/85"
          }`}>
            We&apos;re not trying to replace creativity,{" "}
            <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
              we&apos;re trying to help businesses move faster.
            </span>
          </p>
        </div>
          </div>
        </div>

        {/* Right — Why AgentForge? Comparison table */}
        <div className={`relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border-2 border-cyan-400 p-5 shadow-xl shadow-cyan-500/20 backdrop-blur-xl sm:p-7 ${
          darkMode
            ? "bg-gradient-to-br from-white/[0.06] via-cyan-500/[0.04] to-blue-500/[0.04]"
            : "bg-gradient-to-br from-white via-cyan-50 to-blue-50"
        }`}>
          {/* Blurs */}
          <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-cyan-400/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-rose-400/20 blur-3xl" />

          {/* Header */}
          <div className="relative flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/40 sm:h-14 sm:w-14">
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-600">
                The Comparison
              </p>
              <h2 className="mt-0.5 text-xl font-black leading-tight sm:text-2xl md:text-3xl">
                <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  Why AgentForge?
                </span>
              </h2>
            </div>
          </div>

          <p className={`relative mt-3 text-sm leading-6 ${muted}`}>
            Common objections — answered side by side.
          </p>

          {/* Column headers */}
          <div className="relative mt-5 grid grid-cols-2 gap-2">
            <div className={`rounded-xl border px-3 py-2 text-center ${
              darkMode ? "border-rose-400/30 bg-rose-500/10" : "border-rose-300/60 bg-rose-50"
            }`}>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-600 dark:text-rose-300">
                Traditional Shoot
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-3 py-2 text-center shadow-md shadow-cyan-500/30">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white">
                AgentForge
              </p>
            </div>
          </div>

          {/* Rows */}
          <div className="relative mt-2 space-y-2">
            {[
              { trad: "₹25k photoshoot", af: "AI generation" },
              { trad: "4 – 7 days", af: "~60 seconds" },
              { trad: "Models required", af: "No model needed" },
              { trad: "Stitching needed", af: "Design only" },
            ].map((row) => (
              <div key={row.trad} className="grid grid-cols-2 gap-2">
                {/* Traditional cell */}
                <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
                  darkMode ? "border-white/10 bg-white/[0.04]" : "border-black/10 bg-white/80"
                }`}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-500">
                    <XIcon className="h-3 w-3" />
                  </span>
                  <span className={`text-xs font-bold leading-5 sm:text-[13px] ${
                    darkMode ? "text-white/70 line-through decoration-rose-400/50" : "text-black/65 line-through decoration-rose-400/60"
                  }`}>
                    {row.trad}
                  </span>
                </div>

                {/* AgentForge cell */}
                <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
                  darkMode ? "border-cyan-400/30 bg-cyan-500/10" : "border-cyan-300/60 bg-white shadow-sm shadow-cyan-500/10"
                }`}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-sm shadow-cyan-500/30">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="text-xs font-black leading-5 sm:text-[13px]">
                    {row.af}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom badge */}
          <div className="relative mt-auto flex flex-wrap items-center gap-2 pt-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-3.5 py-1.5 text-[11px] font-black text-white shadow-md shadow-cyan-500/30">
              <Sparkles className="h-3.5 w-3.5" />
              Save up to 95%
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black ${
              darkMode ? "border-white/15 bg-white/[0.06] text-white/85" : "border-black/10 bg-white text-black/75"
            }`}>
              <BadgeCheck className="h-3.5 w-3.5 text-cyan-500" />
              No model · No studio · No wait
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-300/60 bg-gradient-to-r from-orange-50 via-white to-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-orange-700 dark:border-orange-400/30 dark:from-orange-500/10 dark:via-white/5 dark:to-emerald-500/10 dark:text-orange-200">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              Built in India
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/60 bg-white/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200">
              <Sparkles className="h-3 w-3" />
              Since 2018
            </span>
          </div>
        </div>
        </div>

        
      </section>
    </main>
    </>
  );
}
