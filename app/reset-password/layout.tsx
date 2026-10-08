import type { Metadata } from "next";

const SITE = "https://www.aiagentforge.in";

export const metadata: Metadata = {
  title: { absolute: "Set a new password — AgentForge AI" },
  description: "Set a new password for your AgentForge AI account.",
  alternates: { canonical: `${SITE}/reset-password` },
  // Utility page reached only from the reset email.
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
