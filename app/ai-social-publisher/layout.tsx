import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublisherShell from "./_components/PublisherShell";

// HIDDEN (decision 2026-10-08): the Social Publisher is parked. Nothing
// links to it and the address itself answers "page not found" until this
// switch is turned on again. The preview code below is kept as it is.
const SOCIAL_PUBLISHER_VISIBLE = false;

// LAYOUT PREVIEW — kept out of search until the real build ships.
export const metadata: Metadata = {
  title: { absolute: "Social Media Scheduler – Plan & Post to Instagram, Facebook | AgentForge AI" },
  description:
    "Schedule your photos and AgentForge creations to Instagram, Facebook and more from one simple planner.",
  robots: { index: false, follow: false },
};

export default function AiSocialPublisherLayout({ children }: { children: React.ReactNode }) {
  if (!SOCIAL_PUBLISHER_VISIBLE) notFound();
  return <PublisherShell>{children}</PublisherShell>;
}
