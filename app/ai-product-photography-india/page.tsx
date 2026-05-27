import type { Metadata } from "next";
import LandingPage from "@/app/components/LandingPage";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: "AI Product Photography India — Amazon-Ready Hero Shots in 30s",
  description:
    "Turn mobile product photos into Amazon-ready hero shots and Instagram ad creatives. AI product photography for skincare, perfume, watches, gadgets, food and D2C brands across India.",
  keywords: [
    "AI product photography India",
    "Amazon product photo AI",
    "Flipkart catalogue image AI",
    "D2C product shoot AI",
    "ecommerce hero image AI",
    "AI skincare photography",
    "AI perfume product shoot",
    "AI watch photography",
    "Meesho product image AI",
    "product photography for small business India",
  ],
  alternates: { canonical: `${SITE}/ai-product-photography-india` },
  openGraph: {
    title: "AI Product Photography India — AgentForge AI",
    description:
      "Mobile product photo to Amazon-ready hero shot in 30 seconds. Built for Indian D2C brands and ecommerce sellers.",
    url: `${SITE}/ai-product-photography-india`,
    type: "website",
  },
};

export default function Page() {
  return (
    <LandingPage
      slug="ai-product-photography-india"
      eyebrow="AI Product Photography · India"
      heroEmoji="📸"
      h1="AI Product Photography for Indian D2C brands"
      highlight="for Indian D2C brands"
      subheadline="Turn a mobile product photo into an Amazon-ready hero shot, Instagram ad creative or Flipkart listing image — in 30 seconds. Skincare, perfume, watches, gadgets, food, fashion accessories and more."
      primaryCtaLabel="Start Product Shoot"
      primaryCtaHref="/productography-ai"
      secondaryCtaLabel="View Gallery"
      secondaryCtaHref="/gallery"
      trust={[
        { label: "Amazon Ready", sub: "Listing-safe HD" },
        { label: "DSLR Quality", sub: "Logo & label intact" },
        { label: "~30 sec", sub: "Per shoot" },
      ]}
      doodles={["📸", "🛍️", "💄", "⌚", "🕶️", "👜", "👠", "📦", "🎁", "📷", "🎨", "✨", "⭐", "✦", "💫", "🚀", "🏆"]}
      intro={
        <p>
          AgentForge Productography AI is built for Indian D2C brands and
          ecommerce sellers. Skincare, perfume, watches, sunglasses, food,
          gadgets, packaging — upload from your phone and ship a catalogue
          spread, Amazon hero image or Meta Ads creative the same hour. Used
          by brands in Bengaluru, Mumbai, Delhi, Pune and Hyderabad.
        </p>
      }
      features={[
        {
          icon: "🛒",
          title: "Marketplace compliant",
          desc: "Clean white-background mode that meets Amazon, Flipkart and Meesho listing requirements.",
        },
        {
          icon: "🌆",
          title: "Lifestyle scenes",
          desc: "Premium lifestyle and editorial backdrops for Instagram, Pinterest and D2C brand storytelling.",
        },
        {
          icon: "🪪",
          title: "Logo & label intact",
          desc: "Your brand label, packaging text and product details preserved — not redrawn or distorted.",
        },
        {
          icon: "🎯",
          title: "Hero shots that convert",
          desc: "Catalogue-ready hero images tuned for Amazon main image, Flipkart top card and Instagram first frame.",
        },
        {
          icon: "🎨",
          title: "Festive & seasonal looks",
          desc: "Diwali, Holi, Christmas, Valentine's — seasonal backdrop presets ship campaigns fast.",
        },
        {
          icon: "📦",
          title: "Bulk production",
          desc: "Empire plan unlocks bulk product shoot generation for SKU-heavy catalogues.",
        },
      ]}
      steps={[
        { title: "Upload product photo", desc: "A clear mobile photo with good light is enough — no studio needed." },
        { title: "Choose category", desc: "Cosmetics, perfume, watches, shoes, gadgets, food, packaging or custom." },
        { title: "Pick shoot style", desc: "Luxury studio, lifestyle scene, plain white, festive or outdoor premium." },
        { title: "Generate & ship", desc: "HD hero shot ready for Amazon, Flipkart, Meesho, Instagram or Meta Ads." },
      ]}
      useCases={[
        "Skincare and cosmetics D2C brands shipping Amazon listings",
        "Perfume and fragrance brands shooting hero ad creatives",
        "Watch and sunglass sellers building catalogue spreads",
        "Food and beverage brands creating Swiggy / Zomato banners",
        "Gadget and electronics sellers refreshing Flipkart listings",
        "Festive campaign creatives for Diwali, Valentine's and Christmas",
      ]}
      faqs={[
        {
          q: "Will my product label and packaging text stay accurate?",
          a: "Yes. AgentForge preserves the exact label, brand text and packaging detail of your product. The AI only changes the lighting, background and composition — not the product itself.",
        },
        {
          q: "Can I generate Amazon-compliant white-background hero shots?",
          a: "Yes. Pick the 'Plain White' or 'White Background' style — output meets Amazon main image requirements (clean white, product centred, no props).",
        },
        {
          q: "Does it work for skincare, perfume, watches, food and gadgets?",
          a: "Yes. AgentForge Productography is tuned for all major D2C categories — beauty, fragrance, fashion accessories, electronics, food & beverage and lifestyle products.",
        },
        {
          q: "Can I generate ad creatives for Instagram and Meta Ads?",
          a: "Yes. Pick 'Lifestyle' or 'Festive Editorial' style with 1080×1080 or 9:16 output — ready for Instagram feed, Stories, Reels and Meta Ads.",
        },
        {
          q: "What does this cost compared to a regular product shoot?",
          a: "A regular product shoot in India costs ₹5,000–₹25,000 per session. AgentForge plans start at ₹1,999 for 1,800 credits — enough for ~120 hero shots. Empire plan covers 3,000+ images monthly.",
        },
      ]}
    />
  );
}
