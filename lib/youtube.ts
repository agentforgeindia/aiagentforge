// ============================================================
// YouTube channel auto-sync
// ============================================================
// Pulls every video off a public YouTube channel using the RSS
// feed (no API key, no quota, no auth). The feed is cached via
// Next.js ISR — `next.revalidate: 900` means new videos appear
// within 15 minutes of being uploaded, no rebuild required.
//
// Used by /how-it-works so every new tutorial Agent Forge ships
// on YouTube shows up on the site automatically.
// ============================================================

export type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;     // ISO 8601 string
  url: string;             // canonical watch URL
};

export type AgentCategory =
  | "jewellery"
  | "textile"
  | "productography"
  | "other";

// ────────────────────────────────────────────────────────────
// RSS fetch + parse
// ────────────────────────────────────────────────────────────
// YouTube's RSS schema is stable enough that a small regex parser
// beats pulling in a 100KB XML library.
// ────────────────────────────────────────────────────────────

const CACHE_SECONDS = 900; // 15 min — balance freshness vs CDN load

export async function fetchChannelVideos(
  channelId: string,
): Promise<YouTubeVideo[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(
    channelId,
  )}`;

  try {
    const res = await fetch(url, {
      // Next.js ISR: cached at the edge, refetched after CACHE_SECONDS.
      next: { revalidate: CACHE_SECONDS },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseChannelXml(xml);
  } catch {
    return [];
  }
}

// ────────────────────────────────────────────────────────────
// Full fetch via the YouTube Data API v3 (ALL videos, paginated).
// ────────────────────────────────────────────────────────────
// The RSS feed above only ever returns the latest 15 uploads — a
// hard YouTube limit, so older tutorials silently drop off. When a
// YOUTUBE_API_KEY is set we instead page through the channel's
// "uploads" playlist and return every video. Falls back to RSS
// (latest 15) when no key is configured.
//
// Setup: enable "YouTube Data API v3" in Google Cloud, create an
// API key, set YOUTUBE_API_KEY in the environment.
// ────────────────────────────────────────────────────────────
export async function fetchAllChannelVideos(
  channelId: string,
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  // A channel's uploads playlist id is the channel id with the
  // leading "UC" swapped for "UU".
  if (!apiKey || !channelId.startsWith("UC")) {
    return fetchChannelVideos(channelId);
  }
  const uploadsId = "UU" + channelId.slice(2);
  const out: YouTubeVideo[] = [];
  let pageToken = "";

  try {
    // Safety cap: 20 pages × 50 = up to 1000 videos.
    for (let i = 0; i < 20; i++) {
      const url =
        `https://www.googleapis.com/youtube/v3/playlistItems` +
        `?part=snippet&maxResults=50&playlistId=${encodeURIComponent(uploadsId)}` +
        (pageToken ? `&pageToken=${pageToken}` : "") +
        `&key=${apiKey}`;
      const res = await fetch(url, { next: { revalidate: CACHE_SECONDS } });
      if (!res.ok) break;
      const data = await res.json();
      for (const item of data.items ?? []) {
        const s = item?.snippet ?? {};
        const id = s?.resourceId?.videoId;
        if (!id) continue;
        out.push({
          id,
          title: s.title ?? "",
          description: s.description ?? "",
          publishedAt: s.publishedAt ?? "",
          url: `https://www.youtube.com/watch?v=${id}`,
        });
      }
      pageToken = data?.nextPageToken ?? "";
      if (!pageToken) break;
    }
  } catch {
    // Network / quota error → fall back to whatever RSS gives.
    if (out.length === 0) return fetchChannelVideos(channelId);
  }

  if (out.length === 0) return fetchChannelVideos(channelId);
  return out.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

function parseChannelXml(xml: string): YouTubeVideo[] {
  const entries = xml.split(/<entry>/).slice(1); // first chunk is channel meta
  const videos: YouTubeVideo[] = [];

  for (const raw of entries) {
    const entry = raw.split("</entry>")[0] ?? "";

    const id = pick(entry, /<yt:videoId>([^<]+)<\/yt:videoId>/);
    if (!id) continue;

    const title = decodeXml(pick(entry, /<title>([^<]*)<\/title>/));
    const description = decodeXml(
      pick(entry, /<media:description>([\s\S]*?)<\/media:description>/),
    );
    const publishedAt = pick(entry, /<published>([^<]+)<\/published>/);

    videos.push({
      id,
      title,
      description,
      publishedAt,
      url: `https://www.youtube.com/watch?v=${id}`,
    });
  }

  // Newest first (RSS is already in that order but sort defensively).
  return videos.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

function pick(haystack: string, re: RegExp): string {
  const m = haystack.match(re);
  return m ? m[1].trim() : "";
}

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// ────────────────────────────────────────────────────────────
// Auto-categorization
// ────────────────────────────────────────────────────────────
// Looks at the video title + description and decides which
// AgentForge product it belongs to. Add new keywords as new
// agents launch.
//
// Override any single video by passing { [videoId]: category }
// to categorizeVideo / groupVideosByAgent.
// ────────────────────────────────────────────────────────────

const KEYWORDS: Record<Exclude<AgentCategory, "other">, RegExp> = {
  jewellery:
    /\b(jewell?er(y|ies)|necklace|earring|ring|bracelet|pendant|mangalsutra|bangle|kada|payal|tikka|kundan|polki|diamond|gold(?!en hour)|silver|bridal\s*set|nose\s*pin)\b/i,
  textile:
    /\b(textile|saree|sari|kurti|kurta|lehenga|sherwani|fabric|cloth(es|ing)?|fashion|kidswear|kid'?s\s*wear|shirt|t-shirt|tshirt|blouse|curtain|home\s*textile|drape|bed\s*sheet|men'?s\s*wear|women'?s\s*wear|knitwear)\b/i,
  productography:
    /\b(productography|product\s*(shot|photo|photography|mockup|presentation|catalogue|catalog)|packshot|skincare|cosmetic|gadget|electronic|fmcg|d2c|watch|smartwatch|footwear|shoe|sneaker|sunglass(es)?|eyewear|headphone|earphone|bottle|perfume|mug)\b/i,
};

export function categorizeVideo(
  video: YouTubeVideo,
  overrides?: Record<string, AgentCategory>,
): AgentCategory {
  // Manual override always wins.
  if (overrides && overrides[video.id]) return overrides[video.id];

  // 1. The TITLE is the most reliable signal — match it first so a
  //    boilerplate description (which often mentions "fashion" for
  //    every video) can't drag a Watch/Product tutorial into textile.
  const title = video.title;
  if (KEYWORDS.jewellery.test(title)) return "jewellery";
  if (KEYWORDS.textile.test(title)) return "textile";
  if (KEYWORDS.productography.test(title)) return "productography";

  // 2. Fall back to title + description.
  const text = `${video.title} ${video.description}`;
  if (KEYWORDS.jewellery.test(text)) return "jewellery";
  if (KEYWORDS.textile.test(text)) return "textile";
  if (KEYWORDS.productography.test(text)) return "productography";
  return "other";
}

export function groupVideosByAgent(
  videos: YouTubeVideo[],
  overrides?: Record<string, AgentCategory>,
): Record<AgentCategory, YouTubeVideo[]> {
  const groups: Record<AgentCategory, YouTubeVideo[]> = {
    jewellery: [],
    textile: [],
    productography: [],
    other: [],
  };
  for (const v of videos) {
    groups[categorizeVideo(v, overrides)].push(v);
  }
  return groups;
}
