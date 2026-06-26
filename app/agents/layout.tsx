import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: {
    absolute: "AI Agents for Business – AgentForge AI Tools for Indian Sellers & Brands",
  },
  description:
    "Explore AgentForge's purpose-built AI agents for Indian manufacturers, sellers and brands — textile mockups, jewellery photoshoots, product photography, UGC, social ads and more.",
  keywords: [
    "AI agents for business India",
    "AI tools for sellers",
    "AI photoshoot agents",
    "AgentForge AI agents",
    "AI catalogue tools India",
    "AI marketing agents India",
  ],
  alternates: { canonical: `${SITE}/agents` },
  openGraph: {
    title: "AI Agents for Business – AgentForge AI Tools for Indian Sellers & Brands",
    description:
      "Purpose-built AI agents for Indian manufacturers, sellers and brands — all in one studio.",
    url: `${SITE}/agents`,
    siteName: "AgentForge AI",
    images: [{ url: "/banner1.png", width: 1200, height: 630, alt: "AgentForge AI Agents" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Agents for Business – AgentForge AI",
    description: "Purpose-built AI agents for Indian sellers and brands.",
    images: ["/banner1.png"],
  },
};

// ============================================================
// JSON-LD: ItemList (agent directory) + Breadcrumb
// ============================================================
const agentListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "AgentForge AI — All AI Agents for Indian Businesses",
  description:
    "Complete directory of purpose-built AI agents for Indian manufacturers, sellers and brands — textile mockup, jewellery photoshoot, product photography, social ads, UGC and more.",
  url: `${SITE}/agents`,
  numberOfItems: 7,
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "TextilePrints to Mockup", item: `${SITE}/textileprints-to-mockup` },
    { "@type": "ListItem", position: 2, name: "Jewellery AI Studio", item: `${SITE}/jewellery-ai` },
    { "@type": "ListItem", position: 3, name: "Productography AI", item: `${SITE}/productography-ai` },
    { "@type": "ListItem", position: 4, name: "Social Ads Designer AI", item: `${SITE}/social-ads` },
    { "@type": "ListItem", position: 5, name: "UGC Forge AI", item: `${SITE}/ugc-forge` },
    { "@type": "ListItem", position: 6, name: "TrendForge AI", item: `${SITE}/trendforge` },
    { "@type": "ListItem", position: 7, name: "AI Scene Editor", item: `${SITE}/scene-editor` },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE },
    { "@type": "ListItem", position: 2, name: "All AI Agents", item: `${SITE}/agents` },
  ],
};

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(agentListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
