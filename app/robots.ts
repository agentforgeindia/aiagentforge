import { MetadataRoute } from "next";

const SITE = "https://www.aiagentforge.in";

// ============================================================
// robots.txt — tells search crawlers what to index and what to skip
// Lives at /robots.txt (Next.js generates it automatically from this file)
// ============================================================

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default rule for ALL crawlers
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",                  // API endpoints (no content for users)
          "/admin/",                // Admin dashboard
          "/auth/",                 // Auth callback / private auth pages
          "/complete-profile",      // Onboarding step (logged-in only)
          "/profile",               // User profile page
          "/billing",               // User billing
          "/my-creations",          // User-private creations
          "/settings",              // User settings
          "/social-scheduler",      // Logged-in tool
          "/payment-success",       // Post-checkout page
          "/invoice/",              // User-private invoices (financial docs)
          "/_next/",                // Next.js internals
          "/*.json$",               // Raw JSON files
          "/*?source=*",            // Tracking-param URLs (avoid dup-content)
          "/*?utm_*",               // UTM-tagged URLs (avoid dup-content)
          "/*?ref=*",               // Referral-tagged URLs
        ],
      },

      // Googlebot — explicit allow + large image preview
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/auth/",
          "/complete-profile",
          "/profile",
          "/billing",
          "/my-creations",
          "/settings",
          "/social-scheduler",
          "/payment-success",
          "/invoice/",
        ],
      },

      // Bingbot — explicit allow
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/auth/",
          "/complete-profile",
          "/profile",
          "/billing",
          "/my-creations",
          "/settings",
          "/social-scheduler",
          "/payment-success",
          "/invoice/",
        ],
      },

      // AI search crawlers — ALLOWED by default (gives you visibility in
      // Google AI Overviews, ChatGPT search, Perplexity etc.).
      // If you ever want to block them from training on your content,
      // change `allow: "/"` to `disallow: "/"` below.
      { userAgent: "Google-Extended", allow: "/" },   // Google AI Overviews / Gemini
      { userAgent: "ChatGPT-User", allow: "/" },     // ChatGPT search-citing
      { userAgent: "PerplexityBot", allow: "/" },    // Perplexity search results
      { userAgent: "GPTBot", allow: "/" },           // OpenAI training crawler
      { userAgent: "Claude-Web", allow: "/" },       // Anthropic Claude
      { userAgent: "anthropic-ai", allow: "/" },     // Anthropic alt UA
      { userAgent: "CCBot", allow: "/" },            // Common Crawl
    ],

    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
