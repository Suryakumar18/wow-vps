"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import Section from "./ui/Section";
import Button from "./ui/Button";
import Icon, { type IconName } from "./ui/Icon";
import { heroSlides as defaultSlides, heroTrust, type HeroSlide } from "./data/home-content";
import { cn } from "./lib/cn";

const ROTATE_MS = 6000;

/**
 * Hero carousel.
 *
 * Layout differs by intent rather than by scaling one arrangement:
 *  - Under `lg` the banner stacks — copy first, then the photograph in its own
 *    16:10 block. Nothing sits on top of the image, so the subject is never
 *    cropped behind text and the copy stays fully legible.
 *  - From `lg` the photograph is absolutely positioned against the right edge
 *    and the copy floats over a cream gradient, as approved.
 *
 * Height is viewport-proportional on desktop (~62vh) but clamped at both ends
 * so it never becomes a letterbox on a short laptop or a full-screen takeover
 * on a tall monitor.
 */
export default function HeroBanner({ slides = defaultSlides }: { slides?: HeroSlide[] }) {
  const heroSlides = slides;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (paused || reducedMotion.current || heroSlides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % heroSlides.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [paused]);

  const goTo = useCallback((i: number) => setIndex(i), []);
  const slide = heroSlides[index];

  return (
    <Section flush label="Featured collections">
      <div
        aria-roledescription="carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        className="relative isolate block min-h-[15.5rem] overflow-hidden rounded-xl bg-cream-100 sm:min-h-[17rem] lg:min-h-hero"
      >
        {/* Copy sits over the photograph at every size, matching the approved
            mobile design — the cream wash below keeps our ink type legible
            rather than switching to white-on-dark. */}
        <div className="relative z-10 flex min-h-[15.5rem] max-w-[86%] flex-col justify-center px-5 py-6 sm:min-h-[17rem] sm:max-w-[70%] sm:px-8 sm:py-9 lg:min-h-hero lg:max-w-[54%] lg:px-panel lg:py-9 2xl:max-w-[52%]">
          <p className="text-nano font-bold uppercase tracking-[0.2em] text-gold-600">
            {slide.eyebrow}
          </p>

          <h1 className="mt-3 text-hero font-bold text-ink">
            {slide.titleLines[0]}
            <br />
            {slide.titleLines[1]}
          </h1>

          <p className="mt-3 max-w-[46ch] text-lead text-slate-600">{slide.description}</p>

          {/* Two tidy columns on phones instead of a ragged wrap, which keeps the
              stacked hero close to a single screen. */}
          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:flex sm:flex-wrap sm:gap-x-7 sm:gap-y-3">
            {heroTrust.map((t) => (
              <li key={t.label} className="flex items-center gap-2">
                <span className="grid h-control-xs w-control-xs shrink-0 place-items-center rounded-full border border-gold-300 bg-white/60 text-gold-600">
                  <Icon name={t.icon as IconName} size={12} strokeWidth={2} />
                </span>
                <span className="max-w-[7.5ch] text-nano font-semibold leading-[1.25] text-ink">
                  {t.label}
                </span>
              </li>
            ))}
          </ul>

          <Button href={slide.ctaHref} size="md" className="mt-5 self-start lg:mt-6">
            {slide.ctaLabel}
            <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>

        {/* Photography fills the card on mobile and bleeds off the right edge
            from `lg`, where the copy column takes the left half. */}
        <div className="absolute inset-y-0 right-0 -z-10 w-full lg:z-auto lg:w-[58%] xl:w-[60%]">
          {heroSlides.map((s, i) => (
            <Image
              key={s.src}
              src={s.src}
              alt={i === index ? s.alt : ""}
              aria-hidden={i !== index}
              fill
              priority={i === 0}
              loading={i === 0 ? undefined : "lazy"}
              sizes="(min-width: 1024px) 60vw, 100vw"
              className={cn(
                "object-cover object-center transition-opacity duration-700 ease-out",
                i === index ? "opacity-100" : "opacity-0",
              )}
            />
          ))}
          {/* Cream wash under the copy. Heavier on mobile, where the text spans
              most of the card; a soft left-to-right fade on desktop. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-cream-100 via-cream-100/90 to-cream-100/45 lg:via-cream-100/60 lg:to-transparent"
          />

          <p
            aria-hidden="true"
            className="absolute right-[clamp(0.9rem,2.25vw,2.25rem)] top-1/2 hidden -translate-y-1/2 flex-col items-center font-script leading-[1.12] text-white drop-shadow-[0_2px_8px_rgba(16,33,53,0.45)] md:flex md:text-[clamp(1.575rem,2.16vw,2.7rem)]"
          >
            {slide.script.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-3.5 z-10 flex justify-center gap-1.5">
          {heroSlides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show slide ${i + 1} of ${heroSlides.length}`}
              aria-current={i === index}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600",
                i === index ? "w-5 bg-gold-500" : "w-1.5 bg-gold-500/40 hover:bg-gold-500/70",
              )}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
