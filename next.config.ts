import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/blog", destination: "/news", permanent: true },
    ];
  },
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: ".",
  },

  // ============================================================
  // IMAGE OPTIMIZATION — boosts Core Web Vitals (LCP, CLS) and
  // reduces bandwidth. Even <img> tags benefit from the cache,
  // and <Image> components get auto AVIF/WebP conversion.
  // ============================================================
  images: {
    // Modern formats first. Browsers that don't support AVIF
    // fall back to WebP, then to the original.
    formats: ["image/avif", "image/webp"],

    // Cache served-from-CDN images for 1 year (immutable URLs anyway)
    minimumCacheTTL: 60 * 60 * 24 * 365,

    // Responsive image sizes — used by Next.js to generate srcset
    deviceSizes: [320, 420, 640, 768, 1024, 1280, 1536, 1920, 2560],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // External hosts that we load images from (add yours here as needed)
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],

    // ────────────────────────────────────────────────────────────
    // Next.js 16 locks down local images with query strings to
    // prevent enumeration attacks. Our /public images are served
    // without query strings — next/image auto-versions them via
    // its own optimizer cache. If you ever need a cache-buster,
    // add an exact entry here, e.g.
    //   { pathname: "/banner.png", search: "?v=3" }
    // ────────────────────────────────────────────────────────────
    localPatterns: [
      { pathname: "/**", search: "" },
    ],
  },

  // ============================================================
  // PERFORMANCE — compression + powered-by header off
  // ============================================================
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
