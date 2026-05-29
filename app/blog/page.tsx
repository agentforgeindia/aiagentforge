"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BLOG_POSTS, type BlogPost } from "./posts";

const CATEGORY_ACCENT: Record<string, { from: string; to: string; chip: string; ring: string }> = {
  All: { from: "from-cyan-400", to: "to-blue-500", chip: "bg-cyan-50 text-cyan-700 border-cyan-300 dark:bg-cyan-500/15 dark:text-cyan-200 dark:border-cyan-400/30", ring: "ring-cyan-400" },
  Textile: { from: "from-cyan-400", to: "to-blue-500", chip: "bg-cyan-50 text-cyan-700 border-cyan-300 dark:bg-cyan-500/15 dark:text-cyan-200 dark:border-cyan-400/30", ring: "ring-cyan-400" },
  Jewellery: { from: "from-amber-400", to: "to-rose-500", chip: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-400/30", ring: "ring-amber-400" },
  Productography: { from: "from-violet-500", to: "to-fuchsia-500", chip: "bg-violet-50 text-violet-700 border-violet-300 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-400/30", ring: "ring-violet-400" },
  Guide: { from: "from-emerald-400", to: "to-cyan-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-400/30", ring: "ring-emerald-400" },
};

const CATEGORIES = ["All", "Textile", "Jewellery", "Productography", "Guide"] as const;
type Category = (typeof CATEGORIES)[number];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BlogIndexPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const SITE = "https://www.aiagentforge.in";
  const allPosts = useMemo(
    () =>
      [...BLOG_POSTS].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      ),
    [],
  );

  const filtered = useMemo(
    () => (activeCategory === "All" ? allPosts : allPosts.filter((p) => p.category === activeCategory)),
    [activeCategory, allPosts],
  );

  const featured = filtered[0];
  const rest = filtered.slice(1);

  const counts = useMemo(() => {
    const map: Record<Category, number> = { All: allPosts.length, Textile: 0, Jewellery: 0, Productography: 0, Guide: 0 };
    for (const p of allPosts) map[p.category as Category]++;
    return map;
  }, [allPosts]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Subtle, focused doodles only — much fewer than before */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="float-slow absolute left-[6%] top-[8%] text-3xl opacity-40">📝</div>
        <div className="float-medium absolute right-[8%] top-[12%] text-3xl opacity-40">💡</div>
        <div className="float-fast absolute left-[12%] bottom-[20%] text-2xl opacity-35">✨</div>
        <div className="float-slow absolute right-[14%] bottom-[24%] text-3xl opacity-40">📚</div>
        <div className="float-medium absolute left-[48%] top-[5%] text-2xl opacity-30">✦</div>
      </div>

      {/* ======= Hero (cleaner, centred, single-column) ======= */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 pb-8 pt-12 text-center sm:px-5 sm:pb-10 sm:pt-16">
        <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/60 bg-white/80 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-700 shadow-md shadow-cyan-300/30 backdrop-blur dark:border-cyan-400/30 dark:bg-white/10 dark:text-cyan-200 sm:text-[11px]">
          AgentForge Blog
        </div>
        <h1 className="mx-auto max-w-3xl text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
          Guides &amp; case studies for{" "}
          <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Indian textile, jewellery &amp; D2C brands
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-black/60 dark:text-white/65 sm:text-base sm:leading-7">
          Real workflows, honest cost comparisons and step-by-step playbooks for sellers shipping
          AI catalogues at scale — from Surat saree wholesalers to D2C skincare brands.
        </p>
      </section>

      {/* ======= Category filter strip ======= */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-8 sm:px-5">
        <div
          className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Blog category filter"
        >
          {CATEGORIES.map((cat) => {
            const accent = CATEGORY_ACCENT[cat];
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCategory(cat)}
                className={`group inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-black transition active:scale-95 sm:text-sm ${
                  active
                    ? `border-transparent bg-gradient-to-r ${accent.from} ${accent.to} text-white shadow-lg shadow-black/10`
                    : "border-black/10 bg-white/80 text-black/70 hover:border-cyan-300 hover:text-black dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70 dark:hover:text-white"
                }`}
              >
                {cat}
                <span
                  className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                    active ? "bg-white/25 text-white" : "bg-black/10 text-black/60 dark:bg-white/10 dark:text-white/60"
                  }`}
                >
                  {counts[cat]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ======= Featured post (clean side-by-side, balanced) ======= */}
      {featured && (
        <section className="relative z-10 mx-auto max-w-6xl px-4 pb-10 sm:px-5">
          <Link
            href={`/blog/${featured.slug}`}
            className="group relative block overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl dark:border-white/10 dark:bg-white/[0.04]"
          >
            <div className="grid gap-0 md:grid-cols-[1.05fr_1.4fr]">
              {/* Visual side — gradient with emoji */}
              <div
                className={`relative flex items-center justify-center bg-gradient-to-br ${
                  CATEGORY_ACCENT[featured.category].from
                } ${CATEGORY_ACCENT[featured.category].to} p-10 md:p-14`}
                style={{ minHeight: 200 }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 30% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 70%, white 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />
                <div className="relative text-7xl drop-shadow-lg md:text-8xl">{featured.heroEmoji}</div>
                <span className="absolute left-5 top-5 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-black/80 shadow">
                  ⭐ Featured
                </span>
              </div>

              {/* Content side */}
              <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 ${
                      CATEGORY_ACCENT[featured.category].chip
                    }`}
                  >
                    {featured.category}
                  </span>
                  <span className="text-black/45 dark:text-white/45">
                    {formatDate(featured.publishedAt)} · {featured.readMinutes} min read
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-black leading-snug tracking-tight sm:text-2xl md:text-3xl">
                  {featured.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-black/65 dark:text-white/65 sm:text-base sm:leading-7">
                  {featured.excerpt}
                </p>
                <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-black text-cyan-600 dark:text-cyan-300">
                  Read article
                  <span className="transition group-hover:translate-x-1">→</span>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ======= Article grid (uniform cards, clean alignment) ======= */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-16 sm:px-5">
        {rest.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-10 text-center dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-sm font-black">
              More <span className="text-cyan-600 dark:text-cyan-300">{activeCategory}</span> articles coming soon.
            </p>
            <p className="mt-2 text-xs text-black/55 dark:text-white/55">
              In the meantime, explore the other categories or try our AI tools live.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* ======= CTA banner ======= */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-16 sm:px-5">
        <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/40 bg-gradient-to-r from-cyan-50 via-white to-blue-50 p-6 shadow-xl dark:border-cyan-400/20 dark:bg-gradient-to-r dark:from-cyan-500/10 dark:via-white/[0.04] dark:to-blue-500/10 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative grid items-center gap-5 md:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-600">
                Ready when you are
              </p>
              <h3 className="mt-2 text-xl font-black leading-tight sm:text-2xl md:text-3xl">
                Stop reading. Start shipping AI catalogues today.
              </h3>
              <p className="mt-2 text-sm text-black/60 dark:text-white/65 sm:text-base">
                Sign up free · 100 credits on the house · No card required
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 text-sm font-black text-white shadow-xl shadow-cyan-500/30 transition hover:scale-105"
              >
                Get Free Credits →
              </Link>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-black text-black transition hover:scale-105 dark:border-white/15 dark:bg-white/10 dark:text-white"
              >
                See Gallery
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ============================================================
// ArticleCard — uniform, balanced, clean
// ============================================================
function ArticleCard({ post }: { post: BlogPost }) {
  const accent = CATEGORY_ACCENT[post.category];
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-cyan-400/40"
    >
      {/* Visual */}
      <div
        className={`relative flex items-center justify-center bg-gradient-to-br ${accent.from} ${accent.to}`}
        style={{ aspectRatio: "16 / 9" }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 70%, white 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative text-6xl drop-shadow-lg">{post.heroEmoji}</div>
        <span
          className={`absolute left-3 top-3 rounded-full border border-white/40 bg-white/95 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-black/80 shadow`}
        >
          {post.category}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-black/45 dark:text-white/45">
          {formatDate(post.publishedAt)} · {post.readMinutes} min read
        </p>
        <h3 className="mt-2 text-base font-black leading-snug tracking-tight sm:text-lg">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-black/60 dark:text-white/65">
          {post.excerpt}
        </p>
        <div className="mt-auto pt-4">
          <span className="inline-flex items-center gap-1 text-xs font-black text-cyan-600 dark:text-cyan-300">
            Read article
            <span className="transition group-hover:translate-x-1">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
