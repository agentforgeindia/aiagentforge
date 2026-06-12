import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learn & Earn Academy — Work From Home Jobs India | AgentForge",
  description:
    "AgentForge Learn & Earn Academy — India bhar se WFH jobs. Telecaller, AI Operator, Lead Research, Social Media aur Support roles. ₹5,000 basic salary + incentives. Free training provided. Apply now.",
  keywords: [
    "work from home jobs India",
    "WFH jobs India 2026",
    "telecaller work from home",
    "AI operator jobs India",
    "online jobs India fresher",
    "AgentForge Academy",
    "learn and earn India",
    "remote jobs India",
    "free online training jobs India",
    "work from home salary India",
  ],
  alternates: {
    canonical: "https://www.aiagentforge.in/academy",
  },
  openGraph: {
    title: "Learn & Earn Academy — Work From Home Jobs India | AgentForge",
    description:
      "100% WFH. ₹5,000 basic + incentives. Free training. 5 job roles. Apply from anywhere in India — no experience required.",
    url: "https://www.aiagentforge.in/academy",
    siteName: "AgentForge AI",
    images: [{ url: "/banner1.png", width: 1200, height: 630 }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Work From Home Jobs India — AgentForge Academy",
    description: "Free training. ₹5,000 basic + incentives. 100% WFH. Apply now at AgentForge Academy.",
    images: ["/banner1.png"],
  },
};

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
