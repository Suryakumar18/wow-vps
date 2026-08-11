"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/app/components-home/lib/cn";

import { PAGE_SIZES } from "./pagination-config";

export { PAGE_SIZES, DEFAULT_PAGE_SIZE } from "./pagination-config";

/**
 * Pagination driven by the URL, so a page is linkable and survives the refresh
 * that follows an edit or delete.
 */
export default function Pagination({
  page,
  pageSize,
  total,
  basePath,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const go = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params?.toString() ?? "");
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.replace(`${basePath}?${next.toString()}`);
  };

  const btn =
    "grid h-9 w-9 place-items-center rounded-md border border-line text-ink transition-colors hover:border-gold-300 hover:bg-mist disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-transparent";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
      <p className="text-nano text-slate-500">
        {total === 0 ? "No results" : `Showing ${from}–${to} of ${total}`}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-nano text-slate-500">
          Rows
          <select
            value={pageSize}
            onChange={(e) => go({ pageSize: e.target.value, page: "1" })}
            aria-label="Rows per page"
            className="h-9 rounded-md border border-line bg-white px-2 text-micro text-ink outline-none transition-colors focus:border-gold-500"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => go({ page: "1" })}
            disabled={page <= 1}
            aria-label="First page"
            className={btn}
          >
            <ChevronsLeft size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go({ page: String(page - 1) })}
            disabled={page <= 1}
            aria-label="Previous page"
            className={btn}
          >
            <ChevronLeft size={15} aria-hidden="true" />
          </button>

          <span className={cn("px-2 text-nano tabular-nums text-slate-500")}>
            Page {page} of {lastPage}
          </span>

          <button
            type="button"
            onClick={() => go({ page: String(page + 1) })}
            disabled={page >= lastPage}
            aria-label="Next page"
            className={btn}
          >
            <ChevronRight size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go({ page: String(lastPage) })}
            disabled={page >= lastPage}
            aria-label="Last page"
            className={btn}
          >
            <ChevronsRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
