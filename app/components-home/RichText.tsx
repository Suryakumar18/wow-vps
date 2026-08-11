/* eslint-disable @next/next/no-img-element */
"use client";

import { cn } from "./lib/cn";

/**
 * Light markup for long-form product details, shared by the admin editor's
 * live preview and the product page.
 *
 * One rule per line:
 *   `## Key Features`   → section heading
 *   `- 2-Speed Gearbox – crawl or cruise`
 *                       → bullet; text before the first "–" or ":" is bolded
 *   `https://…/photo.jpg` (a bare image URL)
 *                       → full-width image
 *   anything else       → paragraph (same bold-lead rule as bullets, so
 *                          pasted "Brand: FMS" spec lines read like the
 *                          reference sites without any extra syntax)
 *
 * Parsed into React elements — never `dangerouslySetInnerHTML` — so nothing
 * an admin pastes can inject markup or script into the storefront.
 */

export type RichBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "image"; url: string };

const IMAGE_LINE = /^https?:\/\/\S+\.(?:png|jpe?g|webp|gif|avif)(?:\?\S*)?$/i;
const BULLET = /^(?:[-•*])\s+(.*)$/;
const HEADING = /^#{1,3}\s+(.*)$/;

export function parseRichBlocks(text: string): RichBlock[] {
  const blocks: RichBlock[] = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const heading = line.match(HEADING);
    if (heading) {
      blocks.push({ type: "heading", text: heading[1].trim() });
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
      blocks.push({ type: "image", url: line });
      continue;
    }

    blocks.push({ type: "paragraph", text: line });
  }

  return blocks;
}

/**
 * "2-Speed Gearbox – crawl or cruise" → bold lead + rest. Applied only to
 * bullet items — prose paragraphs stay untouched so a sentence mentioning
 * "1:10 scale" is never half-bolded. Ratios and times ("1:10", "7:30") are
 * excluded explicitly: a digit on both sides of the colon is data, not a
 * label.
 */
function splitLead(text: string): { lead: string; sep: string; rest: string } | null {
  const match = text.match(/^(.{2,40}?)\s*(–|—|:|\s-\s)\s*(.+)$/);
  if (!match) return null;
  const lead = match[1].trim();
  if (/^https?:/i.test(lead)) return null;
  if (match[2] === ":" && /\d$/.test(match[1]) && /^\d/.test(match[3])) return null;
  return { lead, sep: match[2] === ":" ? ": " : " — ", rest: match[3].trim() };
}

function LeadText({ text }: { text: string }) {
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

export default function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = parseRichBlocks(text);
  if (blocks.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <h3 key={i} className={cn("text-ui font-bold text-ink", i > 0 && "mt-2")}>
                {block.text}
              </h3>
            );
          case "bullets":
            return (
              <ul key={i} className="flex list-disc flex-col gap-1.5 pl-5 text-micro leading-relaxed text-slate-600 marker:text-gold-500">
                {block.items.map((item, j) => (
                  <li key={j}>
                    <LeadText text={item} />
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
                className="w-full rounded-lg border border-line"
              />
            );
          default:
            return (
              <p key={i} className="text-micro leading-relaxed text-slate-600">
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
}
