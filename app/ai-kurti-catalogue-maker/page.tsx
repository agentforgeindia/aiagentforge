import type { Metadata } from "next";
import LandingPage from "@/app/components/LandingPage";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: "AI Kurti Catalogue Maker — Daily Drops for WhatsApp, Instagram & Amazon",
  description:
    "Upload a kurti photo or design and get a model-worn AI kurti catalogue image in 60 seconds. Built for Jaipur, Delhi, Mumbai kurti brands shipping daily WhatsApp & Instagram drops.",
  keywords: [
    "AI kurti catalogue maker",
    "AI kurti mockup",
    "kurti catalogue generator AI",
    "Jaipur kurti AI",
    "ethnic wear AI catalogue",
    "Amazon kurti listing AI",
    "Instagram kurti drop AI",
    "tunic mockup AI",
  ],
  alternates: { canonical: `${SITE}/ai-kurti-catalogue-maker` },
  openGraph: {
    title: "AI Kurti Catalogue Maker — AgentForge AI",
    description:
      "Generate daily kurti catalogue drops for WhatsApp, Instagram and Amazon in 60 seconds. Built for Indian kurti brands.",
    url: `${SITE}/ai-kurti-catalogue-maker`,
    type: "website",
  },
};

export default function Page() {
  return (
    <LandingPage
      slug="ai-kurti-catalogue-maker"
      eyebrow="AI Kurti Catalogue · Daily Drops"
      heroEmoji="👚"
      h1="The AI Kurti Catalogue Maker for daily drops"
      highlight="for daily drops"
      subheadline="Upload a kurti photo or print, choose a model and vibe — get a premium catalogue image with article code overlay in 60 seconds. Built for Jaipur, Delhi, Mumbai and Bengaluru kurti brands."
      primaryCtaLabel="Make Kurti Catalogue"
      primaryCtaHref="/textileprints-to-mockup"
      secondaryCtaLabel="View Gallery"
      secondaryCtaHref="/gallery"
      trust={[
        { label: "Daily Drops", sub: "Ship in minutes" },
        { label: "₹15+", sub: "Per image" },
        { label: "Bulk Ready", sub: "Empire plan" },
      ]}
      doodles={["👚", "🥻", "👗", "✨", "🧵", "🪡", "🛍️", "🎨", "⭐", "🌟", "✦", "💫", "🏆", "📸", "💎", "🚀", "🎁"]}
      intro={
        <p>
          AgentForge is the kurti catalogue maker built for the way Indian ethnic
          wear brands actually work — daily new arrivals, WhatsApp groups,
          Instagram drops, festive collections and quick Amazon / Flipkart
          listing refreshes. Used by brands across Jaipur, Delhi, Mumbai, Pune
          and Bengaluru.
        </p>
      }
      features={[
        {
          icon: "🌈",
          title: "All kurti styles",
          desc: "A-line, Anarkali, straight cut, kurti sets, kurti with palazzo, festive embroidered — all handled natively.",
        },
        {
          icon: "👩",
          title: "Indian model looks",
          desc: "Choose Indian, festive bridal, daily wear or fusion looks — match the kurti style to the right vibe.",
        },
        {
          icon: "🏷️",
          title: "Article codes",
          desc: "Overlay your wholesale code, brand name, WhatsApp number and website — perfect for catalogue distribution.",
        },
        {
          icon: "🎉",
          title: "Festive lighting",
          desc: "Diwali, Karwa Chauth, Navratri, Eid — festive backdrop and lighting presets to ship seasonal collections fast.",
        },
        {
          icon: "📱",
          title: "Catalog & social ready",
          desc: "1080×1080 square for Amazon / Instagram, plus 9:16 for stories and reels — all exported automatically.",
        },
        {
          icon: "📦",
          title: "Bulk mode for wholesalers",
          desc: "Empire plan unlocks bulk generation for your full daily / weekly catalogue refresh.",
        },
      ]}
      steps={[
        { title: "Upload kurti photo", desc: "Flat lay, hanger shot or fabric print — any clear photo from your phone." },
        { title: "Pick kurti style", desc: "A-line, Anarkali, straight, kurti set, kurti palazzo, embroidered or fusion." },
        { title: "Choose model & vibe", desc: "Indian / Western model, daily wear, festive, bridal or party look." },
        { title: "Generate & ship", desc: "HD catalogue image ready for WhatsApp, Instagram, Amazon, Flipkart or your D2C site." },
      ]}
      useCases={[
        "Jaipur and Delhi ethnic wear brands shipping daily drops",
        "Boutique kurti brands posting Instagram new arrivals",
        "Wholesale ethnic wear groups distributing on WhatsApp",
        "Festive collection launches for Diwali, Eid, Navratri, Karwa Chauth",
        "Amazon and Flipkart kurti listings at scale",
        "Designer D2C brands testing new prints without sampling",
      ]}
      faqs={[
        {
          q: "Will the kurti look natural on the AI model?",
          a: "Yes. AgentForge is trained on Indian ethnic wear — A-line, Anarkali, straight cut, kurti with palazzo and embroidered styles. The output looks like a real model shoot for catalogue and social use.",
        },
        {
          q: "Can I add my brand name and article code on the kurti catalogue image?",
          a: "Yes. Save your brand once and every output overlays your name, article code, WhatsApp and website — ready to share in wholesale groups.",
        },
        {
          q: "How fast can I ship a full daily catalogue?",
          a: "60 seconds per image. A 20-piece daily drop is done in ~10 minutes. Empire plan unlocks bulk mode for hundreds of pieces in parallel.",
        },
        {
          q: "Does it handle embroidered, hand-block printed and digital prints?",
          a: "Yes. Embroidery, hand-block, digital, kantha and Bandhej prints are preserved accurately. Upload a clear flat photo for best results.",
        },
        {
          q: "Can I use the same kurti photo to generate multiple catalogue variants?",
          a: "Yes. Generate the same kurti with different models, poses, backgrounds and lighting — ideal for full catalogue spreads and A/B ad creative tests.",
        },
      ]}
    />
  );
}
