import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: "AgentForge Tutorials — Watch & Learn AI Mockup Generation",
  description:
    "Step-by-step video tutorials for every AgentForge AI agent — textile mockups, jewellery photoshoots, productography and more. Filter by agent, watch what you need.",
  keywords: [
    "AgentForge tutorials",
    "AI mockup tutorial India",
    "AI textile tutorial",
    "AI jewellery photoshoot tutorial",
    "AI product photography tutorial",
    "AgentForge how-to videos",
  ],
  alternates: { canonical: `${SITE}/tutorials` },
  openGraph: {
    title: "AgentForge Tutorials — Watch & Learn AI Mockup Generation",
    description:
      "Every AgentForge tutorial in one place — auto-synced from our YouTube channel.",
    url: `${SITE}/tutorials`,
    type: "website",
  },
};

export default function TutorialsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
