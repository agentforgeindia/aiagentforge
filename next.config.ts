import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  },

  // ============================================================
  // PERFORMANCE — compression + powered-by header off
  // ============================================================
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
