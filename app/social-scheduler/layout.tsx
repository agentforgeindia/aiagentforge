import { notFound } from "next/navigation";

// HIDDEN (decision 2026-10-08): the Social Publisher / Scheduler is
// parked. This older preview page answers "page not found" until the
// switch is turned on again (see also app/ai-social-publisher/layout.tsx).
const SOCIAL_SCHEDULER_VISIBLE = false;

export default function SocialSchedulerLayout({ children }: { children: React.ReactNode }) {
  if (!SOCIAL_SCHEDULER_VISIBLE) notFound();
  return <>{children}</>;
}
