"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import Section from "./ui/Section";
import ProductCard from "./ProductCard";
import { popularPicks as defaultPicks, type Product } from "./data/home-content";
import { cn } from "./lib/cn";

/**
 * Cards visible per view: 2 mobile → 3 from 640 → 4 laptop/desktop → 5 on large
 * desktops. Each width subtracts exactly the gaps active at that breakpoint, so
 * a whole number of cards lands in the viewport with no sliver of another card
 * peeking in. The 3-up starts at `sm` rather than `md` because two cards across
 * a 640px screen would each be ~295px — wider than they ever are on desktop.
 */
const CARD_WIDTH = cn(
  "w-[calc((100%-0.625rem)/2)]",
  "sm:w-[calc((100%-1.5rem)/3)]",
  "lg:w-[calc((100%-2.625rem)/4)]",
  "2xl:w-[calc((100%-4rem)/5)]",
);

/** Gaps here must stay in step with the divisors in CARD_WIDTH. */
const TRACK_GAP = "gap-2.5 sm:gap-3 lg:gap-3.5 2xl:gap-4";

const ARROW_BASE =
  "grid h-control-xs w-control-xs place-items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600 disabled:cursor-default disabled:opacity-40";

export default function PopularPicks({
  className,
  products = defaultPicks,
}: {
  className?: string;
  products?: Product[];
}) {
  const popularPicks = products;
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  // Observe the track itself: the arrows also go stale when the row reflows
  // without a window resize (font swap, image load, breakpoint change).
  useEffect(() => {
    syncArrows();
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(syncArrows);
    observer.observe(el);
    return () => observer.disconnect();
  }, [syncArrows]);

  const scrollByPage = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <Section labelledBy="popular-picks-heading" className={className}>
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Zap
            size={18}
            className="shrink-0 text-gold-500"
            fill="currentColor"
            strokeWidth={1}
            aria-hidden="true"
          />
          <div>
            <h2 id="popular-picks-heading" className="text-promo font-bold text-ink">
              Popular Picks
            </h2>
            <p className="mt-0.5 text-micro text-slate-500">
              Handpicked favourites from our collection
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={atStart}
            aria-label="Show previous products"
            className={cn(
              ARROW_BASE,
              "border border-line bg-white text-slate-500 hover:border-gold-400 hover:text-gold-600",
            )}
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={atEnd}
            aria-label="Show next products"
            className={cn(ARROW_BASE, "bg-navy-800 text-white hover:bg-navy-700")}
          >
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      <ul
        ref={trackRef}
        onScroll={syncArrows}
        className={cn(
          "mt-heading flex snap-x snap-mandatory overflow-x-auto pb-1",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          TRACK_GAP,
        )}
      >
        {popularPicks.map((product) => (
          <li key={product.id} className={cn("shrink-0 snap-start", CARD_WIDTH)}>
            <ProductCard
              product={product}
              sizes="(min-width: 1536px) 18vw, (min-width: 1024px) 23vw, (min-width: 640px) 31vw, 48vw"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
