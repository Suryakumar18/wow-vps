/**
 * Writes a normalised import into the catalogue.
 *
 * Three constraints shape this:
 *
 * 1. **Round trips, not row count, are the cost.** `DATABASE_URL` points at the
 *    Supabase pooler, where each statement carries real latency. 3,000 products
 *    inserted one at a time is ~9,000 round trips and several minutes; batched
 *    with `createManyAndReturn` it's a few dozen and a few seconds.
 *
 * 2. **No interactive transaction wrapping the whole import.** The pooler runs
 *    in transaction mode, and a long-lived interactive transaction holds a
 *    pooled connection hostage for the duration. Instead every step is written
 *    to be *idempotent* — re-running the same file converges rather than
 *    duplicating — which is worth more than all-or-nothing for a bulk load: a
 *    run that dies at row 2,400 is fixed by running it again.
 *
 * 3. **Partial success must be legible.** The report names what was created,
 *    updated, skipped and why, keyed to the line number in the operator's own
 *    file.
 */

import type { PrismaClient } from "@/app/generated/prisma/client";
import { slugify, type ImportProduct, type RowIssue } from "./normalize";

export interface ImportOptions {
  /** Validate and report without writing anything. */
  dryRun?: boolean;
  /** Rows per round trip. 200 keeps each statement well under parameter limits. */
  batchSize?: number;
  /**
   * What to do with a slug that already exists. `skip` protects hand-edited
   * products from being flattened by a re-import; `update` makes the file the
   * source of truth.
   */
  onConflict?: "skip" | "update";
  onProgress?: (done: number, total: number) => void;
}

export interface ImportReport {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  /** Rows the database rejected. Named individually in `issues`. */
  failed: number;
  categoriesCreated: string[];
  subcategoriesCreated: string[];
  brandsCreated: string[];
  issues: RowIssue[];
  durationMs: number;
  dryRun: boolean;
}

const chunk = <T,>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

/** Matching is case- and punctuation-insensitive so "RC Cars" == "rc-cars". */
const key = (value: string) => slugify(value) || value.trim().toLowerCase();

export async function runImport(
  prisma: PrismaClient,
  products: ImportProduct[],
  priorIssues: RowIssue[] = [],
  options: ImportOptions = {},
): Promise<ImportReport> {
  const started = Date.now();
  const { dryRun = false, batchSize = 200, onConflict = "update", onProgress } = options;

  const issues: RowIssue[] = [...priorIssues];
  const report: ImportReport = {
    total: products.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    categoriesCreated: [],
    subcategoriesCreated: [],
    brandsCreated: [],
    issues,
    durationMs: 0,
    dryRun,
  };

  if (!products.length) {
    report.durationMs = Date.now() - started;
    return report;
  }

  /* ---------------------------------------------------------------- */
  /* 1. Resolve categories, subcategories and brands                    */
  /*                                                                    */
  /* A 3,000-row file references maybe 20 categories and 100 brands.    */
  /* Load them once, create what's missing in one statement each, and   */
  /* the per-product loop becomes pure map lookups.                     */
  /* ---------------------------------------------------------------- */

  const [existingCategories, existingBrands] = await Promise.all([
    prisma.category.findMany({ select: { id: true, slug: true, name: true } }),
    prisma.brand.findMany({ select: { id: true, name: true } }),
  ]);

  const categoryIds = new Map<string, string>();
  for (const c of existingCategories) {
    categoryIds.set(key(c.slug), c.id);
    categoryIds.set(key(c.name), c.id);
  }
  const brandIds = new Map<string, string>();
  for (const b of existingBrands) brandIds.set(key(b.name), b.id);

  const missingCategories = new Map<string, string>();
  const missingBrands = new Map<string, string>();
  for (const p of products) {
    if (p.category && !categoryIds.has(key(p.category)) && !missingCategories.has(key(p.category))) {
      missingCategories.set(key(p.category), p.category);
    }
    if (p.brand && !brandIds.has(key(p.brand)) && !missingBrands.has(key(p.brand))) {
      missingBrands.set(key(p.brand), p.brand);
    }
  }

  if (!dryRun && missingCategories.size) {
    const created = await prisma.category.createManyAndReturn({
      data: [...missingCategories.entries()].map(([slug, name]) => ({
        slug,
        name,
        shortTitle: name,
        titleLine1: name,
        // New departments stay out of the homepage grid and the nav until
        // someone gives them artwork — an import shouldn't silently reshape
        // the storefront's navigation.
        showOnHome: false,
        showInNav: false,
      })),
      select: { id: true, slug: true, name: true },
      skipDuplicates: true,
    });
    for (const c of created) {
      categoryIds.set(key(c.slug), c.id);
      categoryIds.set(key(c.name), c.id);
    }
    report.categoriesCreated = created.map((c) => c.name);
  } else if (dryRun) {
    report.categoriesCreated = [...missingCategories.values()];
  }

  if (!dryRun && missingBrands.size) {
    const created = await prisma.brand.createManyAndReturn({
      data: [...missingBrands.values()].map((name) => ({ name })),
      select: { id: true, name: true },
      skipDuplicates: true,
    });
    for (const b of created) brandIds.set(key(b.name), b.id);
    report.brandsCreated = created.map((b) => b.name);
  } else if (dryRun) {
    report.brandsCreated = [...missingBrands.values()];
  }

  // Subcategories are scoped to a category, so they can only be resolved once
  // the category ids above exist.
  const subcategoryIds = new Map<string, string>();
  const subKey = (categoryId: string, name: string) => `${categoryId}:${key(name)}`;

  const existingSubs = await prisma.subcategory.findMany({
    select: { id: true, slug: true, name: true, categoryId: true },
  });
  for (const s of existingSubs) {
    subcategoryIds.set(subKey(s.categoryId, s.slug), s.id);
    subcategoryIds.set(subKey(s.categoryId, s.name), s.id);
  }

  const missingSubs = new Map<string, { categoryId: string; slug: string; name: string }>();
  for (const p of products) {
    if (!p.subcategory) continue;
    const categoryId = categoryIds.get(key(p.category));
    if (!categoryId) continue;
    const k = subKey(categoryId, p.subcategory);
    if (!subcategoryIds.has(k) && !missingSubs.has(k)) {
      missingSubs.set(k, { categoryId, slug: key(p.subcategory), name: p.subcategory });
    }
  }

  if (!dryRun && missingSubs.size) {
    const created = await prisma.subcategory.createManyAndReturn({
      data: [...missingSubs.values()],
      select: { id: true, slug: true, name: true, categoryId: true },
      skipDuplicates: true,
    });
    for (const s of created) {
      subcategoryIds.set(subKey(s.categoryId, s.slug), s.id);
      subcategoryIds.set(subKey(s.categoryId, s.name), s.id);
    }
    report.subcategoriesCreated = created.map((s) => s.name);
  } else if (dryRun) {
    report.subcategoriesCreated = [...missingSubs.values()].map((s) => s.name);
  }

  /* ---------------------------------------------------------------- */
  /* 2. Write products in batches                                       */
  /* ---------------------------------------------------------------- */

  let processed = 0;

  for (const batch of chunk(products, batchSize)) {
    const slugs = batch.map((p) => p.slug);
    const skus = batch.map((p) => p.sku).filter((s): s is string => !!s);

    // Match on SKU *or* slug in one round trip. SKU wins where both exist: it
    // survives a title (and therefore slug) change, which is exactly the case
    // that would otherwise duplicate the whole catalogue on a second import.
    const existing = await prisma.product.findMany({
      where: { OR: [{ slug: { in: slugs } }, ...(skus.length ? [{ sku: { in: skus } }] : [])] },
      select: { id: true, slug: true, sku: true },
    });
    const idBySlug = new Map(existing.map((p) => [p.slug, p.id]));
    const idBySku = new Map(existing.filter((p) => p.sku).map((p) => [p.sku!, p.id]));

    const existingId = (p: ImportProduct) =>
      (p.sku ? idBySku.get(p.sku) : undefined) ?? idBySlug.get(p.slug);

    const toCreate: ImportProduct[] = [];
    const toUpdate: { product: ImportProduct; id: string }[] = [];

    for (const p of batch) {
      const categoryId = categoryIds.get(key(p.category));
      if (!categoryId) {
        // Only reachable in a dry run, where no categories were created.
        issues.push({
          line: p.line,
          field: "category",
          message: `"${p.title}": category "${p.category}" would be created on a real run.`,
          severity: "warning",
        });
        report.skipped++;
        continue;
      }
      const id = existingId(p);
      if (id) {
        if (onConflict === "skip") {
          report.skipped++;
          issues.push({
            line: p.line,
            field: "slug",
            message: `"${p.sku ?? p.slug}" already exists — left untouched.`,
            severity: "warning",
          });
        } else {
          toUpdate.push({ product: p, id });
        }
      } else {
        toCreate.push(p);
      }
    }

    if (dryRun) {
      report.created += toCreate.length;
      report.updated += toUpdate.length;
      processed += batch.length;
      onProgress?.(processed, products.length);
      continue;
    }

    const rowsFor = (p: ImportProduct) => {
      const categoryId = categoryIds.get(key(p.category))!;
      const subcategoryId = p.subcategory
        ? (subcategoryIds.get(subKey(categoryId, p.subcategory)) ?? null)
        : null;
      return {
        slug: p.slug,
        sku: p.sku,
        title: p.title,
        price: p.price,
        originalPrice: p.originalPrice,
        totalStock: p.totalStock,
        rating: p.rating,
        numReviews: p.numReviews,
        description: p.description,
        aboutFeatures: p.aboutFeatures,
        idealFor: p.idealFor,
        isPublished: p.isPublished,
        isFeatured: p.isFeatured,
        isDeal: p.isDeal,
        categoryId,
        subcategoryId,
        brandId: brandIds.get(key(p.brand))!,
      };
    };

    /** Child rows are always replaced wholesale — a partial merge of an image
     *  list has no sensible meaning, and position ordering must stay dense. */
    const childRows = (productId: string, p: ImportProduct) => ({
      images: p.images.map((url, position) => ({ productId, url, position })),
      videos: p.videos.map((url, position) => ({ productId, url, position })),
      specifications: p.specifications.map((s, position) => ({
        productId,
        label: s.label,
        value: s.value,
        position,
      })),
    });

    if (toCreate.length) {
      const created = await prisma.product.createManyAndReturn({
        data: toCreate.map(rowsFor),
        select: { id: true, slug: true },
        skipDuplicates: true,
      });
      const idBySlug = new Map(created.map((p) => [p.slug, p.id]));

      const images: { productId: string; url: string; position: number }[] = [];
      const videos: { productId: string; url: string; position: number }[] = [];
      const specs: { productId: string; label: string; value: string; position: number }[] = [];
      for (const p of toCreate) {
        const id = idBySlug.get(p.slug);
        if (!id) continue;
        const rows = childRows(id, p);
        images.push(...rows.images);
        videos.push(...rows.videos);
        specs.push(...rows.specifications);
      }

      await Promise.all([
        images.length ? prisma.productImage.createMany({ data: images }) : null,
        videos.length ? prisma.productVideo.createMany({ data: videos }) : null,
        specs.length ? prisma.productSpecification.createMany({ data: specs }) : null,
      ]);

      report.created += created.length;
    }

    if (toUpdate.length) {
      const ids = toUpdate.map((u) => u.id);

      // Clear all three child tables for the batch in one statement each, then
      // re-insert — far cheaper than diffing per product.
      await Promise.all([
        prisma.productImage.deleteMany({ where: { productId: { in: ids } } }),
        prisma.productVideo.deleteMany({ where: { productId: { in: ids } } }),
        prisma.productSpecification.deleteMany({ where: { productId: { in: ids } } }),
      ]);

      // Prisma has no bulk update with per-row values; these run concurrently so
      // the batch still costs roughly one round trip of wall clock, not N.
      //
      // `allSettled`, not `all`: a row matched by SKU whose new slug collides
      // with a different existing product is a real (if rare) rejection, and it
      // must cost that one row rather than the other 199 in the batch.
      const results = await Promise.allSettled(
        toUpdate.map((u) => prisma.product.update({ where: { id: u.id }, data: rowsFor(u.product) })),
      );

      const applied: { product: ImportProduct; id: string }[] = [];
      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          applied.push(toUpdate[i]);
          return;
        }
        report.failed++;
        issues.push({
          line: toUpdate[i].product.line,
          field: "slug",
          message: `"${toUpdate[i].product.title}" could not be updated: ${
            result.reason instanceof Error ? result.reason.message.split("\n")[0] : String(result.reason)
          }`,
          severity: "error",
        });
      });

      const images: { productId: string; url: string; position: number }[] = [];
      const videos: { productId: string; url: string; position: number }[] = [];
      const specs: { productId: string; label: string; value: string; position: number }[] = [];
      for (const u of applied) {
        const rows = childRows(u.id, u.product);
        images.push(...rows.images);
        videos.push(...rows.videos);
        specs.push(...rows.specifications);
      }

      await Promise.all([
        images.length ? prisma.productImage.createMany({ data: images }) : null,
        videos.length ? prisma.productVideo.createMany({ data: videos }) : null,
        specs.length ? prisma.productSpecification.createMany({ data: specs }) : null,
      ]);

      report.updated += applied.length;
    }

    processed += batch.length;
    onProgress?.(processed, products.length);
  }

  report.durationMs = Date.now() - started;
  return report;
}
