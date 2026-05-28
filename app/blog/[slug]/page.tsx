import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getPostBySlug, type BlogSection } from "../posts";

const SITE = "https://www.aiagentforge.in";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post not found",
      description: "The blog post you are looking for could not be found.",
    };
  }

  const url = `${SITE}/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
      siteName: "AgentForge AI",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function RenderSection({ section }: { section: BlogSection }) {
  if (section.type === "p") {
    return (
      <p className="mt-5 text-[15px] leading-7 text-black/75 dark:text-white/75 sm:text-base sm:leading-8">
        {section.text}
      </p>
    );
  }
  if (section.type === "h2") {
    return (
      <h2 className="mt-10 text-2xl font-black tracking-tight sm:text-3xl">
        {section.text}
      </h2>
    );
  }
  if (section.type === "h3") {
    return <h3 className="mt-7 text-xl font-black tracking-tight sm:text-2xl">{section.text}</h3>;
  }
  if (section.type === "ul") {
    return (
      <ul className="mt-4 space-y-2.5 text-[15px] leading-7 text-black/75 dark:text-white/75 sm:text-base sm:leading-7">
        {section.items.map((it) => (
          <li key={it} className="flex items-start gap-3">
            <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (section.type === "quote") {
    return (
      <blockquote className="my-6 border-l-4 border-cyan-400 bg-cyan-50/70 px-5 py-4 text-base font-black italic text-cyan-900 dark:bg-cyan-500/10 dark:text-cyan-100">
        “{section.text}”
      </blockquote>
    );
  }
  return null;
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const url = `${SITE}/blog/${post.slug}`;

  // Related posts (same category, exclude current)
  const related = BLOG_POSTS.filter(
    (p) => p.slug !== post.slug && p.category === post.category,
  ).slice(0, 3);

  // JSON-LD Article schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "AgentForge AI",
      logo: { "@type": "ImageObject", url: `${SITE}/logo-new.jpg` },
    },
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: post.keywords.join(", "),
  };

  // BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Floating Doodles — subtle */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="float-slow absolute left-[6%] top-[8%] text-3xl opacity-50">✨</div>
        <div className="float-medium absolute right-[8%] top-[14%] text-3xl opacity-50">📝</div>
        <div className="float-fast absolute right-[12%] top-[60%] text-2xl opacity-45">✦</div>
        <div className="float-slow absolute left-[10%] top-[72%] text-3xl opacity-50">💡</div>
        <div className="float-medium absolute left-[44%] top-[88%] text-2xl opacity-45">💫</div>
      </div>

      <article className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-5 sm:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-black/55 dark:text-white/55">
          <Link href="/" className="hover:text-cyan-600 dark:hover:text-cyan-300">
            Home
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-cyan-600 dark:hover:text-cyan-300">
            Blog
          </Link>
          <span>/</span>
          <span className="truncate text-black/70 dark:text-white/70">{post.category}</span>
        </nav>

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 text-5xl shadow-lg">
            {post.heroEmoji}
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600">
            {post.category} · {post.readMinutes} min read
          </p>
          <h1 className="mx-auto mt-3 max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl">
            {post.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-black/60 dark:text-white/65 sm:text-base sm:leading-8">
            {post.description}
          </p>
          <p className="mt-3 text-xs font-bold text-black/45 dark:text-white/45">
            By {post.author} · {formatDate(post.publishedAt)}
          </p>
        </div>

        {/* Body */}
        <div className="mt-10">
          {post.body.map((section, idx) => (
            <RenderSection key={idx} section={section} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-[1.5rem] border border-cyan-300/40 bg-gradient-to-r from-cyan-50 to-blue-50 p-6 text-center dark:border-cyan-400/20 dark:bg-gradient-to-r dark:from-cyan-500/10 dark:to-blue-500/10 sm:flex-row sm:text-left">
          <div className="min-w-0">
            <p className="text-base font-black sm:text-lg">Ready to try it on your own products?</p>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">
              Sign up and get 100 free credits — no card required.
            </p>
          </div>
          <Link
            href={post.ctaHref}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 text-sm font-black text-white shadow-xl shadow-cyan-500/25 transition hover:scale-105"
          >
            {post.ctaLabel} →
          </Link>
        </div>

        {/* Keywords */}
        <div className="mt-8 flex flex-wrap gap-2">
          {post.keywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] font-bold text-black/60 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/65"
            >
              #{kw}
            </span>
          ))}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-black sm:text-2xl">More on {post.category}</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group flex items-start gap-3 rounded-2xl border border-black/10 bg-white/85 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300 dark:border-white/10 dark:bg-white/[0.05]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 text-2xl dark:from-cyan-500/15 dark:to-blue-500/15">
                    {r.heroEmoji}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black leading-snug">{r.title}</p>
                    <p className="mt-1 text-[11px] font-bold text-cyan-600 dark:text-cyan-300">
                      Read article →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </main>
  );
}
