import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers at AgentForge — Work From Home AI Jobs India",
  description:
    "Join AgentForge Academy. Learn AI sales skills, take a free online assessment, and get hired for remote WFH roles — Telecaller, AI Operator, Lead Research, Social Media Executive. ₹5,000 basic + incentives. No experience required.",
  keywords: [
    "careers AgentForge",
    "work from home jobs India",
    "telecaller job India WFH",
    "AI sales job India",
    "online job India fresher 2026",
    "AgentForge Academy hiring",
    "remote work India",
    "learn and earn online India",
    "WFH job 5000 salary India",
  ],
  alternates: {
    canonical: "https://www.aiagentforge.in/careers",
  },
  openGraph: {
    title: "Careers at AgentForge — WFH AI Jobs India | AgentForge Academy",
    description:
      "Learn → Test → Get Hired. 5 WFH roles. ₹5,000 basic + incentives. Free training. Apply from anywhere in India.",
    url: "https://www.aiagentforge.in/careers",
    siteName: "AgentForge AI",
    images: [{ url: "/banner1.png", width: 1200, height: 630 }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Work From Home Jobs India — AgentForge Careers",
    description: "Free training. ₹5,000 basic + incentives. 100% WFH. Apply now.",
    images: ["/banner1.png"],
  },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
