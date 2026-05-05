"use client";

import { useTheme } from "@/app/components/ThemeProvider";

export default function SettingsPage() {
  const { darkMode, toggleTheme } = useTheme();

  // TODO: AuthProvider will replace with real values
  const user = { name: "User", email: "user@example.com" };

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode ? "border-white/10 bg-white/[0.07] shadow-black/40" : "border-black/10 bg-white/80 shadow-black/10";
  const muted = darkMode ? "text-white/55" : "text-black/55";
  const softCard = darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white/70";

  return (
    <div className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%)]" />
      <div className={`fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.14]"}`} style={{ backgroundImage: "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)", backgroundSize: "34px 34px" }} />

      <div className="relative z-10">
        <section className="mx-auto max-w-3xl px-5 py-14 md:py-20">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-600">Preferences</div>
            <h2 className="text-4xl font-black md:text-5xl">Settings</h2>
            <p className={`mt-3 ${muted}`}>Customize your experience and manage your account.</p>
          </div>

          {/* Appearance */}
          <div className={`mb-6 rounded-[2rem] border p-6 shadow-xl backdrop-blur-xl md:p-8 ${card}`}>
            <h3 className="mb-6 text-xl font-black">Appearance</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">Dark Mode</p>
                <p className={`mt-1 text-sm ${muted}`}>Switch between light and dark theme</p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={`relative flex h-10 w-[74px] items-center rounded-full p-1 transition-colors duration-300 ${
                  darkMode ? "bg-cyan-500/30" : "bg-black/10"
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
            </div>
          </div>

          {/* Account info */}
          <div className={`mb-6 rounded-[2rem] border p-6 shadow-xl backdrop-blur-xl md:p-8 ${card}`}>
            <h3 className="mb-6 text-xl font-black">Account</h3>
            <div className="space-y-5">
              <div>
                <label className={`text-xs font-bold uppercase tracking-widest ${muted}`}>Full Name</label>
                <div className={`mt-2 rounded-2xl border px-4 py-3.5 text-sm font-semibold ${softCard}`}>{user.name}</div>
              </div>
              <div>
                <label className={`text-xs font-bold uppercase tracking-widest ${muted}`}>Email Address</label>
                <div className={`mt-2 rounded-2xl border px-4 py-3.5 text-sm font-semibold ${softCard}`}>{user.email}</div>
              </div>
              <button type="button" disabled className={`rounded-2xl border px-6 py-3 text-sm font-black transition ${softCard} cursor-not-allowed opacity-50`}>
                Edit Profile — Coming Soon
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <div className={`rounded-[2rem] border border-red-400/20 p-6 shadow-xl backdrop-blur-xl md:p-8 ${darkMode ? "bg-red-500/[0.04]" : "bg-red-50/50"}`}>
            <h3 className="mb-4 text-xl font-black text-red-500">Danger Zone</h3>
            <p className={`text-sm ${muted}`}>Permanently delete your account and all associated data. This action cannot be undone.</p>
            <button type="button" disabled className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 px-6 py-3 text-sm font-black text-red-500 opacity-50 cursor-not-allowed">
              Delete Account — Coming Soon
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
