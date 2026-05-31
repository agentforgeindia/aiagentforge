"use client";

import Link from "next/link";
import { useTheme } from "@/app/components/ThemeProvider";

/* ─── Hero: 6 specific picks ─────────────────────────── */
const heroImages = [
  { src: "/gallery/textile/design-2.png",         label: "Men's Shirt" },
  { src: "/gallery/textile/design-8.png",         label: "Male Kurta" },   // different number for kurta
  { src: "/gallery/jewellery/design-3.png",       label: "Necklace" },
  { src: "/gallery/jewellery/design-14.png",      label: "Payal" },
  { src: "/gallery/productography/design-4.png",  label: "Perfume" },
  { src: "/gallery/productography/design-9.png",  label: "Zip Pouch" },
];

/* ─── Agent data ─────────────────────────────────────── */
const agents = [
  {
    title: "TextilePrints to Mockup AI",
    tagline: "Upload fabric design. Get catalogue-ready model mockup.",
    link: "/textileprints-to-mockup",
    emoji: "🥻",
    gradient: "from-cyan-400 via-blue-500 to-blue-600",
    gradientText: "from-cyan-500 to-blue-600",
    glow: "shadow-cyan-500/20",
    badge: "Most Popular",
    badgeClass: "bg-emerald-500/15 text-emerald-700 border border-emerald-400/30",
    usedBy: "Textile manufacturers · Fabric wholesalers · Fashion brands",
    images: [
      "/gallery/textile/design-1.png",
      "/gallery/textile/design-3.png",
      "/gallery/textile/design-5.png",
      "/gallery/textile/design-7.png",
      "/gallery/textile/design-9.png",
      "/gallery/textile/design-11.png",
      "/gallery/textile/design-13.png",
      "/gallery/textile/design-15.png",
      "/gallery/textile/design-17.png",
      "/gallery/textile/design-19.png",
      "/gallery/textile/design-21.png",
      "/gallery/textile/design-23.png",
    ],
    features: [
      "AI maps your fabric onto a live model instantly",
      "Auto-reads article code from image via OCR",
      "6 categories: Men's, Ladies, Kids, Home, Decor, Universal",
      "Indian, Western, African & European model looks",
      "Outdoor, Studio, White BG & Luxury editorial styles",
      "Article number overlay with auto contrast color",
      "Brand logo, name, phone & website watermark",
      "Square (1080×1080) & Mobile (1080×1920) output",
      "Bulk generation for Empire Pack users",
      "DSLR-quality output in under 60 seconds",
    ],
    roi: [
      { stat: "5 days → 60 sec", label: "Sample to client preview" },
      { stat: "₹0",              label: "Studio or model cost" },
      { stat: "3×",              label: "More orders from visual buyers" },
    ],
    hashtags: ["#TextileMockup", "#FabricDesign", "#KurtaMockup", "#SareeMockup", "#ShirtMockup", "#FashionAI", "#AIFashion", "#CatalogueReady", "#TextileIndia", "#MenswearMockup", "#LadiesSuit", "#FabricPrint"],
  },
  {
    title: "Jewellery AI Studio",
    tagline: "One jewellery photo. Full DSLR model shoot output.",
    link: "/jewellery-ai",
    emoji: "💎",
    gradient: "from-amber-400 via-rose-500 to-pink-600",
    gradientText: "from-amber-500 to-rose-500",
    glow: "shadow-amber-500/20",
    badge: "New",
    badgeClass: "bg-rose-500/15 text-rose-700 border border-rose-400/30",
    usedBy: "Jewellery showrooms · Goldsmiths · Boutique brands",
    images: [
      "/gallery/jewellery/design-2.png",
      "/gallery/jewellery/design-4.png",
      "/gallery/jewellery/design-6.png",
      "/gallery/jewellery/design-8.png",
      "/gallery/jewellery/design-10.png",
      "/gallery/jewellery/design-12.png",
      "/gallery/jewellery/design-14.png",
      "/gallery/jewellery/design-16.png",
      "/gallery/jewellery/design-18.png",
      "/gallery/jewellery/design-20.png",
      "/gallery/jewellery/design-22.png",
      "/gallery/jewellery/design-24.png",
    ],
    features: [
      "Rings, earrings, necklaces, bracelets, payal & sets",
      "Hand model, bridal, neck focus, bust portrait & flat lay",
      "Gemstone reflection & metal tone accuracy",
      "Indian, Western & Bridal shoot styles",
      "Macro close-up & texture detail shots",
      "Brand logo & company details overlay",
      "AI auto-detects piece type & suggests best settings",
      "Festive collection ready in hours, not weeks",
      "Square & Portrait for catalogue & Instagram",
      "Luxury editorial quality for premium catalogues",
    ],
    roi: [
      { stat: "₹8,000 → ₹15", label: "Studio shoot vs AI cost" },
      { stat: "1 day",          label: "Full festive collection done" },
      { stat: "4×",             label: "More Instagram enquiries" },
    ],
    hashtags: ["#JewelleryMockup", "#GoldJewellery", "#BridalJewellery", "#NecklaceMockup", "#PayalDesign", "#RingMockup", "#EarringShoot", "#JewelleryPhotography", "#JewelleryAI", "#AIJewellery", "#IndianJewellery", "#JewelleryBrand"],
  },
  {
    title: "Productography AI",
    tagline: "Product photo in. Ad-ready lifestyle visual out.",
    link: "/productography-ai",
    emoji: "📦",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
    gradientText: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/20",
    badge: "New",
    badgeClass: "bg-violet-500/15 text-violet-700 border border-violet-400/30",
    usedBy: "D2C brands · E-commerce sellers · Marketing agencies",
    images: [
      "/gallery/productography/design-1.png",
      "/gallery/productography/design-4.png",
      "/gallery/productography/design-7.png",
      "/gallery/productography/design-10.png",
      "/gallery/productography/design-13.png",
      "/gallery/productography/design-16.png",
      "/gallery/productography/design-19.png",
      "/gallery/productography/design-22.png",
      "/gallery/productography/design-25.png",
      "/gallery/productography/design-28.png",
      "/gallery/productography/design-3.png",
      "/gallery/productography/design-6.png",
    ],
    features: [
      "12+ categories: Cosmetics, Perfume, Electronics, Toys, Shoes & more",
      "Without model, hand, boy, girl, kid & family model options",
      "Indian, European & Asian model looks",
      "Lifestyle, studio, white BG & luxury editorial styles",
      "Amazon, Flipkart, Instagram & Meta ad-ready output",
      "DSLR lighting, depth of field & colour grading built-in",
      "Brand watermark + logo overlay on final image",
      "Multiple product angles in one session",
      "D2C packaging & hero image generation",
      "Download + share + WhatsApp in one tap",
    ],
    roi: [
      { stat: "60 sec",  label: "Product photo to ad visual" },
      { stat: "CTR ↑",   label: "Better hero = more clicks" },
      { stat: "Zero",    label: "Designer dependency" },
    ],
    hashtags: ["#ProductPhotography", "#AIProductShoot", "#PerfumeMockup", "#EcommerceIndia", "#D2CBrand", "#ProductMockup", "#AmazonSeller", "#FlipkartSeller", "#ProductPhotographyAI", "#ToyMockup", "#CosmeticsMockup", "#LifestyleShoot"],
  },
];

/* ─── Coming Shortly ─────────────────────────────────── */
const comingSoon = [
  { emoji: "📱", title: "Social Media Ads AI",          color: "from-pink-500 to-rose-500",     desc: "Auto-generate Instagram, Facebook & Meta ad creatives — brief in, creative out." },
  { emoji: "🎬", title: "UGC Agent",                    color: "from-orange-400 to-amber-500",  desc: "AI-generated UGC-style content that feels authentic and drives real conversions." },
  { emoji: "🎉", title: "Festival Wishes AI",           color: "from-yellow-400 to-orange-500", desc: "Branded Diwali, Eid, Holi & Christmas greetings — designed, branded, ready to share." },
  { emoji: "🗳️", title: "Election Campaign Poster AI",  color: "from-emerald-500 to-teal-500",  desc: "Professional political posters & banners for campaigns — multilingual, fast." },
  { emoji: "🌐", title: "Website Maker Agent",          color: "from-blue-500 to-cyan-500",     desc: "Describe your business, get a fully designed website — no code, live in minutes." },
  { emoji: "🤖", title: "More Agents in Pipeline",      color: "from-violet-500 to-purple-600", desc: "We are building the full AI studio. Active subscribers get priority access to every launch." },
];

/* ─── Page ───────────────────────────────────────────── */
export default function AgentsPage() {
  const { darkMode } = useTheme();

  const pageBg  = darkMode ? "bg-[#070b14] text-white"              : "bg-[#fff8e8] text-[#111827]";
  const muted   = darkMode ? "text-white/55"                        : "text-black/55";
  const cardBg  = darkMode ? "bg-white/[0.04] border-white/10"      : "bg-white border-black/10";
  const divider = darkMode ? "border-white/8"                       : "border-black/8";

  return (
    <main className={`relative min-h-screen overflow-x-hidden ${pageBg}`}>

      {/* Subtle bg */}
      <div className={`pointer-events-none absolute inset-0 ${darkMode ? "opacity-[0.04]" : "opacity-[0.09]"}`}
        style={{ backgroundImage: "linear-gradient(45deg,currentColor 1px,transparent 1px),linear-gradient(-45deg,currentColor 1px,transparent 1px)", backgroundSize: "34px 34px" }} />
      <div className={`pointer-events-none absolute inset-0 ${darkMode
        ? "bg-[radial-gradient(circle_at_20%_10%,#00d4ff15,transparent_40%),radial-gradient(circle_at_80%_5%,#7c3cff15,transparent_40%)]"
        : "bg-[radial-gradient(circle_at_20%_10%,#06b6d420,transparent_40%),radial-gradient(circle_at_80%_5%,#fde04750,transparent_40%)]"}`} />

      <div className="relative z-10">

        {/* ══════ HERO ══════ */}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">

            {/* Left copy */}
            <div className="lg:pt-4">
              <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] ${darkMode ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300" : "border-cyan-600/20 bg-cyan-500/12 text-cyan-800"}`}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
                </span>
                India's First Commercial AI Agent Studio
              </div>

              <h1 className="text-4xl font-black leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-[3.2rem]">
                AI Agents That{" "}
                <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Work for Your Business.
                </span>
              </h1>

              <p className={`mt-4 max-w-lg text-base leading-7 ${muted}`}>
                Purpose-built AI agents for Indian manufacturers, sellers and brands.
                Upload your design or product — get professional visuals in under 60 seconds.
                No studio. No model. No designer.
              </p>

              {/* Agent quick links */}
              <div className="mt-6 space-y-2.5">
                <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${darkMode ? "text-white/35" : "text-black/35"}`}>Jump to an agent</p>
                {[
                  { emoji: "🥻", label: "TextilePrints to Mockup AI", sub: "Shirts · Saree · Kurta · Home Textile", href: "/textileprints-to-mockup", color: "from-cyan-400 to-blue-500",   ring: "ring-cyan-400/30" },
                  { emoji: "💎", label: "Jewellery AI Studio",         sub: "Necklace · Payal · Rings · Bridal",    href: "/jewellery-ai",           color: "from-amber-400 to-rose-500",  ring: "ring-amber-400/30" },
                  { emoji: "📦", label: "Productography AI",           sub: "Perfume · Cosmetics · Toys · D2C",     href: "/productography-ai",       color: "from-violet-500 to-purple-600", ring: "ring-violet-400/30" },
                ].map((a) => (
                  <Link key={a.href} href={a.href}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 transition hover:-translate-y-0.5 hover:shadow-lg ${darkMode ? "border-white/10 bg-white/[0.04] hover:border-white/20" : "border-black/10 bg-white/80 hover:border-black/20"}`}>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${a.color} text-xl ring-2 ${a.ring}`}>
                      {a.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">{a.label}</p>
                      <p className={`truncate text-xs ${muted}`}>{a.sub}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-black bg-gradient-to-r ${a.color} bg-clip-text text-transparent`}>Try Free →</span>
                  </Link>
                ))}
              </div>

              <div className={`mt-5 flex flex-wrap items-center gap-5 text-xs font-bold ${muted}`}>
                <span>✓ No credit card required</span>
                <span>✓ 100 free credits on signup</span>
                <span>✓ Results in 60 seconds</span>
              </div>
            </div>

            {/* Right — 6 images, 3×2 grid, no crop */}
            <div className="grid grid-cols-3 gap-2.5">
              {heroImages.map((img, i) => (
                <div key={i} className={`group aspect-[3/4] overflow-hidden rounded-2xl border shadow-md ${darkMode ? "border-white/10" : "border-black/8"}`}>
                  <img src={img.src} alt={img.label}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ AGENT CARDS ══════ */}
        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
          <div className="mb-7 text-center">
            <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${darkMode ? "text-white/35" : "text-black/35"}`}>Live Now</p>
            <h2 className="mt-1 text-3xl font-black sm:text-4xl">3 Agents. 3 Industries.</h2>
          </div>

          <div className="space-y-7">
            {agents.map((agent) => (
              <div key={agent.title} className={`overflow-hidden rounded-[2rem] border shadow-xl ${cardBg} ${agent.glow}`}>

                {/* Gradient top bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${agent.gradient}`} />

                {/* Header */}
                <div className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6 border-b ${divider}`}>
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${agent.gradient} text-3xl shadow-lg`}>
                    {agent.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] ${agent.badgeClass}`}>{agent.badge}</span>
                    <h3 className="mt-1 text-xl font-black sm:text-2xl">{agent.title}</h3>
                    <p className={`text-sm font-semibold ${muted}`}>{agent.tagline}</p>
                    <p className={`mt-0.5 text-[11px] font-bold uppercase tracking-widest ${darkMode ? "text-white/22" : "text-black/28"}`}>Used by: {agent.usedBy}</p>
                  </div>
                  <Link href={agent.link}
                    className={`shrink-0 self-start rounded-full bg-gradient-to-r ${agent.gradient} px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:scale-105 hover:brightness-110`}>
                    Try This Agent →
                  </Link>
                </div>

                {/* Gallery strip */}
                <div className={`overflow-x-auto border-b ${divider}`}>
                  <div className="flex gap-2 p-3" style={{ width: "max-content" }}>
                    {agent.images.map((src, j) => (
                      <div key={j}
                        className={`overflow-hidden rounded-xl border transition hover:scale-[1.03] hover:shadow-md ${darkMode ? "border-white/10" : "border-black/8"}`}
                        style={{ width: 110, height: 160, flexShrink: 0 }}>
                        <img src={src} alt={`${agent.title} sample ${j + 1}`}
                          className="h-full w-full object-cover" />
                      </div>
                    ))}
                    <Link href="/gallery"
                      className={`flex shrink-0 items-center justify-center rounded-xl border text-xs font-black transition hover:scale-[1.03] ${darkMode ? "border-white/10 bg-white/[0.04] text-white/40 hover:text-white" : "border-black/10 bg-black/[0.03] text-black/35 hover:text-black"}`}
                      style={{ width: 110, height: 160 }}>
                      <span className="text-center leading-5">Gallery →</span>
                    </Link>
                  </div>
                </div>

                {/* Features — full width */}
                <div className="p-5 sm:p-6">
                  <p className={`mb-3 text-[11px] font-black uppercase tracking-[0.2em] ${darkMode ? "text-white/35" : "text-black/35"}`}>What it does</p>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {agent.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${agent.gradient} text-[8px] font-black text-white`}>✓</span>
                        <span className={`text-sm leading-5 ${muted}`}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ROI — one horizontal strip */}
                <div className={`border-t ${divider}`}>
                  <div className="grid grid-cols-3 divide-x px-5 py-4 sm:px-6 ${divider}">
                    {agent.roi.map((r) => (
                      <div key={r.label} className={`px-3 first:pl-0 last:pr-0 ${darkMode ? "divide-white/8" : "divide-black/8"}`}>
                        <p className={`text-xl font-black sm:text-2xl bg-gradient-to-r ${agent.gradientText} bg-clip-text text-transparent`}>{r.stat}</p>
                        <p className={`mt-0.5 text-xs font-semibold ${muted}`}>{r.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hashtags + CTA row */}
                <div className={`border-t ${divider} flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6`}>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.hashtags.map((tag) => (
                      <span key={tag}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition hover:scale-105 ${darkMode ? "bg-white/[0.06] text-white/40 hover:text-white/70" : "bg-black/[0.05] text-black/40 hover:text-black/70"}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link href={agent.link}
                    className={`shrink-0 rounded-2xl bg-gradient-to-r ${agent.gradient} px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:brightness-110`}>
                    Start Free →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════ COMING SHORTLY ══════ */}
        <section className={`py-10 sm:py-12 ${darkMode ? "bg-white/[0.02]" : "bg-black/[0.025]"}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-7 text-center">
              <div className={`mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] ${darkMode ? "border-purple-400/30 bg-purple-400/10 text-purple-300" : "border-purple-600/20 bg-purple-500/10 text-purple-800"}`}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-70" />
                  <span className="relative h-2 w-2 rounded-full bg-purple-500" />
                </span>
                Active Development
              </div>
              <h2 className="text-3xl font-black sm:text-4xl">
                Coming{" "}
                <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">Shortly</span>
              </h2>
              <p className={`mx-auto mt-3 max-w-lg text-sm leading-6 ${muted}`}>
                Names not final yet — all agents are real and in active development.
                Subscribers get priority access to every new launch.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {comingSoon.map((item) => (
                <div key={item.title}
                  className={`group relative overflow-hidden rounded-2xl border p-5 transition hover:-translate-y-1 hover:shadow-lg ${cardBg}`}>
                  <div className={`pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br ${item.color} opacity-10 blur-2xl transition group-hover:opacity-20`} />
                  <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-2xl shadow-md`}>
                    {item.emoji}
                  </div>
                  <h3 className="text-base font-black leading-tight">{item.title}</h3>
                  <p className={`mt-1.5 text-sm leading-5 ${muted}`}>{item.desc}</p>
                  <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${darkMode ? "border-white/10 text-white/30" : "border-black/10 text-black/30"}`}>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                      <span className="relative h-1.5 w-1.5 rounded-full bg-amber-400" />
                    </span>
                    Coming Shortly
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ CTA ══════ */}
        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
          <div className={`overflow-hidden rounded-[2rem] border p-8 text-center shadow-xl sm:p-12 ${darkMode ? "border-cyan-400/15 bg-gradient-to-br from-cyan-400/8 via-blue-500/8 to-purple-500/8" : "border-cyan-300/30 bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50"}`}>
            <div className={`mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300" : "border-cyan-600/20 bg-cyan-500/12 text-cyan-800"}`}>
              India's First Commercial AI Agent Studio
            </div>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
              Get early access to{" "}
              <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 bg-clip-text text-transparent">every new agent.</span>
            </h2>
            <p className={`mx-auto mt-4 max-w-xl text-sm leading-7 ${muted}`}>
              Start free. 100 credits on signup. Each new agent launches first to active subscribers. No waitlist for paid members.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Link href="/signup" className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-3.5 text-sm font-black text-black shadow-xl shadow-cyan-500/25 transition hover:scale-105">
                Sign Up Free — 100 Credits
              </Link>
              <Link href="/pricing" className={`rounded-full border px-8 py-3.5 text-sm font-black transition hover:scale-105 ${darkMode ? "border-white/15 text-white hover:bg-white/8" : "border-black/12 text-black hover:bg-black/5"}`}>
                See All Plans
              </Link>
            </div>
            <p className={`mt-4 text-xs ${muted}`}>No credit card required to start.</p>
          </div>
        </section>

      </div>
    </main>
  );
}
