import { cn } from "@/app/components-home/lib/cn";

/**
 * Wraps a table so wide content scrolls inside the card instead of the page.
 *
 * `min-w-0` matters: as a flex/grid child this element would otherwise inherit
 * `min-width: auto` and refuse to shrink below the table's `min-w-[44rem]`,
 * pushing the whole page into horizontal scroll on a phone.
 */
export function TableCard({
  children,
  footer,
}: {
  children: React.ReactNode;
  /** Pagination sits outside the scroll area so it stays put horizontally. */
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-white">
      <div className="min-w-0 max-h-[calc(100vh-22rem)] overflow-auto">
        <table className="w-full min-w-[44rem] border-collapse text-left">{children}</table>
      </div>
      {footer}
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        // Sticky so column names stay readable through a long list.
        "sticky top-0 z-10 border-b border-line bg-white px-4 py-3 text-nano font-bold uppercase tracking-[0.14em] text-slate-500",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("border-b border-line px-4 py-3 text-micro text-ink", className)}>{children}</td>;
}

/** A table row with the standard hover and alternating background. */
export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={cn("transition-colors even:bg-mist/40 hover:bg-mist", className)}>{children}</tr>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-micro text-slate-500">
        {children}
      </td>
    </tr>
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-micro font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

const CONTROL =
  "h-11 w-full rounded-lg border border-line bg-white px-3.5 text-micro text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-gold-500";

// `className` is merged rather than replaced — an overwriting version silently
// dropped the padding that clears a search field's leading icon.
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(CONTROL, className)} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(CONTROL, className)} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-[6rem] w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-micro text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-gold-500",
        className,
      )}
    />
  );
}

export function FormError({ children }: { children?: React.ReactNode }) {
  return (
    <p aria-live="polite" className="min-h-[1.25rem] text-nano text-[#B91C1C]">
      {children}
    </p>
  );
}
