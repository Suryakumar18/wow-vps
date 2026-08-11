import { cn } from "../lib/cn";

/**
 * The page shell — every section aligns to this one gutter, from the
 * announcement bar down to the footer.
 *
 * Width comes from the `shell` token: a single continuous curve (see
 * tailwind.config.ts) rather than a fixed desktop cap, so the layout keeps
 * growing with the monitor instead of stranding the design in a sea of
 * whitespace at 1920+, and never pops sideways at a breakpoint. Padding scales
 * fluidly with it (16 → 64px) so content never touches the edge either.
 */
export default function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("mx-auto w-full max-w-shell px-gutter", className)}
    >
      {children}
    </div>
  );
}
