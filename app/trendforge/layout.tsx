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

// ============================================================
// JSON-LD: Service + Breadcrumb
// ============================================================
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "TrendForge AI",
  alternateName: "AI Viral Photo Generator India",
  description:
    "TrendForge AI turns your photo into on-trend, ready-to-post visuals. Pick a daily trend, upload an image and generate scroll-stopping content in seconds — no prompt writing needed.",
  provider: {
    "@type": "Organization",
    name: "AgentForge AI",
    url: SITE,
  },
  areaServed: { "@type": "Country", name: "India" },
  serviceType: "AI Trend Visual Generation",
  url: `${SITE}/trendforge`,
  image: `${SITE}/logo-new.jpg`,
  offers: {
    "@type": "Offer",
    priceCurrency: "INR",
    price: "1999",
    url: `${SITE}/pricing`,
    availability: "https://schema.org/InStock",
  },
  // NOTE: aggregateRating / review were removed on purpose. The values
  // were hardcoded, not taken from real customer reviews, which breaks
  // Google's review-snippet rules. Add them back only when they are
  // computed from approved testimonials in the database.
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE },
    { "@type": "ListItem", position: 2, name: "TrendForge AI", item: `${SITE}/trendforge` },
  ],
};

export default function TrendForgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
