/**
 * Turns a pasted social-media link into something the storefront can embed.
 *
 * Shared by the admin editor (to validate and preview as you type) and the
 * server (to derive `platform`/`embedUrl` once, at write time). Deriving it on
 * write rather than on render means the storefront never parses a URL, and a
 * malformed link is caught by the person pasting it instead of by a shopper.
 *
 * No network calls: every platform here can be embedded from the URL alone, so
 * oEmbed round trips are unnecessary.
 */

export type SocialPlatform = "youtube" | "instagram" | "facebook" | "x";

export interface ParsedSocialVideo {
  platform: SocialPlatform;
  /** iframe src, or "" when the platform cannot be framed (X). */
  embedUrl: string;
  /** The canonical link, used for the "watch on…" fallback card. */
  url: string;
}

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X (Twitter)",
};

/**
 * YouTube ids appear in four shapes: watch?v=, youtu.be/, /shorts/ and
 * /embed/. Shorts matter here — a lot of product clips are filmed vertically
 * and posted as Shorts, and they embed through the same /embed/ path.
 */
function youtubeId(u: URL): string | null {
  const host = u.hostname.replace(/^www\./, "");
  if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
  if (!/(^|\.)youtube(-nocookie)?\.com$/.test(host)) return null;

  const v = u.searchParams.get("v");
  if (v) return v;

  const m = u.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/);
  return m ? m[1] : null;
}

/** Instagram posts, reels and TV all embed via `/{kind}/{code}/embed`. */
function instagramPath(u: URL): string | null {
  const m = u.pathname.match(/^\/(p|reel|reels|tv)\/([^/?#]+)/);
  if (!m) return null;
  // "reels" is the plural browse URL; the embeddable form is singular.
  const kind = m[1] === "reels" ? "reel" : m[1];
  return `${kind}/${m[2]}`;
}

export function parseSocialVideo(raw: string): ParsedSocialVideo | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;

  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  const yt = youtubeId(u);
  if (yt) {
    // youtube-nocookie: no tracking cookie is set unless the shopper presses
    // play, which keeps a product page from dropping third-party cookies on
    // every view.
    return {
      platform: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}`,
      url: `https://www.youtube.com/watch?v=${yt}`,
    };
  }

  if (host === "instagram.com" || host.endsWith(".instagram.com")) {
    const path = instagramPath(u);
    if (!path) return null;
    return {
      platform: "instagram",
      embedUrl: `https://www.instagram.com/${path}/embed`,
      url: `https://www.instagram.com/${path}/`,
    };
  }

  if (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.watch") {
    // fb.watch short links can't be resolved without a network call, and
    // Facebook's video plugin accepts the short form, so it is passed through.
    return {
      platform: "facebook",
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
        u.toString(),
      )}&show_text=false`,
      url: u.toString(),
    };
  }

  if (host === "twitter.com" || host === "x.com" || host.endsWith(".x.com")) {
    // X has no iframe embed — its official embed needs widgets.js, a
    // third-party script we deliberately don't load on the storefront. The
    // empty embedUrl tells the renderer to show a link card instead.
    return { platform: "x", embedUrl: "", url: u.toString() };
  }

  return null;
}

/** True when a URL is a social video link this app knows how to handle. */
export const isSocialVideoUrl = (url: string): boolean => parseSocialVideo(url) !== null;
