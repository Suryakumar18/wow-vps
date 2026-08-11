"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input, Select } from "../ui";

/**
 * Search and filter controls for the product list.
 *
 * State lives in the URL rather than component state, so a filtered view can
 * be linked, bookmarked and survives the refresh after an edit or delete.
 */
export default function ProductFilters({
  categories,
  brands,
}: {
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params?.get("q") ?? "");

  const apply = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params?.toString() ?? "");
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.replace(`/admin/products?${next.toString()}`);
  };

  // Debounced so typing doesn't fire a navigation per keystroke.
  useEffect(() => {
    const current = params?.get("q") ?? "";
    if (query === current) return;
    const id = setTimeout(() => apply({ q: query }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const category = params?.get("category") ?? "";
  const brand = params?.get("brand") ?? "";
  const status = params?.get("status") ?? "";
  const hasFilters = Boolean(query || category || brand || status);

  return (
    <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
      <div className="relative">
        <Search
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products by title or slug…"
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
        onChange={(e) => apply({ category: e.target.value })}
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <Select value={brand} onChange={(e) => apply({ brand: e.target.value })} aria-label="Filter by brand">
        <option value="">All brands</option>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </Select>

      <div className="flex gap-2">
        <Select
          value={status}
          onChange={(e) => apply({ status: e.target.value })}
          aria-label="Filter by status"
        >
          <option value="">Any status</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
          <option value="featured">Featured</option>
          <option value="deal">On deal</option>
          <option value="out">Out of stock</option>
          <option value="low">Low stock</option>
        </Select>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              router.replace("/admin/products");
            }}
            className="h-11 shrink-0 rounded-lg px-3 text-micro font-semibold text-slate-500 transition-colors hover:bg-mist hover:text-ink"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
