"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/app/components-home/lib/cn";

/**
 * A sortable column header. Sort state lives in the URL (`?sort=title&dir=asc`)
 * so the server does the ordering and a sorted view stays linkable.
 */
export default function SortableTh({
  column,
  label,
  basePath,
  className,
}: {
  column: string;
  label: string;
  basePath: string;
  className?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const activeColumn = params?.get("sort");
  const direction = params?.get("dir") === "desc" ? "desc" : "asc";
  const isActive = activeColumn === column;

  const toggle = () => {
    const next = new URLSearchParams(params?.toString() ?? "");
    next.set("sort", column);
    next.set("dir", isActive && direction === "asc" ? "desc" : "asc");
    // A re-sort invalidates the current page offset.
    next.delete("page");
    router.replace(`${basePath}?${next.toString()}`);
  };

  const Icon = !isActive ? ChevronsUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <th
      scope="col"
      aria-sort={isActive ? (direction === "asc" ? "ascending" : "descending") : "none"}
      className={cn("border-b border-line bg-white px-4 py-3", className)}
    >
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "inline-flex items-center gap-1.5 text-nano font-bold uppercase tracking-[0.14em] transition-colors",
          isActive ? "text-ink" : "text-slate-500 hover:text-ink",
        )}
      >
        {label}
        <Icon size={12} aria-hidden="true" className={cn(!isActive && "text-slate-300")} />
      </button>
    </th>
  );
}
