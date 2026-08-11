"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, ChevronRight, Filter, PackageSearch, SlidersHorizontal } from "lucide-react";

import Container from "@/app/components-home/ui/Container";
import Section from "@/app/components-home/ui/Section";
import Button from "@/app/components-home/ui/Button";
import BottomSheet from "@/app/components-home/ui/BottomSheet";
import ProductCard from "@/app/components-home/ProductCard";
import { categories as staticCategories, type Product } from "@/app/components-home/data/home-content";
import type {
  CatalogCard,
  CatalogFacets,
  CatalogQuery,
  CatalogResult,
  Facet,
  SortKey,
} from "@/app/components-home/data/catalog";
import type { CategoryMeta } from "@/app/server/catalog";
import { cn } from "@/app/components-home/lib/cn";
import {
  PAGE_SIZE,
  SORT_OPTIONS,
  catalogQueryKey,
  catalogSearchParams,
} from "./catalogParams";

/**
 * Maps a catalogue row onto the same shape the homepage cards use, so the grid
 * renders through the identical `ProductCard` — one card design, one set of
 * hover and focus behaviours, no second implementation to keep in sync.
 */
function toCardProduct(row: CatalogCard): Product {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.brand || row.categoryId,
    price: row.price,
    mrp: row.originalPrice ?? row.price,
    rating: row.rating,
    reviews: row.numReviews,
    stock: row.totalStock ?? 0,
    href: `/product/${row.id}`,
    src: row.images[0] ?? "",
    alt: row.title,
  };
}

/* ------------------------------------------------------------------ */
/* Filter panel — rendered in the desktop sidebar and the mobile sheet  */
/* ------------------------------------------------------------------ */

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line py-4 last:border-b-0">
      <h3 className="mb-2.5 text-nano font-bold uppercase tracking-[0.16em] text-gold-600">{title}</h3>
      {children}
    </div>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex min-h-[2.25rem] cursor-pointer items-center gap-2.5 text-micro text-slate-600 transition-colors hover:text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 rounded border-slate-300 text-gold-500 accent-gold-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && <span className="shrink-0 text-nano text-slate-400">({count})</span>}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Skeletons                                                           */
/* ------------------------------------------------------------------ */

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
      <div className="aspect-[4/3] animate-pulse bg-mist" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-3/4 animate-pulse rounded bg-mist" />
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-mist" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-mist" />
        <div className="h-8 w-full animate-pulse rounded-md bg-mist" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

interface Props {
  slug: string;
  meta: CategoryMeta;
  departments: { id: string; label: string }[];
  /** The query the server already answered, parsed from the URL. */
  initialQuery: CatalogQuery;
  /** Its answer — page one, with facets. Rendered without any client fetch. */
  initialResult: CatalogResult;
}

/** The banner falls back to homepage artwork for departments with no image. */
const FALLBACK_BANNER = staticCategories[0];

/**
 * Fits the price inputs to the catalogue's real range, once.
 *
 * `+500` gives the top of the range some headroom so the most expensive product
 * isn't sitting exactly on the slider's ceiling.
 */
const ceilingFor = (facets: CatalogFacets) => {
  const hi = facets.priceMax + 500;
  return hi > 500 ? hi : 0;
};

export default function CategoryPageClient({
  slug,
  meta,
  departments,
  initialQuery,
  initialResult,
}: Props) {
  const [products, setProducts] = useState<CatalogCard[]>(initialResult.products);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialResult.hasMore);
  const [totalCount, setTotalCount] = useState(initialResult.total);
  const [facets, setFacets] = useState<CatalogFacets>(initialResult.facets);

  const [sortBy, setSortBy] = useState<SortKey>(initialQuery.sort ?? "newest");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedAvailabilities, setSelectedAvailabilities] = useState<string[]>([]);

  // Fixed for the life of this mount: the server's facets already describe the
  // department being browsed, and the page is remounted (via its key) whenever
  // that changes. The old code discovered this from the first client response
  // instead, which meant one render with empty price inputs.
  const priceCeiling = ceilingFor(initialResult.facets);
  const [priceDraft, setPriceDraft] = useState(() => ({ min: 0, max: priceCeiling }));
  const [priceRange, setPriceRange] = useState(priceDraft);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Settle the price inputs before committing them to the query. Returning the
  // previous object when nothing changed matters: a new object with identical
  // values would rebuild the query and refetch the page already on screen.
  useEffect(() => {
    const id = setTimeout(() => {
      setPriceRange((prev) =>
        prev.min === priceDraft.min && prev.max === priceDraft.max ? prev : priceDraft,
      );
    }, 400);
    return () => clearTimeout(id);
  }, [priceDraft]);

  // The query the catalogue should answer right now.
  const query = useMemo<CatalogQuery>(
    () => ({
      ...initialQuery,
      sort: sortBy,
      brands: selectedBrands.length ? selectedBrands : undefined,
      availability: selectedAvailabilities.length ? selectedAvailabilities : undefined,
      minPrice: priceRange.min > 0 ? priceRange.min : undefined,
      maxPrice:
        priceCeiling && priceRange.max > 0 && priceRange.max < priceCeiling
          ? priceRange.max
          : undefined,
    }),
    [initialQuery, sortBy, selectedBrands, selectedAvailabilities, priceRange, priceCeiling],
  );

  const queryKey = catalogQueryKey(query);
  const initialKey = catalogQueryKey(initialQuery);

  // Guards a stale in-flight response from overwriting a newer one when filters
  // change mid-request. `inFlightRef` is synchronous because `isLoadingMore` is
  // state and wouldn't be visible to a second observer callback in the same tick.
  const requestIdRef = useRef(0);
  const pageRef = useRef(1);
  const inFlightRef = useRef(false);
  // `query` is read through a ref so the fetcher's identity doesn't change on
  // every render — the effect below keys off `queryKey` instead.
  const queryRef = useRef(query);
  queryRef.current = query;

  const fetchPage = useCallback(async (page: number, replace: boolean) => {
    if (!replace && inFlightRef.current) return;
    inFlightRef.current = true;

    const reqId = ++requestIdRef.current;
    if (replace) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const sp = catalogSearchParams(queryRef.current, page, replace);
      const res = await fetch(`/api/products?${sp.toString()}`);
      if (!res.ok) throw new Error("Failed to load products");
      const data = (await res.json()) as CatalogResult;
      if (reqId !== requestIdRef.current) return; // superseded by a newer query

      setProducts((prev) => (replace ? data.products : [...prev, ...data.products]));
      setHasMore(data.hasMore);
      setTotalCount(data.total);
      pageRef.current = page;
      if (replace) setFacets(data.facets);
    } catch (err) {
      console.error(err);
      if (reqId === requestIdRef.current) setHasMore(false);
    } finally {
      // Only the newest request clears the flag — a superseded one must not,
      // or it would let a stale scroll batch race the fresh query.
      if (reqId === requestIdRef.current) {
        inFlightRef.current = false;
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, []);

  // Any filter/sort change restarts paging from page 1 — but the very first
  // render already has the server's answer to `initialQuery`, so refetching it
  // would be a wasted round trip on every page view.
  const servedKeyRef = useRef(initialKey);
  useEffect(() => {
    if (servedKeyRef.current === queryKey) return;
    servedKeyRef.current = queryKey;
    fetchPage(1, true);
  }, [queryKey, fetchPage]);

  // Infinite scroll: a sentinel below the grid pulls the next batch early.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || isLoading || isLoadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchPage(pageRef.current + 1, false);
      },
      { rootMargin: "600px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, fetchPage]);

  const brands: Facet[] = facets.brands ?? [];
  const availabilities: Facet[] = facets.availabilities ?? [];

  const activeFilterCount =
    selectedBrands.length +
    selectedAvailabilities.length +
    (priceRange.min > 0 ? 1 : 0) +
    (priceCeiling && priceRange.max < priceCeiling ? 1 : 0);

  const toggle = (setState: React.Dispatch<React.SetStateAction<string[]>>, value: string) =>
    setState((prev) => (prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]));

  const clearAll = () => {
    setSelectedBrands([]);
    setSelectedAvailabilities([]);
    setPriceDraft({ min: 0, max: priceCeiling });
    setPriceRange({ min: 0, max: priceCeiling });
  };

  /**
   * Sort is applied by the client fetch, and mirrored into the URL with
   * `history.replaceState` rather than a router navigation.
   *
   * `router.replace` would re-run the server component for the very page the
   * client is already fetching — two answers to one question, and the server's
   * arrives as props this component has no way to adopt mid-list. Writing the
   * URL directly keeps it shareable (loading it fresh *does* render sorted on
   * the server, via `parseCategoryQuery`) without paying twice.
   */
  const changeSort = (value: SortKey) => {
    setSortBy(value);
    const sp = new URLSearchParams(window.location.search);
    if (value === "newest") sp.delete("sort");
    else sp.set("sort", value);
    const qs = sp.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  };

  const searchTerm = initialQuery.q;
  const bannerSrc = meta.imageUrl || FALLBACK_BANNER.src;
  const bannerAlt = meta.imageAlt || FALLBACK_BANNER.alt;
  const heading = searchTerm ? `Results for “${searchTerm}”` : meta.title;

  const filterPanel = (
    <div>
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between border-b border-line pb-3">
          <span className="text-nano font-bold uppercase tracking-[0.16em] text-ink">
            {activeFilterCount} active
          </span>
          <button
            type="button"
            onClick={clearAll}
            className="text-nano font-semibold uppercase tracking-wide text-gold-600 transition-opacity hover:opacity-70"
          >
            Clear all
          </button>
        </div>
      )}

      <FilterGroup title="Price">
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="min-price">
            Minimum price
          </label>
          <input
            id="min-price"
            type="number"
            min={0}
            value={priceDraft.min || ""}
            placeholder="Min"
            onChange={(e) => setPriceDraft((p) => ({ ...p, min: Number(e.target.value) || 0 }))}
            className="h-9 w-full min-w-0 rounded-md border border-line px-2.5 text-micro text-ink outline-none focus:border-gold-500"
          />
          <span aria-hidden="true" className="text-micro text-slate-400">
            –
          </span>
          <label className="sr-only" htmlFor="max-price">
            Maximum price
          </label>
          <input
            id="max-price"
            type="number"
            min={0}
            value={priceDraft.max || ""}
            placeholder="Max"
            onChange={(e) => setPriceDraft((p) => ({ ...p, max: Number(e.target.value) || 0 }))}
            className="h-9 w-full min-w-0 rounded-md border border-line px-2.5 text-micro text-ink outline-none focus:border-gold-500"
          />
        </div>
      </FilterGroup>

      {brands.length > 0 && (
        <FilterGroup title="Brand">
          <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
            {brands.map((b) => (
              <CheckRow
                key={b.label}
                label={b.label}
                count={b.count}
                checked={selectedBrands.includes(b.label)}
                onChange={() => toggle(setSelectedBrands, b.label)}
              />
            ))}
          </div>
        </FilterGroup>
      )}

      {availabilities.length > 0 && (
        <FilterGroup title="Availability">
          <div className="space-y-0.5">
            {availabilities.map((a) => (
              <CheckRow
                key={a.label}
                label={a.label}
                count={a.count}
                checked={selectedAvailabilities.includes(a.label)}
                onChange={() => toggle(setSelectedAvailabilities, a.label)}
              />
            ))}
          </div>
        </FilterGroup>
      )}
    </div>
  );

  const cards = products.map(toCardProduct).filter((p) => p.id && p.src);

  return (
    <>
      {/* Category banner — same treatment as the homepage department banners. */}
      <Section flush label={`${meta.title} category`}>
        <div className="relative isolate flex h-promo overflow-hidden rounded-xl bg-navy-800">
          <div className="absolute inset-y-0 right-0 w-full sm:w-[62%]">
            <Image src={bannerSrc} alt={bannerAlt} fill priority sizes="(min-width: 768px) 62vw, 100vw" className="object-cover" />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-navy-800 via-navy-800/85 to-navy-800/35 sm:via-navy-800/70 sm:to-transparent"
            />
          </div>

          <div className="relative z-10 flex max-w-[76%] flex-col justify-center px-panel py-5 sm:max-w-[58%]">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-1 text-nano text-white/60">
                <li>
                  <Link href="/" className="transition-colors hover:text-gold-400">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRight size={11} />
                </li>
                <li aria-current="page" className="text-gold-400">
                  {meta.title}
                </li>
              </ol>
            </nav>

            <h1 className="mt-2.5 text-promo font-bold text-white">{heading}</h1>
            <p className="mt-2 text-micro text-white/70">
              {isLoading
                ? "Loading products…"
                : `${totalCount.toLocaleString("en-IN")} ${totalCount === 1 ? "product" : "products"} available`}
            </p>
          </div>
        </div>
      </Section>

      {/* Department chips — horizontally scrollable, snap-aligned on touch. */}
      <Container className="pt-5">
        <ul className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <li className="shrink-0 snap-start">
            <Link
              href="/category/all"
              aria-current={slug === "all" ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center whitespace-nowrap rounded-full border px-4 text-micro font-medium transition-colors",
                slug === "all"
                  ? "border-gold-500 bg-gold-500 text-navy-900"
                  : "border-line bg-white text-slate-600 hover:border-gold-300 hover:text-gold-700",
              )}
            >
              All
            </Link>
          </li>
          {departments.map((c) => (
            <li key={c.id} className="shrink-0 snap-start">
              <Link
                href={`/category/${c.id}`}
                aria-current={slug === c.id ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center whitespace-nowrap rounded-full border px-4 text-micro font-medium transition-colors",
                  slug === c.id
                    ? "border-gold-500 bg-gold-500 text-navy-900"
                    : "border-line bg-white text-slate-600 hover:border-gold-300 hover:text-gold-700",
                )}
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      {/* Toolbar — sticks just under the site header. The offsets track the
          header's own height (≈104px mobile, ≈118px from `lg`). */}
      <div className="sticky top-[104px] z-30 mt-4 border-y border-line bg-white/95 backdrop-blur-sm lg:top-[118px]">
        <Container>
          {/* Mobile: one bar split in half by a hairline — Sort on the left,
              Filter on the right, as in the approved mobile design. */}
          <div className="grid h-12 grid-cols-2 lg:hidden">
            <button
              type="button"
              onClick={() => setSortOpen(true)}
              className="flex items-center justify-center gap-2 text-micro font-semibold text-ink transition-colors hover:text-gold-600"
            >
              <ArrowUpDown size={14} aria-hidden="true" className="text-gold-600" />
              Sort
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex items-center justify-center gap-2 border-l border-line text-micro font-semibold text-ink transition-colors hover:text-gold-600"
            >
              <SlidersHorizontal size={14} aria-hidden="true" className="text-gold-600" />
              Filter
              {activeFilterCount > 0 && (
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-navy-900">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="hidden h-12 items-center justify-between gap-3 lg:flex">
            <p className="min-w-0 truncate text-micro text-slate-500">
              <span className="font-semibold text-ink">{totalCount.toLocaleString("en-IN")}</span>{" "}
              {totalCount === 1 ? "product" : "products"}
            </p>

            <label className="flex shrink-0 items-center gap-2">
              <span className="text-micro text-slate-500">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => changeSort(e.target.value as SortKey)}
                className="h-9 cursor-pointer rounded-md border border-line bg-white px-2.5 text-micro text-ink outline-none focus:border-gold-500"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Container>
      </div>

      <Container className="pt-6">
        <div className="flex gap-8">
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-[11.5rem]">
              <h2 className="flex items-center gap-2 pb-1 text-ui font-bold text-ink">
                <Filter size={14} className="text-gold-500" aria-hidden="true" />
                Filters
              </h2>
              {filterPanel}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {isLoading ? (
              <ul className="grid grid-cols-2 gap-card sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: PAGE_SIZE / 3 }, (_, i) => (
                  <li key={i}>
                    <CardSkeleton />
                  </li>
                ))}
              </ul>
            ) : cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-mist py-16 text-center">
                <PackageSearch size={32} className="mb-3 text-slate-300" aria-hidden="true" />
                <h2 className="text-ui font-bold text-ink">No products found</h2>
                <p className="mt-1 max-w-xs text-micro text-slate-500">
                  {searchTerm
                    ? `Nothing matched “${searchTerm}”. Try a shorter term or browse a department.`
                    : "Try removing a filter or browsing another department."}
                </p>
                {activeFilterCount > 0 && (
                  <Button onClick={clearAll} size="sm" className="mt-4">
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <ul className="grid grid-cols-2 gap-card sm:grid-cols-3 xl:grid-cols-4">
                  {cards.map((product) => (
                    <li key={product.id}>
                      <ProductCard
                        product={product}
                        sizes="(min-width: 1280px) 22vw, (min-width: 640px) 30vw, 48vw"
                      />
                    </li>
                  ))}
                </ul>

                {isLoadingMore && (
                  <ul className="mt-card grid grid-cols-2 gap-card sm:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 4 }, (_, i) => (
                      <li key={i}>
                        <CardSkeleton />
                      </li>
                    ))}
                  </ul>
                )}

                {/* Sentinel pulls the next batch; the button is the accessible
                    fallback when the observer can't fire. */}
                <div ref={sentinelRef} aria-hidden="true" className="h-px" />
                {hasMore && !isLoadingMore && (
                  <div className="mt-6 flex justify-center">
                    <Button onClick={() => fetchPage(pageRef.current + 1, false)} variant="outline" size="sm">
                      Load more products
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>

      <BottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        description={`${totalCount.toLocaleString("en-IN")} ${totalCount === 1 ? "product" : "products"} match`}
        footer={
          <div className="flex gap-2">
            <Button onClick={clearAll} variant="outline" size="sm" className="flex-1">
              Clear all
            </Button>
            <Button onClick={() => setFiltersOpen(false)} size="sm" className="flex-1">
              Show results
            </Button>
          </div>
        }
      >
        {filterPanel}
      </BottomSheet>

      <BottomSheet open={sortOpen} onClose={() => setSortOpen(false)} title="Sort by">
        <ul className="pb-2">
          {SORT_OPTIONS.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => {
                  changeSort(o.value);
                  setSortOpen(false);
                }}
                aria-pressed={sortBy === o.value}
                className={cn(
                  "flex min-h-[3rem] w-full items-center justify-between rounded-lg px-1 text-micro transition-colors",
                  sortBy === o.value ? "font-semibold text-gold-700" : "text-ink hover:bg-mist",
                )}
              >
                {o.label}
                {sortBy === o.value && <span aria-hidden="true" className="text-gold-500">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </>
  );
}
