import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: { absolute: "About AgentForge AI — India's AI Visual Studio" },
  description:
    "AgentForge AI is India's AI visual studio for textile, jewellery and product businesses. Learn our story, mission and the team building the future of catalogues.",
  keywords: [
    "About AgentForge AI",
    "AI visual studio India",
    "AgentForge team",
    "AI catalogue startup India",
  ],
  alternates: { canonical: `${SITE}/about` },
  openGraph: {
    title: "About AgentForge AI — India's AI Visual Studio",
    description:
      "AgentForge AI is India's AI visual studio for textile, jewellery and product businesses.",
    url: `${SITE}/about`,
    siteName: "AgentForge AI",
    images: [{ url: "/banner1.png", width: 1200, height: 630, alt: "About AgentForge AI" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About AgentForge AI",
    description: "India's AI visual studio for textile, jewellery and product businesses.",
    images: ["/banner1.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
