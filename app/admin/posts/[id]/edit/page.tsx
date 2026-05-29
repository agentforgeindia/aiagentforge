"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "@/app/components/ThemeProvider";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { getPostForEdit, type DbPost } from "@/lib/posts";
import PostForm from "../../PostForm";

const ADMIN_EMAILS: string[] = [
  "info@aiagentforge.in",
  "info.agentforge@gmail.com",
];

export default function AdminEditPostPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { darkMode } = useTheme();

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const isAdmin = authEmail
    ? ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(authEmail.toLowerCase())
    : false;

  const [post, setPost] = useState<DbPost | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Auth
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

  // Load post — only after admin check passes
  useEffect(() => {
    if (!isAdmin || !id) return;
    let active = true;
    (async () => {
      setLoadingPost(true);
      const result = await getPostForEdit(id);
      if (!active) return;
      if (!result) {
        setNotFound(true);
      } else {
        setPost(result);
      }
      setLoadingPost(false);
    })();
    return () => {
      active = false;
    };
  }, [isAdmin, id]);

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
            Sign in with an admin email to edit posts.
          </p>
        </div>
      </main>
    );
  }

  if (loadingPost) {
    return (
      <main className={`flex min-h-screen items-center justify-center ${bg}`}>
        <div className="flex items-center gap-3 text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
          <span className={muted}>Loading post…</span>
        </div>
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main className={`flex min-h-screen items-center justify-center px-6 ${bg}`}>
        <div className="max-w-md rounded-3xl border border-black/10 bg-white/85 p-8 text-center dark:border-white/10 dark:bg-white/[0.06]">
          <p className="text-4xl">🚫</p>
          <h1 className="mt-3 text-xl font-black">Post not found</h1>
          <p className={`mt-2 text-sm ${muted}`}>
            This post may have been deleted.
          </p>
          <Link
            href="/admin/posts"
            className="mt-5 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2 text-sm font-black text-white"
          >
            Back to posts
          </Link>
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
            Admin · Content · Edit
          </p>
          <h1 className="mt-1 truncate text-2xl font-black sm:text-3xl">
            {post.title}
          </h1>
          <p className={`mt-1 text-xs ${muted}`}>
            /{post.slug} · status:{" "}
            <span
              className={
                post.status === "published"
                  ? "font-black text-emerald-600 dark:text-emerald-400"
                  : "font-black text-amber-600 dark:text-amber-400"
              }
            >
              {post.status}
            </span>
          </p>
        </div>

        <div className="mt-8">
          <PostForm initial={post} />
        </div>
      </div>
    </main>
  );
}
