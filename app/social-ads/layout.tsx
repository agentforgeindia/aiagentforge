import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: {
    absolute: "Social Media Ads Designer AI – Multi-Platform Ad Creatives in Seconds",
  },
  description:
    "AI Social Media Ads Designer for Indian businesses — 17 categories, 7 platforms and 12 languages with pro text overlay and zero spelling errors. Single and bulk ad creatives in seconds.",
  keywords: [
    "AI social media ad maker India",
    "AI ad creative generator",
    "Instagram ad design AI",
    "Facebook ad maker AI",
    "bulk ad creative generator",
    "multi language ad design AI",
    "AI poster ad generator India",
  ],
  alternates: { canonical: `${SITE}/social-ads` },
  openGraph: {
    title: "Social Media Ads Designer AI – Multi-Platform Ad Creatives in Seconds",
    description:
      "17 categories, 7 platforms, 12 languages, single + bulk ad creatives with pro text overlay.",
    url: `${SITE}/social-ads`,
    siteName: "AgentForge AI",
    images: [{ url: "/banner1.png", width: 1200, height: 630, alt: "Social Media Ads Designer AI" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Social Media Ads Designer AI – Ad Creatives in Seconds",
    description: "Multi-platform, multi-language AI ad creatives with pro text overlay.",
    images: ["/banner1.png"],
  },
};

export default function SocialAdsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
