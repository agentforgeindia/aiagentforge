import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: { absolute: "Refund Policy — AgentForge AI" },
  description:
    "Credit-refund policy for AgentForge AI one-time credit packs: failed generations, retries, regeneration and payments.",
  alternates: { canonical: `${SITE}/refund-policy` },
  openGraph: {
    title: "Refund Policy — AgentForge AI",
    description: "Refund and cancellation policy for AgentForge AI plans.",
    url: `${SITE}/refund-policy`,
    siteName: "AgentForge AI",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
