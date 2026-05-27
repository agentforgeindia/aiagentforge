import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy — AgentForge AI" },
  description:
    "How AgentForge AI collects, uses and protects your data. Compliant with Indian data-protection norms.",
  alternates: { canonical: `${SITE}/privacy-policy` },
  openGraph: {
    title: "Privacy Policy — AgentForge AI",
    description: "How AgentForge AI handles and protects your data.",
    url: `${SITE}/privacy-policy`,
    siteName: "AgentForge AI",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
