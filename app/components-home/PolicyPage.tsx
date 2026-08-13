import Container from "./ui/Container";

/**
 * Shared chrome for the standalone legal pages (privacy, refunds).
 *
 * These are long-form reading pages rather than parts of the shopping flow, so
 * the measure is capped well below the shell width — a policy set across a
 * 1840px monitor is unreadable. Everything else (gutter, vertical rhythm,
 * colours) still comes from the same tokens as the rest of the storefront.
 */
export default function PolicyPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  /** Human-readable date, e.g. "13 August 2026". */
  updated: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Container className="py-section">
      <div className="mx-auto max-w-[68ch]">
        <h1 className="text-section font-bold text-ink">{title}</h1>
        <p className="mt-2 text-nano font-medium uppercase tracking-wide text-slate-500">
          Last updated {updated}
        </p>
        {intro && <div className="mt-heading text-micro leading-relaxed text-slate-600">{intro}</div>}
        <div className="mt-heading space-y-7 text-micro leading-relaxed text-slate-600">{children}</div>
      </div>
    </Container>
  );
}

/** One numbered section of a policy. */
export function PolicySection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-ui font-bold text-ink">{heading}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}

/** Bulleted list with the storefront's list styling. */
export function PolicyList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="ml-4 list-disc space-y-1.5 marker:text-slate-400">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
