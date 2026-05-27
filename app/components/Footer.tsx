"use client";

import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPinterestP,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import {
  ArrowUpRight,
  BadgeCheck,
  Mail,
  MapPin,
} from "lucide-react";

import { useTheme } from "./ThemeProvider";
import TrustBadges from "./TrustBadges";

export default function Footer() {
  const { darkMode } = useTheme();

  const muted = darkMode ? "text-white/55" : "text-black/55";
  const subtle = darkMode ? "text-white/45" : "text-black/45";
  const card = darkMode
    ? "border-white/10 bg-white/[0.07] shadow-black/40"
    : "border-black/10 bg-white/80 shadow-black/10";
  const contactPill = darkMode
    ? "border-white/10 bg-white/[0.05] hover:border-cyan-400/50"
    : "border-black/10 bg-white hover:border-cyan-400/60";

  const socials = [
    { Icon: FaInstagram, href: "https://www.instagram.com/agentforgeindia/", label: "Instagram", hover: "hover:text-pink-500" },
    { Icon: FaYoutube, href: "https://www.youtube.com/@agentforgeindia", label: "YouTube", hover: "hover:text-rose-500" },
    { Icon: FaLinkedinIn, href: "https://www.linkedin.com/in/agentforgeindia/", label: "LinkedIn", hover: "hover:text-[#0A66C2]" },
    { Icon: FaFacebookF, href: "https://www.facebook.com/Agentforgeindia", label: "Facebook", hover: "hover:text-[#1877F2]" },
    { Icon: FaXTwitter, href: "https://x.com/Agentforgeindia", label: "X (Twitter)", hover: "hover:text-black dark:hover:text-white" },
    { Icon: FaPinterestP, href: "https://in.pinterest.com/agentforgeindia/", label: "Pinterest", hover: "hover:text-[#E60023]" },
  ];

  return (
    <footer className="relative">
      {/* Solid mask — hides ONLY the layout bg.svg (z=-40) behind the footer.
          Sits at z=-35 in the root stacking context, so it stays BELOW the
          page-level doodles (z=auto/0) — those still show through. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#fff8e8] dark:bg-[#070b14]"
        style={{ zIndex: -35 }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-5">
      <div
        className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl sm:p-10 ${card}`}
      >
        {/* Decorative blurs */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />

        {/* ───────── Top: Identity (centered) ───────── */}
        <div className="relative flex flex-col items-center justify-center pb-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-white shadow-xl shadow-cyan-500/20 sm:h-20 sm:w-20 dark:border-[#0b1220]">
            <img
              src="/af-logo.png"
              alt="AgentForge AI Logo"
              className="h-full w-full object-cover"
            />
          </div>

          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-600">
            AI Visual Studio
          </p>
          <h3 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">
            <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
              AgentForge AI
            </span>
          </h3>
          <div className="mt-1.5 flex items-center justify-center gap-1">
            <p className={`text-[10px] font-black uppercase tracking-[0.18em] sm:text-[11px] ${muted}`}>
              Upload | Generate | Done
            </p>
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 fill-cyan-500 text-white" />
          </div>

          {/* ───────── Trust Badges — centered below logo ───────── */}
          <TrustBadges
            variant="pills"
            darkMode={darkMode}
            title="Trusted by businesses across India"
            className="mt-6 w-full"
          />
        </div>

        {/* ───────── Link columns ───────── */}
        <div className={`relative mt-8 grid gap-8 border-t pt-8 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] dark:border-white/10 border-black/10`}>
          <div>
            <p className={`mb-3 text-[10px] font-black uppercase tracking-[0.22em] ${muted}`}>
              About AgentForge
            </p>
            <p className={`max-w-sm text-sm leading-6 ${darkMode ? "text-white/70" : "text-black/70"}`}>
              Generate premium textile mockups, jewellery photoshoots, and
              catalogue-ready product visuals — without models, studios or
              traditional shoots. Trusted by manufacturers, sellers and
              agencies across India.
            </p>

            <div className={`mt-4 inline-flex items-center gap-1.5 text-xs ${muted}`}>
              <MapPin className="h-3.5 w-3.5 text-cyan-500" />
              Operating across India · Remote-first
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-black">Products</h4>
            <div className={`space-y-2 text-sm ${muted}`}>
              <Link href="/textileprints-to-mockup" className="block transition hover:text-cyan-500">
                TextilePrints to Mockup AI
              </Link>
              <Link href="/jewellery-ai" className="block transition hover:text-cyan-500">
                Jewellery AI Studio
              </Link>
              <Link href="/productography-ai" className="block transition hover:text-cyan-500">
                Productography AI
              </Link>
              <Link href="/pricing" className="block transition hover:text-cyan-500">
                Pricing
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-black">Company</h4>
            <div className={`space-y-2 text-sm ${muted}`}>
              <Link href="/gallery" className="block transition hover:text-cyan-500">
                Gallery
              </Link>
              <Link href="/blog" className="block transition hover:text-cyan-500">
                Blog
              </Link>
              <Link href="/profile" className="block transition hover:text-cyan-500">
                Profile
              </Link>
              <Link href="/settings" className="block transition hover:text-cyan-500">
                Settings
              </Link>
              <Link href="/support" className="block transition hover:text-cyan-500">
                Support &amp; Tutorials
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-black">Popular AI Tools</h4>
            <div className={`space-y-2 text-sm ${muted}`}>
              <Link href="/ai-textile-mockup-generator-india" className="block transition hover:text-cyan-500">
                AI Textile Mockup India
              </Link>
              <Link href="/ai-jewellery-photoshoot" className="block transition hover:text-cyan-500">
                AI Jewellery Photoshoot
              </Link>
              <Link href="/ai-saree-mockup" className="block transition hover:text-cyan-500">
                AI Saree Mockup
              </Link>
              <Link href="/ai-kurti-catalogue-maker" className="block transition hover:text-cyan-500">
                AI Kurti Catalogue Maker
              </Link>
              <Link href="/ai-product-photography-india" className="block transition hover:text-cyan-500">
                AI Product Photography
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-black">Legal</h4>
            <div className={`space-y-2 text-sm ${muted}`}>
              <Link href="/privacy-policy" className="block transition hover:text-cyan-500">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block transition hover:text-cyan-500">
                Terms &amp; Conditions
              </Link>
              <Link href="/refund-policy" className="block transition hover:text-cyan-500">
                Refund Policy
              </Link>
            </div>

          </div>
        </div>

        {/* ───────── Reach + Social + Copyright (centered, merged) ───────── */}
        <div className={`relative mt-8 flex flex-col items-center justify-center gap-5 border-t pt-6 text-center dark:border-white/10 border-black/10`}>
          <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${muted}`}>
            Reach AgentForge
          </p>

          <a
            href="mailto:info@aiagentforge.in"
            className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-cyan-500/20 ${contactPill}`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400 to-blue-600 text-white">
              <Mail className="h-3.5 w-3.5" />
            </span>
            <span>info@aiagentforge.in</span>
            <ArrowUpRight className={`h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${muted}`} />
          </a>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {socials.map(({ Icon, href, label, hover }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition hover:scale-110 hover:shadow-md ${
                  darkMode ? "border-white/10 bg-white/[0.05] text-white/70" : "border-black/10 bg-white text-black/70"
                } ${hover}`}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>

          <div className={`flex flex-col items-center justify-center gap-2 pt-4 text-xs ${subtle}`}>
            <p className="flex flex-wrap items-center justify-center gap-1.5">
              <BadgeCheck className="h-3.5 w-3.5 text-cyan-500" />
              &copy; {new Date().getFullYear()}{" "}
              <span className={`font-black ${darkMode ? "text-white/75" : "text-black/75"}`}>AgentForge AI</span>. All rights reserved.
            </p>

            <p className="flex flex-wrap items-center justify-center gap-1.5">
              <span>Crafted with care</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-100 via-white to-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-700 dark:from-orange-500/10 dark:via-white/5 dark:to-emerald-500/10 dark:text-orange-200">
                <span className="h-1 w-1 rounded-full bg-orange-500" />
                Made in India
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
              </span>
              <span>·</span>
              <span>By the AgentForge team</span>
            </p>
          </div>
        </div>
      </div>
      </div>
    </footer>
  );
}
