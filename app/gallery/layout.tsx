import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: {
    absolute: "AI Mockup Gallery — Textile, Jewellery & Product Visuals",
  },
  description:
    "Explore 80+ live AI-generated examples — textile mockups, jewellery photoshoots and product photography. Built with AgentForge AI for Indian businesses.",
  keywords: [
    "AI mockup gallery",
    "AI jewellery photo examples",
    "AI textile mockup samples",
    "AI product photography examples India",
    "AgentForge gallery",
    "fashion mockup AI samples",
  ],
  alternates: { canonical: `${SITE}/gallery` },
  openGraph: {
    title: "AI Mockup Gallery — Textile, Jewellery & Product Visuals",
    description:
      "Browse live AI-generated mockups, jewellery shoots and product photography examples. 80+ catalogue-ready visuals.",
    url: `${SITE}/gallery`,
    siteName: "AgentForge AI",
    images: [{ url: "/banner1.png", width: 1200, height: 630, alt: "AgentForge AI Gallery" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Mockup Gallery — Textile, Jewellery & Product Visuals",
    description: "80+ live AI-generated mockups and product photoshoots — explore the gallery.",
    images: ["/banner1.png"],
  },
};

// ============================================================
// JSON-LD: ImageGallery + CollectionPage + Breadcrumb
// ============================================================
const galleryItems: { name: string; folder: string; count: number }[] = [
  { name: "AI Textile Mockups", folder: "textile", count: 28 },
  { name: "AI Jewellery Photoshoots", folder: "jewellery", count: 28 },
  { name: "AI Product Photography", folder: "productography", count: 28 },
];

const imageGallerySchema = {
  "@context": "https://schema.org",
  "@type": "ImageGallery",
  name: "AgentForge AI — Mockup & Product Photography Gallery",
  description:
    "Live AI-generated examples of textile mockups, jewellery photoshoots and product photography by AgentForge AI.",
  url: `${SITE}/gallery`,
  publisher: {
    "@type": "Organization",
    name: "AgentForge AI",
    url: SITE,
  },
  // ItemList of category samples (each entry uses the first image as representative)
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: galleryItems.reduce((sum, g) => sum + g.count, 0),
    itemListElement: galleryItems.map((g, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "ImageObject",
        name: g.name,
        contentUrl: `${SITE}/gallery/${g.folder}/design-1.png`,
        thumbnailUrl: `${SITE}/gallery/${g.folder}/design-1.png`,
        creator: { "@type": "Organization", name: "AgentForge AI" },
      },
    })),
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE },
    { "@type": "ListItem", position: 2, name: "Gallery", item: `${SITE}/gallery` },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(imageGallerySchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
