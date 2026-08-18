import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import {
  getActiveOffer,
  offerFor,
  offerPrice,
  offerOriginalPrice,
  type ActiveOffer,
} from "./offer";
import {
  EMPTY_FACETS,
  IN_STOCK,
  OUT_OF_STOCK,
  type CatalogCard,
  type CatalogFacets,
  type CatalogProduct,
  type CatalogQuery,
  type CatalogResult,
  type Facet,
} from "@/app/components-home/data/catalog";
import { Prisma } from "@/app/generated/prisma/client";

/**
 * The storefront's read path into the catalogue.
 *
 * Everything here is shaped by one rule: **the database returns the page, not
 * the catalogue.** The previous version loaded every published product with all
 * of its images, videos and specifications on every single request and then
 * filtered the result in JavaScript. At the fourteen seeded products that was
 * invisible; at three thousand it measured 1.7 s and 6.4 MB per request, and it
 * ran again for every filter toggle, every infinite-scroll batch and every
 * product page's "related" strip.
 *
 * So: filtering, sorting, paging, counting and facet aggregation are all SQL,
 * and list queries select only the nine columns a grid tile actually paints.
 * The same page now costs one round trip and a few kilobytes.
 */

/* ------------------------------------------------------------------ */
/* Projections                                                         */
/* ------------------------------------------------------------------ */

/** Everything a grid tile paints, and nothing else. */
const cardSelect = {
  id: true,
  slug: true,
  title: true,
  price: true,
  originalPrice: true,
  totalStock: true,
  rating: true,
  numReviews: true,
  brand: { select: { name: true } },
  category: { select: { slug: true } },
  subcategory: { select: { slug: true } },
  // The tile shows one image; fetching the other five per product is most of
  // what made the old query heavy.
  images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

const toCard = (p: CardRow, offer: ActiveOffer | null = null): CatalogCard => ({
  id: p.slug,
  title: p.title,
  brand: p.brand.name,
  categoryId: p.category.slug,
  subcategoryId: p.subcategory?.slug,
  price: offerPrice(p.price, offerFor(p.id, offer)),
  originalPrice: offerOriginalPrice(p.price, p.originalPrice, offerFor(p.id, offer)),
  totalStock: p.totalStock,
  rating: p.rating,
  numReviews: p.numReviews,
  images: p.images.map((i) => i.url),
});

/** The full record, for the product detail page only. */
const detailInclude = {
  brand: true,
  category: true,
  subcategory: true,
  images: { orderBy: { position: "asc" } },
  videos: { orderBy: { position: "asc" } },
  socialVideos: { orderBy: { position: "asc" } },
  specifications: { orderBy: { position: "asc" } },
  colors: { orderBy: { position: "asc" } },
} satisfies Prisma.ProductInclude;

type DetailRow = Prisma.ProductGetPayload<{ include: typeof detailInclude }>;

const toProduct = (p: DetailRow, offer: ActiveOffer | null = null): CatalogProduct => ({
  id: p.slug,
  title: p.title,
  brand: p.brand.name,
  categoryId: p.category.slug,
  subcategoryId: p.subcategory?.slug,
  price: offerPrice(p.price, offerFor(p.id, offer)),
  originalPrice: offerOriginalPrice(p.price, p.originalPrice, offerFor(p.id, offer)),
  totalStock: p.totalStock,
  rating: p.rating,
  numReviews: p.numReviews,
  description: p.description,
  richDescription: p.richDescription,
  aboutFeatures: p.aboutFeatures,
  idealFor: p.idealFor,
  colors: p.colors.map((c) => ({ name: c.name, hex: c.hex, images: c.images })),
  specifications: p.specifications.map((s) => ({ label: s.label, value: s.value })),
  images: p.images.map((i) => i.url),
  videos: p.videos.map((v) => v.url),
  socialVideos: p.socialVideos.map((v) => ({
    url: v.url,
    // Written by socialVideoRows(), which only ever emits these four.
    platform: v.platform as "youtube" | "instagram" | "facebook" | "x",
    embedUrl: v.embedUrl,
    title: v.title,
  })),
});

/* ------------------------------------------------------------------ */
/* Where-clause construction                                           */
/* ------------------------------------------------------------------ */

/**
 * The navigational scope: what the shopper has browsed or searched to.
 *
 * Facets are counted over *this*, not over the fully filtered set — otherwise
 * ticking "WOW Racing" would drop every other brand's count to zero and there'd
 * be no way to see what else was available.
 */
function baseWhere(query: CatalogQuery): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isPublished: true };

  if (query.category && query.category !== "all") {
    where.category = { slug: query.category };
  }
  if (query.subcategory) {
    where.subcategory = { slug: query.subcategory };
  }

  const q = query.q?.trim();
  if (q) {
    // `title` is served by the trigram GIN index from the
    // product_sku_and_catalog_indexes migration; a leading-wildcard ILIKE has
    // no other way to avoid a full scan.
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { brand: { name: { contains: q, mode: "insensitive" } } },
      { category: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}

/** The base scope plus the sidebar refinements. */
function fullWhere(query: CatalogQuery): Prisma.ProductWhereInput {
  const where = baseWhere(query);

  if (query.brands?.length) {
    where.brand = { name: { in: query.brands } };
  }

  // Ticking both boxes (or neither) is the same as no constraint.
  if (query.availability?.length === 1) {
    where.totalStock = query.availability[0] === IN_STOCK ? { gt: 0 } : { lte: 0 };
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {
      ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
    };
  }

  return where;
}

const ORDER_BY: Record<string, Prisma.ProductOrderByWithRelationInput[]> = {
  // `id` breaks ties, so a product can't appear on two pages (or neither) when
  // several share a sort value — the bulk import gives thousands of rows
  // timestamps within the same second.
  newest: [{ createdAt: "desc" }, { id: "asc" }],
  price_asc: [{ price: "asc" }, { id: "asc" }],
  price_desc: [{ price: "desc" }, { id: "asc" }],
};

/* ------------------------------------------------------------------ */
/* Cached lookups                                                      */
/* ------------------------------------------------------------------ */

/**
 * Brand id → name, and the department facet counts.
 *
 * Both are global, change only when the catalogue is edited, and are needed by
 * every listing request. Caching them takes two round trips off the common
 * path; `revalidateCatalog()` clears them when the admin panel writes.
 */
const loadBrandNames = unstable_cache(
  async () => {
    const brands = await prisma.brand.findMany({ select: { id: true, name: true } });
    return Object.fromEntries(brands.map((b) => [b.id, b.name])) as Record<string, string>;
  },
  ["catalog:brand-names"],
  { tags: ["catalog"], revalidate: 300 },
);

const loadCategoryFacets = unstable_cache(
  async (): Promise<Facet[]> => {
    const [groups, categories] = await Promise.all([
      prisma.product.groupBy({
        by: ["categoryId"],
        where: { isPublished: true },
        _count: { _all: true },
      }),
      prisma.category.findMany({ select: { id: true, slug: true } }),
    ]);
    const slugById = new Map(categories.map((c) => [c.id, c.slug]));
    return groups
      .map((g) => ({ label: slugById.get(g.categoryId) ?? g.categoryId, count: g._count._all }))
      .sort((a, b) => a.label.localeCompare(b.label));
  },
  ["catalog:category-facets"],
  { tags: ["catalog"], revalidate: 300 },
);

/**
 * The department strip above a listing.
 *
 * Read from the database rather than the static `categories` array so a
 * department created by a bulk import is browsable the moment it exists —
 * `showInNav` still decides whether it also appears in the site header.
 */
export const getDepartments = unstable_cache(
  async () => {
    const rows = await prisma.category.findMany({
      where: { products: { some: { isPublished: true } } },
      select: { slug: true, name: true, shortTitle: true, position: true },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    });
    return rows.map((c) => ({ id: c.slug, label: c.shortTitle || c.name }));
  },
  ["catalog:departments"],
  { tags: ["catalog"], revalidate: 300 },
);

export interface CategoryMeta {
  slug: string;
  title: string;
  imageUrl: string;
  imageAlt: string;
}

/** Title-cases a slug, for departments that predate the CMS having artwork. */
const titleFromSlug = (slug: string) =>
  slug
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const getCategoryMeta = unstable_cache(
  async (slug: string): Promise<CategoryMeta | null> => {
    if (!slug || slug === "all") {
      return { slug: "all", title: "All Products", imageUrl: "", imageAlt: "" };
    }
    const row = await prisma.category.findUnique({
      where: { slug },
      select: { slug: true, name: true, titleLine1: true, titleLine2: true, imageUrl: true, imageAlt: true },
    });
    if (!row) return null;

    const fromLines = [row.titleLine1, row.titleLine2].filter(Boolean).join(" ");
    return {
      slug: row.slug,
      title: fromLines || row.name || titleFromSlug(slug),
      imageUrl: row.imageUrl,
      imageAlt: row.imageAlt || row.name,
    };
  },
  ["catalog:category-meta"],
  { tags: ["catalog"], revalidate: 300 },
);

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

async function loadFacets(query: CatalogQuery): Promise<CatalogFacets> {
  const where = baseWhere(query);

  const [brandGroups, brandNames, inStock, scopeTotal, priceRange, categories] = await Promise.all([
    prisma.product.groupBy({ by: ["brandId"], where, _count: { _all: true } }),
    loadBrandNames(),
    prisma.product.count({ where: { ...where, totalStock: { gt: 0 } } }),
    prisma.product.count({ where }),
    prisma.product.aggregate({ where, _min: { price: true }, _max: { price: true } }),
    loadCategoryFacets(),
  ]);

  const brands = brandGroups
    .map((g) => ({ label: brandNames[g.brandId] ?? "Unknown", count: g._count._all }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // One count plus a subtraction, rather than a second round trip for the
  // complement.
  const availabilities: Facet[] = [];
  if (inStock > 0) availabilities.push({ label: IN_STOCK, count: inStock });
  if (scopeTotal - inStock > 0) {
    availabilities.push({ label: OUT_OF_STOCK, count: scopeTotal - inStock });
  }

  return {
    brands,
    availabilities,
    categories,
    priceMin: priceRange._min.price ?? 0,
    priceMax: priceRange._max.price ?? 0,
  };
}

export async function queryCatalogDb(query: CatalogQuery = {}): Promise<CatalogResult> {
  const page = Math.max(1, query.page ?? 1);
  // Capped so a hand-edited `?limit=100000` can't ask for the whole catalogue.
  const limit = Math.min(60, Math.max(1, query.limit ?? 24));
  const skip = (page - 1) * limit;

  const where = fullWhere(query);
  const orderBy = ORDER_BY[query.sort ?? "newest"] ?? ORDER_BY.newest;

  const [rows, total, facets, offer] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip, take: limit, select: cardSelect }),
    prisma.product.count({ where }),
    query.withFacets === false ? Promise.resolve(EMPTY_FACETS) : loadFacets(query),
    getActiveOffer(),
  ]);

  return {
    products: rows.map((row) => toCard(row, offer)),
    total,
    hasMore: skip + rows.length < total,
    facets,
  };
}

/**
 * `cache()` dedupes within a single render: the product page's
 * `generateMetadata` and its component both need the same product, and without
 * this that's two identical round trips on every product view.
 */
export const getProductDb = cache(async (slug: string): Promise<CatalogProduct | null> => {
  const [product, offer] = await Promise.all([
    prisma.product.findFirst({
      where: { slug, isPublished: true },
      include: detailInclude,
    }),
    getActiveOffer(),
  ]);
  return product ? toProduct(product, offer) : null;
});

/**
 * Products to show beneath a product.
 *
 * Prefers the same subcategory, then the same department, then anything — but
 * as three bounded queries that stop as soon as `limit` is met, rather than by
 * sorting the whole catalogue.
 */
export async function getRelatedDb(slug: string, limit = 8): Promise<CatalogCard[]> {
  const product = await prisma.product.findFirst({
    where: { slug, isPublished: true },
    select: { id: true, categoryId: true, subcategoryId: true },
  });
  if (!product) return [];

  const collected: CardRow[] = [];
  const seen = new Set<string>([slug]);

  const take = async (where: Prisma.ProductWhereInput) => {
    if (collected.length >= limit) return;
    const rows = await prisma.product.findMany({
      where: {
        ...where,
        isPublished: true,
        slug: { notIn: [...seen] },
      },
      // Best-rated first is a more useful "you might also like" than newest.
      orderBy: [{ rating: "desc" }, { numReviews: "desc" }, { id: "asc" }],
      take: limit - collected.length,
      select: cardSelect,
    });
    for (const row of rows) {
      collected.push(row);
      seen.add(row.slug);
    }
  };

  if (product.subcategoryId) await take({ subcategoryId: product.subcategoryId });
  await take({ categoryId: product.categoryId });
  await take({});

  const offer = await getActiveOffer();
  return collected.map((row) => toCard(row, offer));
}

/** Wishlist and any other "these exact products" read. */
export async function getProductsBySlugsDb(slugs: string[]): Promise<CatalogCard[]> {
  if (!slugs.length) return [];
  const rows = await prisma.product.findMany({
    where: { slug: { in: slugs }, isPublished: true },
    select: cardSelect,
  });

  // Preserve the caller's order — the wishlist shows most-recently-saved first,
  // and `IN (…)` returns rows in whatever order the index hands them over.
  const offer = await getActiveOffer();
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  return slugs.flatMap((slug) => {
    const row = bySlug.get(slug);
    return row ? [toCard(row, offer)] : [];
  });
}

/** Every published slug, for the sitemap. Paged so it never loads all columns. */
export async function getAllPublishedSlugs(skip = 0, take = 5000) {
  return prisma.product.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
    orderBy: { id: "asc" },
    skip,
    take,
  });
}

export async function countPublishedProducts() {
  return prisma.product.count({ where: { isPublished: true } });
}
