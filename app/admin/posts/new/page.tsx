"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "@/app/components/ThemeProvider";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import PostForm from "../PostForm";

// Mirrors ADMIN_EMAILS in app/admin/posts/page.tsx + admin_users seed in
// sql/posts.sql. Replace / extend in all three places when adding admins.
const ADMIN_EMAILS: string[] = [
  "info@aiagentforge.in",
  "info.agentforge@gmail.com",
];

export default function AdminNewPostPage() {
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
      (_event, session) => setAuthEmail(session?.user?.email ?? null),
    );
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const bg = darkMode ? "bg-[#070b14] text-white" : "bg-[#fff8e8] text-[#111827]";
  const muted = darkMode ? "text-white/60" : "text-black/55";

  if (loadingAuth) {
    return (
      <main className={`flex min-h-screen items-center justify-center ${bg}`}>
        <p className={muted}>Checking access…</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className={`flex min-h-screen items-center justify-center px-6 ${bg}`}>
        <div className="max-w-md rounded-3xl border border-black/10 bg-white/85 p-8 text-center dark:border-white/10 dark:bg-white/[0.06]">
          <ShieldCheck className="mx-auto h-10 w-10 text-rose-500" />
          <h1 className="mt-3 text-xl font-black">Admin access required</h1>
          <p className={`mt-2 text-sm ${muted}`}>
            Sign in with an admin email to create posts.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={`relative min-h-screen ${bg}`}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-5 sm:py-12">
        <Link
          href="/admin/posts"
          className="inline-flex items-center gap-2 text-sm font-bold text-cyan-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to posts
        </Link>

        <div className="mt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-600">
            Admin · Content
          </p>
          <h1 className="mt-1 text-2xl font-black sm:text-3xl">
            Create new post
          </h1>
          <p className={`mt-1 text-sm ${muted}`}>
            Fill in the fields, add body sections, and click <strong>Publish</strong> when ready — or save as draft to come back later.
          </p>
        </div>

        <div className="mt-8">
          <PostForm />
        </div>
      </div>
    </main>
  );
}
