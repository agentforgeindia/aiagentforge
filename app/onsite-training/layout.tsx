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
    images: [{ url: "/banner.jpeg", width: 1600, height: 666, alt: "AgentForge — Create Anything. Show Everything." }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free On-Site AI Training — AgentForge Comes to Your Showroom",
    description: "Book a free on-site visit — hands-on AI mockup training for your staff.",
    images: ["/banner.jpeg"],
  },
};

export default function OnsiteTrainingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
