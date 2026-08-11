import { cn } from "@/app/components-home/lib/cn";

/**
 * Semantic status tones.
 *
 * Mapped onto the project's design tokens rather than an arbitrary palette:
 * gold is the brand's primary, and `#B91C1C`/`#0F7B3F` are the two hex values
 * the design system already sanctions for danger and success (both chosen for
 * WCAG-AA contrast at small sizes).
 */
export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const TONES: Record<StatusTone, string> = {
  success: "bg-[#0F7B3F]/10 text-[#0F7B3F]",
  warning: "bg-gold-50 text-gold-700",
  danger: "bg-[#B91C1C]/10 text-[#B91C1C]",
  info: "bg-navy-800/10 text-navy-800",
  neutral: "bg-mist text-slate-600",
};

/** Known statuses across the admin, so the same word never renders two ways. */
const KNOWN: Record<string, StatusTone> = {
  published: "success",
  active: "success",
  completed: "success",
  delivered: "success",
  paid: "success",

  draft: "neutral",
  inactive: "neutral",
  archived: "neutral",
  hidden: "neutral",

  pending: "warning",
  processing: "warning",
  "low stock": "warning",
  shipped: "info",
  featured: "warning",

  cancelled: "danger",
  refunded: "danger",
  "out of stock": "danger",
  failed: "danger",
};

export default function StatusBadge({
  status,
  tone,
  className,
}: {
  status: string;
  /** Overrides the label-derived tone when a status isn't in the known list. */
  tone?: StatusTone;
  className?: string;
}) {
  const resolved = tone ?? KNOWN[status.toLowerCase()] ?? "neutral";

  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-nano font-semibold capitalize",
        TONES[resolved],
        className,
      )}
    >
      {status}
    </span>
  );
}
