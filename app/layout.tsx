import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./components/AuthProvider";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AgentForgeAI from "./components/AgentForgeAI";
import LaunchOfferPopup from "./components/LaunchOfferPopup";

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
      <body className="min-h-full flex flex-col">
  <ThemeProvider>
    <AuthProvider>
      <Navbar />
      {children}
      <Footer />
      <AgentForgeAI />
    </AuthProvider>
  </ThemeProvider>
</body>
    </html>
  );
}
