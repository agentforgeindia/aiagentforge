import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: { absolute: "Login — AgentForge AI" },
  description: "Log in to your AgentForge AI account.",
  alternates: { canonical: `${SITE}/login` },
  // Don't waste Google's crawl budget on auth-only utility page
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
