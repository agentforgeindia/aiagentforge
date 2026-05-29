import type { Metadata } from "next";
import LandingPage from "@/app/components/LandingPage";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: "AI Jewellery Photoshoot — Bridal, Diamond & Daily-Wear Catalogues in 30s",
  description:
    "Premium AI jewellery photoshoots without a studio. Bridal sets, diamond rings, necklaces, earrings, kundan and pearls — catalogue-ready in 60 seconds. Built for Indian jewellery brands.",
  keywords: [
    "AI jewellery photoshoot",
    "AI jewellery model photoshoot",
    "AI bridal jewellery catalogue",
    "AI necklace photoshoot India",
    "AI diamond ring catalogue",
    "AI kundan jewellery shoot",
    "AI pearl photography",
    "jewellery photography AI India",
  ],
  alternates: { canonical: `${SITE}/ai-jewellery-photoshoot` },
  openGraph: {
    title: "AI Jewellery Photoshoot — AgentForge AI",
    description:
      "Bridal sets, diamond rings, necklaces, earrings — generate premium AI jewellery photoshoots in 60 seconds.",
    url: `${SITE}/ai-jewellery-photoshoot`,
    type: "website",
  },
};

export default function Page() {
  return (
    <LandingPage
      slug="ai-jewellery-photoshoot"
      eyebrow="AI Jewellery · Bridal & Daily Wear"
      heroEmoji="💎"
      h1="AI Jewellery Photoshoots without the studio"
      highlight="without the studio"
      subheadline="Bridal sets, diamond rings, necklaces, earrings, bangles and kundan — upload your product photo and get editorial-grade catalogue images in 60 seconds. No model, no MUA, no security transport."
      primaryCtaLabel="Start Jewellery Shoot"
      primaryCtaHref="/jewellery-ai"
      secondaryCtaLabel="View Gallery"
      secondaryCtaHref="/gallery"
      trust={[
        { label: "Bridal Ready", sub: "Editorial grade" },
        { label: "DSLR Quality", sub: "Stone & metal detail" },
        { label: "~30 sec", sub: "Per shot" },
      ]}
      doodles={["💎", "💍", "👑", "📿", "✨", "🪙", "🥇", "⭐", "🏆", "✦", "🌟", "💫", "✧", "💎", "💍", "✨", "📿"]}
      intro={
        <p>
          AgentForge Jewellery AI Studio is built for Indian jewellery brands —
          wedding-season campaigns, marketplace listings, bridal editorials and
          daily-wear catalogues. Replace ₹20,000–₹80,000 model shoots with
          AI-generated luxury photography that preserves stone reflections,
          metal tones and design accuracy.
        </p>
      }
      features={[
        {
          icon: "👰",
          title: "Bridal & wedding-ready",
          desc: "Indian bridal model looks, festive lighting, and editorial composition built for kundan, polki and gold bridal sets.",
        },
        {
          icon: "💎",
          title: "Stone-accurate rendering",
          desc: "Diamond brilliance, gold tone, pearl lustre and gemstone colours preserved — not invented.",
        },
        {
          icon: "🛒",
          title: "Marketplace compliant",
          desc: "Clean white-background mode for Amazon, Flipkart and Meesho listings. Editorial mode for Instagram and D2C sites.",
        },
        {
          icon: "👤",
          title: "With or without model",
          desc: "Generate product-only catalogue shots or model-worn lifestyle imagery — same upload, two clicks.",
        },
        {
          icon: "🪪",
          title: "Brand overlays",
          desc: "Add your brand name, contact and website on every output — shareable straight to WhatsApp.",
        },
        {
          icon: "📦",
          title: "Bulk catalogue mode",
          desc: "Empire plan unlocks bulk generation for full wedding-season collections in hours.",
        },
      ]}
      steps={[
        { title: "Upload jewellery photo", desc: "A clear product photo from your phone or studio camera is enough." },
        { title: "Choose jewellery type", desc: "Ring, necklace, earring, bangle, pendant, bridal set or kundan." },
        { title: "Pick model & shoot style", desc: "Indian bridal, daily wear, marble flat-lay, velvet box or luxury editorial." },
        { title: "Generate & ship", desc: "HD output ready for WhatsApp, Amazon, Flipkart, Instagram or your D2C site." },
      ]}
      useCases={[
        "Bridal jewellery designers preparing wedding-season campaigns",
        "Diamond and gold retailers building D2C product catalogues",
        "Kundan, polki and temple jewellery makers for Instagram drops",
        "Wholesalers shipping daily WhatsApp catalogues to retailers",
        "Pearl and silver brands launching new collections",
        "Earring and pendant sellers on Amazon, Flipkart and Meesho",
      ]}
      faqs={[
        {
          q: "Will diamond reflections and gemstone colours stay accurate?",
          a: "Yes. AgentForge Jewellery AI is tuned to preserve stone shape, brilliance, metal tone and design detail. Customers in Surat, Mumbai and Jaipur use the output for catalogue and ad creative without retouching.",
        },
        {
          q: "Can I generate bridal jewellery on a model?",
          a: "Yes. Choose 'Bridal Model' or 'Indian Model' look and the system generates editorial-grade campaign creatives — including necklace-on-neck, earring-on-ear and full bridal portrait compositions.",
        },
        {
          q: "Does it work for Amazon / Flipkart listings?",
          a: "Yes. Use the 'No Model' mode with 'White Background' style to get marketplace-compliant catalogue images that meet Amazon and Flipkart listing rules.",
        },
        {
          q: "What about kundan, polki, oxidised and temple jewellery?",
          a: "All supported. AgentForge handles fine detail, intricate stone work and traditional Indian jewellery styles natively.",
        },
        {
          q: "How does the price compare to a regular jewellery shoot?",
          a: "A traditional jewellery shoot with model, MUA, photographer and security transport costs ₹20,000–₹80,000. AgentForge plans start at ₹1,999 — you can generate 100+ catalogue images at a fraction of one shoot.",
        },
      ]}
    />
  );
}
