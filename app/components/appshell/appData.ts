// Shared data for the in-app shell (only rendered inside the Android app).

import type { LucideIcon } from "lucide-react";
import { Gem, Shirt, SprayCan } from "lucide-react";

export type AppAgent = {
  slug: "textile" | "jewellery" | "productography";
  title: string;
  desc: string;
  detail: string;
  link: string;
  image: string;
  samples: string[];
  Icon: LucideIcon;
  /** Tailwind gradient stops for the icon chip. */
  tint: string;
};

export const APP_AGENTS: AppAgent[] = [
  {
    slug: "textile",
    title: "Textile Mockup",
    desc: "Fabric design to model mockup",
    detail: "Upload a fabric or print photo and get a model-worn catalogue image — shirts, kurtas, sarees, kidswear and home textile.",
    link: "/textileprints-to-mockup",
    image: "/gallery/textile/design-5.png",
    samples: ["/gallery/textile/design-1.png", "/gallery/textile/design-7.png", "/gallery/textile/design-9.png", "/gallery/textile/design-11.png"],
    Icon: Shirt,
    tint: "from-cyan-400 to-blue-600",
  },
  {
    slug: "jewellery",
    title: "Jewellery Studio",
    desc: "Jewellery photo to model shoot",
    detail: "One jewellery photo becomes a full model shoot — necklaces, rings, bangles, payal and bridal sets.",
    link: "/jewellery-ai",
    image: "/gallery/jewellery/design-3.png",
    samples: ["/gallery/jewellery/design-2.png", "/gallery/jewellery/design-4.png", "/gallery/jewellery/design-10.png", "/gallery/jewellery/design-14.png"],
    Icon: Gem,
    tint: "from-violet-500 to-purple-600",
  },
  {
    slug: "productography",
    title: "Productography",
    desc: "Product photo to ad-ready visual",
    detail: "Turn a shop or mobile photo into clean e-commerce and lifestyle shots for Amazon, Flipkart, Meesho and Instagram.",
    link: "/productography-ai",
    image: "/gallery/productography/design-1.png",
    samples: ["/gallery/productography/design-2.png", "/gallery/productography/design-4.png", "/gallery/productography/design-8.png", "/gallery/productography/design-10.png"],
    Icon: SprayCan,
    tint: "from-blue-500 to-indigo-600",
  },
];

export type ShowcaseItem = {
  src: string;
  label: string;
  agent: AppAgent["slug"];
};

/**
 * "Made with AgentForge" — showcase outputs on the app home screen.
 * Each one is a real before → after board from /public/gallery.
 * Home shows the first 6 under "All" (two per agent), so keep the
 * order mixed and keep 4 per agent (the grid has two columns).
 */
export const APP_SHOWCASE: ShowcaseItem[] = [
  { src: "/gallery/textile/design-27.png", label: "Silk saree", agent: "textile" },
  { src: "/gallery/jewellery/design-2.png", label: "Necklace set", agent: "jewellery" },
  { src: "/gallery/productography/design-1.png", label: "Perfume", agent: "productography" },
  { src: "/gallery/textile/design-6.png", label: "Shirt", agent: "textile" },
  { src: "/gallery/jewellery/design-14.png", label: "Gold bangles", agent: "jewellery" },
  { src: "/gallery/productography/design-10.png", label: "Sunglasses", agent: "productography" },
  { src: "/gallery/textile/design-21.png", label: "Ladies suit", agent: "textile" },
  { src: "/gallery/jewellery/design-12.png", label: "Temple set", agent: "jewellery" },
  { src: "/gallery/productography/design-8.png", label: "Earrings", agent: "productography" },
  { src: "/gallery/textile/design-9.png", label: "Kurta", agent: "textile" },
  { src: "/gallery/jewellery/design-4.png", label: "Ring", agent: "jewellery" },
  { src: "/gallery/productography/design-5.png", label: "Toy", agent: "productography" },
];

/** Full-screen create flows: no bottom tabs here (they have their own bottom action button). */
export const FLOW_ROUTES = [
  "/textileprints-to-mockup",
  "/jewellery-ai",
  "/productography-ai",
  "/social-ads",
  "/ugc-forge",
  "/trendforge",
  "/scene-editor",
  "/election-campaign-ai",
];

/** Pages that need a logged-in user. */
export const AUTH_ROUTES = ["/my-creations", "/profile", "/team", "/billing", "/settings", "/rewards"];

const TITLES: [string, string][] = [
  ["/textileprints-to-mockup", "Textile Mockup"],
  ["/jewellery-ai", "Jewellery Studio"],
  ["/productography-ai", "Productography"],
  ["/my-creations", "My Creations"],
  ["/agents", "Agents"],
  ["/profile", "My Profile"],
  ["/complete-profile", "Complete Profile"],
  ["/team", "My Team"],
  ["/billing", "Credits"],
  ["/pricing", "Credits"],
  ["/settings", "Settings"],
  ["/gallery", "Gallery"],
  ["/tutorials", "Tutorials"],
  ["/support", "Support"],
  ["/rewards", "Refer & Earn"],
  ["/login", "Login"],
  ["/signup", "Create Account"],
  ["/faq", "FAQ"],
  ["/how-it-works", "How It Works"],
  ["/privacy-policy", "Privacy Policy"],
  ["/terms", "Terms"],
  ["/refund-policy", "Refund Policy"],
];

export function appTitleFor(pathname: string): string {
  for (const [prefix, title] of TITLES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return title;
  }
  return "AgentForge";
}

export function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}
