"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/app/components-home/lib/cn";
import { formatPrice } from "@/app/components-home/lib/format";
import { Input, Select, FormError } from "../ui";

export interface PickerProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  categoryName: string;
  brandName: string;
  isFeatured: boolean;
  isDeal: boolean;
}

/**
 * Picks which products appear in a homepage row.
 *
 * `field` decides which flag is toggled, so the same component drives both
 * Popular Picks (`isFeatured`) and Deals of the Day (`isDeal`) without a second
 * near-identical editor.
 *
 * Searching happens on the server. The previous version received every
 * published product as a prop and filtered them in a `useMemo` — which at
 * fourteen products was the simplest thing that worked, and at three thousand
 * meant a multi-megabyte page payload and thousands of list items rendered into
 * the DOM twice over (once per picker). Now the page sends only what's already
 * selected plus a first page, and typing queries `/api/admin/products`.
 */
export default function ProductPicker({
  initialProducts,
  selectedProducts,
  categories,
  field,
  emptyNote,
}: {
  /** A first page to browse before searching. */
  initialProducts: PickerProduct[];
  /** Everything currently carrying this flag — always complete, never truncated. */
  selectedProducts: PickerProduct[];
  categories: { id: string; name: string }[];
  field: "isFeatured" | "isDeal";
  emptyNote: string;
}) {
  const router = useRouter();

  const [rows, setRows] = useState<PickerProduct[]>(initialProducts);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(selectedProducts.map((p) => p.id)),
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [onlySelected, setOnlySelected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Guards a slow response for an old search term from replacing a newer one.
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (opts: { q: string; category: string; onlySelected: boolean }) => {
      const reqId = ++requestIdRef.current;
      setIsSearching(true);
      try {
        const sp = new URLSearchParams();
        if (opts.q) sp.set("q", opts.q);
        if (opts.category) sp.set("category", opts.category);
        if (opts.onlySelected) sp.set("selected", field);
        sp.set("limit", "50");

        const res = await fetch(`/api/admin/products?${sp}`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { products: PickerProduct[] };
        if (reqId !== requestIdRef.current) return;
        setRows(data.products);
        setError(null);
      } catch {
        if (reqId === requestIdRef.current) setError("Couldn't search products.");
      } finally {
        if (reqId === requestIdRef.current) setIsSearching(false);
      }
    },
    [field],
  );

  // Debounced so typing doesn't fire a query per keystroke. The initial render
  // already has its rows from the server, so the first pass is skipped.
  const isFirstRef = useRef(true);
  useEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      return;
    }
    const id = setTimeout(() => void load({ q: query.trim(), category, onlySelected }), 300);
    return () => clearTimeout(id);
  }, [query, category, onlySelected, load]);

  const toggle = async (row: PickerProduct) => {
    const next = !selectedIds.has(row.id);
    setBusyId(row.id);
    setError(null);

    // Optimistic — a checkbox shouldn't wait on a round trip.
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(row.id);
      else copy.delete(row.id);
      return copy;
    });

    try {
      const res = await fetch(`/api/admin/products/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setSelectedIds((prev) => {
        const copy = new Set(prev);
        if (next) copy.delete(row.id);
        else copy.add(row.id);
        return copy;
      });
      setError("Couldn't update that product.");
    } finally {
      setBusyId(null);
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <section className="rounded-xl border border-line bg-white">
      <header className="border-b border-line p-5">
        <p className="text-nano text-slate-500">
          {selectedCount === 0
            ? emptyNote
            : `${selectedCount} selected — shown on the homepage in catalogue order.`}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
          <div className="relative">
            {isSearching ? (
              <Loader2
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
              />
            ) : (
              <Search
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            )}
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, brand or slug…"
              className="pl-9"
              aria-label="Search products"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-mist hover:text-ink"
              >
                <X size={13} aria-hidden="true" />
              </button>
            )}
          </div>

          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <label className="flex h-11 items-center gap-2 whitespace-nowrap text-micro text-slate-600">
            <input
              type="checkbox"
              checked={onlySelected}
              onChange={(e) => setOnlySelected(e.target.checked)}
              className="h-4 w-4 accent-[#C6A15B]"
            />
            Selected only
          </label>
        </div>

        {!onlySelected && !query && !category && (
          <p className="mt-2 text-nano text-slate-400">
            Showing the first {rows.length} products alphabetically — search to reach the rest.
          </p>
        )}
      </header>

      <ul className="max-h-[26rem] overflow-y-auto p-2">
        {rows.length === 0 ? (
          <li className="px-3 py-10 text-center text-micro text-slate-500">
            No products match those filters.
          </li>
        ) : (
          rows.map((row) => (
            <li key={row.id}>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-mist",
                  busyId === row.id && "opacity-60",
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(row.id)}
                  onChange={() => toggle(row)}
                  disabled={busyId === row.id}
                  className="h-4 w-4 shrink-0 accent-[#C6A15B]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-micro font-medium text-ink">{row.title}</span>
                  <span className="block truncate text-nano text-slate-500">
                    {row.categoryName} · {row.brandName}
                  </span>
                </span>
                <span className="shrink-0 text-micro font-semibold tabular-nums text-ink">
                  {formatPrice(row.price)}
                </span>
              </label>
            </li>
          ))
        )}
      </ul>

      <div className="px-5 pb-5">
        <FormError>{error}</FormError>
      </div>
    </section>
  );
}
