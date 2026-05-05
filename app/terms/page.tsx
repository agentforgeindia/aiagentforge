"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const agents = [
  { title: "TextilePrints to Mockup AI", link: "/textileprints-to-mockup" },
  { title: "Jewellery AI", link: "/jewellery-ai" },
  { title: "ProductShot AI", link: "/productshot-ai" },
];

export default function TermsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [showAgents, setShowAgents] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Replace this with your real Supabase auth/session value later.
  const isLoggedIn = false;
  const credits = 5;

  useEffect(() => {
    const savedTheme = localStorage.getItem("agentforge-theme");
    if (savedTheme === "dark") setDarkMode(true);
  }, []);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("agentforge-theme", next ? "dark" : "light");
      return next;
    });
  };

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.07] shadow-black/40"
    : "border-black/10 bg-white/80 shadow-black/10";
  const muted = darkMode ? "text-white/55" : "text-black/55";

  const sections = [
    {
      title: "1. Acceptance of Terms",
      body: "By accessing or using AgentForge, you agree to these Terms & Conditions. If you do not agree, please do not use the platform.",
    },
    {
      title: "2. Our Services",
      body: "AgentForge provides AI-powered visual generation tools for textile mockups, jewellery visuals, product photoshoots, catalogue images, and related creative outputs.",
    },
    {
      title: "3. User Account",
      body: "You are responsible for maintaining the confidentiality of your account login details and for all activity under your account.",
    },
    {
      title: "4. Uploaded Content",
      body: "You retain ownership of the images, designs, product photos, textile prints, jewellery photos, and other content you upload. You must ensure you have the legal right to upload and use such content.",
    },
    {
      title: "5. Generated Outputs",
      body: "Generated images may be used for marketing, catalogues, social media, sales, and commercial purposes, subject to your plan and applicable laws.",
    },
    {
      title: "6. Prohibited Use",
      body: "You must not use AgentForge to create illegal, harmful, misleading, offensive, infringing, or unauthorized content. We may restrict or suspend accounts that violate this rule.",
    },
    {
      title: "7. Credits & Plans",
      body: "AgentForge may operate on a credit or subscription basis. Each successful image generation may consume credits based on the selected plan or tool.",
    },
    {
      title: "8. Payments",
      body: "Payments are processed through third-party payment gateways. By purchasing a plan, you agree to the pricing, billing cycle, and payment terms displayed at the time of purchase.",
    },
    {
      title: "9. Refunds",
      body: "Refunds, if applicable, will be handled according to our Refund Policy. Credits used for successful generations are generally non-refundable.",
    },
    {
      title: "10. Output Quality",
      body: "AI outputs depend on input image quality, selected settings, server conditions, and AI model behavior. We do not guarantee that every output will perfectly match your expectation.",
    },
    {
      title: "11. Platform Availability",
      body: "We aim to keep AgentForge available and reliable, but we do not guarantee uninterrupted access. Maintenance, server issues, or third-party service downtime may affect availability.",
    },
    {
      title: "12. Intellectual Property",
      body: "AgentForge branding, interface, workflows, systems, content, and platform design belong to AgentForge. Users may not copy, resell, or reverse-engineer the platform.",
    },
    {
      title: "13. Privacy",
      body: "Your use of AgentForge is also governed by our Privacy Policy, which explains how we collect, use, and protect your data.",
    },
    {
      title: "14. Account Suspension",
      body: "We may suspend or terminate accounts that misuse the platform, violate terms, attempt fraud, or harm other users or the platform.",
    },
    {
      title: "15. Changes to Terms",
      body: "We may update these Terms & Conditions from time to time. Continued use of the platform means you accept the updated terms.",
    },
    {
      title: "16. Contact",
      body: "For any questions about these Terms, contact us at your@email.com or WhatsApp: +91 XXXXX XXXXX.",
    },
  ];

  return (
    <main className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%)]" />

      <div
        className={`fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.14]"}`}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="relative z-10">
        <header className={`sticky top-0 z-40 border-b backdrop-blur-2xl ${darkMode ? "border-white/10 bg-[#070b14]/80" : "border-black/10 bg-[#fff8e8]/80"}`}>
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
            <Link href="/" className="flex shrink-0 items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-black text-white shadow-lg">
                AF
              </div>
              <div>
                <h1 className="text-xl font-black leading-none">AgentForge</h1>
                <p className={`mt-1 text-xs ${muted}`}>AI Agents Studio</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
              <Link href="/" className={`${muted} hover:text-cyan-500`}>Home</Link>

              <div className="relative">
                <button type="button" onClick={() => setShowAgents(!showAgents)} className={`${muted} hover:text-cyan-500`}>
                  Our Agents ▾
                </button>

                {showAgents && (
                  <div className={`absolute left-0 top-8 z-50 w-64 rounded-2xl border p-2 shadow-2xl ${darkMode ? "border-white/10 bg-[#0b1220] text-white" : "border-black/10 bg-white text-black"}`}>
                    {agents.map((agent) => (
                      <Link key={agent.title} href={agent.link} className={`block rounded-xl px-3 py-2 text-sm ${darkMode ? "hover:bg-white/10" : "hover:bg-cyan-50"}`}>
                        {agent.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/pricing" className={`${muted} hover:text-cyan-500`}>Pricing</Link>
              <Link href="/gallery" className={`${muted} hover:text-cyan-500`}>Gallery</Link>
              <Link href="/support" className={`${muted} hover:text-cyan-500`}>Support</Link>
            </nav>

            <div className="flex items-center gap-2">
              {isLoggedIn && (
                <div className={`hidden rounded-full px-4 py-2 text-sm font-black sm:block ${darkMode ? "bg-white/10 text-white" : "bg-white text-black"}`}>
                  Credits: {credits}
                </div>
              )}

              {isLoggedIn ? (
                <Link href="/profile" className={`hidden rounded-full px-4 py-2 text-sm font-semibold sm:inline-flex ${darkMode ? "bg-white/10 text-white" : "bg-white text-black"}`}>
                  Profile
                </Link>
              ) : (
                <Link href="/login" className="hidden rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/20 sm:inline-flex">
                  Login
                </Link>
              )}

              <button
                type="button"
                onClick={toggleTheme}
                className={`relative flex h-10 w-[74px] items-center rounded-full p-1 transition ${darkMode ? "bg-white/15" : "bg-black/10"}`}
                aria-label="Toggle theme"
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-white text-base shadow-md transition ${darkMode ? "translate-x-8" : "translate-x-0"}`}>
                  {darkMode ? "🌙" : "☀️"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xl lg:hidden ${darkMode ? "bg-white/10 text-white" : "bg-black/10 text-black"}`}
                aria-label="Open menu"
              >
                ☰
              </button>
            </div>
          </div>

          {showMobileMenu && (
            <div className={`mx-5 mb-4 rounded-3xl border p-4 lg:hidden ${darkMode ? "border-white/10 bg-[#0b1220]/95" : "border-black/10 bg-white/95"}`}>
              <div className="grid gap-2 text-sm font-semibold">
                <Link href="/" className="rounded-2xl px-4 py-3 hover:bg-cyan-400/10">Home</Link>
                {agents.map((agent) => (
                  <Link key={agent.title} href={agent.link} className="rounded-2xl px-4 py-3 hover:bg-cyan-400/10">
                    {agent.title}
                  </Link>
                ))}
                <Link href="/pricing" className="rounded-2xl px-4 py-3 hover:bg-cyan-400/10">Pricing</Link>
                <Link href="/gallery" className="rounded-2xl px-4 py-3 hover:bg-cyan-400/10">Gallery</Link>
                <Link href="/support" className="rounded-2xl px-4 py-3 hover:bg-cyan-400/10">Support</Link>
                {isLoggedIn ? (
                  <>
                    <div className="rounded-2xl px-4 py-3 font-black text-cyan-600">Credits: {credits}</div>
                    <Link href="/profile" className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3 text-center font-black text-white">Profile</Link>
                  </>
                ) : (
                  <Link href="/login" className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3 text-center font-black text-white">Login</Link>
                )}
              </div>
            </div>
          )}
        </header>

        <section className="mx-auto max-w-5xl px-5 py-14 text-center">
          <div className="mx-auto mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-600">
            Legal & Usage Rules
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-black leading-tight md:text-7xl">
            Terms &
            <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Conditions
            </span>
          </h1>

          <p className={`mx-auto mt-6 max-w-3xl text-lg leading-8 ${muted}`}>
            Please read these terms carefully before using AgentForge AI tools and services.
          </p>
        </section>

        <section className="mx-auto max-w-4xl px-5 pb-16">
          <div className={`rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl md:p-10 ${card}`}>
            <p className={`text-sm ${muted}`}>Last Updated: [Add Date]</p>

            <div className="mt-8 space-y-8 text-sm leading-7">
              <p>
                Welcome to <b>AgentForge</b>. These Terms & Conditions govern your access to and use of our platform, AI agents, generated visuals, credits, plans, and related services.
              </p>

              {sections.map((item) => (
                <div key={item.title}>
                  <h2 className="text-xl font-black">{item.title}</h2>
                  <p className={`mt-3 ${muted}`}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="relative z-10 mx-auto max-w-7xl px-5 pb-8 pt-10">
          <div className={`rounded-[2rem] border p-6 backdrop-blur-xl ${card}`}>
            <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-black text-white">
                    AF
                  </div>
                  <div>
                    <h3 className="text-lg font-black">AgentForge</h3>
                    <p className={`text-xs ${muted}`}>AI tools for visual business</p>
                  </div>
                </div>
                <p className={`mt-4 max-w-sm text-sm leading-6 ${muted}`}>
                  Create premium product visuals with TextilePrints to Mockup AI, Jewellery AI, and ProductShot AI.
                </p>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-black">Product</h4>
                <div className={`space-y-2 text-sm ${muted}`}>
                  <Link href="/textileprints-to-mockup" className="block hover:text-cyan-500">TextilePrints to Mockup AI</Link>
                  <Link href="/jewellery-ai" className="block hover:text-cyan-500">Jewellery AI</Link>
                  <Link href="/productshot-ai" className="block hover:text-cyan-500">ProductShot AI</Link>
                  <Link href="/pricing" className="block hover:text-cyan-500">Pricing</Link>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-black">Company</h4>
                <div className={`space-y-2 text-sm ${muted}`}>
                  <Link href="/about" className="block hover:text-cyan-500">About</Link>
                  <Link href="/gallery" className="block hover:text-cyan-500">Gallery</Link>
                  <Link href="/support" className="block hover:text-cyan-500">Support</Link>
                  <Link href="/contact" className="block hover:text-cyan-500">Contact</Link>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-black">Legal</h4>
                <div className={`space-y-2 text-sm ${muted}`}>
                  <Link href="/privacy-policy" className="block hover:text-cyan-500">Privacy Policy</Link>
                  <Link href="/terms" className="block hover:text-cyan-500">Terms & Conditions</Link>
                  <Link href="/refund-policy" className="block hover:text-cyan-500">Refund Policy</Link>
                </div>
              </div>
            </div>

            <div className={`mt-6 flex flex-col justify-between gap-3 border-t pt-5 text-xs md:flex-row ${darkMode ? "border-white/10 text-white/45" : "border-black/10 text-black/45"}`}>
              <p>© 2026 AgentForge. All rights reserved.</p>
              <p>AI visual generation platform for product businesses.</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}