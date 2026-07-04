"use client";

// ============================================================
// HomeSocialSection — extracted from app/page.tsx for code-split.
// ============================================================
// This is the "Follow AgentForge across the web" slider with
// Instagram / YouTube / Pinterest / Facebook embeds. Heavy because:
//   • Four different third-party embed scripts (twitter widgets,
//     pinterest pinit, instagram embeds, linkedin profile badge).
//   • A 5.2 s auto-rotate setInterval.
//   • IntersectionObserver that delays the four scripts until the
//     slider scrolls near the viewport (so they don't kill INP on
//     first paint).
//
// Pulling all of this into its own component lets app/page.tsx
// dynamic-import it. The slider's ~12 KB of JS no longer ships
// in the homepage's initial bundle; it loads as a separate chunk
// when the homepage actually mounts. Combined with the IO gating,
// none of the embed scripts run until the user scrolls.
// ============================================================

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPinterestP,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

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
    | { kind: "linkedin"; vanity: string; profileUrl: string }
    | { kind: "none"; tagline: string };
};

const SOCIAL_PLATFORMS: SocialPlatform[] = [
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
];

export default function HomeSocialSection({
  darkMode,
  muted,
}: {
  darkMode: boolean;
  muted: string;
}) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);

  // ─── INP guard ───────────────────────────────────────────
  // Wait until the slider scrolls near the viewport before
  // touching any third-party script.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = sliderRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setReady(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setReady(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Twitter widgets.js — gated.
  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
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
  }, [ready]);

  // Pinterest pinit.js — gated.
  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
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
  }, [ready]);

  // Instagram embeds.js — gated.
  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
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
  }, [ready]);

  // LinkedIn profile badge — gated.
  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    const scriptId = "linkedin-profile-badge";
    const render = () => {
      (window as any).IN?.parse?.();
      (window as any).LIRenderAll?.();
    };
    if (document.getElementById(scriptId)) {
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
  }, [ready]);

  // Auto-rotate — only when ready, not paused, and tab is visible.
  useEffect(() => {
    if (paused || !ready) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    const id = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SOCIAL_PLATFORMS.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [paused, ready]);

  // Smooth-scroll the active slide flush to the start of the viewport.
  useEffect(() => {
    const container = sliderRef.current;
    if (!container) return;
    const track = container.firstElementChild as HTMLElement | null;
    const target = track?.children[activeSlide] as HTMLElement | undefined;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const left = container.scrollLeft + (rect.left - containerRect.left);
    container.scrollTo({ left, behavior: "smooth" });
  }, [activeSlide]);

  const step = (dir: -1 | 1) => {
    setActiveSlide((prev) =>
      (prev + dir + SOCIAL_PLATFORMS.length) % SOCIAL_PLATFORMS.length,
    );
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-5">
      <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-600">
            Live on socials
          </p>
          <h2 className="mt-1 text-2xl font-black sm:text-3xl">
            Follow AgentForge across the web
          </h2>
          <p className={`mt-1 text-sm ${muted}`}>
            Tap any dashboard to open our profile in a new tab.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            aria-label="Previous social"
            onClick={() => step(-1)}
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
            onClick={() => step(1)}
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
        ref={sliderRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        className="-mx-4 overflow-x-auto scroll-smooth px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: "x mandatory" }}
      >
        <div className="flex gap-4 pb-3">
          {SOCIAL_PLATFORMS.map((platform) => {
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
                    <Image
                      src="/af-logo.png"
                      alt="AgentForge"
                      width={56}
                      height={56}
                      sizes="56px"
                      className="h-full w-full object-cover"
                    />
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
                    <div className={`h-[360px] overflow-y-auto overflow-x-hidden ${darkMode ? "bg-black" : "bg-white"} [scrollbar-width:thin]`}>
                      <a
                        className="twitter-timeline"
                        data-height="360"
                        data-theme={darkMode ? "dark" : "light"}
                        data-chrome="noheader nofooter transparent"
                        data-tweet-limit="3"
                        href={`https://twitter.com/${platform.embed.handle}?ref_src=twsrc%5Etfw`}
                      >
                        <div className={`flex h-[360px] flex-col items-center justify-center gap-3 p-6 text-center ${darkMode ? "text-white" : "text-black"}`}>
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white shadow-lg">
                            <FaXTwitter className="h-7 w-7" />
                          </div>
                          <p className="text-sm font-black">Loading latest posts…</p>
                          <p className={`text-xs ${muted}`}>@{platform.embed.handle}</p>
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
                        <a href={platform.url} target="_blank" rel="noopener noreferrer">
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
                      <div
                        className="badge-base LI-profile-badge"
                        data-locale="en_US"
                        data-size="medium"
                        data-theme={darkMode ? "dark" : "light"}
                        data-type="VERTICAL"
                        data-vanity={platform.embed.vanity}
                        data-version="v1"
                      >
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
          {/* Trailing spacer — gives the scroll container enough travel
              room to snap the last card(s) flush to the start; without
              it, the browser clamps scrollLeft short and leaves a sliver
              of the previous card visible. Sized to a full container
              width so this holds regardless of card count or breakpoint. */}
          <div aria-hidden className="w-full shrink-0" />
        </div>
      </div>

      {/* Dots */}
      <div className="mt-4 flex items-center justify-center gap-1.5">
        {SOCIAL_PLATFORMS.map((p, i) => (
          <button
            key={p.name}
            type="button"
            aria-label={`Go to ${p.name}`}
            onClick={() => setActiveSlide(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === activeSlide
                ? "w-6 bg-cyan-500"
                : darkMode ? "w-1.5 bg-white/30" : "w-1.5 bg-black/20"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
