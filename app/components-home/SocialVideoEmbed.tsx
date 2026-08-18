"use client";

import { ExternalLink, Play } from "lucide-react";
import { PLATFORM_LABELS, type SocialPlatform } from "./lib/socialVideo";
import { cn } from "./lib/cn";

export interface SocialVideoItem {
  url: string;
  platform: SocialPlatform;
  embedUrl: string;
  title?: string;
}

/**
 * Aspect ratio per platform. YouTube and Facebook video are landscape;
 * Instagram's embed is a portrait card that includes the caption and action
 * row beneath the clip, so it needs a tall box or the frame scrolls
 * internally.
 */
const RATIO: Record<SocialPlatform, string> = {
  youtube: "aspect-video",
  facebook: "aspect-video",
  instagram: "aspect-[9/14]",
  x: "aspect-video",
};

const BRAND: Record<SocialPlatform, string> = {
  youtube: "text-[#FF0000]",
  instagram: "text-[#E1306C]",
  facebook: "text-[#1877F2]",
  x: "text-ink",
};

/**
 * One embedded social video.
 *
 * `loading="lazy"` matters here: a product with six embeds would otherwise
 * open six third-party connections before the shopper scrolls to the tab.
 *
 * X gets a link card rather than a frame — its official embed requires
 * widgets.js, and loading a third-party script on every product page to render
 * a video someone may never open is a poor trade. The card is honest about
 * where the link goes.
 */
export default function SocialVideoEmbed({ video }: { video: SocialVideoItem }) {
  const label = PLATFORM_LABELS[video.platform];

  if (!video.embedUrl) {
    return (
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 rounded-xl border border-line bg-mist p-4 transition-colors hover:border-gold-400 hover:bg-gold-50"
      >
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white shadow-sm",
            BRAND[video.platform],
          )}
        >
          <Play size={18} fill="currentColor" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-micro font-semibold text-ink">
            {video.title?.trim() || `Watch on ${label}`}
          </span>
          <span className="mt-0.5 block truncate text-nano text-slate-500">{video.url}</span>
        </span>
        <ExternalLink size={15} className="shrink-0 text-slate-400" aria-hidden="true" />
      </a>
    );
  }

  return (
    <figure className="min-w-0">
      <div className={cn("overflow-hidden rounded-xl border border-line bg-black", RATIO[video.platform])}>
        <iframe
          src={video.embedUrl}
          title={video.title?.trim() || `${label} video`}
          loading="lazy"
          // Instagram and Facebook embeds run their own scripts inside the
          // frame; the sandbox keeps them from reaching this page or opening
          // navigations the shopper did not ask for.
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
      <figcaption className="mt-2 flex items-center gap-1.5 text-nano text-slate-500">
        <span className={cn("font-semibold", BRAND[video.platform])}>{label}</span>
        {video.title?.trim() && <span className="truncate">— {video.title.trim()}</span>}
      </figcaption>
    </figure>
  );
}
