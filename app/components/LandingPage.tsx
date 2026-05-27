// Server component — shared template for SEO landing pages.
// Used by /ai-textile-mockup-generator-india, /ai-jewellery-photoshoot,
// /ai-saree-mockup, /ai-kurti-catalogue-maker, /ai-product-photography-india.

import Link from "next/link";
import { ReactNode } from "react";

const SITE = "https://www.aiagentforge.in";

export type LandingPageFAQ = { q: string; a: string };

export type LandingPageProps = {
  /** URL path without the leading slash, e.g. "ai-saree-mockup" */
  slug: string;
  eyebrow: string;
  heroEmoji: string;
  h1: string;
  highlight: string; // gradient-highlighted phrase shown inside H1
  subheadline: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  /** Trust strip — 3 stats */
  trust: { label: string; sub: string }[];
  /** Features list */
  features: { icon: string; title: string; desc: string }[];
  /** Step-by-step how it works */
  steps: { title: string; desc: string }[];
  /** Use cases bullets */
  useCases: string[];
  /** FAQ for FAQPage schema */
  faqs: LandingPageFAQ[];
  /** Optional extra paragraph above features */
  intro?: ReactNode;
  /** Doodle emojis for the floating background (~17 of them works well) */
  doodles: string[];
};

export default function LandingPage(props: LandingPageProps) {
  const url = `${SITE}/${props.slug}`;

  // FAQPage JSON-LD
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: props.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  // BreadcrumbList JSON-LD
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: props.h1, item: url },
    ],
  };

  // Product / Service JSON-LD
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: props.h1,
    description: props.subheadline,
    provider: {
      "@type": "Organization",
      name: "AgentForge AI",
      url: SITE,
    },
    areaServed: { "@type": "Country", name: "India" },
    url,
  };

  // Pad doodles to 17 if fewer
  const doodles = [...props.doodles, ...Array(Math.max(0, 17 - props.doodles.length)).fill("✦")];

  return (
    <main className="relative min-h-screen overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Floating Doodles */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="float-slow absolute left-[6%] top-[6%] text-4xl opacity-65 sm:text-5xl">{doodles[0]}</div>
        <div className="float-medium absolute right-[8%] top-[10%] text-4xl opacity-65 sm:text-5xl">{doodles[1]}</div>
        <div className="float-fast absolute left-[22%] top-[14%] text-2xl opacity-55 sm:text-3xl">{doodles[2]}</div>
        <div className="float-medium absolute right-[24%] top-[6%] text-3xl opacity-60 sm:text-4xl">{doodles[3]}</div>
        <div className="float-slow absolute left-[42%] top-[3%] text-2xl opacity-50 sm:text-3xl">{doodles[4]}</div>
        <div className="float-fast absolute right-[42%] top-[18%] text-3xl opacity-60 sm:text-4xl">{doodles[5]}</div>
        <div className="float-medium absolute left-[3%] top-[28%] text-3xl opacity-55 sm:text-4xl">{doodles[6]}</div>
        <div className="float-slow absolute right-[4%] top-[32%] text-3xl opacity-55 sm:text-4xl">{doodles[7]}</div>
        <div className="float-fast absolute left-[8%] top-[44%] text-3xl opacity-55 sm:text-4xl">{doodles[8]}</div>
        <div className="float-medium absolute right-[6%] top-[46%] text-3xl opacity-55 sm:text-4xl">{doodles[9]}</div>
        <div className="float-slow absolute left-[35%] top-[52%] text-2xl opacity-50 sm:text-3xl">{doodles[10]}</div>
        <div className="float-medium absolute right-[30%] top-[58%] text-2xl opacity-55 sm:text-3xl">{doodles[11]}</div>
        <div className="float-fast absolute left-[14%] top-[62%] text-3xl opacity-55 sm:text-4xl">{doodles[12]}</div>
        <div className="float-slow absolute right-[14%] top-[66%] text-3xl opacity-55 sm:text-4xl">{doodles[13]}</div>
        <div className="float-fast absolute left-[20%] top-[78%] text-2xl opacity-55 sm:text-3xl">{doodles[14]}</div>
        <div className="float-medium absolute right-[18%] top-[82%] text-3xl opacity-60 sm:text-4xl">{doodles[15]}</div>
        <div className="float-slow absolute left-[48%] top-[88%] text-2xl opacity-50 sm:text-3xl">{doodles[16]}</div>
      </div>

      <div className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-5 sm:py-16 md:py-20">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 text-5xl shadow-lg sm:h-24 sm:w-24">
            {props.heroEmoji}
          </div>

          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-white/80 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-700 shadow-md shadow-cyan-300/30 backdrop-blur dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200 sm:text-[11px]">
            <span>✨</span>
            {props.eyebrow}
            <span>✨</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            {props.h1.split(props.highlight)[0]}
            <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              {props.highlight}
            </span>
            {props.h1.split(props.highlight)[1]}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-black/65 dark:text-white/65 sm:text-base sm:leading-8">
            {props.subheadline}
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href={props.primaryCtaHref}
              className="group inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-105 active:scale-95 sm:w-auto sm:px-9 sm:py-4 sm:text-base"
            >
              ✨ {props.primaryCtaLabel}
            </Link>
            {props.secondaryCtaLabel && props.secondaryCtaHref && (
              <Link
                href={props.secondaryCtaHref}
                className="group inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-7 py-3.5 text-sm font-bold transition hover:scale-105 dark:border-white/15 dark:bg-white/10 dark:text-white sm:w-auto sm:px-9 sm:py-4 sm:text-base"
              >
                {props.secondaryCtaLabel} →
              </Link>
            )}
          </div>

          {/* Trust strip */}
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-2 rounded-2xl border border-black/10 bg-white/70 px-3 py-3 text-center backdrop-blur dark:border-white/10 dark:bg-white/[0.05] sm:mt-10 sm:gap-4 sm:px-4">
            {props.trust.map((t, idx) => (
              <div
                key={t.label}
                className={
                  idx === 1 ? "border-x border-black/10 dark:border-white/10" : ""
                }
              >
                <p className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-lg font-black text-transparent sm:text-2xl">
                  {t.label}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-black/55 dark:text-white/55 sm:text-xs">
                  {t.sub}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Optional intro paragraph */}
        {props.intro && (
          <section className="mx-auto max-w-3xl px-4 pb-8 sm:px-5">
            <div className="rounded-[1.5rem] border border-black/10 bg-white/80 p-5 text-[15px] leading-7 text-black/75 backdrop-blur dark:border-white/10 dark:bg-white/[0.05] dark:text-white/75 sm:p-6 sm:text-base sm:leading-8">
              {props.intro}
            </div>
          </section>
        )}

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-14">
          <div className="mb-8 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
              What you get
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl md:text-4xl">
              Built for Indian businesses
            </h2>
          </div>
          <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
            {props.features.map((f) => (
              <div
                key={f.title}
                className="rounded-[1.5rem] border border-black/10 bg-white/85 p-5 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:shadow-cyan-500/15 dark:border-white/10 dark:bg-white/[0.05] sm:p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-2xl text-white shadow-md">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-lg font-black sm:text-xl">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-black/65 dark:text-white/65">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-14">
          <div className="mb-8 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">How it works</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl md:text-4xl">Live in 30 seconds</h2>
          </div>
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
            {props.steps.map((step, idx) => (
              <div
                key={step.title}
                className="relative rounded-[1.5rem] border border-cyan-200/60 bg-white/85 p-5 dark:border-cyan-400/20 dark:bg-white/[0.05]"
              >
                <span className="absolute -top-3 left-5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-black text-white shadow-lg">
                  {idx + 1}
                </span>
                <h3 className="mt-2 text-base font-black sm:text-lg">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-black/60 dark:text-white/60">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Use cases */}
        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-5 sm:py-14">
          <div className="rounded-[2rem] border border-black/10 bg-white/85 p-6 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/[0.05] sm:p-8">
            <div className="text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">Use cases</p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">Perfect for</h2>
            </div>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {props.useCases.map((u) => (
                <li
                  key={u}
                  className="flex items-start gap-3 rounded-2xl border border-cyan-200/40 bg-cyan-50/40 px-4 py-3 text-sm font-bold text-black/75 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-white/80"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-[11px] font-black text-white">
                    ✓
                  </span>
                  <span>{u}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-5 sm:py-14">
          <div className="mb-6 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">FAQ</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">Common questions</h2>
          </div>
          <div className="space-y-3">
            {props.faqs.map((faq, idx) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-black/10 bg-white/85 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-white/[0.05]"
                open={idx === 0}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-black sm:text-base">
                  {faq.q}
                  <span className="text-cyan-500 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-black/65 dark:text-white/65">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-5">
          <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/40 bg-gradient-to-r from-cyan-400/15 via-blue-500/15 to-purple-500/15 p-8 text-center shadow-2xl backdrop-blur-xl">
            <h2 className="text-2xl font-black sm:text-3xl md:text-4xl">
              Start creating in the next 30 seconds
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-black/65 dark:text-white/65 sm:text-base">
              Sign up to AgentForge AI and get 200 free credits. No card required.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href={props.primaryCtaHref}
                className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-105 sm:w-auto sm:px-9 sm:py-4 sm:text-base"
              >
                ✨ {props.primaryCtaLabel}
              </Link>
              <Link
                href="/pricing"
                className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-7 py-3.5 text-sm font-bold transition hover:scale-105 dark:border-white/15 dark:bg-white/10 dark:text-white sm:w-auto sm:px-9 sm:py-4 sm:text-base"
              >
                View Pricing →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
