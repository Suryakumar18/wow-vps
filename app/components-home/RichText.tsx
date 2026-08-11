/* eslint-disable @next/next/no-img-element */
"use client";

import { Fragment } from "react";
import { cn } from "./lib/cn";

/**
 * Light markup for long-form product details, shared by the admin editor's
 * live preview and the product page's Detailed Description tab.
 *
 * One rule per line:
 *   `## Key Features`      → section heading (dark, prominent)
 *   `- 2-Speed Gearbox – crawl or cruise`
 *                          → bullet; text before the first "–" or ":" is
 *                            bolded ("1:10"-style ratios are left alone)
 *   `**important**`        → bold anywhere inside a line
 *   `https://…/photo.jpg`  → the image, on its own line
 *   `[center] …` / `[right] …`
 *                          → aligns that line's heading, paragraph or image
 *   anything else          → paragraph
 *
 * Parsed into React elements — never `dangerouslySetInnerHTML` — so nothing
 * an admin pastes can inject markup or script into the storefront.
 */

export type RichAlign = "left" | "center" | "right";

export type RichBlock =
  | { type: "heading"; text: string; align: RichAlign }
  | { type: "paragraph"; text: string; align: RichAlign }
  | { type: "bullets"; items: string[] }
  | { type: "image"; url: string; align: RichAlign };

const ALIGN_PREFIX = /^\[(left|center|right)\]\s*/i;
const IMAGE_LINE = /^https?:\/\/\S+\.(?:png|jpe?g|webp|gif|avif)(?:\?\S*)?$/i;
const BULLET = /^(?:[-•*])\s+(.*)$/;
const HEADING = /^#{1,3}\s+(.*)$/;

export function parseRichBlocks(text: string): RichBlock[] {
  const blocks: RichBlock[] = [];

  for (const raw of text.split(/\r?\n/)) {
    let line = raw.trim();
    if (!line) continue;

    let align: RichAlign = "left";
    const alignMatch = line.match(ALIGN_PREFIX);
    if (alignMatch) {
      align = alignMatch[1].toLowerCase() as RichAlign;
      line = line.slice(alignMatch[0].length).trim();
      if (!line) continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      blocks.push({ type: "heading", text: heading[1].trim(), align });
      continue;
    }

    const bullet = line.match(BULLET);
    if (bullet) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "bullets") last.items.push(bullet[1].trim());
      else blocks.push({ type: "bullets", items: [bullet[1].trim()] });
      continue;
    }

    if (IMAGE_LINE.test(line)) {
      blocks.push({ type: "image", url: line, align });
      continue;
    }

    blocks.push({ type: "paragraph", text: line, align });
  }

  return blocks;
}

/** `**bold**` segments rendered as real <strong> elements. */
function InlineText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-ink">
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * "2-Speed Gearbox – crawl or cruise" → bold lead + rest. Applied only to
 * bullet items without explicit `**bold**` (explicit markup wins). Ratios
 * and times ("1:10", "7:30") are excluded: a digit on both sides of the
 * colon is data, not a label.
 */
function splitLead(text: string): { lead: string; sep: string; rest: string } | null {
  const match = text.match(/^(.{2,40}?)\s*(–|—|:|\s-\s)\s*(.+)$/);
  if (!match) return null;
  const lead = match[1].trim();
  if (/^https?:/i.test(lead)) return null;
  if (match[2] === ":" && /\d$/.test(match[1]) && /^\d/.test(match[3])) return null;
  return { lead, sep: match[2] === ":" ? ": " : " — ", rest: match[3].trim() };
}

function BulletText({ text }: { text: string }) {
  if (/\*\*/.test(text)) return <InlineText text={text} />;
  const split = splitLead(text);
  if (!split) return <>{text}</>;
  return (
    <>
      <strong className="font-semibold text-ink">{split.lead}</strong>
      {split.sep}
      {split.rest}
    </>
  );
}

const ALIGN_TEXT: Record<RichAlign, string> = {
  left: "",
  center: "text-center",
  right: "text-right",
};

export default function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = parseRichBlocks(text);
  if (blocks.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <h3
                key={i}
                className={cn(
                  "text-lead font-bold text-ink",
                  i > 0 && "mt-3",
                  ALIGN_TEXT[block.align],
                )}
              >
                <InlineText text={block.text} />
              </h3>
            );
          case "bullets":
            return (
              <ul
                key={i}
                className="flex list-disc flex-col gap-1.5 pl-5 text-micro leading-relaxed text-slate-600 marker:text-gold-500"
              >
                {block.items.map((item, j) => (
                  <li key={j}>
                    <BulletText text={item} />
                  </li>
                ))}
              </ul>
            );
          case "image":
            return (
              <img
                key={i}
                src={block.url}
                alt=""
                loading="lazy"
                className={cn(
                  "max-h-[32rem] max-w-full rounded-lg border border-line",
                  block.align === "center" && "mx-auto",
                  block.align === "right" && "ml-auto",
                )}
              />
            );
          default:
            return (
              <p
                key={i}
                className={cn(
                  "text-micro leading-relaxed text-slate-600",
                  ALIGN_TEXT[block.align],
                )}
              >
                <InlineText text={block.text} />
              </p>
            );
        }
      })}
    </div>
  );
}
