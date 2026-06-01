"use client";

// ============================================================
// /admin — admin home / hub. Links to every admin tool.
// ============================================================

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "@/app/components/ThemeProvider";
import { supabase } from "@/lib/supabase";
import {
  FileText,
  MessageSquare,
  Receipt,
  ShieldCheck,
  Users,
  UserPlus,
} from "lucide-react";

const ADMIN_EMAILS: string[] = [
  "info@aiagentforge.in",
  "info.agentforge@gmail.com",
];

type Tile = {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  badge?: string;
};

const TILES: Tile[] = [
  {
    href: "/admin/customers",
    label: "Customers",
    description: "Every signed-up user, plan, balance, notes, payments.",
    icon: <Users className="h-5 w-5" />,
    accent: "from-cyan-400 to-blue-600",
  },
  {
    href: "/admin/leads",
    label: "Leads",
    description: "Prospects from IG, FB, WhatsApp, calls, referrals.",
    icon: <UserPlus className="h-5 w-5" />,
    accent: "from-violet-400 to-fuchsia-600",
  },
  {
    href: "/admin/posts",
    label: "Posts",
    description: "Blog, news, product updates published on /news.",
    icon: <FileText className="h-5 w-5" />,
    accent: "from-emerald-400 to-cyan-600",
  },
  {
    href: "/admin/testimonials",
    label: "Testimonials",
    description: "Customer reviews shown on the homepage.",
    icon: <MessageSquare className="h-5 w-5" />,
    accent: "from-amber-400 to-rose-500",
  },
  {
    href: "/admin/invoices",
    label: "Invoices",
    description: "Auto-generated GST invoices for every paid order.",
    icon: <Receipt className="h-5 w-5" />,
    accent: "from-slate-400 to-slate-600",
    badge: "Coming soon",
  },
];

export default function AdminHomePage() {
  const { darkMode } = useTheme();

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const isAdmin = authEmail
    ? ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(authEmail.toLowerCase())
    : false;

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setAuthEmail(data.session?.user?.email ?? null);
      setLoadingAuth(false);
    })();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_e, s) => setAuthEmail(s?.user?.email ?? null),
    );
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const card = darkMode
    ? "border-white/10 bg-white/[0.06]"
    : "border-black/10 bg-white/85";
  const muted = darkMode ? "text-white/60" : "text-black/55";

  if (loadingAuth) {
    return (
      <main className={`flex min-h-screen items-center justify-center ${bg}`}>
        <p className={muted}>Checking access…</p>
      </main>
    );
  }
  if (!authEmail) {
    return (
      <main className={`flex min-h-screen items-center justify-center px-6 ${bg}`}>
        <div className={`max-w-md rounded-3xl border p-8 text-center ${card}`}>
          <ShieldCheck className="mx-auto h-10 w-10 text-cyan-500" />
          <h1 className="mt-3 text-xl font-black">Admin login required</h1>
          <Link
            href="/login"
            className="mt-5 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2.5 text-sm font-black text-white"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }
  if (!isAdmin) {
    return (
      <main className={`flex min-h-screen items-center justify-center px-6 ${bg}`}>
        <div className={`max-w-md rounded-3xl border p-8 text-center ${card}`}>
          <ShieldCheck className="mx-auto h-10 w-10 text-rose-500" />
          <h1 className="mt-3 text-xl font-black">Access denied</h1>
          <p className={`mt-2 text-sm ${muted}`}>
            {authEmail} is not on the admin allowlist.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={`relative min-h-screen ${bg}`}>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-5 sm:py-16">
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-600">
          Admin
        </p>
        <h1 className="mt-1 text-3xl font-black sm:text-4xl">AgentForge Console</h1>
        <p className={`mt-2 text-sm ${muted}`}>
          Sab kuch ek jagah — customers, leads, content, billing.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TILES.map((t) => (
            <TileCard key={t.href} tile={t} card={card} muted={muted} />
          ))}
        </div>

        <p className={`mt-10 text-center text-xs ${muted}`}>
          Signed in as <span className="font-black">{authEmail}</span>
        </p>
      </div>
    </main>
  );
}

function TileCard({
  tile,
  card,
  muted,
}: {
  tile: Tile;
  card: string;
  muted: string;
}) {
  const disabled = Boolean(tile.badge === "Coming soon");
  const inner = (
    <div className={`group relative h-full rounded-3xl border p-5 transition ${card} ${disabled ? "opacity-60" : "hover:-translate-y-0.5 hover:shadow-lg"}`}>
      <div
        className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${tile.accent} text-white shadow`}
      >
        {tile.icon}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-black">{tile.label}</h2>
        {tile.badge && (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
            {tile.badge}
          </span>
        )}
      </div>
      <p className={`mt-1.5 text-sm leading-6 ${muted}`}>{tile.description}</p>
    </div>
  );
  if (disabled) return <div>{inner}</div>;
  return <Link href={tile.href}>{inner}</Link>;
}
