import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: {
    absolute: "TrendForge AI – Select a Trend, Upload a Photo, Generate Viral Visuals",
  },
  description:
    "TrendForge AI turns your photo into on-trend, ready-to-post visuals. Pick a daily trend, upload an image and generate scroll-stopping content — no prompt writing needed.",
  keywords: [
    "AI trend photo generator",
    "trending AI photoshoot India",
    "AI viral content generator",
    "daily trend AI images",
    "AI social media trend visuals",
    "no prompt AI image generator",
  ],
  alternates: { canonical: `${SITE}/trendforge` },
  openGraph: {
    title: "TrendForge AI – Select a Trend, Upload a Photo, Generate Viral Visuals",
    description:
      "Pick a trend, upload a photo, generate on-trend visuals in seconds. No prompt needed.",
    url: `${SITE}/trendforge`,
    siteName: "AgentForge AI",
    images: [{ url: "/banner1.png", width: 1200, height: 630, alt: "TrendForge AI" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrendForge AI – Select a Trend, Upload a Photo, Generate",
    description: "On-trend AI visuals from your photo, in seconds.",
    images: ["/banner1.png"],
  },
};

export default function TrendForgeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
