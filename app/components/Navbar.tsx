"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { supabase } from "@/lib/supabase";

const agents = [
  { title: "TextilePrints to Mockup AI", desc: "Textile design → fashion mockup", link: "/textileprints-to-mockup" },
  { title: "Jewellery AI Studio", desc: "Premium jewellery model shoots", link: "/jewellery-ai" },
  { title: "Productography AI", desc: "Product photos → ad visuals", link: "/productography-ai" },
];

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/pricing" },
  { label: "Gallery", href: "/gallery" },
  { label: "Support", href: "/support" },
  { label: "Credits", href: "/billing" },
];

// Safe helper to get user initials from name or email
function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "U";
}

export default function Navbar() {
  const { darkMode, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [showAgents, setShowAgents] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const agentRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // TODO: AuthProvider will replace these with real values
  const isLoggedIn = false;
  const credits = 0;
  const user: { name?: string | null; email?: string | null; avatarUrl?: string | null } = {
    name: null,
    email: null,
    avatarUrl: null,
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (agentRef.current && !agentRef.current.contains(e.target as Node)) setShowAgents(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setShowMobileMenu(false);
    setShowAgents(false);
    setShowProfile(false);
  }, [pathname]);

  const handleLogout = async () => {
    setShowProfile(false);
    setShowMobileMenu(false);
    await supabase.auth.signOut();
    router.push("/");
  };

  const muted = darkMode ? "text-white/55" : "text-black/55";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isAgentActive = pathname.includes("mockup") || pathname.includes("jewellery") || pathname.includes("productography");

  const initials = getInitials(user?.name, user?.email);

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-2xl transition-colors duration-300 ${
        darkMode ? "border-white/10 bg-[#070b14]/80" : "border-black/8 bg-[#fff8e8]/80"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        {/* Logo */}
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition-transform duration-200 group-hover:scale-105">
            AF
          </div>
          <div>
            <h1 className="text-xl font-black leading-none">AgentForge</h1>
            <p className={`mt-1 text-xs ${muted}`}>AI Agents Studio</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 text-sm font-medium lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-2 transition-all duration-200 ${
                isActive(link.href)
                  ? "bg-cyan-500/10 font-bold text-cyan-600"
                  : `${muted} hover:bg-cyan-500/5 hover:text-cyan-500`
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="relative" ref={agentRef}>
            <button
              type="button"
              onClick={() => setShowAgents(!showAgents)}
              className={`flex items-center gap-1 rounded-full px-4 py-2 transition-all duration-200 ${
                isAgentActive
                  ? "bg-cyan-500/10 font-bold text-cyan-600"
                  : `${muted} hover:bg-cyan-500/5 hover:text-cyan-500`
              }`}
            >
              Agents
              <svg
                className={`h-3.5 w-3.5 transition-transform duration-200 ${showAgents ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {showAgents && (
              <div
                className={`absolute left-0 top-11 z-50 w-72 overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl ${
                  darkMode ? "border-white/10 bg-[#0b1220]/95" : "border-black/10 bg-white/95"
                }`}
              >
                {agents.map((agent) => (
                  <Link
                    key={agent.title}
                    href={agent.link}
                    className={`block px-4 py-3 transition-colors ${darkMode ? "hover:bg-white/8" : "hover:bg-cyan-50"}`}
                  >
                    <p className="text-sm font-bold">{agent.title}</p>
                    <p className={`mt-0.5 text-xs ${muted}`}>{agent.desc}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Credits badge — visible only when logged in */}
          {isLoggedIn && (
            <div
              className={`hidden rounded-full px-4 py-2 text-sm font-black sm:block ${
                darkMode ? "bg-white/10 text-white" : "bg-white text-black shadow-sm"
              }`}
            >
              🪙 {credits}
            </div>
          )}

          {/* Login button (visitor) OR Avatar (logged in) */}
          {!isLoggedIn ? (
            <Link
              href="/login"
              className="hidden rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:shadow-cyan-500/30 hover:brightness-110 sm:inline-flex"
            >
              Login
            </Link>
          ) : (
            <div className="relative hidden sm:block" ref={profileRef}>
              {/* Avatar button */}
              <button
                type="button"
                onClick={() => setShowProfile(!showProfile)}
                className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 transition-all duration-200 ${
                  showProfile
                    ? "border-cyan-400 shadow-lg shadow-cyan-500/30"
                    : darkMode
                    ? "border-white/20 hover:border-cyan-400/60"
                    : "border-black/15 hover:border-cyan-400/60"
                }`}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-black text-white">
                    {initials}
                  </div>
                )}
              </button>

              {/* Profile dropdown */}
              {showProfile && (
                <div
                  className={`absolute right-0 top-13 z-50 w-72 overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl ${
                    darkMode ? "border-white/10 bg-[#0b1220]/95" : "border-black/10 bg-white/95"
                  }`}
                >
                  {/* User info header */}
                  <div className={`flex items-center gap-3 border-b px-4 py-3.5 ${darkMode ? "border-white/10" : "border-black/10"}`}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-black text-white">
                          {initials}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-black">{user?.name || "User"}</p>
                      <p className={`truncate text-xs ${muted}`}>{user?.email || ""}</p>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1 text-sm">
                    <Link href="/profile" className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${darkMode ? "hover:bg-white/8" : "hover:bg-cyan-50"}`}>
                      <svg className="h-4 w-4 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" /></svg>
                      My Profile
                    </Link>
                    <Link href="/my-creations" className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${darkMode ? "hover:bg-white/8" : "hover:bg-cyan-50"}`}>
                      <svg className="h-4 w-4 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                      My Creations
                    </Link>
                    <Link href="/settings" className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${darkMode ? "hover:bg-white/8" : "hover:bg-cyan-50"}`}>
                      <svg className="h-4 w-4 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Settings
                    </Link>
                    <Link href="/billing" className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${darkMode ? "hover:bg-white/8" : "hover:bg-cyan-50"}`}>
                      <svg className="h-4 w-4 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                      Billing &amp; Credits
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className={`border-t ${darkMode ? "border-white/10" : "border-black/10"}`}>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 transition-colors ${
                        darkMode ? "hover:bg-red-500/10" : "hover:bg-red-50"
                      }`}
                    >
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`relative flex h-10 w-[74px] items-center rounded-full p-1 transition-colors duration-300 ${
              darkMode ? "bg-white/15" : "bg-black/10"
            }`}
            aria-label="Toggle theme"
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-white text-base shadow-md transition-transform duration-300 ${
                darkMode ? "translate-x-8" : "translate-x-0"
              }`}
            >
              {darkMode ? "🌙" : "☀️"}
            </span>
          </button>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-xl transition-colors lg:hidden ${
              darkMode ? "bg-white/10 text-white" : "bg-black/10 text-black"
            }`}
            aria-label="Toggle menu"
          >
            {showMobileMenu ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div
          className={`mx-5 mb-4 rounded-3xl border p-4 lg:hidden ${
            darkMode ? "border-white/10 bg-[#0b1220]/95" : "border-black/10 bg-white/95"
          }`}
        >
          <div className="grid gap-1 text-sm font-semibold">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-2xl px-4 py-3 transition-colors ${
                  isActive(link.href) ? "bg-cyan-500/10 text-cyan-600" : "hover:bg-cyan-400/10"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {agents.map((agent) => (
              <Link key={agent.title} href={agent.link} className="rounded-2xl px-4 py-3 hover:bg-cyan-400/10">
                {agent.title}
              </Link>
            ))}

            <div className={`mt-2 border-t pt-3 ${darkMode ? "border-white/10" : "border-black/10"}`}>
              {isLoggedIn ? (
                <>
                  {/* Mobile: user info + credits */}
                  <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-black text-white">
                          {initials}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-black">{user?.name || "User"}</p>
                      <p className="text-xs text-cyan-600">🪙 {credits} credits</p>
                    </div>
                  </div>

                  {/* Mobile: menu links */}
                  <Link href="/profile" className="block rounded-2xl px-4 py-3 hover:bg-cyan-400/10">
                    My Profile
                  </Link>
                  <Link href="/my-creations" className="block rounded-2xl px-4 py-3 hover:bg-cyan-400/10">
                    My Creations
                  </Link>
                  <Link href="/settings" className="block rounded-2xl px-4 py-3 hover:bg-cyan-400/10">
                    Settings
                  </Link>
                  <Link href="/billing" className="block rounded-2xl px-4 py-3 hover:bg-cyan-400/10">
                    Billing &amp; Credits
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-2xl px-4 py-3 text-left text-red-500 hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/login" className="block rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3 text-center font-black text-white">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
