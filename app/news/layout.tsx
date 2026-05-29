import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: "News, Blog & Product Updates — AgentForge AI",
  description:
    "Latest news, blog articles, product updates and case studies from AgentForge AI — covering Indian textile, jewellery, and product photography workflows.",
  keywords: [
    "AgentForge news",
    "AI textile blog India",
    "AI jewellery blog India",
    "AI productography blog India",
    "AI catalogue news India",
    "AgentForge product updates",
  ],
  alternates: { canonical: `${SITE}/news` },
  openGraph: {
    title: "News, Blog & Product Updates — AgentForge AI",
    description:
      "AgentForge's newsroom — blogs, news, product updates and case studies on AI catalogue, textile mockup, jewellery photoshoot and product photography for Indian brands.",
    url: `${SITE}/news`,
    type: "website",
  },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
