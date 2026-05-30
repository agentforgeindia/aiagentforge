"use client";

import Image from "next/image";
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
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useTheme } from "./ThemeProvider";

// ────────────────────────────────────────────────────────────
// Link data — declared once, mapped through cleanly.
// ────────────────────────────────────────────────────────────

const AGENT_LINKS = [
  { label: "TextilePrints to Mockup AI", href: "/textileprints-to-mockup" },
  { label: "Jewellery AI Studio", href: "/jewellery-ai" },
  { label: "Productography AI", href: "/productography-ai" },
  { label: "Gallery", href: "/gallery" },
  { label: "Case Studies", href: "/case-studies" },
];

const COMPANY_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "News & Blog", href: "/news" },
  { label: "Tutorials", href: "/tutorials" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "FAQ", href: "/faq" },
  { label: "Supported Industries", href: "/supported-industries" },
  { label: "Support", href: "/support" },
  { label: "Pricing", href: "/pricing" },
];

const SEO_LINKS = [
  { label: "AI Textile Mockup India", href: "/ai-textile-mockup-generator-india" },
  { label: "AI Jewellery Photoshoot", href: "/ai-jewellery-photoshoot" },
  { label: "AI Saree Mockup", href: "/ai-saree-mockup" },
  { label: "AI Kurti Catalogue Maker", href: "/ai-kurti-catalogue-maker" },
  { label: "AI Product Photography", href: "/ai-product-photography-india" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Data Protection (DPDP)", href: "/data-protection" },
  { label: "AI Safety Policy", href: "/ai-safety-policy" },
  { label: "Commercial Usage", href: "/commercial-usage-policy" },
];

const TRUST_PILLS = [
  { Icon: ShieldCheck, label: "Secure Payments", color: "text-emerald-600 dark:text-emerald-300" },
  { Icon: Sparkles,    label: "AI Powered",       color: "text-cyan-600 dark:text-cyan-300" },
  { Icon: BadgeCheck,  label: "Commercial Use",   color: "text-blue-600 dark:text-blue-300" },
  { Icon: BadgeCheck,  label: "HD Output",        color: "text-indigo-600 dark:text-indigo-300" },
  { Icon: ShieldCheck, label: "Watermark Free",   color: "text-amber-600 dark:text-amber-300" },
];

const SOCIALS = [
  { Icon: FaInstagram,  href: "https://www.instagram.com/agentforgeindia/",   label: "Instagram", hover: "hover:text-pink-500" },
  { Icon: FaYoutube,    href: "https://www.youtube.com/@agentforgeindia",     label: "YouTube",   hover: "hover:text-rose-500" },
  { Icon: FaLinkedinIn, href: "https://www.linkedin.com/in/agentforgeindia/", label: "LinkedIn",  hover: "hover:text-[#0A66C2]" },
  { Icon: FaFacebookF,  href: "https://www.facebook.com/Agentforgeindia",     label: "Facebook",  hover: "hover:text-[#1877F2]" },
  { Icon: FaXTwitter,   href: "https://x.com/Agentforgeindia",                label: "X (Twitter)", hover: "hover:text-black dark:hover:text-white" },
  { Icon: FaPinterestP, href: "https://in.pinterest.com/agentforgeindia/",    label: "Pinterest", hover: "hover:text-[#E60023]" },
];

export default function Footer() {
  const { darkMode } = useTheme();

  // Tokens — declared once, used throughout.
  const muted = darkMode ? "text-white/55" : "text-black/55";
  const subtle = darkMode ? "text-white/40" : "text-black/40";
  const linkBase = darkMode
    ? "text-white/65 hover:text-cyan-300"
    : "text-black/65 hover:text-cyan-600";
  const heading = darkMode ? "text-white/85" : "text-black/85";
  const card = darkMode
    ? "border-white/10 bg-white/[0.04]"
    : "border-black/10 bg-white/80";
  const divider = darkMode ? "border-white/10" : "border-black/10";

  const year = new Date().getFullYear();

  return (
    <footer className="relative">
      <div className="mx-auto max-w-7xl px-4 pb-6 pt-10 sm:px-5">
        <div
          className={`relative overflow-hidden rounded-[2rem] border p-6 backdrop-blur-xl sm:p-8 ${card}`}
        >
          {/* Decorative blurs — desktop-only to keep mobile light */}
          <div className="pointer-events-none absolute -left-16 -top-16 hidden h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl md:block" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 hidden h-44 w-44 rounded-full bg-blue-500/15 blur-3xl md:block" />

          {/* ============================================================
              ROW 1 — Brand identity (left) + trust pills (right)
              Single compact row instead of a tall centered block.
              ============================================================ */}
          <div className="relative flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
            <Link
              href="/"
              className="group flex items-center gap-3 shrink-0"
              aria-label="AgentForge AI home"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow-md shadow-cyan-500/15 dark:border-[#0b1220]">
                <Image
                  src="/af-logo.png"
                  alt="AgentForge AI"
                  width={48}
                  height={48}
                  sizes="48px"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black leading-none">
                  <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                    AgentForge AI
                  </span>
                </h3>
                <p className={`mt-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] no-justify ${muted}`}>
                  Upload | Generate | Done
                  <BadgeCheck className="h-3 w-3 fill-cyan-500 text-white" />
                </p>
              </div>
            </Link>

            {/* Trust pills — inline horizontal strip (scrolls on mobile) */}
            <div
              className="-mx-1 flex max-w-full items-center gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="list"
              aria-label="Trust signals"
            >
              {TRUST_PILLS.map(({ Icon, label, color }) => (
                <span
                  key={label}
                  role="listitem"
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-2.5 py-1 text-[11px] font-black dark:border-white/10 dark:bg-white/[0.05] ${color}`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* ============================================================
              ROW 2 — Link columns
              ============================================================ */}
          <div
            className={`relative mt-7 grid gap-x-6 gap-y-7 border-t pt-7 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.1fr_1fr_1fr] ${divider}`}
          >
            {/* Brand short description */}
            <div className="space-y-3">
              <p className={`text-sm leading-6 ${darkMode ? "text-white/70" : "text-black/70"}`}>
                India's AI visual studio — premium textile mockups, jewellery
                photoshoots and catalogue-ready product visuals without models,
                studios or traditional shoots.
              </p>
              <div className={`inline-flex items-center gap-1.5 text-xs no-justify ${muted}`}>
                <MapPin className="h-3.5 w-3.5 text-cyan-500" />
                Operating across India · Remote-first
              </div>
            </div>

            <LinkColumn title="AI Agents" links={AGENT_LINKS} heading={heading} linkBase={linkBase} />
            <LinkColumn title="Company"   links={COMPANY_LINKS} heading={heading} linkBase={linkBase} />
            <LinkColumn title="Popular AI Tools" links={SEO_LINKS} heading={heading} linkBase={linkBase} />
            <LinkColumn title="Legal & Trust" links={LEGAL_LINKS} heading={heading} linkBase={linkBase} />
          </div>

          {/* ============================================================
              ROW 3 — Contact + social + copyright (compact horizontal)
              ============================================================ */}
          <div
            className={`relative mt-7 flex flex-col gap-4 border-t pt-5 md:flex-row md:items-center md:justify-between ${divider}`}
          >
            {/* Left: email pill */}
            <a
              href="mailto:info@aiagentforge.in"
              className={`group inline-flex w-full items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-black transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-cyan-500/20 md:w-auto md:justify-start ${
                darkMode
                  ? "border-white/10 bg-white/[0.05] hover:border-cyan-400/50"
                  : "border-black/10 bg-white hover:border-cyan-400/60"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400 to-blue-600 text-white">
                <Mail className="h-3 w-3" />
              </span>
              <span>info@aiagentforge.in</span>
              <ArrowUpRight className={`h-3 w-3 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${muted}`} />
            </a>

            {/* Middle: social icons */}
            <div className="flex items-center justify-center gap-1.5">
              {SOCIALS.map(({ Icon, href, label, hover }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border transition hover:scale-110 ${
                    darkMode
                      ? "border-white/10 bg-white/[0.05] text-white/70"
                      : "border-black/10 bg-white text-black/70"
                  } ${hover}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>

            {/* Right: copyright + Made in India inline */}
            <div className={`flex flex-wrap items-center justify-center gap-1.5 text-[11px] md:justify-end ${subtle}`}>
              <BadgeCheck className="h-3 w-3 text-cyan-500" />
              <span>© {year}</span>
              <span className={`font-black ${darkMode ? "text-white/70" : "text-black/70"}`}>
                AgentForge AI
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-100 via-white to-emerald-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-orange-700 dark:from-orange-500/15 dark:via-white/5 dark:to-emerald-500/15 dark:text-orange-200">
                <span className="h-0.5 w-0.5 rounded-full bg-orange-500" />
                Made in India
                <span className="h-0.5 w-0.5 rounded-full bg-emerald-500" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ────────────────────────────────────────────────────────────
// Sub-component for link columns — kept inline for clarity.
// ────────────────────────────────────────────────────────────
function LinkColumn({
  title,
  links,
  heading,
  linkBase,
}: {
  title: string;
  links: { label: string; href: string }[];
  heading: string;
  linkBase: string;
}) {
  return (
    <div>
      <h4 className={`mb-3 text-[11px] font-black uppercase tracking-[0.18em] ${heading}`}>
        {title}
      </h4>
      <ul className="space-y-1.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={`block transition ${linkBase}`}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
