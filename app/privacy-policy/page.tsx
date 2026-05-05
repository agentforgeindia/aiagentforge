"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PrivacyPolicyPage() {
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
  const card = darkMode ? "bg-white/[0.07] border-white/10 shadow-black/40" : "bg-white/80 border-black/10 shadow-black/10";
  const muted = darkMode ? "text-white/60" : "text-black/60";

  const agents = [
    { title: "TextilePrints to Mockup AI", link: "/textileprints-to-mockup" },
    { title: "Jewellery AI", link: "/jewellery-ai" },
    { title: "ProductShot AI", link: "/productshot-ai" },
  ];

  const policyItems = [
    { title: "1. Information We Collect", body: "We may collect your name, email address, mobile number, login credentials, device information, browser type, IP address, pages visited, uploaded images, textile designs, product photos, jewellery photos, and AI-generated outputs. We do not claim ownership of your uploaded content." },
    { title: "2. How We Use Your Information", body: "We use your data to provide and improve our services, generate AI mockups, process payments, manage subscriptions, provide customer support, and send important platform updates." },
    { title: "3. Data Storage & Security", body: "Your data is stored using trusted cloud services. We follow industry-standard security practices, but no system is 100% secure and we cannot guarantee absolute security." },
    { title: "4. Sharing of Information", body: "We do not sell your personal data. We may share required data with payment gateways, cloud providers, analytics tools, and service partners needed to operate the platform." },
    { title: "5. Cookies & Tracking", body: "We may use cookies to improve user experience, remember login sessions, and understand usage patterns. You can disable cookies from your browser settings." },
    { title: "6. Third-Party Services", body: "AgentForge may use third-party services such as Google Login, Apple Login, payment gateways, hosting, storage, AI generation APIs, and analytics providers. These services follow their own privacy policies." },
    { title: "7. User Content & Rights", body: "You retain ownership of your uploaded designs, images, and generated outputs. We do not use your private designs for resale or public display without permission. You may request deletion of your data." },
    { title: "8. Data Retention", body: "We retain your data as long as your account is active or as required for legal, security, operational, and accounting purposes." },
    { title: "9. Children’s Privacy", body: "Our services are not intended for individuals under 18 years of age." },
    { title: "10. Changes to This Policy", body: "We may update this Privacy Policy from time to time. Updated versions will be posted on this page with a revised date." },
    { title: "11. Contact Us", body: "For privacy-related questions, contact us at your@email.com or WhatsApp: +91 XXXXX XXXXX." },
  ];

  return (
    <main className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.08))]" />
      <div className={`fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.14]"}`} style={{ backgroundImage: "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)", backgroundSize: "34px 34px" }} />

      <div className="relative z-10">
        <header className={`sticky top-0 z-40 border-b backdrop-blur-2xl ${darkMode ? "border-white/10 bg-[#070b14]/80" : "border-black/10 bg-[#fff8e8]/80"}`}>
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
            <Link href="/" className="flex shrink-0 items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-black text-white shadow-lg">AF</div>
              <div>
                <h1 className="text-xl font-black leading-none">AgentForge</h1>
                <p className={`mt-1 text-xs ${muted}`}>AI Agents Studio</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
              <Link href="/" className={`${muted} hover:text-cyan-500`}>Home</Link>
              <div className="relative">
                <button type="button" onClick={() => setShowAgents(!showAgents)} className={`${muted} hover:text-cyan-500`}>Our Agents ▾</button>
                {showAgents && (
                  <div className={`absolute left-0 top-8 z-50 w-64 rounded-2xl border p-2 shadow-2xl ${darkMode ? "border-white/10 bg-[#0b1220] text-white" : "border-black/10 bg-white text-black"}`}>
                    {agents.map((agent) => (
                      <Link key={agent.title} href={agent.link} className={`block rounded-xl px-3 py-2 text-sm ${darkMode ? "hover:bg-white/10" : "hover:bg-cyan-50"}`}>{agent.title}</Link>
                    ))}
                  </div>
                )}
              </div>
              <Link href="/pricing" className={`${muted} hover:text-cyan-500`}>Pricing</Link>
              <Link href="/gallery" className={`${muted} hover:text-cyan-500`}>Gallery</Link>
              <Link href="/support" className={`${muted} hover:text-cyan-500`}>Support</Link>
            </nav>

            <div className="flex items-center gap-2">
              {isLoggedIn && <div className={`hidden rounded-full px-4 py-2 text-sm font-black sm:block ${darkMode ? "bg-white/10 text-white" : "bg-white text-black"}`}>Credits: {credits}</div>}
              {isLoggedIn ? (
                <Link href="/profile" className={`hidden rounded-full px-4 py-2 text-sm font-semibold sm:inline-flex ${darkMode ? "bg-white/10 text-white" : "bg-white text-black"}`}>Profile</Link>
              ) : (
                <Link href="/login" className="hidden rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/20 sm:inline-flex">Login</Link>
              )}
              <button type="button" onClick={toggleTheme} className={`relative flex h-10 w-[74px] items-center rounded-full p-1 transition ${darkMode ? "bg-white/15" : "bg-black/10"}`} aria-label="Toggle theme">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-white text-base shadow-md transition ${darkMode ? "translate-x-8" : "translate-x-0"}`}>{darkMode ? "🌙" : "☀️"}</span>
              </button>
              <button type="button" onClick={() => setShowMobileMenu(!showMobileMenu)} className={`flex h-10 w-10 items-center justify-center rounded-full text-xl lg:hidden ${darkMode ? "bg-white/10 text-white" : "bg-black/10 text-black"}`} aria-label="Open menu">☰</button>
            </div>
          </div>

          {showMobileMenu && (
            <div className={`mx-5 mb-4 rounded-3xl border p-4 lg:hidden ${darkMode ? "border-white/10 bg-[#0b1220]/95" : "border-black/10 bg-white/95"}`}>
              <div className="grid gap-2 text-sm font-semibold">
                <Link href="/" className="rounded-2xl px-4 py-3 hover:bg-cyan-400/10">Home</Link>
                {agents.map((agent) => <Link key={agent.title} href={agent.link} className="rounded-2xl px-4 py-3 hover:bg-cyan-400/10">{agent.title}</Link>)}
                <Link href="/pricing" className="rounded-2xl px-4 py-3 hover:bg-cyan-400/10">Pricing</Link>
                <Link href="/gallery" className="rounded-2xl px-4 py-3 hover:bg-cyan-400/10">Gallery</Link>
                <Link href="/support" className="rounded-2xl px-4 py-3 hover:bg-cyan-400/10">Support</Link>
                {isLoggedIn ? <><div className="rounded-2xl px-4 py-3 font-black text-cyan-600">Credits: {credits}</div><Link href="/profile" className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3 text-center font-black text-white">Profile</Link></> : <Link href="/login" className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3 text-center font-black text-white">Login</Link>}
              </div>
            </div>
          )}
        </header>

        <section className="mx-auto max-w-5xl px-5 py-14 text-center md:py-20">
          <div className="mx-auto mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-600">Legal & Trust</div>
          <h2 className="mx-auto max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-7xl">Privacy<span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">Policy</span></h2>
          <p className={`mx-auto mt-6 max-w-3xl text-lg leading-8 ${muted}`}>How AgentForge collects, uses, protects, and manages your data while you use our AI visual tools.</p>
        </section>

        <section className="mx-auto max-w-4xl px-5 pb-16">
          <div className={`rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl md:p-10 ${card}`}>
            <p className={`text-sm ${muted}`}>Last Updated: April 29, 2026</p>
            <div className="mt-8 space-y-8 text-sm leading-7 md:text-base md:leading-8">
              <p>Welcome to <b>AgentForge</b> (“we”, “our”, “us”). We are committed to protecting your privacy and ensuring transparency in how your data is collected and used.</p>
              <p>This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.</p>
              {policyItems.map((item) => <div key={item.title}><h3 className="text-xl font-black">{item.title}</h3><p className={`mt-3 ${muted}`}>{item.body}</p></div>)}
            </div>
          </div>
        </section>

        <footer className="relative z-10 mx-auto max-w-7xl px-5 pb-8 pt-10">
          <div className={`rounded-[2rem] border p-6 backdrop-blur-xl ${card}`}>
            <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
              <div>
                <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-black text-white">AF</div><div><h3 className="text-lg font-black">AgentForge</h3><p className={`text-xs ${muted}`}>AI tools for visual business</p></div></div>
                <p className={`mt-4 max-w-sm text-sm leading-6 ${muted}`}>Create premium product visuals with TextilePrints to Mockup AI, Jewellery AI, and ProductShot AI.</p>
              </div>
              <div><h4 className="mb-3 text-sm font-black">Product</h4><div className={`space-y-2 text-sm ${muted}`}><Link href="/textileprints-to-mockup" className="block hover:text-cyan-500">TextilePrints to Mockup AI</Link><Link href="/jewellery-ai" className="block hover:text-cyan-500">Jewellery AI</Link><Link href="/productshot-ai" className="block hover:text-cyan-500">ProductShot AI</Link><Link href="/pricing" className="block hover:text-cyan-500">Pricing</Link></div></div>
              <div><h4 className="mb-3 text-sm font-black">Company</h4><div className={`space-y-2 text-sm ${muted}`}><Link href="/about" className="block hover:text-cyan-500">About</Link><Link href="/gallery" className="block hover:text-cyan-500">Gallery</Link><Link href="/support" className="block hover:text-cyan-500">Support</Link><Link href="/contact" className="block hover:text-cyan-500">Contact</Link></div></div>
              <div><h4 className="mb-3 text-sm font-black">Legal</h4><div className={`space-y-2 text-sm ${muted}`}><Link href="/privacy-policy" className="block hover:text-cyan-500">Privacy Policy</Link><Link href="/terms" className="block hover:text-cyan-500">Terms & Conditions</Link><Link href="/refund-policy" className="block hover:text-cyan-500">Refund Policy</Link></div></div>
            </div>
            <div className={`mt-6 flex flex-col justify-between gap-3 border-t pt-5 text-xs md:flex-row ${darkMode ? "border-white/10 text-white/45" : "border-black/10 text-black/45"}`}><p>© 2026 AgentForge. All rights reserved.</p><p>AI visual generation platform for product businesses.</p></div>
          </div>
        </footer>
      </div>
    </main>
  );
}
