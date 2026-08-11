import { cn } from "../lib/cn";

export type BadgeTone = "discount" | "gold" | "navy" | "count";

const TONES: Record<BadgeTone, string> = {
  discount: "bg-[#E23B3B] text-white",
  gold: "bg-gold-500 text-navy-900",
  navy: "bg-navy-800 text-white",
  count: "bg-gold-500 text-navy-900",
};

/**
 * Small pill used for discounts on product cards and for the cart item count.
 * `count` is a perfect circle so single digits stay centred.
 */
export default function Badge({
  tone = "discount",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-bold leading-none",
        tone === "count"
          ? "h-[15px] min-w-[15px] rounded-full px-1 text-nano"
          : "rounded px-1.5 py-[3px] text-nano tracking-wide",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
