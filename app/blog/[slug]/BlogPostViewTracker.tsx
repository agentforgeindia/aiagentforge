"use client";

// ============================================================
// BlogPostViewTracker
// ============================================================
// Tiny client component dropped inside the (server-rendered)
// blog/news post page. Fires a single `blog_post_read` event on
// mount so we can measure which articles drive engagement.
// ============================================================

import { useEffect } from "react";

import { track } from "@/lib/analytics";

export default function BlogPostViewTracker({
  slug,
  category,
}: {
  slug: string;
  category?: string;
}) {
  useEffect(() => {
    track({ name: "blog_post_read", slug, category });
  }, [slug, category]);

  return null;
}
