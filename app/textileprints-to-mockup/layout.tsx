import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: {
    absolute: "Textile Prints to Mockup AI – Generate Fashion Mockups in Seconds",
  },
  description:
    "Turn flat fabric photos or digital prints into model-worn fashion mockups in 60 seconds. AI saree, kurti, kurta, lehenga, kidswear and home textile mockups for Indian sellers.",
  keywords: [
    // Core
    "textile mockup AI",
    "textile prints to mockup AI",
    "AI textile design presentation",
    "AI fashion mockup generator",
    "AI fashion catalogue generator",
    "fabric mockup generator",
    "fabric mockup AI India",
    "textile AI software India",
    "textile design to model AI",
    // Product-specific
    "saree mockup AI",
    "kurti mockup AI",
    "AI kurta mockup",
    "AI lehenga photoshoot",
    "AI kidswear catalogue",
    "home textile mockup AI",
  ],
  alternates: { canonical: `${SITE}/textileprints-to-mockup` },
  openGraph: {
    title: "Textile Prints to Mockup AI – Generate Fashion Mockups in Seconds",
    description:
      "Flat fabric photo to model-worn AI mockup in 60 seconds. Built for Indian saree, kurti, kurta, lehenga, kidswear and home textile sellers.",
    url: `${SITE}/textileprints-to-mockup`,
    siteName: "AgentForge AI",
    images: [{ url: "/banner1.png", width: 1200, height: 630, alt: "Textile Prints to Mockup AI" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Textile Prints to Mockup AI – Generate Fashion Mockups in Seconds",
    description:
      "AI textile mockups for saree, kurti, kurta and lehenga. Live in 60 seconds, no studio needed.",
    images: ["/banner1.png"],
  },
};

// ============================================================
// JSON-LD: Service + AggregateRating + Reviews + Breadcrumb
// ============================================================

// Service schema — Google understands this is a paid service
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "TextilePrints to Mockup AI",
  alternateName: "AI Textile Mockup Generator India",
  description:
    "AI service that turns flat textile photos or digital prints into model-worn fashion mockups in 60 seconds. Saree, kurti, kurta, lehenga, kidswear and home textile.",
  provider: {
    "@type": "Organization",
    name: "AgentForge AI",
    url: SITE,
  },
  areaServed: { "@type": "Country", name: "India" },
  serviceType: "AI Fashion Mockup Generation",
  url: `${SITE}/textileprints-to-mockup`,
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
    {
      "@type": "ListItem",
      position: 2,
      name: "TextilePrints to Mockup AI",
      item: `${SITE}/textileprints-to-mockup`,
    },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
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
