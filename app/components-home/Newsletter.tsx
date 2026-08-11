"use client";

import { useId, useState } from "react";
import { Crown } from "lucide-react";
import Section from "./ui/Section";
import { BrandMark } from "./ui/BrandLogo";
import { newsletter as defaultNewsletter } from "./data/home-content";

type NewsletterContent = {
  title: string;
  description: string;
  placeholder: string;
  ctaLabel: string;
  asideLines: readonly [string, string];
};

/**
 * WOW Club signup strip. Submission is handled client-side for now — swap the
 * `onSubmit` body for the real subscribe endpoint when it exists.
 *
 * The three groups sit on one row from `lg`; below that they stack in reading
 * order (pitch → form) and the "Play More. Save More." aside drops away rather
 * than squeezing the form.
 */
export default function Newsletter({
  className,
  content = defaultNewsletter,
}: {
  className?: string;
  content?: NewsletterContent;
}) {
  const newsletter = content;
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <Section labelledBy="newsletter-heading" className={className}>
      <div className="relative isolate overflow-hidden rounded-xl bg-navy-800 px-panel py-4">
        <BrandMark className="pointer-events-none absolute -right-2 top-1/2 hidden h-[6.3rem] w-[6.3rem] -translate-y-1/2 text-white/[0.05] lg:block" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex items-center gap-3.5">
            <span className="grid h-control-md w-control-md shrink-0 place-items-center rounded-full bg-gold-500 text-navy-900">
              <Crown size={16} aria-hidden="true" />
            </span>
            <div>
              <h2 id="newsletter-heading" className="text-ui font-bold leading-tight text-white">
                {newsletter.title}
              </h2>
              <p className="mt-1 text-nano leading-[1.45] text-white/60">
                {newsletter.description.split("\n").map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </div>
          </div>

          <form
            className="flex h-control-md w-full max-w-[23.4rem] items-stretch lg:w-auto lg:max-w-none"
            onSubmit={(e) => {
              e.preventDefault();
              setDone(true);
              setEmail("");
            }}
          >
            <label htmlFor={inputId} className="sr-only">
              Email address
            </label>
            <input
              id={inputId}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={newsletter.placeholder}
              className="min-w-0 flex-1 rounded-l-md border border-r-0 border-white/15 bg-white px-3.5 text-micro text-ink outline-none placeholder:text-slate-400 focus:border-gold-500 lg:w-[clamp(11.7rem,14.4vw,18rem)] lg:flex-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-r-md bg-gold-500 px-5 text-micro font-semibold text-navy-900 transition-colors hover:bg-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
            >
              {newsletter.ctaLabel}
            </button>
          </form>

          <p aria-live="polite" className="sr-only">
            {done ? "Thanks for joining the WOW Club." : ""}
          </p>

          <p className="hidden text-right text-ui font-bold leading-tight text-white lg:block">
            {newsletter.asideLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        </div>
      </div>
    </Section>
  );
}
