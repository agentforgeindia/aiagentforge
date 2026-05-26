"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/app/components/ThemeProvider";
import { supabase } from "@/lib/supabase";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Crown,
  Globe,
  ImageIcon,
  Infinity as InfinityIcon,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings as SettingsIcon,
  Sparkles,
  TrendingUp,
  Upload,
  Wallet,
  X,
} from "lucide-react";

const BUSINESS_PROFILE_KEY = "agentforge-business-profile-v1";

type BusinessProfile = {
  logoDataUrl: string;
  companyName: string;
  website: string;
  phone: string;
  address: string;
};

const emptyBusinessProfile: BusinessProfile = {
  logoDataUrl: "",
  companyName: "",
  website: "",
  phone: "",
  address: "",
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { darkMode } = useTheme();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<{
    name: string;
    email: string;
    phone: string;
    avatarUrl: string | null;
  }>({
    name: "User",
    email: "",
    phone: "",
    avatarUrl: null,
  });

  const [credits, setCredits] = useState(0);
  const [plan, setPlan] = useState("Free Trial");
  const [generationsCount, setGenerationsCount] = useState(0);
  const [memberSince, setMemberSince] = useState<string>("");
  const [loadingStats, setLoadingStats] = useState(true);

  const [biz, setBiz] = useState<BusinessProfile>(emptyBusinessProfile);
  const [savedToast, setSavedToast] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Load business profile from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BUSINESS_PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setBiz({ ...emptyBusinessProfile, ...parsed });
      }
    } catch {
      // ignore
    }
  }, []);

  // Load profile + generations count
  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active || !session?.user) {
        if (active) setLoadingStats(false);
        return;
      }

      const authUser = session.user;

      const [{ data: profile }, { count }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, credits, plan, phone")
          .eq("id", authUser.id)
          .single(),
        supabase
          .from("generations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", authUser.id),
      ]);

      if (!active) return;

      setUser({
        name:
          profile?.full_name ||
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split("@")[0] ||
          "User",
        email: authUser.email || "",
        phone: profile?.phone || "",
        avatarUrl:
          authUser.user_metadata?.avatar_url ||
          authUser.user_metadata?.picture ||
          null,
      });
      setCredits(profile?.credits ?? 0);
      setPlan(profile?.plan || "Free Trial");
      setGenerationsCount(count ?? 0);
      setMemberSince(
        authUser.created_at
          ? new Date(authUser.created_at).toLocaleDateString("en-IN", {
              month: "short",
              year: "numeric",
            })
          : "",
      );
      setLoadingStats(false);
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

  const planMeta = useMemo(() => {
    const p = (plan || "").toLowerCase();
    if (p.includes("empire")) {
      return {
        label: "Empire",
        accent: "from-amber-400 to-orange-500",
        textColor: "text-amber-700 dark:text-amber-200",
        bgSoft: "bg-amber-50 dark:bg-amber-500/10",
      };
    }
    if (p.includes("pro")) {
      return {
        label: "Pro Creator",
        accent: "from-cyan-400 to-blue-600",
        textColor: "text-cyan-700 dark:text-cyan-200",
        bgSoft: "bg-cyan-50 dark:bg-cyan-500/10",
      };
    }
    if (p.includes("starter")) {
      return {
        label: "Starter",
        accent: "from-blue-400 to-indigo-500",
        textColor: "text-blue-700 dark:text-blue-200",
        bgSoft: "bg-blue-50 dark:bg-blue-500/10",
      };
    }
    return {
      label: "Free Trial",
      accent: "from-slate-400 to-slate-500",
      textColor: "text-slate-700 dark:text-slate-200",
      bgSoft: "bg-slate-100 dark:bg-white/[0.05]",
    };
  }, [plan]);

  const usedCreditsEstimate = generationsCount * 15;

  const updateBiz = <K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) =>
    setBiz((prev) => ({ ...prev, [key]: value }));

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      updateBiz("logoDataUrl", dataUrl);
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const saveBusinessProfile = () => {
    try {
      window.localStorage.setItem(BUSINESS_PROFILE_KEY, JSON.stringify(biz));
      setSavedToast(true);
      window.setTimeout(() => setSavedToast(false), 2200);
    } catch (err) {
      console.warn("Could not save business profile", err);
    }
  };

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.07] shadow-black/40"
    : "border-black/10 bg-white/80 shadow-black/10";
  const softCard = darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white/70";
  const muted = darkMode ? "text-white/55" : "text-black/55";
  const input = darkMode
    ? "border-white/10 bg-black/25 text-white placeholder:text-white/35"
    : "border-black/10 bg-white text-black placeholder:text-black/35";

  const initial = user.name?.[0]?.toUpperCase() || "U";

  return (
    <div className={`relative min-h-screen overflow-hidden ${bg}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#8b5cf644,transparent_35%)]" />
      <div
        className={`fixed inset-0 ${darkMode ? "opacity-[0.06]" : "opacity-[0.12]"}`}
        style={{
          backgroundImage:
            "linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="relative z-10">
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-14">
          {/* ───────── Header card ───────── */}
          <div className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl sm:p-8 ${card}`}>
            <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <div className="relative">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl ring-4 ring-white/70 shadow-xl sm:h-24 sm:w-24 dark:ring-[#0b1220]">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-600 text-3xl font-black text-white">
                      {initial}
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-md ring-2 ring-white dark:ring-[#0b1220]">
                  <BadgeCheck className="h-4 w-4" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-600">
                  My Profile
                </p>
                <h1 className="mt-1 truncate text-2xl font-black sm:text-3xl md:text-4xl">
                  {user.name}
                </h1>
                <div className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm ${muted}`}>
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email || "—"}
                  </span>
                  {user.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {user.phone}
                    </span>
                  )}
                  {memberSince && (
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Member since {memberSince}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
                <span
                  className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r ${planMeta.accent} px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white shadow-lg`}
                >
                  <Crown className="h-3.5 w-3.5" />
                  {planMeta.label}
                </span>
                <Link
                  href="/billing"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-4 py-2 text-[11px] font-black text-white transition hover:scale-105 dark:bg-white dark:text-black"
                >
                  Manage Billing
                </Link>
              </div>
            </div>
          </div>

          {/* ───────── Credit Stats — 3 cards ───────── */}
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {/* Available */}
            <div className="group relative overflow-hidden rounded-[1.5rem] border-2 border-cyan-400 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-5 shadow-xl shadow-cyan-500/20 transition hover:-translate-y-1 dark:from-white/[0.06] dark:via-white/[0.04] dark:to-white/[0.03]">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-400/25 blur-2xl transition group-hover:scale-125" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className={`text-[11px] font-black uppercase tracking-[0.22em] text-cyan-600`}>
                    Available
                  </p>
                  <p className="mt-1 text-3xl font-black sm:text-4xl">
                    {loadingStats ? "—" : credits.toLocaleString("en-IN")}
                  </p>
                  <p className={`mt-1 text-xs ${muted}`}>credits remaining</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-md shadow-cyan-500/40">
                  <Wallet className="h-5 w-5" />
                </span>
              </div>
              <Link
                href="/pricing"
                className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 text-[11px] font-black text-white shadow-md shadow-cyan-500/30 transition hover:scale-105"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Top up credits
              </Link>
            </div>

            {/* Used */}
            <div className={`group relative overflow-hidden rounded-[1.5rem] border p-5 shadow-xl backdrop-blur-xl transition hover:-translate-y-1 ${card}`}>
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-400/20 blur-2xl transition group-hover:scale-125" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-600">
                    Used
                  </p>
                  <p className="mt-1 text-3xl font-black sm:text-4xl">
                    {loadingStats ? "—" : generationsCount.toLocaleString("en-IN")}
                  </p>
                  <p className={`mt-1 text-xs ${muted}`}>
                    generations · ~{usedCreditsEstimate.toLocaleString("en-IN")} credits
                  </p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white shadow-md shadow-violet-500/40">
                  <TrendingUp className="h-5 w-5" />
                </span>
              </div>
              <Link
                href="/my-creations"
                className={`relative mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-black transition hover:scale-105 ${
                  darkMode ? "bg-white/10 text-white" : "bg-black text-white"
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                View creations
              </Link>
            </div>

            {/* Validity */}
            <div className={`group relative overflow-hidden rounded-[1.5rem] border p-5 shadow-xl backdrop-blur-xl transition hover:-translate-y-1 ${card}`}>
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-400/20 blur-2xl transition group-hover:scale-125" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-600">
                    Validity
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-3xl font-black sm:text-4xl">
                    <InfinityIcon className="h-7 w-7 text-emerald-500" />
                    Lifetime
                  </p>
                  <p className={`mt-1 text-xs ${muted}`}>credits never expire</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-500/40">
                  <BadgeCheck className="h-5 w-5" />
                </span>
              </div>
              <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2 text-[11px] font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Active · top-up anytime
              </div>
            </div>
          </div>

          {/* ───────── Business Profile ───────── */}
          <div className={`relative mt-8 overflow-hidden rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl sm:p-8 ${card}`}>
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />

            <div className="relative mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
                  <Briefcase className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-600">
                    Business Details
                  </p>
                  <h3 className="text-xl font-black sm:text-2xl">
                    <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                      Business Profile
                    </span>
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={saveBusinessProfile}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-cyan-500/30 transition hover:scale-105"
              >
                <Save className="h-4 w-4" />
                Save profile
              </button>
            </div>

            <p className={`relative mb-5 text-sm leading-6 ${muted}`}>
              Save your company branding once — your logo, name, website, phone
              and address are stored on this device and can be used as defaults
              on output images across all agents.
            </p>

            {/* Logo upload row */}
            <div className={`relative mb-5 flex items-center gap-4 rounded-2xl border p-4 ${softCard}`}>
              <div className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${
                darkMode ? "bg-white/10 text-cyan-200" : "bg-cyan-50 text-cyan-700"
              }`}>
                {biz.logoDataUrl ? (
                  <img src={biz.logoDataUrl} alt="Business logo" className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-9 w-9" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black sm:text-base">Business logo</p>
                <p className={`text-xs leading-5 ${muted}`}>
                  PNG, JPG or WEBP · square logo works best · stored locally
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1.5 text-[11px] font-black text-cyan-700 transition hover:scale-105 disabled:opacity-60 dark:bg-white/10 dark:text-cyan-200"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {biz.logoDataUrl ? "Replace logo" : uploadingLogo ? "Uploading…" : "Upload logo"}
                  </button>
                  {biz.logoDataUrl && (
                    <button
                      type="button"
                      onClick={() => updateBiz("logoDataUrl", "")}
                      className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1.5 text-[11px] font-black text-rose-500 transition hover:scale-105"
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>

            {/* Fields grid */}
            <div className="relative grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={`mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] ${muted}`}>
                  <Building2 className="h-3.5 w-3.5" />
                  Company name
                </label>
                <input
                  type="text"
                  value={biz.companyName}
                  onChange={(e) => updateBiz("companyName", e.target.value)}
                  placeholder="e.g. AgentForge India Pvt Ltd"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-400 ${input}`}
                />
              </div>

              <div>
                <label className={`mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] ${muted}`}>
                  <Globe className="h-3.5 w-3.5" />
                  Website
                </label>
                <input
                  type="text"
                  value={biz.website}
                  onChange={(e) => updateBiz("website", e.target.value)}
                  placeholder="www.agentforge.in"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-400 ${input}`}
                />
              </div>

              <div>
                <label className={`mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] ${muted}`}>
                  <Phone className="h-3.5 w-3.5" />
                  Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={biz.phone}
                  onChange={(e) => updateBiz("phone", e.target.value)}
                  placeholder="+91 90416 35032"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-400 ${input}`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={`mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] ${muted}`}>
                  <MapPin className="h-3.5 w-3.5" />
                  Address
                </label>
                <textarea
                  value={biz.address}
                  onChange={(e) => updateBiz("address", e.target.value)}
                  placeholder="Shop / Floor, Street, City, State – PIN"
                  rows={2}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-400 ${input}`}
                />
              </div>
            </div>

            {savedToast && (
              <div className="relative mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/50 bg-emerald-50 px-3.5 py-1.5 text-xs font-black text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                <BadgeCheck className="h-4 w-4" />
                Business profile saved
              </div>
            )}
          </div>

          {/* ───────── Account Information ───────── */}
          <div className={`mt-6 rounded-[2rem] border p-6 shadow-xl backdrop-blur-xl sm:p-8 ${card}`}>
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
                <SettingsIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-600">
                  Account
                </p>
                <h3 className="text-xl font-black sm:text-2xl">Account Information</h3>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className={`rounded-2xl border p-4 ${softCard}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${muted}`}>Full Name</p>
                <p className="mt-1 truncate text-sm font-black sm:text-base">{user.name}</p>
              </div>
              <div className={`rounded-2xl border p-4 ${softCard}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${muted}`}>Email</p>
                <p className="mt-1 truncate text-sm font-black sm:text-base">{user.email || "—"}</p>
              </div>
              <div className={`rounded-2xl border p-4 ${softCard}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${muted}`}>Phone</p>
                <p className="mt-1 truncate text-sm font-black sm:text-base">{user.phone || "—"}</p>
              </div>
            </div>
          </div>

          {/* ───────── Quick links ───────── */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "My Creations",
                desc: "All your generated visuals",
                href: "/my-creations",
                Icon: ImageIcon,
                accent: "from-cyan-400 to-blue-500",
              },
              {
                label: "Pricing",
                desc: "Compare plans & upgrade",
                href: "/pricing",
                Icon: Sparkles,
                accent: "from-violet-400 to-fuchsia-500",
              },
              {
                label: "Billing",
                desc: "Invoices & payment history",
                href: "/billing",
                Icon: Wallet,
                accent: "from-amber-400 to-orange-500",
              },
              {
                label: "Settings",
                desc: "Theme, account & data",
                href: "/settings",
                Icon: SettingsIcon,
                accent: "from-indigo-400 to-blue-500",
              },
            ].map((link) => {
              const Icon = link.Icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative overflow-hidden rounded-[1.5rem] border p-5 transition hover:-translate-y-1 ${card}`}
                >
                  <span className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${link.accent} opacity-15 blur-2xl transition group-hover:scale-125`} />
                  <div className="relative">
                    <span className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${link.accent} text-white shadow-lg`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="text-base font-black">{link.label}</p>
                    <p className={`mt-1 text-xs leading-5 ${muted}`}>{link.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
