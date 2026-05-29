import type { Metadata } from "next";
import Link from "next/link";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: "How It Works — AgentForge AI Generation Flow",
  description:
    "Step-by-step guide to AgentForge: sign up, upload your photo, choose settings, generate a model-worn or product mockup in 30 seconds. Behind-the-scenes look at the AI engine.",
  keywords: [
    "how AgentForge works",
    "AI mockup generation steps",
    "AI textile mockup how to",
    "AI jewellery photoshoot guide",
    "AI productography flow",
  ],
  alternates: { canonical: `${SITE}/how-it-works` },
  openGraph: {
    title: "How It Works — AgentForge AI Generation Flow",
    description:
      "The 4-step AgentForge workflow + a peek under the hood of the AI engine.",
    url: `${SITE}/how-it-works`,
    type: "website",
  },
};

const STEPS = [
  {
    no: 1,
    title: "Sign up — 30 seconds",
    emoji: "🚀",
    time: "30 sec",
    body: "Create your AgentForge account with email or Google. You get 100 free credits the moment you land in — enough to test all three live agents (textile, jewellery, productography). No card required.",
  },
  {
    no: 2,
    title: "Upload your product photo",
    emoji: "📤",
    time: "10 sec",
    body: "Open any agent and drop a phone photo. JPG / PNG / WebP up to 10 MB. Background can be messy — AI replaces it. Just make sure the product is sharp, well-lit and clearly visible.",
  },
  {
    no: 3,
    title: "Choose your settings",
    emoji: "🎨",
    time: "20 sec",
    body: "Pick model type, shoot style, background mood, accessories, output size and quality. Every agent has presets tuned for Indian use cases — bridal jewellery, festive saree, Amazon main image, Meesho catalogue and more.",
  },
  {
    no: 4,
    title: "Generate & download",
    emoji: "✨",
    time: "30 sec",
    body: "Click generate. The AI does its thing in 25–40 seconds. Brand overlay (your logo, phone, website) is added automatically. HD output ready to download for Amazon, Flipkart, Meesho, Instagram, WhatsApp.",
  },
];

const TIPS = [
  {
    title: "Use natural light",
    body: "Take your input photo near a window during the day. Soft natural light beats harsh studio flash for AI input quality.",
  },
  {
    title: "Steady hands or tripod",
    body: "Sharp, in-focus photos give noticeably better results than slightly motion-blurred ones.",
  },
  {
    title: "Plain background helps",
    body: "Even though AI replaces the background, a plain wall behind the product makes edge detection cleaner — fewer reflections, no halo artefacts.",
  },
  {
    title: "Match the input aspect to the output",
    body: "Want a 1:1 catalogue image? Crop your input close to square before uploading. The AI follows your input framing more faithfully that way.",
  },
  {
    title: "Iterate with variants",
    body: "Try 2–3 background variants per product — pick the best, ship that one. Costs ~30 credits total for high-converting A/B.",
  },
];

const BEHIND = [
  {
    title: "The AI engines",
    body: "AgentForge runs on a stack of fine-tuned image-to-image diffusion models, vision-language models for prompt understanding, and a post-processing canvas pipeline that applies your brand overlay client-side for pixel-perfect placement.",
  },
  {
    title: "Why it stays fast",
    body: "Most generations finish in 25–40 seconds because the heavy AI work runs on dedicated GPUs and the output is streamed back as soon as it's ready — not held up by post-processing or queueing.",
  },
  {
    title: "What we preserve, what we transform",
    body: "Preserved: product shape, colour, fabric pattern, logo, packaging text, article codes. Transformed: background, lighting, model, composition, mood. This is the core promise — your product stays your product.",
  },
  {
    title: "Bulk catalogue mode (Empire plan)",
    body: "Empire plan users can batch up to 100 SKUs per run. They generate in parallel — 100 SKUs typically complete in ~25 minutes — and each one gets the same brand overlay automatically.",
  },
];

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to generate an AI mockup with AgentForge",
  description:
    "Sign up, upload your product photo, choose settings and generate a catalogue-ready AI mockup in 90 seconds.",
  totalTime: "PT90S",
  step: STEPS.map((s, idx) => ({
    "@type": "HowToStep",
    position: idx + 1,
    name: s.title,
    text: s.body,
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE },
    {
      "@type": "ListItem",
      position: 2,
      name: "How It Works",
      item: `${SITE}/how-it-works`,
    },
  ],
};

export default function HowItWorksPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee40,transparent_34%),radial-gradient(circle_at_top_right,#8b5cf640,transparent_32%)]" />

      <section className="relative z-10 mx-auto max-w-5xl px-5 py-14 md:py-20">
        {/* Hero */}
        <div className="mb-10 rounded-[2.2rem] border border-black/10 bg-white/85 p-7 shadow-2xl backdrop-blur-xl md:p-10 dark:border-white/10 dark:bg-white/[0.07]">
          <p className="mb-4 inline-flex rounded-full bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-600">
            How AgentForge works
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
            From phone photo to{" "}
            <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
              catalogue image in 90 seconds
            </span>
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-black/60 dark:text-white/65 md:text-lg">
            Four simple steps. No setup. No installs. No design experience
            needed. Built for Indian textile manufacturers, jewellery brands and
            D2C sellers.
          </p>
        </div>

        {/* Steps */}
        <h2 className="mb-6 text-2xl font-black md:text-3xl">The 4-step flow</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {STEPS.map((s) => (
            <div
              key={s.no}
              className="rounded-[1.7rem] border border-black/10 bg-white/85 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-lg font-black text-white shadow-md">
                  {s.no}
                </span>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                  {s.time}
                </span>
              </div>
              <h3 className="flex items-center gap-2 text-lg font-black md:text-xl">
                <span aria-hidden="true">{s.emoji}</span>
                {s.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-black/65 dark:text-white/65">
                {s.body}
              </p>
            </div>
          ))}
        </div>

        {/* Behind the scenes */}
        <h2 className="mt-12 mb-6 text-2xl font-black md:text-3xl">
          Behind the scenes
        </h2>
        <div className="space-y-3">
          {BEHIND.map((b) => (
            <div
              key={b.title}
              className="rounded-[1.5rem] border border-black/10 bg-white/85 p-6 shadow-md backdrop-blur dark:border-white/10 dark:bg-white/[0.05]"
            >
              <h3 className="text-lg font-black">{b.title}</h3>
              <p className="mt-2 text-sm leading-7 text-black/65 dark:text-white/65">
                {b.body}
              </p>
            </div>
          ))}
        </div>

        {/* Tips */}
        <h2 className="mt-12 mb-6 text-2xl font-black md:text-3xl">
          Quality tips for better outputs
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {TIPS.map((t) => (
            <div
              key={t.title}
              className="rounded-[1.5rem] border border-cyan-200/40 bg-cyan-50/40 p-5 dark:border-cyan-400/20 dark:bg-cyan-500/10"
            >
              <h3 className="flex items-start gap-2 text-sm font-black">
                <span className="mt-0.5 text-cyan-500">✓</span>
                {t.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-black/70 dark:text-white/75">
                {t.body}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <section className="mt-12 rounded-[2rem] border border-cyan-400/30 bg-gradient-to-r from-cyan-400/15 via-blue-500/15 to-purple-500/15 p-8 text-center shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-black md:text-3xl">
            Ready to try it on your products?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-8 text-black/70 dark:text-white/75 md:text-base">
            Sign up and get 100 free credits. No card required.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-105"
            >
              Sign up free →
            </Link>
            <Link
              href="/gallery"
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-7 py-3.5 text-sm font-bold transition hover:scale-105 dark:border-white/15 dark:bg-white/10"
            >
              See the gallery
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
