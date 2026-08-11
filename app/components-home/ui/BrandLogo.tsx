import Link from "next/link";
import { brand } from "../data/home-content";
import { cn } from "../lib/cn";

/** The gold angular W monogram. Swap this SVG for the final brand asset. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-hidden="true" className={cn("text-gold-500", className)}>
      <path
        d="M6 8 L17.5 8 L23.5 40.5 L30.5 8 L36.5 8 L43.5 40.5 L49.5 8 L61 8 L50 56 L40 56 L33.5 26 L27 56 L17 56 Z"
        fill="currentColor"
      />
      <path d="M6 8 L17.5 8 L23.5 40.5 L18 56 Z" fill="currentColor" fillOpacity="0.72" />
    </svg>
  );
}

/**
 * Full lockup: monogram + wordmark + location + tagline. `compact` drops the
 * tagline for tight spots such as the mobile header.
 */
export default function BrandLogo({
  href = "/",
  compact = false,
  inverted = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  inverted?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      // `min-w-0` rather than `shrink-0`: on a 320px screen the mark plus the
      // wordmark plus two 44px tap targets exceed the row, and an unshrinkable
      // lockup pushed the cart button off the edge. The wordmark truncates
      // instead — the mark itself never shrinks.
      className={cn("group flex min-w-0 items-center gap-u-2.5", className)}
      aria-label={`${brand.name} ${brand.location} — home`}
    >
      <BrandMark className={cn("shrink-0", compact ? "h-8 w-8" : "h-10 w-10 lg:h-11 lg:w-11")} />
      <span className="flex min-w-0 flex-col justify-center leading-none">
        <span
          className={cn(
            "truncate font-bold leading-none tracking-[0.01em]",
            compact ? "text-nav-ui" : "text-nav-lead lg:text-nav-lead",
            inverted ? "text-white" : "text-ink",
          )}
        >
          {brand.name}
        </span>
        <span
          className={cn(
            "mt-[2.835px] truncate text-[8.98px] font-medium leading-none tracking-[0.24em]",
            inverted ? "text-white/60" : "text-slate-500",
          )}
        >
          {brand.location}
        </span>
        {!compact && (
          <span className="mt-[3.78px] font-script text-nav-nano italic leading-none text-gold-600">
            {brand.tagline}
          </span>
        )}
      </span>
    </Link>
  );
}
