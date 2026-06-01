// Server component — /news is the unified Blog + News + Updates index.
// Reads tab/category from URL searchParams so it's SEO-friendly and
// shareable. No client-side state.

import Link from "next/link";
import Image from "next/image";
import {
  listPublishedPosts,
  POST_TYPE_LABEL,
  POST_CATEGORY_LABEL,
  type PostType,
  type PostCategory,
  type UnifiedPost,
} from "@/lib/posts";
import type { BlogThumbnailConfig } from "@/app/blog/posts";

function BlogThumbnail({ cfg }: { cfg: BlogThumbnailConfig }) {
  return (
    <div
      className="relative flex h-full w-full flex-col justify-between overflow-hidden p-5"
      style={{ background: `linear-gradient(135deg, ${cfg.gradientFrom}, ${cfg.gradientTo})` }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "22px 22px" }}
      />
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/15 blur-2xl" />

      <div className="relative flex items-center justify-between">
        <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-black/80 shadow">
          {cfg.badge}
        </span>
        <span className="text-3xl drop-shadow-lg">{cfg.icon}</span>
      </div>

      <div className="relative flex items-center gap-1.5">
        <div className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-md bg-white/95 shadow">
          <Image
            src="/af-logo.png"
            alt="AgentForge AI"
            width={24}
            height={24}
            className="h-full w-full object-contain"
          />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-white/85">AgentForge AI</span>
      </div>

      <div className="relative min-w-0">
        <p className="break-words text-xl font-black leading-tight tracking-tight text-white drop-shadow sm:text-3xl">
          {cfg.headline}
          <span className="block text-white/80">{cfg.subline}</span>
        </p>
      </div>

      {cfg.statsRow && (
        <div className="relative flex flex-wrap gap-1.5">
          {cfg.statsRow.map((s) => (
            <span key={s} className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const SITE = "https://www.aiagentforge.in";

// Tab definitions — drives the top tab strip.
const TAB_DEFS: { key: "all" | PostType; label: string; emoji: string }[] = [
  { key: "all", label: "All", emoji: "✨" },
  { key: "blog", label: POST_TYPE_LABEL.blog, emoji: "📝" },
  { key: "news", label: POST_TYPE_LABEL.news, emoji: "📰" },
  { key: "update", label: POST_TYPE_LABEL.update, emoji: "🚀" },
];

// Category chip definitions — drives the secondary filter row.
const CATEGORY_DEFS: { key: "all" | PostCategory; label: string }[] = [
  { key: "all", label: "All topics" },
  { key: "textile", label: POST_CATEGORY_LABEL.textile },
  { key: "jewellery", label: POST_CATEGORY_LABEL.jewellery },
  { key: "productography", label: POST_CATEGORY_LABEL.productography },
  { key: "guide", label: POST_CATEGORY_LABEL.guide },
  { key: "announcement", label: POST_CATEGORY_LABEL.announcement },
];

const CATEGORY_ACCENT: Record<PostCategory, string> = {
  textile:
    "bg-cyan-50 text-cyan-700 border-cyan-300 dark:bg-cyan-500/15 dark:text-cyan-200 dark:border-cyan-400/30",
  jewellery:
    "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-400/30",
  productography:
    "bg-violet-50 text-violet-700 border-violet-300 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-400/30",
  guide:
    "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-400/30",
  announcement:
    "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-400/30",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Build a /news URL keeping any other active filter. */
function buildHref(
  tab: "all" | PostType,
  category: "all" | PostCategory,
): string {
  const params = new URLSearchParams();
  if (tab !== "all") params.set("tab", tab);
  if (category !== "all") params.set("category", category);
  const qs = params.toString();
  return qs ? `/news?${qs}` : "/news";
}

type SearchParams = Promise<{ tab?: string; category?: string }>;

export default async function NewsIndexPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const activeTab: "all" | PostType =
    (params.tab as PostType | undefined) &&
    TAB_DEFS.some((t) => t.key === params.tab)
      ? (params.tab as PostType)
      : "all";

  const activeCategory: "all" | PostCategory =
    (params.category as PostCategory | undefined) &&
    CATEGORY_DEFS.some((c) => c.key === params.category)
      ? (params.category as PostCategory)
      : "all";

  const posts = await listPublishedPosts({
    type: activeTab,
    category: activeCategory,
  });

  const featured = posts[0];
  const rest = posts.slice(1);

  // JSON-LD: BreadcrumbList + ItemList of posts for richer Google preview.
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "News", item: `${SITE}/news` },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: posts.slice(0, 30).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/blog/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Subtle floating doodles for visual rhythm */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="float-slow absolute left-[6%] top-[8%] text-3xl opacity-40">📝</div>
        <div className="float-medium absolute right-[8%] top-[12%] text-3xl opacity-40">📰</div>
        <div className="float-fast absolute left-[12%] bottom-[20%] text-2xl opacity-35">✨</div>
        <div className="float-slow absolute right-[14%] bottom-[24%] text-3xl opacity-40">🚀</div>
        <div className="float-medium absolute left-[48%] top-[5%] text-2xl opacity-30">✦</div>
      </div>

      {/* ───────── Hero ───────── */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 pb-6 pt-12 text-center sm:px-5 sm:pb-8 sm:pt-16">
        <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/60 bg-white/80 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-700 shadow-md shadow-cyan-300/30 backdrop-blur dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200 sm:text-[11px]">
          AgentForge Newsroom
        </div>
        <h1 className="mx-auto max-w-3xl text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
          News, blog &amp; product updates from{" "}
          <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            AgentForge AI
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-black/60 dark:text-white/65 sm:text-base sm:leading-7">
          Industry stories, honest playbooks, and product news — for Indian textile,
          jewellery and D2C brands shipping AI catalogues at scale.
        </p>
      </section>

      {/* ───────── Type tabs ───────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-4 sm:px-5">
        <div
          className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Content type"
        >
          {TAB_DEFS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Link
                key={tab.key}
                href={buildHref(tab.key, activeCategory)}
                role="tab"
                aria-selected={active}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition ${
                  active
                    ? "border-transparent bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/30"
                    : "border-black/10 bg-white/80 text-black/70 hover:border-cyan-400 hover:text-cyan-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70"
                }`}
              >
                <span aria-hidden="true">{tab.emoji}</span>
                {tab.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ───────── Category chips ───────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-8 sm:px-5">
        <div
          className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Topic filter"
        >
          {CATEGORY_DEFS.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <Link
                key={cat.key}
                href={buildHref(activeTab, cat.key)}
                role="tab"
                aria-selected={active}
                className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  active
                    ? "border-cyan-400 bg-cyan-100/70 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200"
                    : "border-black/10 bg-white/70 text-black/55 hover:border-cyan-400 hover:text-cyan-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55"
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ───────── Featured + grid ───────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-16 sm:px-5">
        {posts.length === 0 ? (
          <div className="rounded-[2rem] border border-black/10 bg-white/80 p-12 text-center backdrop-blur dark:border-white/10 dark:bg-white/[0.05]">
            <p className="text-4xl">🗒️</p>
            <p className="mt-3 text-base font-black">No posts found</p>
            <p className="mt-1 text-sm text-black/55 dark:text-white/55">
              Try a different tab or topic filter.
            </p>
          </div>
        ) : (
          <>
            {featured && <FeaturedCard post={featured} />}
            {rest.length > 0 && (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p) => (
                  <PostCard key={`${p.source}:${p.slug}`} post={p} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

// ───────── Card components (server) ─────────

function CategoryChip({ category }: { category: PostCategory }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] ${CATEGORY_ACCENT[category]}`}
    >
      {POST_CATEGORY_LABEL[category]}
    </span>
  );
}

function TypeChip({ type }: { type: PostType }) {
  const emoji = TAB_DEFS.find((t) => t.key === type)?.emoji ?? "📝";
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-black/60 dark:bg-white/10 dark:text-white/60">
      <span aria-hidden="true">{emoji}</span>
      {POST_TYPE_LABEL[type]}
    </span>
  );
}

function FeaturedCard({ post }: { post: UnifiedPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative block overflow-hidden rounded-[2rem] border border-black/10 bg-white/85 shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:shadow-cyan-500/15 dark:border-white/10 dark:bg-white/[0.05]"
    >
      <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-cyan-100 via-blue-50 to-purple-100 dark:from-cyan-900/40 dark:via-blue-900/30 dark:to-purple-900/40">
          {post.thumbnail ? (
            <BlogThumbnail cfg={post.thumbnail} />
          ) : post.heroImageUrl ? (
            <Image
              src={post.heroImageUrl}
              alt={post.title}
              fill
              sizes="(min-width: 1024px) 600px, 100vw"
              className="object-cover transition duration-700 group-hover:scale-[1.03]"
              priority={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-7xl sm:text-8xl">
              <span aria-hidden="true">{post.heroEmoji}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <TypeChip type={post.type} />
            <CategoryChip category={post.category} />
            <span className="text-[11px] font-bold text-black/45 dark:text-white/45">
              {formatDate(post.publishedAt)} · {post.readMinutes} min read
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
            {post.title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-black/65 dark:text-white/65 sm:text-base">
            {post.excerpt}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-600">
            Read article →
          </div>
        </div>
      </div>
    </Link>
  );
}

function PostCard({ post }: { post: UnifiedPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-black/10 bg-white/85 shadow-md backdrop-blur transition hover:-translate-y-0.5 hover:shadow-cyan-500/15 dark:border-white/10 dark:bg-white/[0.05]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-cyan-50 to-purple-50 dark:from-cyan-900/30 dark:to-purple-900/30">
        {post.thumbnail ? (
          <BlogThumbnail cfg={post.thumbnail} />
        ) : post.heroImageUrl ? (
          <Image
            src={post.heroImageUrl}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl">
            <span aria-hidden="true">{post.heroEmoji}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <TypeChip type={post.type} />
          <CategoryChip category={post.category} />
        </div>
        <h3 className="mt-3 line-clamp-2 text-base font-black leading-snug sm:text-lg">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-black/60 dark:text-white/60">
          {post.excerpt}
        </p>
        <div className="mt-auto pt-4 text-[11px] font-bold text-black/45 dark:text-white/45">
          {formatDate(post.publishedAt)} · {post.readMinutes} min read
        </div>
      </div>
    </Link>
  );
}
