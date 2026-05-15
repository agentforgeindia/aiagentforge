import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./components/AuthProvider";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AgentForgeAI from "./components/AgentForgeAI";
import LaunchOfferPopup from "./components/LaunchOfferPopup";
import Script from "next/script";
import { hasBulkAccess, hasUnlimitedAccess } from "@/lib/plans";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AgentForge AI",
    template: "%s | AgentForge AI",
  },

  description:
    "Generate premium textile mockups, jewellery photoshoots and product photography using AI.",

  keywords: [
    "AI textile mockup",
    "AI jewellery photoshoot",
    "AI product photography",
    "fashion mockup AI",
    "textile catalog AI",
    "AI model generator",
    "AI product photoshoot",
    "virtual photoshoot AI",
  ],

  icons: {
    icon: "/logo-new.jpg",
  },

  openGraph: {
    title: "AgentForge AI",
    description:
      "AI visual generation platform for textile, jewellery and product businesses.",
    url: "https://www.aiagentforge.in",
    siteName: "AgentForge",
    images: [
      {
        url: "/logo-new.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
  <html
    lang="en"
    className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    suppressHydrationWarning
  >
    <head>
      <meta
        name="facebook-domain-verification"
        content="rulnxopysk6g6u6lp9ct0dp2pp8iom"
      />
    </head>

    <body className="relative min-h-full overflow-x-hidden flex flex-col">
      <div className="fixed inset-0 -z-50 bg-[#070b14]" />

      <object
        type="image/svg+xml"
        data="/bg.svg"
        className="fixed inset-0 -z-40 h-full w-full object-cover opacity-20"
        aria-label="AgentForge Animated Background"
      />

      <div className="fixed inset-0 -z-30 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%),radial-gradient(circle_at_bottom,#0ea5e944,transparent_30%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.08))]" />

      <ThemeProvider>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
          <AgentForgeAI />
          <LaunchOfferPopup />
        </AuthProvider>
      </ThemeProvider>

      <Script id="facebook-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');

          fbq('init', '1136318385188354');
          fbq('track', 'PageView');
        `}
      </Script>
    </body>
  </html>
);
}