// FILE PATH: app/workshop/page.tsx
// Clean final version: header/footer hidden, separate 12-image gallery, popup image view.

"use client";

import { useEffect, useMemo, useState } from "react";


const WORKSHOP_DATE = "2026-05-24T15:00:00+05:30";
const REGISTER_LINK = "/signup?source=textile-workshop";
const WHATSAPP_LINK = "https://wa.me/919041635032";

const heroImages = [
  { title: "Men Shirt Mockup", category: "Male Garments", src: "/Workshop/mens-shirt.png" },
  { title: "Women Suit Mockup", category: "Female Garments", src: "/Workshop/kurti.png" },
  { title: "Kids Collection", category: "Kids Wear", src: "/Workshop/kids-suits.png" },
  { title: "Home Decor", category: "Cushions", src: "/Workshop/model holding product.png" },
];

const workshopGalleryImages = [
  { title: "Men Shirt Mockup", category: "Male Garments", src: "/Workshop/mens-shirt.png" },
  { title: "Women Suit Mockup", category: "Female Garments", src: "/Workshop/kurti.png" },
  { title: "Kids Shirt Mockup", category: "Kids Collection", src: "/Workshop/boys-shirt.png" },
  { title: "Family Night Suit", category: "Family Collection", src: "/Workshop/family lifestyle scene.png" },
  { title: "Model Holding Product", category: "Product Preview", src: "/Workshop/model holding product.png" },
  { title: "Bedsheet Mockup", category: "Home Decor", src: "/Workshop/bedsheet.png" },
  { title: "Interior Styled Setup", category: "Home Decor", src: "/Workshop/interior styled setup.png" },
  { title: "Table Cover Mockup", category: "Home Textile", src: "/Workshop/table cover.png" },
  { title: "Saree Mockup", category: "Female Garments", src: "/Workshop/saree.png" },
  { title: "Kurta Mockup", category: "Male Garments", src: "/Workshop/male kurta.png" },
  { title: "Cushion Covers", category: "Home Decor", src: "/Workshop/cushion-cover.png" },
  { title: "Handloom Mockup", category: "Handlooms", src: "/Workshop/luxury bedroom setup.png" },
];

const learnItems = [
  { icon: "⬆️", title: "Upload Textile Prints", desc: "Right way to upload textile designs for clean AI outputs." },
  { icon: "✨", title: "Generate AI Mockups", desc: "Create premium garment and decor mockups live." },
  { icon: "👕", title: "Men / Women / Kids", desc: "Generate multiple categories from one design." },
  { icon: "🏠", title: "Home Decor Mockups", desc: "Cushions, curtains, bedsheets, table covers and more." },
  { icon: "💬", title: "WhatsApp Catalogue", desc: "Create visuals ready for client sharing." },
  { icon: "📸", title: "Instagram Creatives", desc: "Use AI outputs for social media promotions." },
];

const whoItems = [
  "Textile Manufacturers",
  "Wholesalers",
  "Boutique Owners",
  "Instagram Sellers",
  "Handloom Businesses",
  "Home Decor Brands",
];

type GalleryImage = {
  title: string;
  category: string;
  src: string;
};

function getTimeLeft() {
  const diff = new Date(WORKSHOP_DATE).getTime() - Date.now();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function WebinarLandingPage() {
    const [mounted, setMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
  setMounted(true);
  setTimeLeft(getTimeLeft());

  const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
  return () => clearInterval(timer);
}, []);

  const isDark = theme === "dark";

  const pageClass = useMemo(
    () => (isDark ? "bg-[#050816] text-white" : "bg-[#f8fbff] text-slate-950"),
    [isDark]
  );

  const cardClass = isDark
    ? "border-white/10 bg-white/[0.06] shadow-black/30"
    : "border-slate-200 bg-white shadow-violet-100";

  const mutedText = isDark ? "text-white/65" : "text-slate-600";

  const CTA = ({ label = "Join Workshop" }: { label?: string }) => (
    <a
      href={REGISTER_LINK}
      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 px-7 py-4 text-sm font-black uppercase tracking-wide text-white shadow-xl shadow-violet-500/25 transition hover:scale-[1.02] active:scale-95"
    >
      {label} →
    </a>
  );

  const CenterCTA = () => (
    <div className="mt-8 text-center">
      <CTA label="Join Workshop" />
    </div>
  );

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className={`rounded-2xl border px-3 py-4 text-center ${cardClass}`}>
      <div className="text-3xl font-black text-violet-500">
        {String(value).padStart(2, "0")}
      </div>
      <div className={`mt-1 text-[10px] font-black uppercase tracking-[0.18em] ${mutedText}`}>
        {label}
      </div>
    </div>
  );

  const SectionWrap = ({
    eyebrow,
    title,
    children,
  }: {
    eyebrow: string;
    title: string;
    children: React.ReactNode;
  }) => (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="mb-8 text-center">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-violet-500">
          {eyebrow}
        </p>
        <h2 className="mx-auto mt-3 max-w-4xl text-4xl font-black tracking-tight md:text-5xl">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );

  return (
        <main
        className={`webinar-landing-page relative isolate min-h-screen overflow-hidden pb-28 transition-colors duration-300 ${pageClass}`}
>

    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee22,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf622,transparent_35%),radial-gradient(circle_at_bottom,#f59e0b18,transparent_35%),linear-gradient(180deg,#f8fbff_0%,#eef8ff_55%,#fffaf2_100%)]" />

  <div className="absolute inset-0 opacity-[0.14]">
    <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="textilePattern" width="90" height="90" patternUnits="userSpaceOnUse">
          <path d="M0 45H90M45 0V90" stroke="#0ea5e9" strokeWidth="1" opacity="0.35" />
          <circle cx="45" cy="45" r="4" fill="#8b5cf6" opacity="0.45" />
          <path d="M15 15C35 5 55 5 75 15" fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.4" />
          <path d="M15 75C35 65 55 65 75 75" fill="none" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.35" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#textilePattern)" />
    </svg>
  </div>

  {[
    { icon: "🧵", left: "5%", top: "12%" },
    { icon: "✂️", left: "18%", top: "35%" },
    { icon: "🪡", left: "32%", top: "20%" },
    { icon: "👕", left: "45%", top: "60%" },
    { icon: "🧶", left: "58%", top: "75%" },
    { icon: "🧣", left: "72%", top: "28%" },
    { icon: "🛏️", left: "85%", top: "45%" },
    { icon: "🧥", left: "8%", top: "70%" },
    { icon: "🪞", left: "28%", top: "82%" },
    { icon: "🧺", left: "65%", top: "15%" },
  ].map((item, index) => (
    <div
      key={index}
      className="absolute rounded-[1.5rem] bg-white/70 p-3 text-4xl shadow-xl backdrop-blur-md"
      style={{
        left: item.left,
        top: item.top,
        animation: `floatTextile ${9 + index}s ease-in-out infinite`,
        animationDelay: `${index * 0.7}s`,
      }}
    >
      {item.icon}
    </div>
  ))}
</div>
     <div
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
          isDark ? "border-white/10 bg-[#050816]/85" : "border-slate-200 bg-white/85"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <img src="/af-logo.png" alt="AgentForge" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-500">
                Live Sunday Workshop
              </p>
              <p className={`text-xs ${mutedText}`}>TextilePrints to Mockup AI</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`rounded-full border px-4 py-2 text-xs font-black ${
                isDark
                  ? "border-white/15 bg-white/10 text-white"
                  : "border-slate-200 bg-white text-slate-800"
              }`}
            >
              {isDark ? "☀️ Light" : "🌙 Dark"}
            </button>
            <a
              href={REGISTER_LINK}
              className="rounded-full bg-gradient-to-r from-cyan-500 to-violet-700 px-5 py-2.5 text-xs font-black text-white shadow-lg"
            >
              Register
            </a>
          </div>
        </div>
      </div>

      <section className="relative mx-auto grid max-w-7xl items-center gap-10 overflow-hidden px-4 py-14 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:py-20">

  {/* PREMIUM TEXTILE BACKGROUND */}

  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">

      <style jsx global>{`
   @keyframes floatTextile {
  0% {
    transform: translate(0px, 0px) rotate(0deg);
  }
  25% {
    transform: translate(35px, -22px) rotate(5deg);
  }
  50% {
    transform: translate(-25px, 18px) rotate(-4deg);
  }
  75% {
    transform: translate(22px, 28px) rotate(3deg);
  }
  100% {
    transform: translate(0px, 0px) rotate(0deg);
  }
}
}
  `}</style></div>

        <div className="relative z-10">
          <div
            className={`mb-5 inline-flex rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.22em] ${
              isDark
                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                : "border-cyan-200 bg-cyan-50 text-cyan-700"
            }`}
          >
            India’s First Complete AI Textile Workshop
          </div>

          <h1 className="max-w-4xl text-5xl font-black leading-[0.96] tracking-tight md:text-7xl">
            TextilePrints to{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 bg-clip-text text-transparent">
              Mockup AI
            </span>{" "}
            Workshop
          </h1>

          <p className={`mt-6 max-w-2xl text-lg font-medium leading-8 ${mutedText}`}>
            Learn how textile businesses create premium AI catalogues for garments,
            kidswear, handlooms and home decor — without traditional photoshoots.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {["Live AI Demo", "Certificate Included", "Beginner Friendly", "WhatsApp Catalogue Ready"].map((item) => (
              <span
                key={item}
                className={`rounded-full border px-4 py-2 text-sm font-bold ${
                  isDark
                    ? "border-white/10 bg-white/10 text-white/85"
                    : "border-slate-200 bg-white text-slate-700 shadow-sm"
                }`}
              >
                ✓ {item}
              </span>
            ))}
          </div>

          <div className={`mt-8 rounded-[2rem] border p-5 ${cardClass}`}>
            <p className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-violet-500">
              Workshop Starts In
            </p>
            <div className="grid grid-cols-4 gap-2 md:gap-4">
             <TimeBox value={mounted ? timeLeft.days : 0} label="Days" />
                <TimeBox value={mounted ? timeLeft.hours : 0} label="Hours" />
<               TimeBox value={mounted ? timeLeft.minutes : 0} label="Min" />
                <TimeBox value={mounted ? timeLeft.seconds : 0} label="Sec" />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <CTA label="Join Workshop Now — ₹99" />
            <p className={`text-sm font-bold ${mutedText}`}>
              Sunday • Sharp 3:00 PM • Limited Seats
            </p>
          </div>
        </div>

        <div className={`relative z-10 rounded-[2.5rem] border p-4 ${cardClass}`}>
          <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-violet-950 to-blue-950 p-5 text-white">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em]">
                Upload → Generate → Done
              </span>
              <span className="rounded-full bg-amber-300 px-3 py-2 text-xs font-black text-slate-950">
                AI Live
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {heroImages.map((item) => (
                <div
                  key={item.title}
                  onClick={() => setSelectedImage(item)}
                  className="group cursor-pointer overflow-hidden rounded-3xl bg-white/10 p-2"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100">
                    <img
                      src={item.src}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <p className="absolute bottom-3 left-3 text-sm font-black text-white">
                      {item.category}
                    </p>
                  </div>
                  <p className="px-2 py-3 text-sm font-black">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SectionWrap eyebrow="AI Mockup Gallery" title="See What You Can Create">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {workshopGalleryImages.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              onClick={() => setSelectedImage(item)}
              className={`group cursor-pointer overflow-hidden rounded-[1.75rem] border transition duration-300 hover:-translate-y-1 hover:shadow-2xl ${cardClass}`}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                <img
                  src={item.src}
                  alt={item.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90" />

                <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-violet-700 shadow-sm backdrop-blur">
                  AI Mockup
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-lg font-black text-white">{item.title}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white/75">
                    {item.category}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <CenterCTA />
      </SectionWrap>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-8 rounded-[2.5rem] bg-slate-950 p-6 text-white shadow-2xl md:grid-cols-2 md:p-10">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
              The Problem
            </p>
            <h2 className="mt-3 text-4xl font-black md:text-5xl">
              Traditional textile shoots are slow and expensive.
            </h2>
          </div>
          <div className="grid gap-3">
            {["No stitching needed for preview", "No model shoot dependency", "No long editing delay", "Faster WhatsApp catalogue sharing"].map((item) => (
              <div key={item} className="rounded-2xl bg-white/10 p-4 font-bold">
                ✓ {item}
              </div>
            ))}
            <CTA label="Join Workshop" />
          </div>
        </div>
      </section>

      <SectionWrap eyebrow="Workshop Modules" title="What You Will Learn">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {learnItems.map((item) => (
            <div key={item.title} className={`rounded-3xl border p-6 ${cardClass}`}>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-violet-100 text-2xl">
                {item.icon}
              </div>
              <h3 className="text-xl font-black">{item.title}</h3>
              <p className={`mt-2 text-sm leading-6 ${mutedText}`}>{item.desc}</p>
            </div>
          ))}
        </div>

        <div
  className={`mt-8 overflow-hidden rounded-[2.5rem] border p-5 md:p-7 ${
    isDark
      ? "border-cyan-300/20 bg-cyan-400/10"
      : "border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-blue-50"
  }`}
>
  <div className="grid items-center gap-8 md:grid-cols-[0.95fr_1.2fr]">

    {/* LEFT CONTENT */}

    <div className="p-2 text-center md:text-left">

      <div className="mb-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-700 shadow-sm">
        Official Workshop Certificate
      </div>

      <h3 className="bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 bg-clip-text text-4xl font-black leading-tight text-transparent">
        Get Certified By AgentForge AI
      </h3>

      <p className={`mt-4 text-base leading-7 ${mutedText}`}>
        Successfully complete the workshop and receive your official
        <span className="font-black text-violet-600">
          {" "}TextilePrints to Mockup AI Certificate{" "}
        </span>
        from AgentForge AI.
      </p>

      <div className="mt-5 space-y-3">

        <div className="flex items-center gap-3 text-sm font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
            ✓
          </div>
          Industry-style professional certificate
        </div>

        <div className="flex items-center gap-3 text-sm font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
            ✓
          </div>
          Shareable on LinkedIn & Instagram
        </div>

        <div className="flex items-center gap-3 text-sm font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
            ✓
          </div>
          Exclusive for workshop attendees
        </div>

      </div>

      <div className="mt-7">
        <a
          href={REGISTER_LINK}
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 px-7 py-4 text-sm font-black uppercase tracking-wide text-white shadow-xl transition hover:scale-[1.02]"
        >
          Join Workshop →
        </a>
      </div>

    </div>

    {/* RIGHT IMAGE */}

    <div className="overflow-hidden rounded-[2rem] border border-white/50 bg-white shadow-2xl">
      <img
        src="/Workshop/certificate.jpeg"
        alt="AgentForge Workshop Certificate"
        className="w-full object-cover"
      />
    </div>

  </div>
</div>
       
      </SectionWrap>

      <SectionWrap eyebrow="Perfect For" title="Who Should Join?">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {whoItems.map((item) => (
            <div key={item} className={`rounded-3xl border p-6 text-center text-lg font-black ${cardClass}`}>
              {item}
            </div>
          ))}
        </div>
        <CenterCTA />
      </SectionWrap>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className={`rounded-[2.5rem] border p-6 md:p-10 ${cardClass}`}>
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-violet-500">
              For Factories & Wholesalers
            </p>
            <h2 className="mt-3 text-4xl font-black md:text-5xl">
              Private Onboarding Available
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {["Bulk Mockup Generation", "Faster Workflow Setup", "Dedicated Onboarding", "+1000 Founder Credits"].map((item) => (
              <div key={item} className={`rounded-3xl border p-5 text-center font-black ${cardClass}`}>
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a
              href={WHATSAPP_LINK}
              className="inline-flex rounded-2xl bg-green-500 px-7 py-4 font-black text-white shadow-xl"
            >
              Connect Privately on WhatsApp
            </a>
          </div>
        </div>
      </section>


<SectionWrap eyebrow="FAQ" title="Before You Join">
  <div className="mx-auto grid max-w-4xl gap-4 text-left">
    {[
      {
        q: " A. Why is the workshop fee only ₹99?",
        a: "₹99 is kept only to confirm seriousness. We want serious textile business owners inside — not random free registrations who never attend.",
      },
      {
        q: " B. Is this workshop beginner friendly?",
        a: "Yes. You do not need AI or design experience. We will show the process step-by-step with live examples.",
      },
      {
        q: " C. Will I get a certificate?",
        a: "Yes. Attendees will receive an AgentForge TextilePrints to Mockup AI Workshop certificate.",
      },
      {
        q: " D. Can I join from mobile?",
        a: "Yes, but laptop or computer is recommended for the best learning experience.",
      },
      {
        q: " E. What will I learn in the workshop?",
        a: "You will learn how to turn textile prints into AI mockups for garments, kidswear, home decor, handlooms and WhatsApp catalogue use.",
      },
      {
        q: " F. Is this only for big factories?",
        a: "No. It is useful for manufacturers, wholesalers, boutiques, resellers, Instagram sellers and home decor businesses.",
      },
    ].map((item) => (
      <div
        key={item.q}
        className={`rounded-3xl border p-6 ${cardClass}`}
      >
        <h3 className="text-lg font-black">{item.q}</h3>
        <p className={`mt-3 text-sm leading-7 ${mutedText}`}>
          {item.a}
        </p>
      </div>
    ))}
  </div>

  <CenterCTA />
</SectionWrap>



      <section className="mx-auto max-w-7xl px-4 py-14 text-center md:px-8">
        <div className="rounded-[2.5rem] bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 p-8 text-white shadow-2xl shadow-violet-300/30 md:p-12">
          <h2 className="text-4xl font-black md:text-6xl">
            Be Part Of India’s First TextilePrints to Mockup AI Workshop
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-medium text-white/85">
            Live demo, certificate, AI workflow and practical textile AI training.
          </p>
          <div className="mt-8">
            <a
              href={REGISTER_LINK}
              className="inline-flex rounded-2xl bg-white px-8 py-4 font-black text-violet-700 shadow-xl"
            >
              Join Workshop — ₹99
            </a>
          </div>
        </div>
      </section>

<div className="mt-4 text-center">
  <p className="bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 bg-clip-text text-lg font-black uppercase tracking-[0.22em] text-transparent">
    The textile industry is changing fast. Be early.
  </p>

  
</div>


      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-white/90 p-3 shadow-2xl backdrop-blur-xl md:hidden">
        <a
          href={REGISTER_LINK}
          className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 px-6 py-4 font-black uppercase text-white shadow-lg"
        >
          Join Workshop
        </a>
      </div>

      <a
  href={WHATSAPP_LINK}
  className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 px-6 py-4 text-sm font-black text-white shadow-2xl md:bottom-6"
>
  Register Now
</a>

      {selectedImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-xl font-black text-white"
            >
              ×
            </button>

            <img
              src={selectedImage.src}
              alt={selectedImage.title}
              className="max-h-[86vh] w-full object-contain"
            />

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
              <p className="text-2xl font-black">{selectedImage.title}</p>
              <p className="text-sm font-bold text-white/80">{selectedImage.category}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
