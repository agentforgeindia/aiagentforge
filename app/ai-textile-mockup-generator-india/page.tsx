import type { Metadata } from "next";
import LandingPage from "@/app/components/LandingPage";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: "AI Textile Mockup Generator India — Saree, Kurti, Kurta & Lehenga Mockups in 30s",
  description:
    "India's #1 AI textile mockup generator. Turn a flat fabric photo or digital design into a premium model-worn catalogue image in 30 seconds. Built for Surat, Jaipur, Ludhiana, Mumbai & Delhi textile sellers.",
  keywords: [
    "AI textile mockup generator India",
    "textile design to mockup AI",
    "fabric mockup AI India",
    "saree mockup generator",
    "kurti catalogue AI",
    "kurta mockup AI",
    "lehenga mockup AI",
    "Surat textile catalogue AI",
    "Jaipur fashion mockup AI",
  ],
  alternates: { canonical: `${SITE}/ai-textile-mockup-generator-india` },
  openGraph: {
    title: "AI Textile Mockup Generator India — AgentForge AI",
    description:
      "Generate model-worn saree, kurti, kurta and lehenga mockups in 30 seconds. Built for Indian textile manufacturers, wholesalers and D2C sellers.",
    url: `${SITE}/ai-textile-mockup-generator-india`,
    type: "website",
  },
};

export default function Page() {
  return (
    <LandingPage
      slug="ai-textile-mockup-generator-india"
      eyebrow="AI Textile Mockup · India"
      heroEmoji="👕"
      h1="The AI Textile Mockup Generator built for India"
      highlight="built for India"
      subheadline="Turn your fabric photo or digital design into a premium model-worn catalogue image in 30 seconds. Saree, kurti, kurta, lehenga, kidswear and home textile — no model, no studio, no shoot."
      primaryCtaLabel="Generate Textile Mockup"
      primaryCtaHref="/textileprints-to-mockup"
      secondaryCtaLabel="View Gallery"
      secondaryCtaHref="/gallery"
      trust={[
        { label: "30 sec", sub: "Per mockup" },
        { label: "₹15+", sub: "Per image" },
        { label: "Bulk Ready", sub: "Empire plan" },
      ]}
      doodles={["👕", "🥻", "🧵", "👗", "👚", "🧥", "🪡", "🛍️", "🎨", "✨", "⭐", "✦", "💫", "🚀", "🌟", "👔", "⚡"]}
      intro={
        <p>
          AgentForge is India's most loved AI textile mockup generator. We are
          built specifically for the way Indian textile businesses work — saree
          drapes, salwar suits, festive bridal lighting, article-code overlays
          for wholesalers, and bulk catalogue workflows for factories in Surat,
          Jaipur, Ludhiana, Mumbai and beyond.
        </p>
      }
      features={[
        {
          icon: "🎯",
          title: "Indian fashion specific",
          desc: "Saree drape physics, salwar suits, kurta sets, festive bridal looks and kidswear — all native, not generic Western fashion AI.",
        },
        {
          icon: "🏷️",
          title: "Article code overlays",
          desc: "Add your wholesale article number, company name and WhatsApp number on every output — exactly the way Indian wholesalers send catalogues.",
        },
        {
          icon: "📦",
          title: "Bulk catalogue mode",
          desc: "Empire plan unlocks bulk generation — ship 3,000+ AI catalogue images every month for your factory or wholesale operation.",
        },
        {
          icon: "👨‍👩‍👧",
          title: "Indian model looks",
          desc: "Choose from Indian, Western, family-scene and festive model styles. No more catalogues with the wrong skin tones or wrong poses.",
        },
        {
          icon: "📱",
          title: "WhatsApp-ready output",
          desc: "Auto-export in 1080×1080 HD — drop straight into WhatsApp wholesale groups, Instagram or Amazon listings without re-cropping.",
        },
        {
          icon: "💸",
          title: "1 shoot = 1 year",
          desc: "₹15,000 traditional shoot budget = 1 year of unlimited AI catalogues on our Empire plan. Real savings, real time back.",
        },
      ]}
      steps={[
        { title: "Upload fabric or design", desc: "Snap a flat fabric photo or upload a digital print from your phone." },
        { title: "Pick category", desc: "Saree, kurti, kurta, lehenga, kidswear, home textile or universal fabric." },
        { title: "Choose model & shoot", desc: "Indian / Western model, festive or studio shoot, bridal or casual." },
        { title: "Generate & download", desc: "HD 1080 image in 30 seconds, ready for WhatsApp, Amazon, Flipkart or Instagram." },
      ]}
      useCases={[
        "Surat saree manufacturers shipping daily WhatsApp catalogues",
        "Jaipur and Delhi kurti / kurta brands posting Instagram drops",
        "Ludhiana wholesalers building Amazon and Flipkart listings",
        "Bridal lehenga designers preparing festive collections",
        "Kidswear D2C brands testing ad creatives at scale",
        "Home textile sellers shooting bedsheets, curtains and quilts",
      ]}
      faqs={[
        {
          q: "Will AI mockups look real enough for my Indian fashion catalogue?",
          a: "Yes. AgentForge is trained specifically on Indian apparel — saree drapes, salwar suits, kurta sets, festive looks. Customers across Surat, Jaipur, Mumbai and Bengaluru report indistinguishable quality from traditional shoots for catalogue and WhatsApp use.",
        },
        {
          q: "Can I add my article code and brand name on every output?",
          a: "Yes. You can save your company name, phone, website and logo once, and every generated mockup overlays them automatically — exactly how Indian wholesalers send catalogues.",
        },
        {
          q: "How much does it cost compared to a regular saree or kurta shoot?",
          a: "A traditional shoot in India costs ₹15,000–₹50,000. AgentForge plans start at ₹1,999 for 1,800 credits — enough for ~120 catalogue images. The Empire plan at ₹39,999 covers 3,000+ images monthly.",
        },
        {
          q: "Does it work for bulk catalogue generation for my factory?",
          a: "Yes. The Empire plan is built for factories and wholesalers running bulk catalogue production. It includes priority queue, multi-upload and team usage planning.",
        },
        {
          q: "Can I generate kidswear, home textile and bridal mockups too?",
          a: "Absolutely. AgentForge covers men's wear, ladies wear, kids wear, home textile (bedsheets, curtains, cushion covers, quilts) and decor — plus a universal fabric mode for flat layouts.",
        },
      ]}
    />
  );
}
