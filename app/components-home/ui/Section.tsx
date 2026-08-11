import Container from "./Container";
import { cn } from "../lib/cn";

/**
 * Standard page section: fluid top spacing (48 → 120px) plus the shared
 * container. Every homepage block goes through this so the vertical rhythm is
 * defined in exactly one place rather than as per-section padding utilities.
 *
 * Pass `flush` for blocks that manage their own top spacing (the hero).
 */
export default function Section({
  label,
  labelledBy,
  flush = false,
  className,
  innerClassName,
  children,
}: {
  /** aria-label for sections without a visible heading. */
  label?: string;
  /** id of the visible heading, for sections that have one. */
  labelledBy?: string;
  flush?: boolean;
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={label}
      aria-labelledby={labelledBy}
      className={cn(flush ? "pt-4 sm:pt-5" : "pt-section", className)}
    >
      <Container className={innerClassName}>{children}</Container>
    </section>
  );
}
