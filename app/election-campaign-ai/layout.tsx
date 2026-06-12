import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: {
    absolute: "Election Campaign AI – Instant Political Posters & Campaign Creatives",
  },
  description:
    "Save candidate details once, pick the party and the symbol/theme auto-fills. Generate Punjabi, Hindi and English election posters, festival wishes and campaign creatives instantly with AI.",
  keywords: [
    "election poster maker AI",
    "political campaign AI India",
    "AI election banner generator",
    "candidate poster maker",
    "Punjabi election poster AI",
    "Hindi political poster generator",
    "festival wishes poster AI",
  ],
  alternates: { canonical: `${SITE}/election-campaign-ai` },
  openGraph: {
    title: "Election Campaign AI – Instant Political Posters & Campaign Creatives",
    description:
      "AI-generated election posters, festival wishes and campaign creatives in Punjabi, Hindi and English.",
    url: `${SITE}/election-campaign-ai`,
    siteName: "AgentForge AI",
    images: [{ url: "/banner1.png", width: 1200, height: 630, alt: "Election Campaign AI" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Election Campaign AI – Instant Political Posters & Creatives",
    description: "AI election posters and campaign creatives in seconds.",
    images: ["/banner1.png"],
  },
};

export default function ElectionCampaignLayout({ children }: { children: React.ReactNode }) {
  return children;
}
