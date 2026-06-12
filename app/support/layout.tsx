import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: { absolute: "Support & Tutorials — AgentForge AI" },
  description:
    "Help, tutorials and contact for AgentForge AI users. Get step-by-step guides for textile mockups, jewellery photoshoots and product photography workflows.",
  keywords: [
    "AgentForge support",
    "AI mockup tutorials",
    "AgentForge help",
    "AI catalogue help India",
  ],
  alternates: { canonical: `${SITE}/support` },
  openGraph: {
    title: "Support & Tutorials — AgentForge AI",
    description: "Step-by-step guides and help for AgentForge AI users.",
    url: `${SITE}/support`,
    siteName: "AgentForge AI",
    images: [{ url: "/banner1.png", width: 1200, height: 630, alt: "AgentForge Support" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Support & Tutorials — AgentForge AI",
    description: "Help and tutorials for AgentForge AI users.",
    images: ["/banner1.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
