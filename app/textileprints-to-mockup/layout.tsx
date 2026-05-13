import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Textile Mockup Generator",
  description:
    "Create premium textile mockups, saree mockups, kurti mockups, shirt mockups and catalogue-ready fashion model photos using AgentForge AI.",
  keywords: [
    "AI textile mockup generator",
    "textile mockup AI",
    "fabric mockup generator",
    "saree mockup AI",
    "kurti mockup generator",
    "shirt mockup AI",
    "textile catalogue images",
    "AI fashion model generator",
    "AgentForge textile AI",
  ],
  openGraph: {
    title: "AI Textile Mockup Generator | AgentForge AI",
    description:
      "Upload textile designs and generate catalogue-ready AI fashion model mockups without stitching or photoshoots.",
    url: "https://www.aiagentforge.in/textileprints-to-mockup",
    siteName: "AgentForge AI",
    images: [
      {
        url: "/banner-design-output.png",
        width: 1200,
        height: 630,
        alt: "AI textile mockup generated using AgentForge",
      },
    ],
    type: "website",
  },
};

export default function TextileMockupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}