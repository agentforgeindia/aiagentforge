"use client";

import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Gem,
  Heart,
  MapPin,
  Package,
  Quote,
  Shield,
  ShoppingBag,
  Sparkles,
  Target,
  Upload,
  Users,
  Zap,
} from "lucide-react";

export default function AboutPage() {
  return (
    <>
      {/* Subtle floating doodles (toned-down for trust page) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="float-slow absolute left-[6%] top-[8%] text-3xl opacity-40">💡</div>
        <div className="float-medium absolute right-[8%] top-[12%] text-3xl opacity-40">🤝</div>
        <div className="float-fast absolute left-[12%] bottom-[22%] text-2xl opacity-35">✨</div>
        <div className="float-slow absolute right-[14%] bottom-[26%] text-3xl opacity-40">🏆</div>
        <div className="float-medium absolute left-[48%] top-[6%] text-2xl opacity-30">✦</div>
      </div>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        {/* ===================================================
            HERO
            =================================================== */}
        <section className="text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/60 bg-white/80 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-700 shadow-md shadow-cyan-300/30 backdrop-blur dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200 sm:text-[11px]">
            About AgentForge AI
          </div>
          <h1 className="text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
            India's AI visual studio for{" "}
            <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              textile, jewellery & D2C brands
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-black/65 dark:text-white/65 sm:text-lg">
            We replace ₹15,000+ photoshoots with 30-second AI catalogues — so manufacturers, sellers
            and brands across India can ship more, faster, and at a fraction of the cost.
          </p>

          {/* Trust stats */}
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { v: "30 sec", l: "Per AI visual" },
              { v: "₹15+", l: "Per generation" },
              { v: "4.9 / 5", l: "User rating" },
              { v: "India-first", l: "Built locally" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl border border-black/10 bg-white/80 p-3 backdrop-blur dark:border-white/10 dark:bg-white/[0.05]"
              >
                <p className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-base font-black text-transparent sm:text-lg">
                  {s.v}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-black/55 dark:text-white/55">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ===================================================
            OUR STORY — Chapter narrative
            =================================================== */}
        <section className="mt-16">
          <div className="mb-8 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
              Our story
            </p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">
              Built from{" "}
              <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                real problems
              </span>
              , not pitch decks
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-black/60 dark:text-white/60 sm:text-base">
              Four chapters. One mission. A platform built by Indians, for Indian businesses.
            </p>
          </div>

          {/* =============================
              CHAPTER 01 — The Beginning
              ============================= */}
          <div className="relative mt-10">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-md">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-600">
                  Chapter 01 · The beginning
                </p>
                <h3 className="mt-0.5 text-xl font-black sm:text-2xl">
                  The story behind AgentForge
                </h3>
              </div>
            </div>

            <div className="rounded-3xl border border-cyan-200/60 bg-gradient-to-br from-cyan-50/60 via-white to-blue-50/40 p-6 shadow-xl dark:border-cyan-400/20 dark:from-cyan-500/10 dark:via-white/[0.04] dark:to-blue-500/10 sm:p-8">
              <p className="text-base leading-7 text-black/75 dark:text-white/80">
                AgentForge wasn't started in a Silicon Valley office.
              </p>
              <p className="mt-3 text-base leading-7 text-black/75 dark:text-white/80">
                It started from{" "}
                <span className="font-black text-black dark:text-white">
                  real client work, late nights, design pressure
                </span>
                , and one simple realization:
              </p>

              {/* Big highlight */}
              <div className="my-6 rounded-2xl border-l-4 border-cyan-500 bg-white/80 px-5 py-4 shadow-md backdrop-blur dark:bg-white/[0.06]">
                <p className="text-lg font-black leading-snug sm:text-xl">
                  <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                    Traditional content creation was too slow for modern businesses.
                  </span>
                </p>
              </div>

              <p className="text-base leading-7 text-black/75 dark:text-white/80">
                Since{" "}
                <span className="font-black text-black dark:text-white">2018</span>, we've worked
                with brands, textile businesses, creators, and growing companies across digital
                marketing, branding, and visual production. And one problem kept repeating itself:
              </p>
              <p className="mt-3 text-base leading-7 text-black/75 dark:text-white/80">
                Businesses wanted premium presentation — but the process was{" "}
                <span className="font-black text-black dark:text-white">
                  expensive, slow, and dependent on too many people
                </span>
                .
              </p>

              {/* The painful chain */}
              <div className="mt-5 flex flex-wrap gap-2">
                {["Models", "Studios", "Editors", "Photographers", "Revisions", "Delays"].map(
                  (t) => (
                    <span
                      key={t}
                      className="rounded-full border border-rose-300/60 bg-rose-50 px-3 py-1 text-xs font-black text-rose-700 line-through dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300"
                    >
                      {t}
                    </span>
                  )
                )}
              </div>

              <p className="mt-5 text-base leading-7 text-black/75 dark:text-white/80">
                Sometimes, a business owner with a great product still couldn't showcase it
                properly. That didn't make sense to us. Because{" "}
                <span className="font-black text-black dark:text-white">
                  nobody understands a product better than the person selling it
                </span>
                .
              </p>
              <p className="mt-3 text-base leading-7 text-black/75 dark:text-white/80">
                So we built AgentForge — an AI-powered visual generation platform designed for{" "}
                <span className="font-black text-black dark:text-white">Indian businesses</span> —
                especially textile sellers, jewellery brands, catalogue creators, and modern
                product-based businesses.
              </p>

              {/* What we understand */}
              <div className="mt-6 rounded-2xl border border-black/10 bg-white/80 p-5 backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-sm font-black text-black/85 dark:text-white/90">
                  What makes AgentForge different is not just AI. It's industry understanding.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    "Catalogue culture",
                    "WhatsApp selling",
                    "Textile launches",
                    "Indian fashion presentation",
                    "Local business mindset",
                    "Fast-moving product marketing",
                  ].map((t) => (
                    <div key={t} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-500" />
                      <span className="text-black/75 dark:text-white/75">{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* The signature flow */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 px-5 py-4 text-white shadow-xl">
                <div className="flex items-center gap-2 text-sm font-black sm:text-base">
                  <Upload className="h-4 w-4" /> Upload
                </div>
                <ChevronRight className="h-4 w-4 opacity-80" />
                <div className="flex items-center gap-2 text-sm font-black sm:text-base">
                  <Sparkles className="h-4 w-4" /> Generate
                </div>
                <ChevronRight className="h-4 w-4 opacity-80" />
                <div className="flex items-center gap-2 text-sm font-black sm:text-base">
                  Done ✅
                </div>
              </div>
            </div>
          </div>

          {/* =============================
              CHAPTER 02 — Why AgentForge Exists (Bhavin)
              ============================= */}
          <div className="relative mt-12">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-400 to-pink-600 text-white shadow-md">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-fuchsia-600">
                  Chapter 02 · The textile spark
                </p>
                <h3 className="mt-0.5 text-xl font-black sm:text-2xl">Why AgentForge exists</h3>
              </div>
            </div>

            <div className="rounded-3xl border border-fuchsia-200/60 bg-gradient-to-br from-fuchsia-50/60 via-white to-pink-50/40 p-6 shadow-xl dark:border-fuchsia-400/20 dark:from-fuchsia-500/10 dark:via-white/[0.04] dark:to-pink-500/10 sm:p-8">
              <p className="text-base leading-7 text-black/75 dark:text-white/80">
                AgentForge didn't start as an AI startup idea. It started from a real business
                problem.
              </p>
              <p className="mt-3 text-base leading-7 text-black/75 dark:text-white/80">
                One day,{" "}
                <span className="font-black text-black dark:text-white">Mr. Bhavin</span> — a textile
                industry professional we knew through family — shared a frustration that stayed in
                our mind.
              </p>
              <p className="mt-3 text-base leading-7 text-black/75 dark:text-white/80">
                A client was constantly asking for{" "}
                <span className="font-black text-black dark:text-white">
                  shirt mockups and fresh catalogue visuals
                </span>
                . But internally, the process had become painful. Designers with strong creative
                skills were spending hours inside Photoshop just creating mockups manually.
              </p>
              <p className="mt-3 text-base leading-7 text-black/75 dark:text-white/80">
                And the bigger problem wasn't only editing. To launch new textile collections
                properly, businesses still had to deal with:
              </p>

              {/* Pain list */}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  "Sample stitching",
                  "Model coordination",
                  "Shoot agencies",
                  "Photographers",
                  "Makeup artists",
                  "Editing teams",
                  "Production delays",
                ].map((t) => (
                  <div
                    key={t}
                    className="flex items-center gap-2 rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <span className="text-rose-500">✗</span>
                    <span className="text-black/75 dark:text-white/75">{t}</span>
                  </div>
                ))}
              </div>

              {/* Bhavin's quote */}
              <div className="mt-6 rounded-2xl border-l-4 border-fuchsia-500 bg-white/90 p-5 shadow-md backdrop-blur dark:bg-white/[0.06]">
                <Quote className="h-6 w-6 text-fuchsia-500" />
                <p className="mt-2 text-base italic leading-7 text-black/80 dark:text-white/85 sm:text-lg">
                  "I'm paying skilled designers high salaries… and still making them spend hours
                  only on mockups. I wish there was a system that could generate all this faster —
                  without stitching, without shoots, without depending on so many people."
                </p>
                <p className="mt-3 text-xs font-black uppercase tracking-wider text-fuchsia-600">
                  — Mr. Bhavin, textile industry
                </p>
              </div>

              <p className="mt-6 text-base leading-7 text-black/75 dark:text-white/80">
                That conversation became the starting point of AgentForge. We began building a
                system focused specifically on the{" "}
                <span className="font-black text-black dark:text-white">
                  Indian textile workflow
                </span>{" "}
                — not a generic AI image tool, but something that understands:
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "Textile prints",
                  "Catalogue presentation",
                  "Saree draping",
                  "Indian fashion aesthetics",
                  "Wholesalers",
                  "WhatsApp catalogue culture",
                  "Fast-moving launches",
                ].map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-300/60 bg-white/80 px-3 py-1 text-[11px] font-black text-fuchsia-700 backdrop-blur dark:border-fuchsia-400/30 dark:bg-white/10 dark:text-fuchsia-200"
                  >
                    <Sparkles className="h-3 w-3" />
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-600 p-5 text-white shadow-lg">
                <p className="text-sm font-bold opacity-90">That's how</p>
                <p className="text-xl font-black sm:text-2xl">TextilePrints to Mockup AI was born</p>
                <p className="mt-2 text-sm leading-6 opacity-90">
                  From there, AgentForge evolved into a larger AI visual platform for textile
                  businesses, jewellery brands, product sellers, and Indian creators who need
                  speed, presentation, and scale — without massive production costs.
                </p>
              </div>
            </div>
          </div>

          {/* =============================
              CHAPTER 03 — Jewellery AI Studio
              ============================= */}
          <div className="relative mt-12">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-md">
                <Gem className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-600">
                  Chapter 03 · The jewellery chapter
                </p>
                <h3 className="mt-0.5 text-xl font-black sm:text-2xl">
                  Why we built Jewellery AI Studio
                </h3>
              </div>
            </div>

            <div className="rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50/60 via-white to-rose-50/40 p-6 shadow-xl dark:border-amber-400/20 dark:from-amber-500/10 dark:via-white/[0.04] dark:to-rose-500/10 sm:p-8">
              <p className="text-base leading-7 text-black/75 dark:text-white/80">
                Our connection with jewellery photography started long before AI. We worked closely
                with jewellery businesses like{" "}
                <span className="font-black text-black dark:text-white">
                  Rakesh Jewellers and Verma Jewellers
                </span>
                , handling shoots, presentation visuals, and catalogue content.
              </p>
              <p className="mt-3 text-base leading-7 text-black/75 dark:text-white/80">
                And while the final photos looked premium… the process behind them was{" "}
                <span className="font-black text-black dark:text-white">exhausting</span>.
              </p>

              {/* Coordination grid */}
              <div className="mt-5 rounded-2xl border border-black/10 bg-white/80 p-5 backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
                <p className="mb-3 text-xs font-black uppercase tracking-wider text-amber-600">
                  Every shoot came with endless coordination
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    "Security handling for expensive jewellery",
                    "Photographer scheduling",
                    "Studio timing mismatches",
                    "Model coordination",
                    "Props collection",
                    "Lighting setup",
                    "Editing delays",
                    "Approval revisions",
                  ].map((t) => (
                    <div key={t} className="flex items-start gap-2 text-sm">
                      <Camera className="h-4 w-4 shrink-0 text-amber-500" />
                      <span className="text-black/75 dark:text-white/75">{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-5 text-base leading-7 text-black/75 dark:text-white/80">
                Sometimes an entire day would go into planning just a few catalogue shots. And even
                after all that effort, the client still wasn't fully satisfied. Because{" "}
                <span className="font-black text-black dark:text-white">
                  jewellery presentation is emotional
                </span>
                .
              </p>

              {/* Three emotional truths */}
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { v: "One angle", l: "changes everything" },
                  { v: "One lighting mistake", l: "affects the luxury feel" },
                  { v: "One delay", l: "slows the entire launch" },
                ].map((c) => (
                  <div
                    key={c.v}
                    className="rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-rose-50/50 p-4 text-center dark:border-amber-400/20 dark:from-amber-500/10 dark:to-rose-500/10"
                  >
                    <p className="text-sm font-black text-amber-700 dark:text-amber-300">{c.v}</p>
                    <p className="mt-1 text-xs text-black/65 dark:text-white/65">{c.l}</p>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-base leading-7 text-black/75 dark:text-white/80">
                That's when we realized something:
              </p>

              <div className="my-5 rounded-2xl border-l-4 border-amber-500 bg-white/90 px-5 py-4 shadow-md backdrop-blur dark:bg-white/[0.06]">
                <p className="text-lg font-black leading-snug sm:text-xl">
                  The jewellery industry didn't just need better editing.{" "}
                  <span className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent">
                    It needed a faster and smarter presentation system.
                  </span>
                </p>
              </div>

              <p className="text-base leading-7 text-black/75 dark:text-white/80">
                So we built{" "}
                <span className="font-black text-black dark:text-white">
                  Jewellery AI Studio
                </span>{" "}
                inside AgentForge AI — a system designed to generate luxury jewellery visuals
                without depending on traditional production workflows.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  "No heavy coordination",
                  "No expensive setup",
                  "No waiting for catalogues",
                ].map((t) => (
                  <div
                    key={t}
                    className="rounded-xl border border-emerald-300/50 bg-emerald-50/60 px-3 py-2 text-center text-xs font-black text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                  >
                    ✓ {t}
                  </div>
                ))}
              </div>

              <p className="mt-5 text-base leading-7 text-black/75 dark:text-white/80">
                Today, businesses are using AgentForge AI to create premium jewellery presentations{" "}
                <span className="font-black text-black dark:text-white">
                  faster than traditional shoots
                </span>{" "}
                — while saving both time and production cost.
              </p>

              <div className="mt-5 rounded-2xl border border-amber-200/50 bg-amber-50/40 p-4 text-center dark:border-amber-400/20 dark:bg-amber-500/10">
                <p className="text-sm italic text-black/70 dark:text-white/75">
                  Modern brands don't just compete on products anymore.{" "}
                  <span className="font-black not-italic text-amber-700 dark:text-amber-300">
                    They compete on presentation speed.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* =============================
              CHAPTER 04 — Productography AI
              ============================= */}
          <div className="relative mt-12">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-600">
                  Chapter 04 · The ecommerce expansion
                </p>
                <h3 className="mt-0.5 text-xl font-black sm:text-2xl">
                  Why we built Productography AI
                </h3>
              </div>
            </div>

            <div className="rounded-3xl border border-violet-200/60 bg-gradient-to-br from-violet-50/60 via-white to-fuchsia-50/40 p-6 shadow-xl dark:border-violet-400/20 dark:from-violet-500/10 dark:via-white/[0.04] dark:to-fuchsia-500/10 sm:p-8">
              <p className="text-base leading-7 text-black/75 dark:text-white/80">
                As AgentForge started helping textile and jewellery businesses, we realized
                something important: the same presentation problem existed across{" "}
                <span className="font-black text-black dark:text-white">
                  almost every product-based business
                </span>
                .
              </p>

              {/* Categories */}
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "🎁 Gift shops",
                  "🍫 Food brands",
                  "💐 Florists",
                  "💄 Cosmetics sellers",
                  "👜 Fashion accessories",
                  "🛒 Online ecommerce stores",
                ].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-violet-300/60 bg-white/80 px-3 py-1.5 text-xs font-black text-violet-700 backdrop-blur dark:border-violet-400/30 dark:bg-white/10 dark:text-violet-200"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <p className="mt-5 text-base leading-7 text-black/75 dark:text-white/80">
                Everyone wanted professional product visuals. But traditional product photography
                was still{" "}
                <span className="font-black text-black dark:text-white">
                  slow, expensive, and difficult to scale
                </span>
                . Especially for ecommerce sellers.
              </p>

              <p className="mt-3 text-base leading-7 text-black/75 dark:text-white/80">
                Because today — Amazon, Flipkart, Instagram, WhatsApp — businesses don't just
                compete on products anymore.{" "}
                <span className="font-black text-black dark:text-white">
                  They compete on presentation.
                </span>
              </p>

              {/* Better visual = */}
              <div className="my-6 rounded-2xl border border-violet-200/60 bg-white/80 p-5 backdrop-blur dark:border-violet-400/20 dark:bg-white/[0.04]">
                <p className="mb-3 text-xs font-black uppercase tracking-wider text-violet-600">
                  A better product visual means
                </p>
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    { v: "Higher", l: "clicks" },
                    { v: "More", l: "trust" },
                    { v: "Better", l: "conversions" },
                    { v: "Stronger", l: "branding" },
                  ].map((c) => (
                    <div
                      key={c.l}
                      className="rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-3 text-center"
                    >
                      <p className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-base font-black text-transparent">
                        {c.v}
                      </p>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-black/60 dark:text-white/65">
                        {c.l}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-base leading-7 text-black/75 dark:text-white/80">
                That's why we built{" "}
                <span className="font-black text-black dark:text-white">Productography AI</span> —
                a system where businesses can upload a simple product photo directly from their
                phone and generate professional AI product shoots in seconds.
              </p>

              {/* Where it's used */}
              <div className="mt-6 rounded-2xl border border-black/10 bg-white/80 p-5 backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
                <p className="mb-3 text-xs font-black uppercase tracking-wider text-violet-600">
                  Today, businesses use AgentForge AI for
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    "Amazon listings",
                    "Flipkart catalogues",
                    "Instagram ads",
                    "WhatsApp catalogues",
                    "Website banners",
                    "Ecommerce stores",
                    "Product launches",
                  ].map((t) => (
                    <div key={t} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-500" />
                      <span className="text-black/75 dark:text-white/75">{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-5 text-base leading-7 text-black/75 dark:text-white/80">
                From shoes to watches… from cosmetics to food brands… from flowers to gift items —{" "}
                <span className="font-black text-black dark:text-white">Productography AI</span>{" "}
                helps businesses create premium presentation visuals faster, smarter, and at scale.
              </p>

              {/* Big closing line */}
              <div className="mt-6 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-6 text-center text-white shadow-xl">
                <p className="text-sm font-bold opacity-90">In modern ecommerce,</p>
                <p className="mt-1 text-xl font-black sm:text-2xl">
                  presentation is no longer optional.
                </p>
                <p className="mt-1 text-lg font-black opacity-95 sm:text-xl">
                  It's the{" "}
                  <span className="bg-gradient-to-r from-amber-200 to-yellow-100 bg-clip-text text-transparent">
                    new packaging
                  </span>
                  .
                </p>

                {/* Signature flow */}
                <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2 backdrop-blur">
                  <span className="flex items-center gap-1.5 text-sm font-black">
                    <Upload className="h-3.5 w-3.5" /> Upload
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                  <span className="flex items-center gap-1.5 text-sm font-black">
                    <Sparkles className="h-3.5 w-3.5" /> Generate
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                  <span className="text-sm font-black">Done ✅</span>
                </div>
              </div>
            </div>
          </div>

          {/* Closing line */}
          <div className="mt-10 text-center">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-600">
              This is just the beginning
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-base text-black/65 dark:text-white/70 sm:text-lg">
              AgentForge is built for the next generation of Indian sellers and creators who want{" "}
              <span className="font-black text-black dark:text-white">
                speed, quality, and control
              </span>{" "}
              — without massive production costs.
            </p>
          </div>
        </section>

        {/* ===================================================
            VALUES
            =================================================== */}
        <section className="mt-16">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
            What we stand for
          </p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Our values</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              {
                Icon: Target,
                title: "Built for Indian businesses",
                desc: "Saree drape, kundan jewellery, festive lighting, article-code overlays, WhatsApp output — every detail tuned for how Indian sellers actually work.",
              },
              {
                Icon: Zap,
                title: "Speed over polish",
                desc: "We'd rather ship a 30-second catalogue you can use today than a 30-day campaign you'll see next month. Speed is the product.",
              },
              {
                Icon: Shield,
                title: "Your data, your designs",
                desc: "Your uploads, designs and outputs belong to you. We don't resell, retrain on your private data, or share with third parties.",
              },
              {
                Icon: Users,
                title: "Customer-led roadmap",
                desc: "Every new feature comes from a real Indian manufacturer, brand or seller asking for it on WhatsApp. We ship what users actually need.",
              },
            ].map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-black/10 bg-white/80 p-5 backdrop-blur dark:border-white/10 dark:bg-white/[0.05]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-md">
                  <v.Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-black">{v.title}</h3>
                <p className="mt-2 text-sm leading-6 text-black/65 dark:text-white/65">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===================================================
            WHO WE SERVE
            =================================================== */}
        <section className="mt-16">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
            Who we serve
          </p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Trusted by businesses across India</h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { city: "Surat", desc: "Saree manufacturers & wholesalers" },
              { city: "Jaipur", desc: "Kurti & ethnic wear brands" },
              { city: "Mumbai", desc: "Jewellery & D2C brands" },
              { city: "Ludhiana", desc: "Knitwear & wholesale" },
              { city: "Delhi", desc: "Designer brands & ad agencies" },
              { city: "Bengaluru", desc: "D2C startups & skincare brands" },
              { city: "Tirupur", desc: "Knitwear & kidswear factories" },
              { city: "Hyderabad", desc: "Jewellery & fashion sellers" },
              { city: "Pune", desc: "D2C and ecommerce brands" },
            ].map((c) => (
              <div
                key={c.city}
                className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/80 p-4 backdrop-blur dark:border-white/10 dark:bg-white/[0.05]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 text-cyan-600 dark:text-cyan-300">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black">{c.city}</p>
                  <p className="text-xs text-black/55 dark:text-white/55">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===================================================
            LEGAL & TRUST LINKS
            =================================================== */}
        <section className="mt-16">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
            Legal &amp; trust
          </p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Policies you can read</h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Privacy Policy", desc: "How we handle your data", href: "/privacy-policy" },
              { title: "Terms & Conditions", desc: "Rules for using AgentForge", href: "/terms" },
              { title: "Refund Policy", desc: "Cancellation & refund rules", href: "/refund-policy" },
              { title: "Case Studies", desc: "Real client results", href: "/case-studies" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group rounded-2xl border border-black/10 bg-white/80 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.05]"
              >
                <p className="text-sm font-black group-hover:text-cyan-600 dark:group-hover:text-cyan-300">
                  {l.title}
                </p>
                <p className="mt-1 text-xs text-black/55 dark:text-white/55">{l.desc}</p>
              </Link>
            ))}
          </div>
        </section>

      </main>
    </>
  );
}
