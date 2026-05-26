"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "./components/ThemeProvider";
import {
  Activity,
  BadgeCheck,
  Check,
  ChevronLeft,
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
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPinterestP,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import type { IconType } from "react-icons";
import LaunchOfferPopup from "@/app/components/LaunchOfferPopup";
import TrustBadges from "@/app/components/TrustBadges";
import { hasBulkAccess, hasUnlimitedAccess } from "@/lib/plans";

type SocialPlatform = {
  name: string;
  handle: string;
  displayName: string;
  url: string;
  Icon: IconType;
  headerGradient: string;
  iconColor: string;
  cta: string;
  /**
   * "fb"        → Facebook Page Plugin iframe.
   * "twitter"   → Twitter widgets.js timeline.
   * "pinterest" → Pinterest pinit.js profile widget.
   * "instagram" → Instagram official blockquote embed (embeds.js).
   * "youtube"   → YouTube uploads playlist iframe.
   * "linkedin"  → LinkedIn official Profile Badge widget.
   * "none"      → styled fallback CTA card.
   */
  embed:
    | { kind: "fb"; pageHref: string }
    | { kind: "twitter"; handle: string }
    | { kind: "pinterest"; user: string; profileUrl: string }
    | { kind: "instagram"; permalink: string }
    | { kind: "youtube"; uploadsPlaylistId: string }
    | { kind: "linkedin"; vanity: string; profileUrl: string }
    | { kind: "none"; tagline: string };
};

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
  // Starting baseline — adjust upward over time as your real numbers grow.
  const COUNTER_BASE = 12842;
  const COUNTER_LAST_24H = 247;
  const [liveCount, setLiveCount] = useState(0);
  const [last24h, setLast24h] = useState(0);

  // Animated count-up on mount (ease-out cubic)
  useEffect(() => {
    const start = performance.now();
    const duration = 2200;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setLiveCount(Math.floor(COUNTER_BASE * eased));
      setLast24h(Math.floor(COUNTER_LAST_24H * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Periodic +1..3 to feel "live" — every 8–14s
  useEffect(() => {
    const tickOnce = () => {
      setLiveCount((c) => c + Math.floor(Math.random() * 3) + 1);
      if (Math.random() < 0.4) setLast24h((c) => c + 1);
    };
    let timeout = window.setTimeout(function loop() {
      tickOnce();
      timeout = window.setTimeout(loop, 8000 + Math.random() * 6000);
    }, 8000 + Math.random() * 6000);
    return () => window.clearTimeout(timeout);
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
        imageSrc: "/textile-banner.png?v=2",
        icon: "textile",
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

  const socialPlatforms: SocialPlatform[] = useMemo(
    () => [
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
        // Uploads playlist id = channel id with first 2 chars swapped from "UC" → "UU"
        // Channel ID: UCtA6G7quYS8CGnB6YxfGBng  →  Uploads: UUtA6G7quYS8CGnB6YxfGBng
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
    kind: "linkedin",
    vanity: "agentforgeindia",
    profileUrl: "https://in.linkedin.com/in/agentforgeindia?trk=profile-badge",
  },
},
    ],
    [],
  );

  const socialSliderRef = useRef<HTMLDivElement>(null);
  const [activeSocialSlide, setActiveSocialSlide] = useState(0);
  const [socialPaused, setSocialPaused] = useState(false);

  // Load Twitter widgets.js once and re-scan whenever the slider mounts.
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

  // Load Pinterest pinit.js once.
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

  // Load Instagram embeds.js once and re-process whenever the slider mounts.
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

  // Load LinkedIn Profile Badge widget. Script auto-renders on load. If
  // already loaded (e.g. navigating back), re-trigger the render manually.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const scriptId = "linkedin-profile-badge";
    const render = () => {
      // platform.linkedin.com/badges/js/profile.js exposes IN.parse
      (window as any).IN?.parse?.();
      (window as any).LIRenderAll?.();
    };
    if (document.getElementById(scriptId)) {
      // Slight delay to let React commit the badge DOM nodes
      window.setTimeout(render, 60);
      return;
    }
    const s = document.createElement("script");
    s.id = scriptId;
    s.src = "https://platform.linkedin.com/badges/js/profile.js";
    s.async = true;
    s.defer = true;
    s.onload = () => window.setTimeout(render, 60);
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    if (socialPaused) return;
    const id = window.setInterval(() => {
      setActiveSocialSlide((prev) => (prev + 1) % socialPlatforms.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [socialPaused, socialPlatforms.length]);

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
    <LaunchOfferPopup />

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

      {/* Floating Doodles (popup style — full spread) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Top band */}
        <div className="float-slow absolute left-[6%] top-[6%] text-4xl opacity-70 sm:text-5xl">✨</div>
        <div className="float-medium absolute right-[8%] top-[10%] text-4xl opacity-70 sm:text-5xl">💎</div>
        <div className="float-fast absolute left-[22%] top-[14%] text-2xl opacity-60 sm:text-3xl">✦</div>
        <div className="float-medium absolute right-[24%] top-[6%] text-3xl opacity-65 sm:text-4xl">🪄</div>
        <div className="float-slow absolute left-[42%] top-[3%] text-2xl opacity-55 sm:text-3xl">✧</div>
        <div className="float-fast absolute right-[42%] top-[18%] text-3xl opacity-65 sm:text-4xl">🌟</div>

        {/* Hero side accents */}
        <div className="float-medium absolute left-[3%] top-[28%] text-3xl opacity-60 sm:text-4xl">👕</div>
        <div className="float-slow absolute right-[4%] top-[32%] text-3xl opacity-60 sm:text-4xl">💍</div>
        <div className="float-fast absolute left-[8%] top-[44%] text-3xl opacity-55 sm:text-4xl">📸</div>
        <div className="float-medium absolute right-[6%] top-[46%] text-3xl opacity-55 sm:text-4xl">🎨</div>

        {/* Middle band */}
        <div className="float-slow absolute left-[35%] top-[52%] text-2xl opacity-50 sm:text-3xl">⚡</div>
        <div className="float-medium absolute right-[30%] top-[58%] text-2xl opacity-55 sm:text-3xl">🔮</div>
        <div className="float-fast absolute left-[14%] top-[62%] text-3xl opacity-55 sm:text-4xl">🚀</div>
        <div className="float-slow absolute right-[14%] top-[66%] text-3xl opacity-55 sm:text-4xl">🎁</div>

        {/* Lower band */}
        <div className="float-fast absolute left-[20%] top-[78%] text-2xl opacity-55 sm:text-3xl">✦</div>
        <div className="float-medium absolute right-[18%] top-[82%] text-3xl opacity-60 sm:text-4xl">✨</div>
        <div className="float-slow absolute left-[48%] top-[88%] text-2xl opacity-50 sm:text-3xl">💫</div>
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
              Using AI — in 30 seconds.
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

        {/* ───────── Live Generations Counter ───────── */}
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
                      {liveCount.toLocaleString("en-IN")}+
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
                    {last24h.toLocaleString("en-IN")}
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

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-12">
          <div className="mb-6 text-center sm:mb-8">
            <h3 className="text-2xl font-black sm:text-3xl md:text-4xl">Our AI Agents</h3>
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
                <div className="h-48 w-full overflow-hidden">
                  <img
                    src={item.imageSrc}
                    alt={`${item.title} generated using AgentForge AI`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
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
              <h3 className="mt-2 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
                <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  How AgentForge Works
                </span>
              </h3>
              <p className={`mx-auto mt-3 max-w-xl text-sm sm:text-base ${muted}`}>
                Four steps. Zero setup. Business-grade output every time.
              </p>
            </div>

            {/* Flow graph */}
            <div className="relative">
              {/* Horizontal animated dashed line (desktop only) */}
              <div className="pointer-events-none absolute left-[12%] right-[12%] top-[58px] hidden lg:block">
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

                      {/* Inline arrow (desktop, between nodes) */}
                      {!isLast && (
                        <ChevronRight className="pointer-events-none absolute right-[-14px] top-[54px] hidden h-6 w-6 text-cyan-500 lg:block" />
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
            <h3 className="mt-2 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
              <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                Built for sellers, brands & creative teams
              </span>
            </h3>
            <p className={`mx-auto mt-3 max-w-2xl text-sm leading-7 sm:text-base ${muted}`}>
              Har category ke liye ek dedicated AI agent. Apni industry choose karo
              — seedha agent ke andar jao aur generate karna shuru karo.
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
              uses: [
                {
                  title: "Textile Sellers & Wholesalers",
                  desc: "Catalogue mockups with article codes — bulk ready.",
                },
                {
                  title: "Fashion Designers",
                  desc: "Apne motifs ko model-worn collection visuals mein turn karo.",
                },
                {
                  title: "Garment Manufacturers",
                  desc: "Saree, kurta, suit, kidswear — sab pe instant model shoots.",
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
              uses: [
                {
                  title: "E-commerce Sellers",
                  desc: "Amazon, Flipkart, Meesho ke liye hero product shots.",
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
                    className={`hidden shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r ${group.accent} px-4 py-2 text-xs font-black text-white shadow-lg ${group.shadowColor} transition hover:-translate-y-0.5 sm:inline-flex`}
                  >
                    Open agent
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Use-case cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.uses.map((u) => (
                    <Link
                      key={u.title}
                      href={group.link}
                      className={`group relative overflow-hidden rounded-3xl border p-5 backdrop-blur-xl transition hover:-translate-y-1 ${card}`}
                      style={{ animation: "afCardFloat 6s ease-in-out infinite" }}
                    >
                      {/* Animated gradient border on hover */}
                      <span
                        className={`pointer-events-none absolute -inset-px rounded-3xl opacity-0 ring-2 transition group-hover:opacity-100 ${group.ringColor}`}
                      />
                      {/* Corner glow */}
                      <span
                        className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full ${group.bgGlow} blur-2xl transition group-hover:scale-125`}
                      />

                      <div className="relative flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${group.accent} text-white shadow-md ${group.shadowColor}`}
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

                      <div className="relative mt-4 flex items-center justify-between">
                        <span
                          className={`text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r ${group.accent} bg-clip-text text-transparent`}
                        >
                          Open {group.tag}
                        </span>
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r ${group.accent} text-white shadow-md ${group.shadowColor} transition group-hover:translate-x-1`}
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
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
                    {/* Header / browser bar */}
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

                    {/* Profile row */}
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

                    {/* Live embed area */}
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
                        <div className={`h-[360px] overflow-y-auto overflow-x-hidden ${darkMode ? "bg-black" : "bg-white"} [scrollbar-width:thin]`}>
                          <a
                            className="twitter-timeline"
                            data-height="360"
                            data-theme={darkMode ? "dark" : "light"}
                            data-chrome="noheader nofooter transparent"
                            data-tweet-limit="3"
                            href={`https://twitter.com/${platform.embed.handle}?ref_src=twsrc%5Etfw`}
                          >
                            {/* Fallback content shown while widgets.js loads or if it fails */}
                            <div className={`flex h-[360px] flex-col items-center justify-center gap-3 p-6 text-center ${darkMode ? "text-white" : "text-black"}`}>
                              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white shadow-lg">
                                <FaXTwitter className="h-7 w-7" />
                              </div>
                              <p className="text-sm font-black">Loading latest posts…</p>
                              <p className={`text-xs ${muted}`}>
                                @{platform.embed.handle}
                              </p>
                              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[11px] font-black text-white">
                                View on X →
                              </span>
                            </div>
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

                      {platform.embed.kind === "linkedin" && (
                        <div className={`flex h-[360px] items-start justify-center overflow-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${darkMode ? "bg-[#0a0f1c]" : "bg-white"}`}>
                          {/* Official LinkedIn Profile Badge — loaded by platform.linkedin.com/badges/js/profile.js */}
                          <div
                            className="badge-base LI-profile-badge"
                            data-locale="en_US"
                            data-size="medium"
                            data-theme={darkMode ? "dark" : "light"}
                            data-type="VERTICAL"
                            data-vanity={platform.embed.vanity}
                            data-version="v1"
                          >
                            {/* Fallback content while badge loads or if blocked */}
                            <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
                              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A66C2] text-white shadow-lg">
                                <FaLinkedinIn className="h-6 w-6" />
                              </div>
                              <p className="text-sm font-black">{platform.displayName}</p>
                              <p className={`text-xs ${muted}`}>Loading LinkedIn profile…</p>
                              <a
                                className="badge-base__link LI-simple-link mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#0A66C2] px-3 py-1.5 text-[11px] font-black text-white"
                                href={platform.embed.profileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View on LinkedIn →
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {platform.embed.kind === "none" && (
                        <a
                          href={platform.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`group flex h-[360px] flex-col items-center justify-center gap-3 p-6 text-center transition-all duration-300 hover:scale-[1.02] ${
                            darkMode ? "bg-white/[0.04] hover:bg-white/[0.06]" : "bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-white ${platform.headerGradient} shadow-lg`}>
                            <platform.Icon className="h-8 w-8" />
                          </div>
                          <p className="text-sm font-black">
                            {platform.displayName} on {platform.name}
                          </p>
                          <p className={`max-w-[260px] text-xs leading-5 ${muted}`}>
                            {platform.embed.tagline}
                          </p>
                          <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black text-white ${platform.headerGradient}`}>
                            {platform.cta} →
                          </span>
                        </a>
                      )}
                    </div>

                    {/* CTA */}
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

          {/* Dots */}
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
              <img src="/af-logo.png" alt="AgentForge" className="h-full w-full object-cover" />
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
                under 30 seconds
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
              { trad: "4 – 7 days", af: "~30 seconds" },
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
