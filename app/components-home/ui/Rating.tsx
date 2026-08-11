import { Star } from "lucide-react";
import { cn } from "../lib/cn";

const GAP = 1;

function StarRow({ size, className }: { size: number; className: string }) {
  return (
    <span className={cn("flex", className)} style={{ gap: GAP }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} fill="currentColor" strokeWidth={0} />
      ))}
    </span>
  );
}

/**
 * Five-star rating with fractional fill (4.5 renders as four full stars plus a
 * half). A single gold row is clipped over a grey row — one positioned element
 * rather than one per star. The numeric value is exposed to screen readers.
 */
export default function Rating({
  value,
  reviews,
  size = 11,
  className,
}: {
  value: number;
  reviews?: number;
  size?: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(5, value));
  const width = size * 5 + GAP * 4;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span
        className="relative block shrink-0 overflow-hidden"
        style={{ width, height: size }}
        aria-hidden="true"
      >
        <StarRow size={size} className="text-gold-200" />
        <span
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${(clamped / 5) * 100}%` }}
        >
          <StarRow size={size} className="text-gold-500" />
        </span>
      </span>

      <span className="sr-only">{clamped} out of 5 stars</span>
      {reviews !== undefined && (
        <span className="text-nano leading-none text-slate-400">({reviews})</span>
      )}
    </div>
  );
}
