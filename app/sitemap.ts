import { MetadataRoute } from "next";
import fs from "node:fs";
import path from "node:path";
import { BLOG_POSTS } from "@/app/blog/posts";

const SITE = "https://www.aiagentforge.in";

// ============================================================
// AUTO-DISCOVERY: walk the app/ directory, find every page.tsx,
// and convert its folder path into a URL. New pages you add are
// automatically picked up — no need to edit this file.
// ============================================================

// Folders that should NEVER appear in the sitemap (private, admin,
// auth-only, system folders, route groups, etc.)
const EXCLUDED_SEGMENTS = new Set([
  "api",                  // API routes (not pages)
  "components",           // React components (not pages)
  "admin",                // admin dashboard (private)
  "auth",                 // auth callback (private)
  "complete-profile",     // onboarding step (private, blocked from index anyway)
  "profile",              // user profile (private)
  "billing",              // user billing (private)
  "my-creations",         // user creations (private)
  "settings",             // user settings (private)
  "social-scheduler",     // logged-in tool (private)
  "payment-success",      // post-checkout (private)
  "workshop",             // legacy workshop pages
]);

// File-system patterns that mean "this is not a real route"
function isHiddenOrSystemSegment(seg: string) {
  if (seg.startsWith(".")) return true;          // .DS_Store, .next, etc.
  if (seg.startsWith("_")) return true;          // _components convention
  if (seg.startsWith("(") && seg.endsWith(")")) return true; // route groups (auth)
  if (seg.startsWith("[") && seg.endsWith("]")) return true; // dynamic params
  if (seg.startsWith("@")) return true;          // parallel routes
  if (seg.includes("~")) return true;            // backup folders e.g. workshop~xxx
  return false;
}

/** Recursively collect every folder path under `app/` that contains a page.tsx */
function collectPageRoutes(appDir: string): string[] {
  const routes: string[] = [];

  function walk(currentDir: string, relativeSegments: string[]) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    // If this folder has a page.tsx (or page.jsx/ts/js), it's a route.
    // The root app/ folder counts as "/" if it has a page.tsx.
    const hasPage = entries.some(
      (e) => e.isFile() && /^page\.(tsx|jsx|ts|js)$/.test(e.name),
    );
    if (hasPage) {
      // Convert segments to URL path. Root = "/".
      const urlPath = "/" + relativeSegments.join("/");
      routes.push(urlPath === "/" ? "/" : urlPath.replace(/\/+$/, ""));
    }

    // Recurse into subdirectories (skipping excluded/system ones).
    // Dynamic params like [slug] are auto-skipped via isHiddenOrSystemSegment
    // — they're expanded later from data sources (e.g. BLOG_POSTS).
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const name = entry.name;
      if (isHiddenOrSystemSegment(name)) continue;
      if (EXCLUDED_SEGMENTS.has(name)) continue;
      walk(path.join(currentDir, name), [...relativeSegments, name]);
    }
  }

  walk(appDir, []);
  return routes;
}

/** Heuristic priority & changefreq based on URL shape */
function classify(url: string): {
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
} {
  // Homepage
  if (url === SITE || url === `${SITE}/`) {
    return { priority: 1.0, changeFrequency: "weekly" };
  }
  // Legal / utility — low priority, rarely changes
  if (/\/(privacy-policy|terms|refund-policy)$/.test(url)) {
    return { priority: 0.3, changeFrequency: "yearly" };
  }
  // Blog post (individual)
  if (/\/blog\/[^/]+$/.test(url)) {
    return { priority: 0.7, changeFrequency: "monthly" };
  }
  // Blog index
  if (url.endsWith("/blog")) {
    return { priority: 0.7, changeFrequency: "weekly" };
  }
  // SEO landing pages (ai-* keyword pages)
  if (/\/ai-[a-z0-9-]+$/.test(url)) {
    return { priority: 0.9, changeFrequency: "weekly" };
  }
  // Core AI agent product pages
  if (/\/(textileprints-to-mockup|jewellery-ai|productography-ai|ugc-forge|trendforge|election-campaign-ai)$/.test(url)) {
    return { priority: 0.95, changeFrequency: "weekly" };
  }
  // Pricing & Gallery — high-value
  if (/\/(pricing|gallery)$/.test(url)) {
    return { priority: 0.9, changeFrequency: "weekly" };
  }
  // Default for everything else (support, about, etc.)
  return { priority: 0.6, changeFrequency: "monthly" };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const appDir = path.join(process.cwd(), "app");

  // 1. Auto-discover static routes from the filesystem
  const discoveredRoutes = collectPageRoutes(appDir);
  const staticEntries: MetadataRoute.Sitemap = discoveredRoutes.map((route) => {
    const url = route === "/" ? SITE : `${SITE}${route}`;
    const { priority, changeFrequency } = classify(url);
    return { url, lastModified: now, changeFrequency, priority };
  });

  // 2. Expand dynamic blog post routes from BLOG_POSTS data
  const blogPostEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${SITE}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // 3. Deduplicate (in case auto-discovery picks up something dynamic also adds)
  const seen = new Set<string>();
  const all = [...staticEntries, ...blogPostEntries].filter((e) => {
    if (seen.has(e.url)) return false;
    seen.add(e.url);
    return true;
  });

  // 4. Sort by priority (highest first) for nicer XML output
  return all.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}
