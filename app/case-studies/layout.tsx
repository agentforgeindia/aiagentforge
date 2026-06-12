import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: {
    absolute: "AgentForge AI Case Studies — Real Indian Business Results",
  },
  description:
    "How Surat saree manufacturers, Jaipur kurti brands, Mumbai jewellers and D2C founders use AgentForge AI to ship more catalogues at a fraction of the cost. Real numbers, real outcomes.",
  keywords: [
    "AgentForge case studies",
    "AI mockup case study India",
    "Surat saree AI case study",
    "Jaipur kurti AI results",
    "AI jewellery photoshoot case study",
    "D2C AI product photography results",
  ],
  alternates: { canonical: `${SITE}/case-studies` },
  openGraph: {
    title: "AgentForge AI Case Studies — Real Indian Business Results",
    description:
      "Real numbers from Surat, Jaipur, Mumbai, Ludhiana, Bengaluru brands using AgentForge.",
    url: `${SITE}/case-studies`,
    siteName: "AgentForge AI",
    images: [{ url: "/banner1.png", width: 1200, height: 630, alt: "AgentForge AI Case Studies" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentForge AI Case Studies — Real Indian Business Results",
    description: "Real client results from Surat, Jaipur, Mumbai and beyond.",
    images: ["/banner1.png"],
  },
};

// ============================================================
// JSON-LD: CollectionPage + BreadcrumbList
// ============================================================
const collectionSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "AgentForge AI Case Studies",
  description:
    "Real client results from Indian textile, jewellery and D2C brands using AgentForge AI.",
  url: `${SITE}/case-studies`,
  publisher: {
    "@type": "Organization",
    name: "AgentForge AI",
    logo: { "@type": "ImageObject", url: `${SITE}/logo-new.jpg` },
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE },
    { "@type": "ListItem", position: 2, name: "Case Studies", item: `${SITE}/case-studies` },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
