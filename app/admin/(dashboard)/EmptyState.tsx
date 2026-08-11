import Button from "@/app/components-home/ui/Button";
import { PackageSearch, SearchX } from "lucide-react";

/**
 * Shown instead of a blank panel.
 *
 * `variant` distinguishes "there's nothing here yet" from "your filters
 * matched nothing" — the two need different wording and different actions, and
 * conflating them is how a filtered list looks like an empty database.
 */
export default function EmptyState({
  variant = "empty",
  title,
  description,
  action,
}: {
  variant?: "empty" | "no-results";
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  const Icon = variant === "no-results" ? SearchX : PackageSearch;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-mist text-slate-400">
        <Icon size={24} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-ui font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-micro text-slate-500">{description}</p>
      {action && (
        <Button href={action.href} size="sm" className="mt-5">
          {action.label}
        </Button>
      )}
    </div>
  );
}
