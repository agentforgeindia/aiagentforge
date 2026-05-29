// ============================================================
// AgentForge Posts data layer
// ============================================================
// Single source of truth for blog / news / update / case-study
// posts. Backed by Supabase `public.posts` table (see
// sql/posts.sql). Static BLOG_POSTS (in app/blog/posts.ts) are
// merged in for backwards compat — DB wins on slug collision.
// ============================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { BLOG_POSTS, type BlogPost, type BlogSection } from "@/app/blog/posts";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export type PostType = "blog" | "news" | "update" | "case-study";
export type PostCategory =
  | "textile"
  | "jewellery"
  | "productography"
  | "guide"
  | "announcement";
export type PostStatus = "draft" | "published";

/** Body section shape — matches BlogSection plus an inline image type. */
export type PostSection =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "image"; src: string; alt?: string; caption?: string };

/** DB row shape — keep it close to the SQL schema. */
export type DbPost = {
  id: string;
  slug: string;
  type: PostType;
  category: PostCategory;
  title: string;
  description: string | null;
  excerpt: string | null;
  author: string;
  hero_image_url: string | null;
  hero_emoji: string | null;
  read_minutes: number;
  cta_label: string | null;
  cta_href: string | null;
  keywords: string[];
  body: PostSection[];
  status: PostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** UI shape — what /news, /blog and post pages render. */
export type UnifiedPost = {
  slug: string;
  type: PostType;
  category: PostCategory;
  title: string;
  description: string;
  excerpt: string;
  author: string;
  heroImageUrl: string | null;
  heroEmoji: string;
  publishedAt: string; // ISO
  readMinutes: number;
  ctaLabel: string | null;
  ctaHref: string | null;
  keywords: string[];
  body: PostSection[];
  /** "db" = mutable (admin can edit); "static" = code-defined. */
  source: "db" | "static";
};

// ────────────────────────────────────────────────────────────
// Static → unified adapter
// ────────────────────────────────────────────────────────────
// Map a hard-coded BlogPost (BLOG_POSTS) into UnifiedPost so the
// UI can render both DB and static rows from the same array.

const STATIC_CATEGORY_MAP: Record<BlogPost["category"], PostCategory> = {
  Textile: "textile",
  Jewellery: "jewellery",
  Productography: "productography",
  Guide: "guide",
};

function staticToUnified(p: BlogPost): UnifiedPost {
  return {
    slug: p.slug,
    type: "blog",
    category: STATIC_CATEGORY_MAP[p.category] ?? "guide",
    title: p.title,
    description: p.description,
    excerpt: p.excerpt,
    author: p.author,
    heroImageUrl: null,
    heroEmoji: p.heroEmoji,
    publishedAt: p.publishedAt,
    readMinutes: p.readMinutes,
    ctaLabel: p.ctaLabel ?? null,
    ctaHref: p.ctaHref ?? null,
    keywords: p.keywords,
    body: p.body as PostSection[],
    source: "static",
  };
}

function dbToUnified(p: DbPost): UnifiedPost {
  return {
    slug: p.slug,
    type: p.type,
    category: p.category,
    title: p.title,
    description: p.description ?? "",
    excerpt: p.excerpt ?? p.description ?? "",
    author: p.author,
    heroImageUrl: p.hero_image_url,
    heroEmoji: p.hero_emoji ?? "📝",
    publishedAt: p.published_at ?? p.created_at,
    readMinutes: p.read_minutes,
    ctaLabel: p.cta_label,
    ctaHref: p.cta_href,
    keywords: p.keywords ?? [],
    body: Array.isArray(p.body) ? (p.body as PostSection[]) : [],
    source: "db",
  };
}

// Shared list of static posts in unified shape — computed once at module load.
const STATIC_UNIFIED: UnifiedPost[] = BLOG_POSTS.map(staticToUnified);

// ────────────────────────────────────────────────────────────
// Server-side Supabase client (anon key)
// ────────────────────────────────────────────────────────────
// We instantiate per-call to keep this module safe to import from
// both server and client components. The anon key + RLS gates
// reads to published-only rows for non-admins.

function getClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ────────────────────────────────────────────────────────────
// Public read API
// ────────────────────────────────────────────────────────────

export type ListPostsFilter = {
  /** "all" or specific type. */
  type?: PostType | "all";
  /** "all" or specific topical category. */
  category?: PostCategory | "all";
  /** Cap on returned posts after merge + sort. */
  limit?: number;
};

/**
 * List published posts, merging Supabase rows with the legacy
 * static BLOG_POSTS array. DB rows win on slug collision.
 *
 * Used by /news, /blog, sitemap, navbar dropdown.
 */
export async function listPublishedPosts(
  filter: ListPostsFilter = {},
): Promise<UnifiedPost[]> {
  const { type = "all", category = "all", limit } = filter;

  const supabase = getClient();
  let dbPosts: UnifiedPost[] = [];

  if (supabase) {
    let query = supabase
      .from("posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false });

    if (type !== "all") query = query.eq("type", type);
    if (category !== "all") query = query.eq("category", category);

    const { data, error } = await query;
    if (!error && data) {
      dbPosts = (data as DbPost[]).map(dbToUnified);
    }
  }

  // Merge: DB rows win, then static posts fill gaps.
  const seen = new Set(dbPosts.map((p) => p.slug));
  const staticFiltered = STATIC_UNIFIED.filter((p) => {
    if (seen.has(p.slug)) return false;
    if (type !== "all" && p.type !== type) return false;
    if (category !== "all" && p.category !== category) return false;
    return true;
  });

  const merged = [...dbPosts, ...staticFiltered].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return typeof limit === "number" ? merged.slice(0, limit) : merged;
}

/** Single post by slug. Checks DB first, falls back to static. */
export async function getPostBySlug(slug: string): Promise<UnifiedPost | null> {
  const supabase = getClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!error && data) return dbToUnified(data as DbPost);
  }
  const fallback = STATIC_UNIFIED.find((p) => p.slug === slug);
  return fallback ?? null;
}

/** All published slugs — used by /sitemap and generateStaticParams. */
export async function listPublishedSlugs(): Promise<string[]> {
  const all = await listPublishedPosts();
  return all.map((p) => p.slug);
}

// ────────────────────────────────────────────────────────────
// Admin write API
// ────────────────────────────────────────────────────────────
// These rely on RLS — the caller must be signed in as an admin
// (email present in public.admin_users). The browser will use
// its authed Supabase client; we just import lib/supabase here.

import { supabase as browserClient } from "@/lib/supabase";

export type UpsertPostInput = Omit<
  DbPost,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
};

/** Insert or update a post. Returns the saved row. */
export async function upsertPost(
  input: UpsertPostInput,
): Promise<{ data: DbPost | null; error: string | null }> {
  // If publishing for the first time, stamp published_at.
  const payload: Partial<DbPost> = { ...input };
  if (input.status === "published" && !input.published_at) {
    payload.published_at = new Date().toISOString();
  }

  const { data, error } = await browserClient
    .from("posts")
    .upsert(payload, { onConflict: "slug" })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as DbPost, error: null };
}

export async function deletePost(
  id: string,
): Promise<{ error: string | null }> {
  const { error } = await browserClient.from("posts").delete().eq("id", id);
  return { error: error?.message ?? null };
}

/** Admin list — returns DRAFTS + PUBLISHED (RLS allows when admin). */
export async function listAllPostsForAdmin(): Promise<DbPost[]> {
  const { data, error } = await browserClient
    .from("posts")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data as DbPost[];
}

export async function getPostForEdit(id: string): Promise<DbPost | null> {
  const { data, error } = await browserClient
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as DbPost;
}

// ────────────────────────────────────────────────────────────
// Image upload helper (Supabase Storage)
// ────────────────────────────────────────────────────────────

const STORAGE_BUCKET = "post-images";
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Upload an image to the post-images bucket and return a public URL.
 * Used by the admin form for hero + inline body images.
 */
export async function uploadPostImage(
  file: File,
): Promise<{ url: string | null; error: string | null }> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      url: null,
      error: "Only JPG, PNG, WebP or AVIF images are allowed.",
    };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { url: null, error: "Image must be 5 MB or smaller." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await browserClient.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { cacheControl: "31536000", upsert: false });

  if (uploadError) return { url: null, error: uploadError.message };

  const { data } = browserClient.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

// ────────────────────────────────────────────────────────────
// Slug helper — converts a title into a URL-safe slug.
// ────────────────────────────────────────────────────────────
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// ────────────────────────────────────────────────────────────
// UI labels — single source of truth for type/category names.
// ────────────────────────────────────────────────────────────

export const POST_TYPE_LABEL: Record<PostType, string> = {
  blog: "Blog",
  news: "News",
  update: "Product Update",
  "case-study": "Case Study",
};

export const POST_CATEGORY_LABEL: Record<PostCategory, string> = {
  textile: "Textile",
  jewellery: "Jewellery",
  productography: "Productography",
  guide: "Guide",
  announcement: "Announcement",
};

export const ALL_TYPES: PostType[] = ["blog", "news", "update", "case-study"];
export const ALL_CATEGORIES: PostCategory[] = [
  "textile",
  "jewellery",
  "productography",
  "guide",
  "announcement",
];
