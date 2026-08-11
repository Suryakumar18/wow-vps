"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useId, useEffect } from "react";
import { Search } from "lucide-react";
import { brand as defaultBrand } from "./data/home-content";
import { cn } from "./lib/cn";

/**
 * Catalogue search. Submitting routes to /category/all?q=… , which
 * `parseCategoryQuery` turns into a real query against the products table.
 *
 * The box is refilled from the URL after navigating, so a shopper on a results
 * page can see and edit what they searched for instead of facing an empty
 * field. Read from `window.location` rather than `useSearchParams`, which would
 * oblige every page rendering the header to sit inside a Suspense boundary.
 */
export default function SearchBar({
  className,
  placeholder = defaultBrand.searchPlaceholder,
}: {
  className?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const inputId = useId();

  useEffect(() => {
    const term = new URLSearchParams(window.location.search).get("q") ?? "";
    setQuery((current) => (current === term ? current : term));
  }, [pathname]);

  return (
    <form
      role="search"
      className={cn("flex h-nav-control-md w-full items-stretch", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const q = query.trim();
        router.push(q ? `/category/all?q=${encodeURIComponent(q)}` : "/category/all");
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-l-md border border-r-0 border-slate-300 bg-white px-u-3.5 text-nav-micro text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-gold-500"
      />
      <button
        type="submit"
        aria-label="Search"
        className="grid w-nav-control-md shrink-0 place-items-center rounded-r-md border border-gold-500 bg-gold-500 text-navy-900 transition-colors hover:bg-gold-600 hover:border-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
      >
        <Search size={14} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </form>
  );
}
