"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "@/app/components/ThemeProvider";
import { supabase } from "@/lib/supabase";
import { hasBulkAccess, hasUnlimitedAccess } from "@/lib/plans";

export default function ProfilePage() {
  const { darkMode } = useTheme();

  const [user, setUser] = useState<{ name: string; email: string; avatarUrl: string | null }>({
    name: "User",
    email: "",
    avatarUrl: null,
  });
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    let active = true;

    

    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active || !session?.user) return;

      const authUser = session.user;
      
      // Fetch profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, credits")
        .eq("id", authUser.id)
        .single();

      if (active) {
        setUser({
          name: profile?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
          email: authUser.email || "",
          avatarUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
        });
        setCredits(profile?.credits || 0);
      }
    }

    loadProfile();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) loadProfile();
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode ? "border-white/10 bg-white/[0.07] shadow-black/40" : "border-black/10 bg-white/80 shadow-black/10";
  const muted = darkMode ? "text-white/55" : "text-black/55";
  const softCard = darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white/70";

  const initial = user.name?.[0]?.toUpperCase() || "U";

  return (
    <div className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%)]" />
      <div className={`fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.14]"}`} style={{ backgroundImage: "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)", backgroundSize: "34px 34px" }} />

      <div className="relative z-10">
        <section className="mx-auto max-w-4xl px-5 py-14 md:py-20">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-600">Account</div>
            <h2 className="text-4xl font-black md:text-5xl">My Profile</h2>
            <p className={`mt-3 ${muted}`}>Manage your account and view your activity.</p>
          </div>

          {/* Credits highlight */}
          <div className="mx-auto mb-8 max-w-sm rounded-[2rem] border border-cyan-400/30 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 p-8 text-center backdrop-blur-xl">
            <p className={`text-sm font-bold uppercase tracking-widest ${muted}`}>Available Credits</p>
            <p className="mt-3 text-6xl font-black text-cyan-500">🪙 {credits}</p>
            <Link href="/billing" className="mt-5 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:scale-105">
              Buy More Credits
            </Link>
          </div>

          {/* User info card */}
          <div className={`mb-6 rounded-[2rem] border p-6 shadow-xl backdrop-blur-xl md:p-8 ${card}`}>
            <h3 className="mb-6 text-xl font-black">Account Information</h3>
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-600 text-2xl font-black text-white">{initial}</div>
                )}
              </div>
              <div className="space-y-3 text-center sm:text-left">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest ${muted}`}>Full Name</p>
                  <p className="mt-1 text-lg font-black">{user.name}</p>
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest ${muted}`}>Email Address</p>
                  <p className="mt-1 text-lg font-black">{user.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/textileprints-to-mockup" className={`group rounded-[2rem] border p-6 text-center shadow-xl backdrop-blur-xl transition hover:-translate-y-1 ${card}`}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-xl text-white transition-transform group-hover:scale-110">🎨</div>
              <h4 className="text-lg font-black">Go to Agent</h4>
              <p className={`mt-2 text-sm ${muted}`}>Start creating premium AI visuals</p>
            </Link>
            <Link href="/pricing" className={`group rounded-[2rem] border p-6 text-center shadow-xl backdrop-blur-xl transition hover:-translate-y-1 ${card}`}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 text-xl text-white transition-transform group-hover:scale-110">💎</div>
              <h4 className="text-lg font-black">View Pricing</h4>
              <p className={`mt-2 text-sm ${muted}`}>Choose the right plan for your needs</p>
            </Link>
          </div>

          {/* Quick links */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: "My Creations", href: "/my-creations", icon: "🖼️" },
              { label: "Settings", href: "/settings", icon: "⚙️" },
              { label: "Billing & Credits", href: "/billing", icon: "💳" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className={`flex items-center gap-3 rounded-2xl border p-4 font-semibold transition hover:border-cyan-400/50 ${softCard}`}>
                <span className="text-xl">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
