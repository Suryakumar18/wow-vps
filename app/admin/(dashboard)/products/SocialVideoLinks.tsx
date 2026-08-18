"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, CheckCircle2, AlertCircle } from "lucide-react";
import {
  parseSocialVideo,
  PLATFORM_LABELS,
  type SocialPlatform,
} from "@/app/components-home/lib/socialVideo";
import SocialVideoEmbed from "@/app/components-home/SocialVideoEmbed";

export interface SocialVideoValue {
  url: string;
  title: string;
}

/**
 * Editor for a product's social-media video links.
 *
 * Validates as you type and shows a live embed of anything it recognises, so a
 * wrong or private link is caught here rather than appearing as an empty box on
 * the storefront. Only the raw url and title are stored in form state —
 * platform and embed address are derived server-side on save, so the browser
 * cannot dictate what gets framed.
 */
export default function SocialVideoLinks({
  values,
  onChange,
}: {
  values: SocialVideoValue[];
  onChange: (next: SocialVideoValue[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [draftTitle, setDraftTitle] = useState("");

  const parsedDraft = draft.trim() ? parseSocialVideo(draft) : null;
  const draftInvalid = draft.trim().length > 0 && !parsedDraft;

  const add = () => {
    if (!parsedDraft) return;
    onChange([...values, { url: draft.trim(), title: draftTitle.trim() }]);
    setDraft("");
    setDraftTitle("");
  };

  const move = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= values.length) return;
    const next = [...values];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const update = (i: number, patch: Partial<SocialVideoValue>) =>
    onChange(values.map((v, k) => (k === i ? { ...v, ...patch } : v)));

  return (
    <div className="flex flex-col gap-3">
      {values.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {values.map((v, i) => {
            const parsed = parseSocialVideo(v.url);
            return (
              <li
                key={`${v.url}-${i}`}
                className="flex items-start gap-3 rounded-lg border border-line bg-white p-3"
              >
                <span className="mt-1 w-24 shrink-0 text-nano font-semibold text-slate-500">
                  {parsed ? PLATFORM_LABELS[parsed.platform as SocialPlatform] : "Unrecognised"}
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    value={v.url}
                    onChange={(e) => update(i, { url: e.target.value })}
                    className="w-full rounded border border-line px-2.5 py-1.5 text-nano text-ink outline-none focus:border-gold-400"
                  />
                  <input
                    value={v.title}
                    onChange={(e) => update(i, { title: e.target.value })}
                    placeholder="Caption (optional)"
                    className="w-full rounded border border-line px-2.5 py-1.5 text-nano text-slate-600 outline-none focus:border-gold-400"
                  />
                  {!parsed && (
                    <p className="flex items-center gap-1.5 text-nano font-medium text-red-600">
                      <AlertCircle size={13} aria-hidden="true" />
                      Not a YouTube, Instagram, Facebook or X link — it will be skipped on save.
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="rounded p-1 text-slate-400 hover:bg-mist hover:text-ink disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === values.length - 1}
                    aria-label="Move down"
                    className="rounded p-1 text-slate-400 hover:bg-mist hover:text-ink disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(values.filter((_, k) => k !== i))}
                    aria-label="Remove"
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="rounded-lg border border-dashed border-line p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Paste a YouTube, Instagram, Facebook or X video link"
            className="min-w-0 flex-1 rounded border border-line px-3 py-2 text-nano text-ink outline-none focus:border-gold-400"
          />
          <input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="Caption (optional)"
            className="w-full rounded border border-line px-3 py-2 text-nano text-ink outline-none focus:border-gold-400 sm:w-52"
          />
          <button
            type="button"
            onClick={add}
            disabled={!parsedDraft}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded bg-navy-900 px-3.5 py-2 text-nano font-semibold text-white transition-opacity disabled:opacity-40"
          >
            <Plus size={14} aria-hidden="true" />
            Add
          </button>
        </div>

        {draftInvalid && (
          <p className="mt-2 flex items-center gap-1.5 text-nano font-medium text-red-600">
            <AlertCircle size={13} aria-hidden="true" />
            Not recognised. Supported: youtube.com / youtu.be (including Shorts), instagram.com
            posts and reels, facebook.com and fb.watch, x.com and twitter.com.
          </p>
        )}

        {parsedDraft && (
          <div className="mt-3">
            <p className="mb-2 flex items-center gap-1.5 text-nano font-medium text-[#0F7B3F]">
              <CheckCircle2 size={13} aria-hidden="true" />
              {PLATFORM_LABELS[parsedDraft.platform]} link recognised — preview:
            </p>
            <div className="max-w-sm">
              <SocialVideoEmbed
                video={{
                  url: parsedDraft.url,
                  platform: parsedDraft.platform,
                  embedUrl: parsedDraft.embedUrl,
                  title: draftTitle,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <p className="text-nano leading-relaxed text-slate-500">
        These appear in a <span className="font-medium text-ink">Videos</span> tab on the product
        page, between the detailed description and the reviews. They are separate from{" "}
        <span className="font-medium text-ink">Product videos</span> above, which are files uploaded
        to our own server and play in the image gallery. You can also drop any of these links on
        their own line inside the detailed description to embed it there.
      </p>
    </div>
  );
}
