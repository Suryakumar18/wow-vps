import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * The gold rule + uppercase kicker used above "Discover What Excites You" and
 * "More Joy. More Discovery.".
 */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-2.5", className)}>
      <span aria-hidden="true" className="h-px w-6 bg-gold-500" />
      <span className="text-nano font-bold uppercase tracking-[0.16em] text-gold-600">
        {children}
      </span>
    </p>
  );
}

/**
 * Section header block: kicker, title, optional subtitle, and an optional
 * right-aligned "View all" link that drops below the title on small screens.
 */
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-end justify-between gap-4 lg:gap-6", className)}
    >
      {/* Mobile keeps the heading row compact — the kicker and the supporting
          sentence are desktop-only, as in the approved mobile design. */}
      <div className="min-w-0">
        {eyebrow && <Eyebrow className="mb-2.5 hidden lg:flex">{eyebrow}</Eyebrow>}
        <h2 className="text-promo font-bold text-ink lg:text-section">{title}</h2>
        {subtitle && (
          <p className="mt-1.5 hidden max-w-[70ch] text-micro text-slate-500 lg:block">{subtitle}</p>
        )}
      </div>

      {action && (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-1.5 text-micro font-semibold text-gold-600 transition-colors hover:text-gold-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
        >
          {action.label}
          <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
