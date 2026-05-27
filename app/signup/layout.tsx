import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: { absolute: "Sign Up — Get 200 Free Credits | AgentForge AI" },
  description:
    "Create your AgentForge AI account and get 200 free credits. No card required. Start generating textile mockups, jewellery photoshoots and product photography in seconds.",
  keywords: [
    "AgentForge signup",
    "AgentForge AI register",
    "free AI mockup credits",
    "AI catalogue signup India",
  ],
  alternates: { canonical: `${SITE}/signup` },
  openGraph: {
    title: "Sign Up — Get 200 Free Credits | AgentForge AI",
    description:
      "Create your AgentForge AI account and get 200 free credits. No card required.",
    url: `${SITE}/signup`,
    siteName: "AgentForge AI",
    images: [{ url: "/logo-new.jpg", width: 1200, height: 630, alt: "Sign up to AgentForge AI" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign Up — Get 200 Free Credits | AgentForge AI",
    description: "Create an AgentForge AI account. 200 free credits. No card required.",
    images: ["/logo-new.jpg"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
