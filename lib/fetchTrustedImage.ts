// ============================================================
// Download an image the SERVER is about to read — safely.
// ============================================================
// Several routes take an image URL from the request and fetch it
// (to send to a vision model). The server must never fetch an
// arbitrary address. This helper only fetches images WE host,
// checks every redirect hop, and caps the size and type.
// ============================================================

import { isAgentForgeHostedUrl } from "@/lib/uploadValidation";

export const MAX_ANALYSIS_IMAGE_BYTES = 20 * 1024 * 1024;

const IMAGE_MIME = /^image\/(png|jpe?g|webp|avif|gif)$/i;

export class UntrustedImageError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "UntrustedImageError";
    this.status = status;
  }
}

export async function fetchTrustedImage(
  url: unknown,
  maxBytes: number = MAX_ANALYSIS_IMAGE_BYTES,
): Promise<{ bytes: Uint8Array; mime: string; base64: string }> {
  // Follow at most 3 redirects by hand, checking every hop — a redirect
  // must never take the server to a host we do not own.
  let current = url;
  let res: Response | null = null;
  for (let hop = 0; hop < 4; hop += 1) {
    if (!isAgentForgeHostedUrl(current)) {
      throw new UntrustedImageError("image_url must be an image uploaded to AgentForge.");
    }
    const attempt = await fetch(current as string, {
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
    });
    if (attempt.status >= 300 && attempt.status < 400) {
      const next = attempt.headers.get("location");
      if (!next) throw new UntrustedImageError("Image fetch failed: bad redirect.", 502);
      current = new URL(next, current as string).toString();
      continue;
    }
    res = attempt;
    break;
  }
  if (!res) throw new UntrustedImageError("Image fetch failed: too many redirects.", 502);
  if (!res.ok) throw new UntrustedImageError(`Image fetch failed: ${res.status}`, 502);

  const mime = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!IMAGE_MIME.test(mime)) throw new UntrustedImageError("The file is not an image.");

  const declared = Number(res.headers.get("content-length") || 0);
  if (declared > maxBytes) throw new UntrustedImageError("Image is too large.", 413);

  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length === 0) throw new UntrustedImageError("Image is empty.");
  if (bytes.length > maxBytes) throw new UntrustedImageError("Image is too large.", 413);

  return { bytes, mime, base64: Buffer.from(bytes).toString("base64") };
}
