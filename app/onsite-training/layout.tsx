import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: {
    absolute: "Free On-Site AI Training — AgentForge Comes to Your Showroom",
  },
  description:
    "Book a free on-site visit. The AgentForge team comes to your showroom or factory and trains your staff to generate AI catalogue mockups — no photoshoot needed. Pick your date and time.",
  keywords: [
    "AgentForge on-site training",
    "AI mockup staff training India",
    "textile showroom AI training",
    "book AI training visit",
    "AI photography training textile",
  ],
  alternates: { canonical: `${SITE}/onsite-training` },
  openGraph: {
    title: "Free On-Site AI Training — AgentForge Comes to Your Showroom",
    description:
      "We're visiting showrooms and factories next week to train staff on generating AI catalogue mockups live. Book your date.",
    url: `${SITE}/onsite-training`,
    siteName: "AgentForge AI",
    images: [{ url: "/banner1.png", width: 1200, height: 630, alt: "AgentForge On-Site AI Training" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free On-Site AI Training — AgentForge Comes to Your Showroom",
    description: "Book a free on-site visit — hands-on AI mockup training for your staff.",
    images: ["/banner1.png"],
  },
};

export default function OnsiteTrainingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
