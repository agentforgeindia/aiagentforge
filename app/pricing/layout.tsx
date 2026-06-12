import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: {
    absolute: "AgentForge Pricing — AI Mockup & Photoshoot Plans India",
  },
  description:
    "Simple credit-based pricing for AI textile mockups, jewellery photoshoots and product photography. Starter ₹1,999 · Pro ₹9,999 · Empire ₹39,999 with bulk catalogue mode.",
  keywords: [
    "AgentForge pricing",
    "AI mockup pricing India",
    "AI jewellery photoshoot price",
    "AI product photography cost",
    "AI catalogue subscription India",
    "textile mockup plan India",
  ],
  alternates: { canonical: `${SITE}/pricing` },
  openGraph: {
    title: "AgentForge Pricing — AI Mockup & Photoshoot Plans India",
    description:
      "Starter to Empire — credit-based AI plans for Indian textile, jewellery and product businesses. Bulk catalogue mode included.",
    url: `${SITE}/pricing`,
    siteName: "AgentForge AI",
    images: [{ url: "/banner1.png", width: 1200, height: 630, alt: "AgentForge Pricing" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentForge Pricing — AI Mockup & Photoshoot Plans India",
    description: "Credit-based AI plans for textile, jewellery and product businesses. From ₹1,999.",
    images: ["/banner1.png"],
  },
};

// ============================================================
// JSON-LD: Product schema for each plan + Breadcrumb
// ============================================================
const PLAN_PRODUCTS = [
  {
    name: "AgentForge Starter Plan",
    description:
      "1,800 credits for ~120 standard AI generations. Best to start for small shops, creators and new sellers.",
    price: "1999",
    sku: "AF-STARTER",
  },
  {
    name: "AgentForge Pro Creator Plan",
    description:
      "9,000 credits for ~600 standard AI generations. Most popular plan for sellers, agencies and growing brands.",
    price: "9999",
    sku: "AF-PRO",
  },
  {
    name: "AgentForge Empire Plan",
    description:
      "36,000 credits for ~2,400 AI generations. Bulk catalogue studio for factories, wholesalers and large teams.",
    price: "39999",
    sku: "AF-EMPIRE",
  },
];

const productSchemas = PLAN_PRODUCTS.map((plan) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: plan.name,
  description: plan.description,
  sku: plan.sku,
  brand: { "@type": "Brand", name: "AgentForge AI" },
  category: "AI Visual Generation SaaS",
  image: "https://www.aiagentforge.in/logo-new.jpg",
  offers: {
    "@type": "Offer",
    url: `${SITE}/pricing`,
    priceCurrency: "INR",
    price: plan.price,
    availability: "https://schema.org/InStock",
    seller: { "@type": "Organization", name: "AgentForge AI" },
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "412",
    bestRating: "5",
    worstRating: "1",
  },
}));

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE },
    { "@type": "ListItem", position: 2, name: "Pricing", item: `${SITE}/pricing` },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {productSchemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
