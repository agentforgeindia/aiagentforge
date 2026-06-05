import type { Metadata } from "next";
import Link from "next/link";

import {
  fetchChannelVideos,
  groupVideosByAgent,
  type AgentCategory,
  type YouTubeVideo,
} from "@/lib/youtube";

const SITE = "https://www.aiagentforge.in";

// Re-fetch the YouTube RSS feed at most every 15 minutes — keeps
// /how-it-works automatically up to date as new tutorials ship
// without any rebuild.
export const revalidate = 900;

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

// ────────────────────────────────────────────────────────────
// TUTORIAL VIDEOS — auto-synced from YouTube
// ────────────────────────────────────────────────────────────
// At request time the page pulls the channel's RSS feed via
// lib/youtube.ts, auto-categorises each video by keywords in
// its title/description, and renders the result. Cache window
// is 15 min (revalidate below), so a freshly uploaded video
// appears on /how-it-works within 15 minutes — NO rebuild,
// NO manual code edit.
//
// Hooks you can use to override the auto behaviour:
//   • VIDEO_OVERRIDES — force a specific videoId into a chosen
//     agent category when keyword matching gets it wrong.
//   • HIDDEN_VIDEO_IDS — drop a videoId from the page entirely
//     (e.g. brand / marketing videos that don't belong in a
//     tutorial section).
//   • STATIC_FALLBACK — list of videos shown when the RSS fetch
//     fails (offline, blocked, etc.). Keeps the page useful.
//
// Channel ID lives in lib/youtube.ts call below. Update it
// here if you ever migrate channels.
// ────────────────────────────────────────────────────────────

const CHANNEL_ID = "UCtA6G7quYS8CGnB6YxfGBng"; // Agent Forge India
const CHANNEL_UPLOADS_PLAYLIST_ID = "UUtA6G7quYS8CGnB6YxfGBng";

// Force a video into a specific category. Add entries when the
// auto-categoriser misses (e.g. video title doesn't contain any
// of the agent keywords).
//   "videoId123": "jewellery",
const VIDEO_OVERRIDES: Record<string, AgentCategory> = {};

// Videos you don't want shown on /how-it-works at all
// (e.g. brand / marketing videos that aren't tutorials).
const HIDDEN_VIDEO_IDS = new Set<string>([
  "OoiX6d_TPfQ", // "Heavy Workload in Textile Business" — marketing
  "Vt9WYLcGPuw", // "Photoshoots Without Models" — marketing
]);

// Per-agent display metadata. Videos themselves are pulled live;
// these are just the section headers + agent CTAs.
const AGENT_DISPLAY: Record<
  Exclude<AgentCategory, "other">,
  { title: string; emoji: string; description: string; agentHref: string }
> = {
  jewellery: {
    title: "Jewellery AI Studio",
    emoji: "💎",
    description:
      "Bridal sets, daily-wear, kundan, diamond — see how to upload, pick a shoot style and generate.",
    agentHref: "/jewellery-ai",
  },
  textile: {
    title: "TextilePrints to Mockup AI",
    emoji: "👕",
    description:
      "Saree, kurti, kurta, lehenga, kidswear, home textile — pick the tutorial that matches your product line.",
    agentHref: "/textileprints-to-mockup",
  },
  productography: {
    title: "Productography AI",
    emoji: "📸",
    description:
      "Product packshots, lifestyle scenes and Amazon-compliant catalogue images — full walkthrough.",
    agentHref: "/productography-ai",
  },
};

// Order in which agent sections render on the page.
const AGENT_ORDER: Exclude<AgentCategory, "other">[] = [
  "jewellery",
  "textile",
  "productography",
];

// Type kept for the static fallback array below.
type AgentTutorialBlock = {
  slug: string;
  title: string;
  emoji: string;
  description: string;
  agentHref: string;
  videos: { id: string; title: string; desc: string }[];
};

// Last-resort fallback for the rare case where the YouTube
// fetch fails (timeout, blocked, channel down). Keeps the page
// useful instead of empty.
const STATIC_FALLBACK: AgentTutorialBlock[] = [
  {
    slug: "jewellery",
    title: "Jewellery AI Studio",
    emoji: "💎",
    description:
      "Bridal sets, daily-wear, kundan, diamond — see how to upload, pick a shoot style and generate.",
    agentHref: "/jewellery-ai",
    videos: [
      {
        id: "1qmLLUqhvP8",
        title: "Jewellery designs → AI model shoots",
        desc: "Full overview — upload jewellery, pick model + style, get a premium shoot.",
      },
      {
        id: "dVRxlvIiouA",
        title: "AI earring mockup walkthrough",
        desc: "Earring design to model-worn ear close-up in 30 seconds.",
      },
    ],
  },
  {
    slug: "textile",
    title: "TextilePrints to Mockup AI",
    emoji: "👕",
    description:
      "Saree, kurti, kurta, lehenga, kidswear, home textile — pick the tutorial that matches your product line.",
    agentHref: "/textileprints-to-mockup",
    videos: [
      {
        id: "IbLgfPJCzao",
        title: "Textile prints → AI fashion models",
        desc: "Main overview — fabric design uploaded, model-worn mockup generated.",
      },
      {
        id: "drcvDWwuQLA",
        title: "AgentForge textile tutorial (Hindi)",
        desc: "Step-by-step Hindi walkthrough for Indian textile sellers.",
      },
      {
        id: "5IJFmFgH-z0",
        title: "Men's shirt mockup tutorial",
        desc: "Shirt design → professional male model fashion shoot.",
      },
      {
        id: "d1-cqb1Dq20",
        title: "Kidswear mockup tutorial",
        desc: "Family-safe kids fashion mockup from a plain design.",
      },
      {
        id: "tIhEO5srqRg",
        title: "Curtain & home-textile mockup",
        desc: "Fabric design rendered as a curtain in a real interior scene.",
      },
    ],
  },
  {
    slug: "productography",
    title: "Productography AI",
    emoji: "📸",
    description:
      "Product packshots, lifestyle scenes and Amazon-compliant catalogue images — full walkthrough.",
    agentHref: "/productography-ai",
    videos: [
      {
        id: "ORKxrasItIM",
        title: "AI product photography in minutes",
        desc: "Main overview — phone photo to catalogue-ready hero shot.",
      },
      {
        id: "FQqTZoQ1nZQ",
        title: "Product → AI model showcase",
        desc: "Product photo turned into a model lifestyle scene.",
      },
      {
        id: "Oprfu1eLSqg",
        title: "Product → AI presentation",
        desc: "Premium AI product mockup for ads and pitch decks.",
      },
    ],
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

// ────────────────────────────────────────────────────────────
// Render-shape adapter — combines auto-synced YouTube videos
// with the static fallback so the page always has something
// to show.
// ────────────────────────────────────────────────────────────
function buildTutorialBlocks(
  videos: YouTubeVideo[],
): AgentTutorialBlock[] {
  // Drop the marketing / brand videos we don't want on this page.
  const visible = videos.filter((v) => !HIDDEN_VIDEO_IDS.has(v.id));
  const grouped = groupVideosByAgent(visible, VIDEO_OVERRIDES);

  const fallbackMap = new Map(
    STATIC_FALLBACK.map((b) => [b.slug, b] as const),
  );

  return AGENT_ORDER.map((slug) => {
    const meta = AGENT_DISPLAY[slug];
    const live = grouped[slug];

    // Prefer live videos. If RSS fetch returned nothing for this
    // agent, fall back to the hardcoded list so the section
    // never disappears.
    const liveVideos = live.map((v) => ({
      id: v.id,
      title: v.title,
      desc: shortDescription(v.description),
    }));

    const fallback = fallbackMap.get(slug);
    const videosForSection =
      liveVideos.length > 0
        ? liveVideos
        : (fallback?.videos ?? []);

    return {
      slug,
      title: meta.title,
      emoji: meta.emoji,
      description: meta.description,
      agentHref: meta.agentHref,
      videos: videosForSection,
    };
  });
}

/** Trim YouTube descriptions to a tweet-sized hint — first sentence
 *  or 120 chars, whichever is shorter. */
function shortDescription(raw: string): string {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return "AgentForge tutorial — watch the full walkthrough.";
  const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned;
  if (firstSentence.length <= 120) return firstSentence;
  return firstSentence.slice(0, 117).trimEnd() + "…";
}

export default async function HowItWorksPage() {
  // Fetched at build / request boundary; cached via `revalidate`
  // above so the page refreshes within 15 minutes of any new
  // video being uploaded to the YouTube channel.
  const liveVideos = await fetchChannelVideos(CHANNEL_ID);
  const AGENT_TUTORIALS = buildTutorialBlocks(liveVideos);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      {/* Doodles — upload, generate, arrows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* Arrow right top-left */}
        <svg className="absolute left-6 top-24 h-10 w-28 text-cyan-400/35" viewBox="0 0 120 40" fill="none">
          <path d="M4 20 L100 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M88 8 L104 20 L88 32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {/* Sparkle star top-right */}
        <svg className="absolute right-10 top-16 h-10 w-10 text-purple-400/50 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
        </svg>
        {/* Gear mid-right */}
        <svg className="absolute right-8 top-1/3 h-16 w-16 text-blue-400/20" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="10" stroke="currentColor" strokeWidth="3" />
          <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="3" strokeDasharray="5 7" />
        </svg>
        {/* Upload cloud bottom-left */}
        <svg className="absolute bottom-32 left-8 h-16 w-16 text-cyan-400/25" viewBox="0 0 64 64" fill="none">
          <path d="M32 44 L32 24 M24 32 L32 24 L40 32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 44 C12 44 8 38 10 32 C12 26 18 24 22 26 C24 18 34 14 42 20 C48 16 56 22 54 30 C58 32 58 40 52 44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        {/* Dot grid bottom-right */}
        <svg className="absolute bottom-24 right-6 h-14 w-14 text-purple-400/20" viewBox="0 0 42 42" fill="currentColor">
          {[7,21,35].map(y => [7,21,35].map(x => <circle key={`${x}${y}`} cx={x} cy={y} r="2.5" />))}
        </svg>
        {/* Step numbers hint left */}
        <svg className="absolute left-10 top-1/2 h-20 w-8 text-cyan-400/15" viewBox="0 0 24 80" fill="none">
          <circle cx="12" cy="10" r="8" stroke="currentColor" strokeWidth="2.5" />
          <line x1="12" y1="18" x2="12" y2="32" stroke="currentColor" strokeWidth="2" strokeDasharray="3 4" />
          <circle cx="12" cy="40" r="8" stroke="currentColor" strokeWidth="2.5" />
          <line x1="12" y1="48" x2="12" y2="62" stroke="currentColor" strokeWidth="2" strokeDasharray="3 4" />
          <circle cx="12" cy="70" r="8" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      </div>
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

        {/* ───────── Tutorials — compact preview ─────────
            Shows ONE featured video per agent (the latest one).
            Full library lives at /tutorials with filter chips,
            VideoObject schema and the complete grid. */}
        <h2 className="mt-12 mb-2 text-2xl font-black md:text-3xl">
          Watch the tutorials
        </h2>
        <p className="mb-6 text-sm leading-7 text-black/60 dark:text-white/65 md:text-base">
          A featured walkthrough for each agent. Want the complete library? See{" "}
          <Link
            href="/tutorials"
            className="font-black text-cyan-600 underline"
          >
            all AgentForge tutorials →
          </Link>
        </p>

        <div className="grid gap-5 md:grid-cols-3">
          {AGENT_TUTORIALS.map((agent) => {
            // Compact mode: render only the FIRST (latest) video.
            // Fall back to the channel playlist if we somehow have
            // no video for this agent at all.
            const featured = agent.videos[0];
            const embedSrc = featured
              ? `https://www.youtube.com/embed/${featured.id}?rel=0&modestbranding=1`
              : `https://www.youtube.com/embed/videoseries?list=${CHANNEL_UPLOADS_PLAYLIST_ID}&rel=0&modestbranding=1`;
            const remaining = Math.max(0, agent.videos.length - 1);

            return (
              <article
                key={agent.slug}
                className="flex flex-col overflow-hidden rounded-[1.7rem] border border-black/10 bg-white/85 shadow-md backdrop-blur dark:border-white/10 dark:bg-white/[0.05]"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-black/5 dark:bg-white/[0.04]">
                  <iframe
                    src={embedSrc}
                    title={featured?.title ?? `${agent.title} tutorials`}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="flex items-center gap-2 text-base font-black md:text-lg">
                    <span aria-hidden="true">{agent.emoji}</span>
                    {agent.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-black/65 dark:text-white/65">
                    {featured?.desc ?? agent.description}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
                    <Link
                      href={`/tutorials?agent=${agent.slug}`}
                      className="text-xs font-black text-cyan-600 hover:underline"
                    >
                      {remaining > 0
                        ? `View ${remaining} more →`
                        : "View all tutorials →"}
                    </Link>
                    <Link
                      href={agent.agentHref}
                      className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-3 py-1.5 text-[11px] font-black text-white shadow-sm transition hover:scale-105"
                    >
                      Open agent →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* "View all" pill — second affordance to /tutorials */}
        <div className="mt-6 text-center">
          <Link
            href="/tutorials"
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2.5 text-sm font-black text-cyan-700 transition hover:bg-cyan-400/20 dark:text-cyan-200"
          >
            📺 Browse the full tutorial library
          </Link>
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
