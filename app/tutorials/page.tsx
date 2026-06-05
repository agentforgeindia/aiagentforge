// Server component — full auto-synced tutorial library.
// Pulls every video off the AgentForge YouTube channel via RSS
// (see lib/youtube.ts), buckets by agent, and renders a
// filterable grid. URL ?agent=jewellery/textile/productography
// narrows the view server-side — shareable, no client JS.

import Link from "next/link";
import HeroSlider from "./HeroSlider";

import {
  fetchChannelVideos,
  groupVideosByAgent,
  type AgentCategory,
  type YouTubeVideo,
} from "@/lib/youtube";

const SITE = "https://www.aiagentforge.in";
const CHANNEL_ID = "UCtA6G7quYS8CGnB6YxfGBng";
const CHANNEL_URL = "https://www.youtube.com/@agentforgeindia";

// Same overrides / hides as /how-it-works so behaviour stays
// consistent across the site. Both pages read from this single
// source.
const VIDEO_OVERRIDES: Record<string, AgentCategory> = {};
const HIDDEN_VIDEO_IDS = new Set<string>([
  "OoiX6d_TPfQ", // "Heavy Workload in Textile Business" — marketing, not tutorial
  "Vt9WYLcGPuw", // "Photoshoots Without Models" — marketing
]);

// Display metadata per category — same shape as /how-it-works.
const AGENT_DISPLAY: Record<
  Exclude<AgentCategory, "other">,
  { title: string; emoji: string; agentHref: string; accent: string }
> = {
  jewellery: {
    title: "Jewellery AI Studio",
    emoji: "💎",
    agentHref: "/jewellery-ai",
    accent:
      "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-400/30",
  },
  textile: {
    title: "TextilePrints to Mockup AI",
    emoji: "👕",
    agentHref: "/textileprints-to-mockup",
    accent:
      "bg-cyan-50 text-cyan-700 border-cyan-300 dark:bg-cyan-500/15 dark:text-cyan-200 dark:border-cyan-400/30",
  },
  productography: {
    title: "Productography AI",
    emoji: "📸",
    agentHref: "/productography-ai",
    accent:
      "bg-violet-50 text-violet-700 border-violet-300 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-400/30",
  },
};

const AGENT_ORDER: Exclude<AgentCategory, "other">[] = [
  "jewellery",
  "textile",
  "productography",
];

// 15-minute ISR — same window as /how-it-works.
export const revalidate = 900;

type SearchParams = Promise<{ agent?: string }>;

function isValidAgent(v: unknown): v is Exclude<AgentCategory, "other"> {
  return v === "jewellery" || v === "textile" || v === "productography";
}

function formatDate(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function shortDescription(raw: string, max = 140): string {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return "AgentForge tutorial — watch the full walkthrough.";
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, max - 1).trimEnd() + "…";
}

function ytThumb(id: string) {
  // High-quality thumbnail Google always serves for public videos.
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export default async function TutorialsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const activeFilter: "all" | Exclude<AgentCategory, "other"> = isValidAgent(
    params.agent,
  )
    ? params.agent
    : "all";

  // Fetch + group + drop hidden / marketing videos.
  const all = await fetchChannelVideos(CHANNEL_ID);
  const visible = all.filter((v) => !HIDDEN_VIDEO_IDS.has(v.id));
  const grouped = groupVideosByAgent(visible, VIDEO_OVERRIDES);

  // Counts for the filter chips.
  const totalCount = visible.length;
  const counts: Record<"all" | Exclude<AgentCategory, "other">, number> = {
    all: totalCount,
    jewellery: grouped.jewellery.length,
    textile: grouped.textile.length,
    productography: grouped.productography.length,
  };

  // Resolve which videos to render based on the active filter.
  const renderList: { agent: Exclude<AgentCategory, "other">; video: YouTubeVideo }[] =
    activeFilter === "all"
      ? AGENT_ORDER.flatMap((agent) =>
          grouped[agent].map((video) => ({ agent, video })),
        )
      : grouped[activeFilter].map((video) => ({ agent: activeFilter, video }));

  // ────────────────────────────────────────────────────────────
  // SCHEMA — VideoObject for each video + ItemList for the page.
  // ────────────────────────────────────────────────────────────
  const videoObjectsSchema = renderList.map(({ video }) => ({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: shortDescription(video.description, 280),
    thumbnailUrl: [ytThumb(video.id)],
    uploadDate: video.publishedAt,
    contentUrl: video.url,
    embedUrl: `https://www.youtube.com/embed/${video.id}`,
    publisher: {
      "@type": "Organization",
      name: "AgentForge AI",
      url: SITE,
    },
  }));

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AgentForge AI Tutorials",
    numberOfItems: renderList.length,
    itemListElement: renderList.map(({ video }, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: video.url,
      name: video.title,
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
        name: "Tutorials",
        item: `${SITE}/tutorials`,
      },
    ],
  };

  function chipHref(target: "all" | Exclude<AgentCategory, "other">) {
    return target === "all" ? "/tutorials" : `/tutorials?agent=${target}`;
  }

  const FILTER_CHIPS: {
    key: "all" | Exclude<AgentCategory, "other">;
    label: string;
    emoji: string;
  }[] = [
    { key: "all", label: "All", emoji: "✨" },
    { key: "jewellery", label: "Jewellery", emoji: "💎" },
    { key: "textile", label: "Textile", emoji: "👕" },
    { key: "productography", label: "Productography", emoji: "📸" },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff8e8] text-[#111827] dark:bg-[#070b14] dark:text-white">
      {/* Doodles — play, video, learning */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* Play button top-left */}
        <svg className="absolute left-8 top-20 h-16 w-16 text-cyan-400/30" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3" />
          <path d="M24 20 L48 32 L24 44 Z" fill="currentColor" opacity="0.5" />
        </svg>
        {/* Star sparkle top-right */}
        <svg className="absolute right-10 top-14 h-10 w-10 text-purple-400/50 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
        </svg>
        {/* Film strip mid-right */}
        <svg className="absolute right-6 top-1/3 h-20 w-8 text-blue-400/20" viewBox="0 0 28 80" fill="none">
          <rect x="2" y="2" width="24" height="76" rx="4" stroke="currentColor" strokeWidth="2.5" />
          {[8,20,32,44,56,68].map(y => <rect key={y} x="6" y={y} width="16" height="8" rx="2" fill="currentColor" opacity="0.4" />)}
        </svg>
        {/* Wavy line bottom */}
        <svg className="absolute bottom-28 left-6 h-10 w-32 text-cyan-400/25" viewBox="0 0 130 40" fill="none">
          <path d="M2 20 Q 22 4, 42 20 T 82 20 T 122 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        {/* Dot grid bottom-right */}
        <svg className="absolute bottom-20 right-10 h-14 w-14 text-purple-400/20" viewBox="0 0 42 42" fill="currentColor">
          {[7,21,35].map(y => [7,21,35].map(x => <circle key={`${x}${y}`} cx={x} cy={y} r="2.5" />))}
        </svg>
        {/* Small play buttons scattered */}
        <svg className="absolute left-1/4 top-16 h-8 w-8 text-cyan-400/20" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" />
          <path d="M12 10 L24 16 L12 22 Z" fill="currentColor" opacity="0.4" />
        </svg>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      {videoObjectsSchema.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee40,transparent_34%),radial-gradient(circle_at_top_right,#8b5cf640,transparent_32%)]" />

      <section className="relative z-10 mx-auto max-w-6xl px-5 py-14 md:py-20">
        {/* ───────── Hero ───────── */}
        <div className="mb-8 overflow-hidden rounded-[2.2rem] border border-black/10 bg-white/85 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.07]">
          <div className="grid gap-0 md:grid-cols-[1fr_1.1fr]">

            {/* Left — copy */}
            <div className="flex flex-col justify-center p-7 md:p-10">
              <p className="mb-4 inline-flex w-fit rounded-full bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-600">
                AgentForge Tutorials
              </p>
              <h1 className="text-3xl font-black leading-tight tracking-tight md:text-5xl">
                Learn how to use{" "}
                <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  every AI agent
                </span>{" "}
                — step by step
              </h1>
              <p className="mt-4 text-sm leading-7 text-black/60 dark:text-white/65 md:text-base">
                Watch real walkthroughs for Jewellery AI Studio, TextilePrints to Mockup AI and Productography AI — from uploading your first image to downloading a catalogue-ready output.
              </p>

            </div>

            {/* Right — auto-sliding hero slider */}
            <div className="hidden p-4 md:block">
              <HeroSlider
                videos={AGENT_ORDER.flatMap((agent) =>
                  grouped[agent].map((v) => ({
                    id: v.id,
                    title: v.title,
                    url: v.url,
                    agent,
                    emoji: AGENT_DISPLAY[agent].emoji,
                  }))
                )}
              />
            </div>
          </div>
        </div>

        {/* ───────── Category cards ───────── */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {AGENT_ORDER.map((agent) => {
            const meta = AGENT_DISPLAY[agent];
            const count = grouped[agent].length;
            return (
              <Link
                key={agent}
                href={`/tutorials?agent=${agent}`}
                className={`group flex items-center gap-4 rounded-2xl border px-6 py-5 transition hover:-translate-y-0.5 hover:shadow-lg ${meta.accent}`}
              >
                <span className="text-4xl">{meta.emoji}</span>
                <div>
                  <p className="text-base font-black leading-tight">
                    {meta.title.replace(/\s*AI(\s+Studio)?$/i, "")}
                  </p>
                  <p className="mt-0.5 text-sm font-bold opacity-70">
                    {count} tutorial{count !== 1 ? "s" : ""}
                  </p>
                </div>
                <span className="ml-auto text-lg font-black opacity-40 transition group-hover:translate-x-1">→</span>
              </Link>
            );
          })}
        </div>

        {/* ───────── Filter chips ───────── */}
        <div
          className="-mx-1 mb-8 flex items-center gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Filter tutorials by agent"
        >
          {FILTER_CHIPS.map((chip) => {
            const active = activeFilter === chip.key;
            const count = counts[chip.key];
            return (
              <Link
                key={chip.key}
                href={chipHref(chip.key)}
                role="tab"
                aria-selected={active}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition ${
                  active
                    ? "border-transparent bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/30"
                    : "border-black/10 bg-white/80 text-black/70 hover:border-cyan-400 hover:text-cyan-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70"
                }`}
              >
                <span aria-hidden="true">{chip.emoji}</span>
                {chip.label}
                <span
                  className={`rounded-full px-2 text-[10px] font-black uppercase tracking-widest ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-black/5 text-black/55 dark:bg-white/10 dark:text-white/55"
                  }`}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* ───────── Video grid ───────── */}
        {renderList.length === 0 ? (
          <div className="rounded-[1.7rem] border border-black/10 bg-white/85 p-12 text-center backdrop-blur dark:border-white/10 dark:bg-white/[0.05]">
            <p className="text-4xl">📭</p>
            <p className="mt-3 text-base font-black">No tutorials found</p>
            <p className="mt-1 text-sm text-black/55 dark:text-white/55">
              Try a different filter or visit{" "}
              <a
                href={CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-black text-cyan-600 underline"
              >
                our channel
              </a>{" "}
              directly.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {renderList.map(({ agent, video }) => {
              const meta = AGENT_DISPLAY[agent];
              return (
                <article
                  key={video.id}
                  className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-black/10 bg-white/85 shadow-md backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/15 dark:border-white/10 dark:bg-white/[0.05]"
                >
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/thumb relative block aspect-video w-full overflow-hidden bg-black/5 dark:bg-white/[0.04]"
                    aria-label={`Watch: ${video.title}`}
                  >
                    <img
                      src={ytThumb(video.id)}
                      alt={video.title}
                      className="h-full w-full object-cover transition duration-300 group-hover/thumb:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 transition group-hover/thumb:bg-black/35" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-xl transition duration-200 group-hover/thumb:scale-110">
                        <svg className="h-6 w-6 translate-x-0.5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      YouTube ↗
                    </span>
                  </a>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Link
                        href={meta.agentHref}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] transition hover:scale-105 ${meta.accent}`}
                      >
                        <span aria-hidden="true">{meta.emoji}</span>
                        {meta.title.replace(/\s*AI(\s+Studio)?$/i, "")}
                      </Link>
                      <span className="text-[11px] font-bold text-black/45 dark:text-white/45">
                        {formatDate(video.publishedAt)}
                      </span>
                    </div>

                    <h2 className="line-clamp-2 text-base font-black leading-snug">
                      {video.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-black/60 dark:text-white/60">
                      {shortDescription(video.description)}
                    </p>

                    <div className="mt-auto pt-4">
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-black text-cyan-600 hover:underline"
                      >
                        Watch on YouTube ↗
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ───────── Bottom CTA ───────── */}
        <section className="mt-12 rounded-[2rem] border border-cyan-400/30 bg-gradient-to-r from-cyan-400/15 via-blue-500/15 to-purple-500/15 p-7 shadow-xl backdrop-blur-xl md:p-9">
          <h2 className="text-2xl font-black md:text-3xl">
            Want a live walkthrough or custom training?
          </h2>
          <p className="mt-3 leading-8 text-black/70 dark:text-white/75">
            Email{" "}
            <a
              href="mailto:info@aiagentforge.in"
              className="font-black text-cyan-600 underline"
            >
              info@aiagentforge.in
            </a>{" "}
            and we'll arrange a 30-minute demo for your team. Subscribe to{" "}
            <a
              href={CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-black text-cyan-600 underline"
            >
              @agentforgeindia
            </a>{" "}
            for new tutorials as we ship them.
          </p>
        </section>
      </section>
    </main>
  );
}
