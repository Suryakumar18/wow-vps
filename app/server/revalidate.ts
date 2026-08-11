import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Cache invalidation for admin writes.
 *
 * Two caches are in play and both have to be cleared, or the admin panel
 * appears to save changes that never reach the storefront:
 *
 *  - The `catalog` tag covers what `app/server/catalog.ts` memoises across
 *    requests: brand names, department facet counts, category metadata.
 *  - The homepage is *prerendered*. Its content comes from the CMS tables, but
 *    nothing in it reads cookies or search params, so Next renders it once and
 *    serves that HTML — which means a hero slide edited in the admin panel
 *    would otherwise not appear until the next deploy.
 *
 * One coarse tag rather than per-entity keys, on purpose: these caches are
 * small, cheap to rebuild, and written far less often than they're read. A
 * finer scheme would buy nothing and would eventually miss a case.
 */

/** Catalogue reads: products, departments, brands, facets. */
export function revalidateCatalog() {
  revalidateTag("catalog");
}

/** Anything that changes the prerendered homepage. */
export function revalidateHomepage() {
  revalidatePath("/");
}

/**
 * Both. Used by writes that touch the catalogue *and* what the homepage shows —
 * a product's featured/deal flags, or a department's tile.
 */
export function revalidateStorefront() {
  revalidateCatalog();
  revalidateHomepage();
}
