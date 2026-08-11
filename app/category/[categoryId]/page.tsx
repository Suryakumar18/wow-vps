import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryPageClient from "./CategoryPageClient";
import ListingSkeleton from "./ListingSkeleton";
import {
  catalogQueryKey,
  parseCategoryQuery,
  type CategorySearchParams,
} from "./catalogParams";
import {
  getCategoryMeta,
  getDepartments,
  queryCatalogDb,
  type CategoryMeta,
} from "@/app/server/catalog";
import type { CatalogQuery } from "@/app/components-home/data/catalog";
import { BRAND } from "@/app/seo";

interface Props {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<CategorySearchParams>;
}

/**
 * Department listing.
 *
 * The page used to be a bare client component: it painted skeletons, hydrated,
 * then fetched — three sequential waits before a shopper saw a product, and an
 * empty document for a crawler indexing three thousand of them. The grid, the
 * count and the facet counts are now all in the first response.
 *
 * The split below is deliberate:
 *
 *  - `getCategoryMeta` is awaited **here**, in the shell. It's cached and fast,
 *    and resolving it before anything is flushed is what lets a missing
 *    department return a real HTTP 404. Do this work behind the Suspense
 *    boundary (or in a `loading.tsx`, which wraps the whole segment) and the
 *    status line is already sent — the not-found page renders under a 200,
 *    which crawlers read as "this page exists".
 *  - The product query streams in behind `ListingSkeleton`, so the skeleton
 *    reaches the browser immediately rather than after the database answers.
 */

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { categoryId } = await params;
  const { q } = await searchParams;
  const meta = await getCategoryMeta(categoryId);

  if (!meta) {
    return { title: "Category not found", robots: { index: false, follow: false } };
  }

  // A search results page is thin, duplicated content across every possible
  // term — useful to a shopper, not something to put in an index.
  if (q?.trim()) {
    return {
      // The layout's title template appends the brand, so these titles must
      // not carry it themselves or it lands in the tab twice.
      title: `Search: ${q.trim()}`,
      robots: { index: false, follow: true },
    };
  }

  const description =
    `Shop ${meta.title} at ${BRAND}, Texvalley, Erode — hobby-grade RC cars, drones, ` +
    `bikes and toys for kids and adults. Fast delivery across Tamil Nadu and all India.`;

  return {
    title: `${meta.title} — Buy Online in Erode`,
    description,
    alternates: { canonical: `/category/${categoryId}` },
    openGraph: {
      title: `${meta.title} — ${BRAND}, Texvalley Erode`,
      description,
      url: `/category/${categoryId}`,
      ...(meta.imageUrl ? { images: [{ url: meta.imageUrl, alt: meta.imageAlt }] } : {}),
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { categoryId } = await params;

  // In the shell, before the first flush — see the note above.
  const meta = await getCategoryMeta(categoryId);
  if (!meta) notFound();

  const query = parseCategoryQuery(categoryId, await searchParams);

  return (
    // Keyed so a new department or search term gets a fresh boundary, and the
    // skeleton reappears instead of the previous department's grid sitting
    // there while the new one loads.
    <Suspense key={catalogQueryKey(query)} fallback={<ListingSkeleton />}>
      <Listing categoryId={categoryId} meta={meta} query={query} />
    </Suspense>
  );
}

async function Listing({
  categoryId,
  meta,
  query,
}: {
  categoryId: string;
  meta: CategoryMeta;
  query: CatalogQuery;
}) {
  const [initial, departments] = await Promise.all([queryCatalogDb(query), getDepartments()]);

  return (
    // The key forces a remount when the URL-driven query changes.
    //
    // Without it, moving between departments keeps the same component instance:
    // React reconciles `/category/all` and `/category/rc-cars` to the same
    // element, the `useState` initialisers seeded from `initialResult` never run
    // again, and the new department renders the old one's products, count and
    // price range. Remounting is also what makes the client's "the server
    // already answered this" check correct — it re-reads the served query.
    <CategoryPageClient
      key={catalogQueryKey(query)}
      slug={categoryId}
      meta={meta}
      departments={departments}
      initialQuery={query}
      initialResult={initial}
    />
  );
}
