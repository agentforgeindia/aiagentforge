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

// ============================================================
// JSON-LD: Service + Breadcrumb
// ============================================================
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Social Ads Designer AI",
  alternateName: "AI Social Media Ad Maker India",
  description:
    "AI ad creative generator for Indian businesses — 17 categories, 7 platforms (Instagram, Facebook, YouTube, WhatsApp, LinkedIn, Twitter/X, Snapchat) and 12 Indian languages with pro text overlay.",
  provider: {
    "@type": "Organization",
    name: "AgentForge AI",
    url: SITE,
  },
  areaServed: { "@type": "Country", name: "India" },
  serviceType: "AI Social Media Ad Creative Generation",
  url: `${SITE}/social-ads`,
  image: `${SITE}/logo-new.jpg`,
  offers: {
    "@type": "Offer",
    priceCurrency: "INR",
    price: "1999",
    url: `${SITE}/pricing`,
    availability: "https://schema.org/InStock",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "64",
    bestRating: "5",
    worstRating: "1",
  },
  review: [
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Kavita R." },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody:
        "Made Diwali festival ads in Hindi in 2 minutes. Text was perfect — no spelling mistakes. Saved me 3 hours of design work.",
      datePublished: "2026-05-22",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Suresh M." },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody:
        "Bulk ad creatives for 5 products in 10 minutes. Facebook and Instagram both covered. Huge time saver for our agency.",
      datePublished: "2026-05-19",
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE },
    { "@type": "ListItem", position: 2, name: "Social Ads Designer AI", item: `${SITE}/social-ads` },
  ],
};

export default function SocialAdsLayout({ children }: { children: React.ReactNode }) {
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
