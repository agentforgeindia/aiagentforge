import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: {
    absolute: "AI Room Scene Editor — Visualise Home Textile in Any Room Setting",
  },
  description:
    "Upload a bedsheet, curtain or quilt photo and see it live in any room scene. AI Scene Editor for home textile sellers, interior decorators and D2C home brands in India — no studio, no sample stitching.",
  keywords: [
    // Core
    "AI room scene editor",
    "AI home textile visualiser",
    "AI interior scene generator",
    "AI room staging India",
    "home textile mockup AI",
    // Product-specific
    "AI bedsheet mockup",
    "AI curtain mockup India",
    "AI quilt visualiser",
    "bedsheet catalogue AI India",
    "AI cushion cover mockup",
    // Use-case
    "home textile D2C AI India",
    "AI room decor visualiser",
    "interior decor catalogue AI",
  ],
  alternates: { canonical: `${SITE}/scene-editor` },
  openGraph: {
    title: "AI Room Scene Editor — Visualise Home Textile in Any Room",
    description:
      "Drag your bedsheet, curtain or quilt into a room scene and generate a lifestyle catalogue image in seconds. AI home textile visualiser for Indian D2C brands and sellers.",
    url: `${SITE}/scene-editor`,
    siteName: "AgentForge AI",
    images: [{ url: "/banner1.png", width: 1200, height: 630, alt: "AI Room Scene Editor" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Room Scene Editor — Home Textile Visualiser",
    description:
      "See your bedsheet, curtain or quilt in a real room setting. AI-generated lifestyle catalogue images in seconds.",
    images: ["/banner1.png"],
  },
};

// ============================================================
// JSON-LD: Service + Breadcrumb
// ============================================================
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "AI Scene Editor",
  alternateName: "AI Room Scene Editor India",
  description:
    "AI tool that places your bedsheet, curtain, quilt or cushion cover into a realistic room scene — lifestyle catalogue images without sample stitching or a studio shoot.",
  provider: {
    "@type": "Organization",
    name: "AgentForge AI",
    url: SITE,
  },
  areaServed: { "@type": "Country", name: "India" },
  serviceType: "AI Home Textile Visualisation",
  url: `${SITE}/scene-editor`,
  image: `${SITE}/logo-new.jpg`,
  offers: {
    "@type": "Offer",
    priceCurrency: "INR",
    price: "1999",
    url: `${SITE}/pricing`,
    availability: "https://schema.org/InStock",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE },
    {
      "@type": "ListItem",
      position: 2,
      name: "AI Scene Editor",
      item: `${SITE}/scene-editor`,
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
