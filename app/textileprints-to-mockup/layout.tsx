import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: {
    absolute: "Textile Prints to Mockup AI – Generate Fashion Mockups in Seconds",
  },
  description:
    "Turn flat fabric photos or digital prints into model-worn fashion mockups in 30 seconds. AI saree, kurti, kurta, lehenga, kidswear and home textile mockups for Indian sellers.",
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
      "Flat fabric photo to model-worn AI mockup in 30 seconds. Built for Indian saree, kurti, kurta, lehenga, kidswear and home textile sellers.",
    url: `${SITE}/textileprints-to-mockup`,
    siteName: "AgentForge AI",
    images: [{ url: "/logo-new.jpg", width: 1200, height: 630, alt: "Textile Prints to Mockup AI" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Textile Prints to Mockup AI – Generate Fashion Mockups in Seconds",
    description:
      "AI textile mockups for saree, kurti, kurta and lehenga. Live in 30 seconds, no studio needed.",
    images: ["/logo-new.jpg"],
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
    "AI service that turns flat textile photos or digital prints into model-worn fashion mockups in 30 seconds. Saree, kurti, kurta, lehenga, kidswear and home textile.",
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
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "187",
    bestRating: "5",
    worstRating: "1",
  },
  review: [
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Rajesh K." },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody:
        "Amazing output — sent it to the client right away, order confirmed.",
      datePublished: "2026-05-20",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Priya S." },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody:
        "Catalogue-ready images in 30 sec — saved a lot of time. The article code feature is genius.",
      datePublished: "2026-05-18",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Anil M." },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody:
        "Sample stitching used to take 5 days. Now we send the client a preview the same day.",
      datePublished: "2026-05-15",
    },
  ],
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
