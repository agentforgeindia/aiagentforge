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

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
