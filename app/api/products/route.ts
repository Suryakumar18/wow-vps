import { NextRequest, NextResponse } from "next/server";
import { queryCatalogDb } from "@/app/server/catalog";
import type { CatalogQuery, SortKey } from "@/app/components-home/data/catalog";

const SORTS = new Set<SortKey>(["newest", "price_asc", "price_desc"]);

/** Parses a numeric param, ignoring anything that isn't a usable number. */
function num(value: string | null): number | undefined {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const brands = sp.getAll("brand");
  const availability = sp.getAll("availability");
  const sort = sp.get("sort") as SortKey | null;

  const query: CatalogQuery = {
    category: sp.get("category") ?? undefined,
    subcategory: sp.get("sub") ?? undefined,
    q: sp.get("q")?.trim() || undefined,
    brands: brands.length ? brands : undefined,
    availability: availability.length ? availability : undefined,
    minPrice: num(sp.get("minPrice")),
    maxPrice: num(sp.get("maxPrice")),
    sort: sort && SORTS.has(sort) ? sort : undefined,
    page: num(sp.get("page")),
    limit: num(sp.get("limit")),
    // Infinite scroll appends pages and never re-reads the facet counts, so it
    // asks for them to be skipped — roughly halving the cost of a scroll batch.
    withFacets: sp.get("facets") !== "0",
  };

  const result = await queryCatalogDb(query);

  return NextResponse.json(result, {
    headers: {
      // Listings are public and identical for everyone. A short shared cache
      // with a long stale window means a burst of shoppers on the same
      // department costs one query, and a price edit is still live within a
      // minute.
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
