import { cn } from "@/app/components-home/lib/cn";

/**
 * Loading placeholders for the admin panel.
 *
 * These mirror the real layout closely enough that content doesn't jump when
 * it arrives — the point is to hold the shape, not to decorate the wait.
 *
 * The sweep is a CSS animation rather than a JS one so it still runs when the
 * tab is backgrounded and rAF is throttled.
 */
export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded bg-mist",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent",
        className,
      )}
    />
  );
}

export function PageHeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <Shimmer className="h-7 w-40" />
        <Shimmer className="mt-2 h-3.5 w-56" />
      </div>
      {withAction && <Shimmer className="h-control-sm w-28 rounded-md" />}
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex gap-4 border-b border-line px-4 py-3">
        {Array.from({ length: columns }, (_, i) => (
          <Shimmer key={i} className={cn("h-3", i === 0 ? "w-40" : "w-20")} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-line px-4 py-4 last:border-b-0">
          {Array.from({ length: columns }, (_, c) => (
            <Shimmer key={c} className={cn("h-3.5", c === 0 ? "w-48" : "w-16")} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="rounded-xl border border-line bg-white p-5">
          <Shimmer className="h-2.5 w-16" />
          <Shimmer className="mt-3 h-7 w-20" />
        </li>
      ))}
    </ul>
  );
}

/** A titled card with a grid of fields inside — the shape of every editor. */
export function FormCardSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="rounded-xl border border-line bg-white">
      <div className="flex items-start gap-3 border-b border-line p-5">
        <Shimmer className="h-9 w-9 rounded-lg" />
        <div className="min-w-0 flex-1">
          <Shimmer className="h-4 w-32" />
          <Shimmer className="mt-2 h-3 w-64 max-w-full" />
        </div>
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-2">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i}>
            <Shimmer className="h-3 w-24" />
            <Shimmer className="mt-1.5 h-11 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TabsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mb-6 flex gap-1 border-b border-line">
      {Array.from({ length: count }, (_, i) => (
        <Shimmer key={i} className="h-11 w-28 rounded-none" />
      ))}
    </div>
  );
}
