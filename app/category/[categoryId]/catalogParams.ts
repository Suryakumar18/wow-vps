import type { CatalogQuery, SortKey } from "@/app/components-home/data/catalog";

/**
 * The URL → query translation, shared by the server component that renders the
 * first page and the client component that takes over from there.
 *
 * Kept in one place because the two have to agree exactly: if the server
 * renders a different query than the client would compute for the same URL, the
 * client discards the server's work and refetches on mount, which is the whole
 * cost the server render was meant to avoid.
 */

/** Sized to fill whole rows of the 4-column desktop grid. */
export const PAGE_SIZE = 24;

const SORTS: readonly SortKey[] = ["newest", "price_asc", "price_desc"];

export const SORT_OPTIONS = [
  { value: "newest", label: "Best selling" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
] as const;

/**
 * Which parts of the listing live in the URL.
 *
 * Department, subcategory, search term and sort do — they're shareable, they
 * survive the back button, and they're what a search engine should be able to
 * reach. The sidebar refinements (brand, availability, price) stay as client
 * state: they're a way of narrowing what's already on screen, and putting them
 * in the URL would mean a server round trip for every checkbox.
 */
export interface CategorySearchParams {
  sub?: string;
  q?: string;
  sort?: string;
}

export function parseCategoryQuery(
  categoryId: string,
  params: CategorySearchParams = {},
): CatalogQuery {
  const sort = SORTS.includes(params.sort as SortKey) ? (params.sort as SortKey) : "newest";
  return {
    category: categoryId && categoryId !== "all" ? categoryId : undefined,
    subcategory: params.sub?.trim() || undefined,
    q: params.q?.trim() || undefined,
    sort,
    page: 1,
    limit: PAGE_SIZE,
    withFacets: true,
  };
}

/**
 * A stable identity for a query.
 *
 * Used as an effect dependency instead of the query object: the object is
 * rebuilt on every render, and depending on its reference made the listing
 * refetch itself on mount and again after the price debounce settled, for
 * exactly the results it already had.
 */
export function catalogQueryKey(query: CatalogQuery): string {
  return JSON.stringify([
    query.category ?? "",
    query.subcategory ?? "",
    query.q ?? "",
    query.sort ?? "newest",
    [...(query.brands ?? [])].sort(),
    [...(query.availability ?? [])].sort(),
    query.minPrice ?? null,
    query.maxPrice ?? null,
    query.limit ?? PAGE_SIZE,
  ]);
}

/** Builds the `/api/products` query string for a page of a query. */
export function catalogSearchParams(
  query: CatalogQuery,
  page: number,
  withFacets: boolean,
): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set("page", String(page));
  sp.set("limit", String(query.limit ?? PAGE_SIZE));
  if (query.sort) sp.set("sort", query.sort);
  if (query.category) sp.set("category", query.category);
  if (query.subcategory) sp.set("sub", query.subcategory);
  if (query.q) sp.set("q", query.q);
  for (const brand of query.brands ?? []) sp.append("brand", brand);
  for (const availability of query.availability ?? []) sp.append("availability", availability);
  if (query.minPrice != null) sp.set("minPrice", String(query.minPrice));
  if (query.maxPrice != null) sp.set("maxPrice", String(query.maxPrice));
  if (!withFacets) sp.set("facets", "0");
  return sp;
}
