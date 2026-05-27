import type { Metadata } from "next";
import LandingPage from "@/app/components/LandingPage";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: "AI Saree Mockup Generator — Model-Worn Saree Catalogues in 30s",
  description:
    "Upload a flat saree photo and get a model-worn AI saree mockup in 30 seconds. Built for Surat manufacturers, wholesalers and saree D2C brands. Festive, bridal, casual & daily-wear.",
  keywords: [
    "AI saree mockup",
    "AI saree photoshoot",
    "saree mockup generator India",
    "Surat saree manufacturer AI",
    "saree catalogue AI",
    "bridal saree mockup AI",
    "festive saree AI",
    "designer saree catalogue AI",
  ],
  alternates: { canonical: `${SITE}/ai-saree-mockup` },
  openGraph: {
    title: "AI Saree Mockup Generator — AgentForge AI",
    description:
      "Flat saree photo to model-worn catalogue image in 30 seconds. Built for Indian saree sellers.",
    url: `${SITE}/ai-saree-mockup`,
    type: "website",
  },
};

export default function Page() {
  return (
    <LandingPage
      slug="ai-saree-mockup"
      eyebrow="AI Saree Mockup · India"
      heroEmoji="🥻"
      h1="The AI Saree Mockup Generator for Indian sellers"
      highlight="for Indian sellers"
      subheadline="Take a flat saree photo from your phone. Get a premium model-worn catalogue image with accurate draping, festive lighting and your article code overlay — in 30 seconds."
      primaryCtaLabel="Generate Saree Mockup"
      primaryCtaHref="/textileprints-to-mockup"
      secondaryCtaLabel="See Examples"
      secondaryCtaHref="/gallery"
      trust={[
        { label: "30 sec", sub: "Per mockup" },
        { label: "Indian Drape", sub: "Accurate pallu" },
        { label: "Bridal Ready", sub: "Festive lighting" },
      ]}
      doodles={["🥻", "✨", "💎", "👰", "🌟", "🎨", "🪡", "🧵", "🛍️", "⭐", "✦", "💫", "🏆", "🥇", "👗", "📸", "🎁"]}
      intro={
        <p>
          AgentForge specialises in Indian saree mockups — Banarasi, Kanjeevaram,
          Chiffon, Georgette, Net, designer, festive and bridal. Drape accuracy,
          pallu placement, pleat physics and Indian model looks come built in.
          Used by Surat manufacturers, Mumbai wholesalers and Bengaluru D2C
          brands to ship daily WhatsApp catalogues and Instagram drops.
        </p>
      }
      features={[
        {
          icon: "🪷",
          title: "Accurate saree drape",
          desc: "Pallu, pleats and waist fall handled natively for Indian sarees — no Western-fashion guesswork.",
        },
        {
          icon: "👰",
          title: "Bridal & festive looks",
          desc: "Wedding-season lighting, bridal makeup, festive backdrops and traditional jewellery composition.",
        },
        {
          icon: "🏷️",
          title: "Article code overlay",
          desc: "Add your wholesale article number, WhatsApp and company on every output — exactly how Indian wholesalers ship catalogues.",
        },
        {
          icon: "📱",
          title: "WhatsApp-ready output",
          desc: "Auto-export in 1080×1080 HD — drop straight into WhatsApp groups, Instagram or your catalogue.",
        },
        {
          icon: "💸",
          title: "Per image ~₹15",
          desc: "Generate hundreds of catalogue mockups for the cost of one traditional model shoot.",
        },
        {
          icon: "📦",
          title: "Bulk mode",
          desc: "Empire plan unlocks bulk catalogue generation for your full festive or bridal collection at once.",
        },
      ]}
      steps={[
        { title: "Upload saree photo", desc: "Flat saree spread, fabric layout or designer print — any clear photo works." },
        { title: "Pick saree category", desc: "Banarasi, Kanjeevaram, Chiffon, Georgette, Net, designer or bridal." },
        { title: "Choose model & vibe", desc: "Indian model, festive backdrop, bridal look or daily wear." },
        { title: "Generate & download", desc: "HD 1080 mockup ready for WhatsApp, Amazon, Flipkart or Instagram." },
      ]}
      useCases={[
        "Surat saree manufacturers shipping daily WhatsApp catalogues",
        "Bridal saree designers preparing wedding-season campaigns",
        "Designer saree brands posting Instagram drops",
        "Festive collection launches for Diwali, Karwa Chauth, Navratri",
        "Wholesalers building Amazon and Flipkart saree listings",
        "Boutique D2C brands testing new designs without sampling",
      ]}
      faqs={[
        {
          q: "Will the saree drape look right on the AI model?",
          a: "Yes. AgentForge is trained specifically on Indian saree drapes — pallu placement, pleat physics, waist fall and fabric flow. Outputs look indistinguishable from real shoots for catalogue and WhatsApp use.",
        },
        {
          q: "Can I add my wholesale article code on the mockup?",
          a: "Yes. Save your company name, article number, WhatsApp and website once, and every saree mockup overlays them automatically.",
        },
        {
          q: "Does it work for bridal and festive sarees?",
          a: "Absolutely. Choose Bridal Model + Festive Lighting and you get wedding-season-ready visuals with traditional jewellery composition and editorial framing.",
        },
        {
          q: "What fabric types are supported?",
          a: "All major Indian saree fabrics — Banarasi, Kanjeevaram, Chiffon, Georgette, Net, Silk, Organza, Cotton, Designer and Bridal collections.",
        },
        {
          q: "Can I generate multiple mockups of the same saree?",
          a: "Yes. Generate variations with different models, poses, backgrounds and lighting from the same flat fabric upload — ideal for full catalogue spreads.",
        },
      ]}
    />
  );
}
