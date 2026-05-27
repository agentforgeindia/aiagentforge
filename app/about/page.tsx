"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  ChevronRight,
  Gem,
  Mail,
  MapPin,
  Package,
  Shield,
  ShoppingBag,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

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
            OUR STORY
            =================================================== */}
        <section className="mt-16">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
            Our story
          </p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Why AgentForge exists</h2>

          <div className="mt-6 space-y-5 text-base leading-7 text-black/75 dark:text-white/75">
            <p>
              In 2026, a Surat saree manufacturer shipping 30 new designs a month was still spending{" "}
              <span className="font-black text-black dark:text-white">₹4–8 lakh</span> on
              photography alone — sample stitching, model fees, MUA, studio rental, photographer,
              post-production. And it took{" "}
              <span className="font-black text-black dark:text-white">5–7 days</span> from design
              lock to WhatsApp drop. By the time the catalogue went out, the trend had moved.
            </p>
            <p>
              Indian D2C founders, jewellery brands and ecommerce sellers faced the same problem
              from different angles: photography was the bottleneck killing both their budget and
              their speed-to-market.
            </p>
            <p>
              AgentForge AI was built to solve this — not with a generic global AI tool, but with a
              system that understands{" "}
              <span className="font-black text-black dark:text-white">how Indian businesses
              actually work</span>: saree drape physics, article-code overlays for wholesalers,
              Indian bridal model looks, WhatsApp-ready output formats, bulk catalogue workflows for
              factories, and credit-based INR pricing.
            </p>
          </div>
        </section>

        {/* ===================================================
            WHAT WE BUILD
            =================================================== */}
        <section className="mt-16">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
            What we build
          </p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Three AI agents, one platform</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                Icon: ShoppingBag,
                title: "TextilePrints to Mockup AI",
                desc: "Saree, kurti, kurta, lehenga, kidswear and home textile mockups in 30 seconds.",
                href: "/textileprints-to-mockup",
                grad: "from-cyan-400 to-blue-500",
              },
              {
                Icon: Gem,
                title: "Jewellery AI Studio",
                desc: "Bridal sets, diamond rings, necklaces, earrings — editorial-grade in 30 seconds.",
                href: "/jewellery-ai",
                grad: "from-amber-400 to-rose-500",
              },
              {
                Icon: Package,
                title: "Productography AI",
                desc: "Skincare, perfume, watches, gadgets, food — Amazon-ready hero shots in 30 seconds.",
                href: "/productography-ai",
                grad: "from-violet-500 to-fuchsia-500",
              },
            ].map((a) => (
              <Link
                key={a.title}
                href={a.href}
                className="group relative rounded-2xl border border-black/10 bg-white/80 p-5 transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.05]"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${a.grad} text-white shadow-md`}
                >
                  <a.Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-black leading-snug">{a.title}</h3>
                <p className="mt-2 text-sm leading-6 text-black/60 dark:text-white/65">{a.desc}</p>
                <p className="mt-4 inline-flex items-center gap-1 text-xs font-black text-cyan-600 dark:text-cyan-300">
                  Open agent <ChevronRight className="h-3 w-3" />
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* ===================================================
            FOUNDER STORY
            =================================================== */}
        <section className="mt-16">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
            The mind behind
          </p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Founding story</h2>

          <div className="mt-6 rounded-[2rem] border border-cyan-200/60 bg-gradient-to-br from-cyan-50/60 via-white to-blue-50/40 p-6 shadow-xl dark:border-cyan-400/20 dark:bg-gradient-to-br dark:from-cyan-500/10 dark:via-white/[0.04] dark:to-blue-500/10 sm:p-8">
            <div className="grid gap-6 md:grid-cols-[1fr_2fr] md:items-start">
              {/* Avatar / brand mark */}
              <div className="mx-auto md:mx-0">
                <div className="relative">
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-cyan-400/30 to-blue-600/30 blur-xl" />
                  <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-[1.75rem] border-4 border-white bg-white shadow-2xl shadow-cyan-500/30 dark:border-[#0b1220]">
                    <img
                      src="/af-logo.png"
                      alt="AgentForge AI founding team"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <p className="mt-4 text-center text-sm font-black md:text-left">
                  The AgentForge Team
                </p>
                <p className="text-center text-xs text-black/55 dark:text-white/55 md:text-left">
                  Founders · Engineers · Designers
                </p>
              </div>

              {/* Story */}
              <div className="space-y-4 text-sm leading-6 text-black/75 dark:text-white/75 sm:text-base sm:leading-7">
                <p>
                  AgentForge was started by a small team obsessed with one question: why is
                  premium product photography priced like a luxury when Indian SMBs need it like
                  oxygen?
                </p>
                <p>
                  The founders come from a mix of{" "}
                  <span className="font-black text-black dark:text-white">
                    branding, ecommerce, manufacturing and AI engineering
                  </span>{" "}
                  backgrounds — having shipped catalogues, designed for Indian wholesale, and
                  watched the same friction repeat across saree mandis, jewellery showrooms and
                  D2C ad shoots.
                </p>
                <p>
                  We are not a generic AI wrapper. Every output style, every overlay rule, every
                  category in AgentForge was designed by talking to actual Surat manufacturers,
                  Jaipur kurti brands, Mumbai jewellers and Bengaluru D2C founders. The result is a
                  platform that feels like it was built for your business — because it was.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    "Indian fashion specialists",
                    "AI engineering team",
                    "Ex-brand operators",
                    "Customer-led roadmap",
                  ].map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/60 bg-white/80 px-3 py-1 text-[11px] font-black text-cyan-700 backdrop-blur dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200"
                    >
                      <Sparkles className="h-3 w-3" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
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
            CONTACT
            =================================================== */}
        <section className="mt-16">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
            Get in touch
          </p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Contact AgentForge</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {/* Email */}
            <a
              href="mailto:info@aiagentforge.in"
              className="group flex items-start gap-3 rounded-2xl border border-black/10 bg-white/80 p-5 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.05]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-md">
                <Mail className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-600">
                  Email
                </p>
                <p className="mt-1 truncate text-sm font-black group-hover:text-cyan-600 dark:group-hover:text-cyan-300">
                  info@aiagentforge.in
                </p>
                <p className="mt-1 text-xs text-black/55 dark:text-white/55">
                  Sales, support, partnership
                </p>
              </div>
            </a>

            {/* Operating region */}
            <div className="flex items-start gap-3 rounded-2xl border border-black/10 bg-white/80 p-5 backdrop-blur dark:border-white/10 dark:bg-white/[0.05]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-white shadow-md">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-600">
                  Based in
                </p>
                <p className="mt-1 text-sm font-black">India · Remote-first</p>
                <p className="mt-1 text-xs text-black/55 dark:text-white/55">
                  Serving businesses across India
                </p>
              </div>
            </div>

            {/* Support */}
            <Link
              href="/support"
              className="group flex items-start gap-3 rounded-2xl border border-black/10 bg-white/80 p-5 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.05]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-600">
                  Support
                </p>
                <p className="mt-1 text-sm font-black group-hover:text-cyan-600 dark:group-hover:text-cyan-300">
                  Help & Tutorials
                </p>
                <p className="mt-1 text-xs text-black/55 dark:text-white/55">
                  FAQ + step-by-step guides
                </p>
              </div>
            </Link>
          </div>

          {/* Socials */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <p className="mr-1 text-xs font-bold text-black/55 dark:text-white/55">Follow:</p>
            {[
              { Icon: FaInstagram, href: "https://www.instagram.com/agentforgeindia/", label: "Instagram", color: "hover:text-pink-500" },
              { Icon: FaYoutube, href: "https://www.youtube.com/@agentforgeindia", label: "YouTube", color: "hover:text-rose-500" },
              { Icon: FaLinkedinIn, href: "https://www.linkedin.com/in/agentforgeindia/", label: "LinkedIn", color: "hover:text-[#0A66C2]" },
              { Icon: FaFacebookF, href: "https://www.facebook.com/Agentforgeindia", label: "Facebook", color: "hover:text-[#1877F2]" },
              { Icon: FaXTwitter, href: "https://x.com/Agentforgeindia", label: "X (Twitter)", color: "hover:text-black dark:hover:text-white" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-black/70 transition hover:scale-110 hover:shadow-md dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70 ${s.color}`}
              >
                <s.Icon className="h-4 w-4" />
              </a>
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

        {/* ===================================================
            FINAL CTA
            =================================================== */}
        <section className="mt-16 mb-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/40 bg-gradient-to-r from-cyan-400/15 via-blue-500/15 to-purple-500/15 p-8 text-center shadow-2xl backdrop-blur-xl">
            <h2 className="text-2xl font-black sm:text-3xl">Start with 200 free credits</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-black/65 dark:text-white/65 sm:text-base">
              No card required. Sign up and try AgentForge AI on your own products in 30 seconds.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-105"
              >
                ✨ Sign Up Free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-7 py-3.5 text-sm font-bold text-black transition hover:scale-105 dark:border-white/15 dark:bg-white/10 dark:text-white"
              >
                View Pricing →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
