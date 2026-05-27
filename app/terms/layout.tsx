import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: { absolute: "Terms & Conditions — AgentForge AI" },
  description:
    "Terms and conditions governing the use of AgentForge AI — India's AI visual studio for textile, jewellery and product businesses.",
  alternates: { canonical: `${SITE}/terms` },
  openGraph: {
    title: "Terms & Conditions — AgentForge AI",
    description: "Terms governing the use of AgentForge AI.",
    url: `${SITE}/terms`,
    siteName: "AgentForge AI",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
