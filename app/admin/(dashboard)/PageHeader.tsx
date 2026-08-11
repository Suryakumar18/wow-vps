"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/app/components-home/lib/cn";

export interface Crumb {
  label: string;
  /** Omit on the final crumb — the current page isn't a link to itself. */
  href?: string;
}

/** Clickable trail back up the hierarchy. The last crumb is the current page. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-nano text-slate-500">
        {items.map((crumb, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="rounded transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={cn(isLast && "text-ink")}>
                  {crumb.label}
                </span>
              )}
              {!isLast && <ChevronRight size={12} aria-hidden="true" className="text-slate-300" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Re-runs the server components for the current route. */
export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // `router.refresh()` resolves before paint, so a bare transition flickers.
  const [spinning, setSpinning] = useState(false);

  const refresh = () => {
    setSpinning(true);
    startTransition(() => router.refresh());
    setTimeout(() => setSpinning(false), 600);
  };

  return (
    <button
      type="button"
      onClick={refresh}
      disabled={pending}
      aria-label="Refresh this page"
      title="Refresh"
      className="grid h-control-sm w-control-sm shrink-0 place-items-center rounded-md border border-navy-800/20 text-navy-900 transition-colors hover:border-navy-800/40 hover:bg-navy-800/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-800 disabled:opacity-60"
    >
      <RefreshCw size={15} aria-hidden="true" className={cn(spinning && "animate-spin")} />
    </button>
  );
}

/**
 * The header every admin page opens with: breadcrumb and back button on the
 * left, actions on the right.
 *
 * `backHref` is preferred over `router.back()` — browser history can point
 * anywhere (an external referrer, a deleted record), whereas the parent
 * listing is always a sensible destination.
 */
export default function AdminPageHeader({
  breadcrumb,
  title,
  description,
  backHref,
  actions,
  showRefresh = true,
}: {
  breadcrumb: Crumb[];
  title: string;
  description?: string;
  backHref?: string;
  actions?: React.ReactNode;
  showRefresh?: boolean;
}) {
  return (
    <header className="mb-6">
      <Breadcrumb items={breadcrumb} />

      <div className="mt-2 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-start gap-3">
          {backHref && (
            <Link
              href={backHref}
              aria-label="Go back"
              className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line text-ink transition-colors hover:border-gold-300 hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="text-section font-bold text-ink">{title}</h1>
            {description && <p className="mt-1 text-micro text-slate-500">{description}</p>}
          </div>
        </div>

        {(actions || showRefresh) && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
            {showRefresh && <RefreshButton />}
          </div>
        )}
      </div>
    </header>
  );
}
