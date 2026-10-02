import type { Metadata } from "next";
import PublisherShell from "./_components/PublisherShell";

// LAYOUT PREVIEW — kept out of search until the real build ships.
export const metadata: Metadata = {
  title: { absolute: "Social Media Scheduler – Plan & Post to Instagram, Facebook | AgentForge AI" },
  description:
    "Schedule your photos and AgentForge creations to Instagram, Facebook and more from one simple planner.",
  robots: { index: false, follow: false },
};

export default function AiSocialPublisherLayout({ children }: { children: React.ReactNode }) {
  return <PublisherShell>{children}</PublisherShell>;
}
