import type { Metadata } from "next";
import { BLOG_POSTS } from "./posts";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: {
    absolute: "AgentForge Blog — AI Mockup, Photoshoot & Catalogue Guides",
  },
  description:
    "Practical guides, case studies and cost comparisons for Indian textile manufacturers, jewellery brands and D2C sellers shipping AI catalogues at scale.",
  keywords: [
    "AI textile mockup blog",
    "AI jewellery photoshoot guide",
    "AI product photography tutorial",
    "AgentForge blog",
    "AI catalogue maker India",
    "Indian D2C marketing blog",
  ],
  alternates: { canonical: `${SITE}/blog` },
  openGraph: {
    title: "AgentForge Blog — AI Mockup, Photoshoot & Catalogue Guides",
    description:
      "Guides and case studies for Indian businesses replacing traditional shoots with AI catalogues.",
    url: `${SITE}/blog`,
    siteName: "AgentForge AI",
    images: [{ url: "/logo-new.jpg", width: 1200, height: 630, alt: "AgentForge Blog" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentForge Blog — AI Mockup, Photoshoot & Catalogue Guides",
    description: "Practical guides for Indian textile, jewellery and D2C brands using AI.",
    images: ["/logo-new.jpg"],
  },
};

// ============================================================
// JSON-LD: Blog + BlogPosting list + Breadcrumb
// ============================================================
const posts = [...BLOG_POSTS].sort(
  (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
);

const blogSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "AgentForge Blog",
  description:
    "Practical guides, case studies and cost comparisons for Indian textile, jewellery and D2C brands shipping AI catalogues at scale.",
  url: `${SITE}/blog`,
  publisher: {
    "@type": "Organization",
    name: "AgentForge AI",
    logo: { "@type": "ImageObject", url: `${SITE}/logo-new.jpg` },
  },
  blogPost: posts.map((p) => ({
    "@type": "BlogPosting",
    headline: p.title,
    description: p.description,
    url: `${SITE}/blog/${p.slug}`,
    datePublished: p.publishedAt,
    dateModified: p.publishedAt,
    author: { "@type": "Organization", name: p.author },
    keywords: p.keywords.join(", "),
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/blog/${p.slug}` },
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE },
    { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
