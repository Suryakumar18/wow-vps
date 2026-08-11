import type { MetadataRoute } from "next";
import { prisma } from "@/app/server/prisma";
import { siteUrl } from "@/app/server/env";

/**
 * Sitemap.
 *
 * With three thousand product pages this is the main way they get discovered —
 * a crawler will not find them all by following the storefront's own paging.
 *
 * Two constraints shape it:
 *
 *  - The sitemap protocol caps a file at 50,000 URLs and 50 MB. Three thousand
 *    products fits comfortably today, but the query is capped explicitly rather
 *    than relying on that staying true.
 *  - Only slug and `updatedAt` are selected. Building this from full product
 *    rows would repeat exactly the mistake the catalogue query layer was
 *    rewritten to fix.
 *
 * Regenerated hourly, which is far more often than a catalogue changes and far
 * less often than it's crawled.
 */

export const revalidate = 3600;

const MAX_URLS = 45_000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/category/all`, changeFrequency: "daily", priority: 0.8 },
  ];

  try {
    const [categories, products] = await Promise.all([
      prisma.category.findMany({
        where: { products: { some: { isPublished: true } } },
        select: { slug: true },
        orderBy: { position: "asc" },
      }),
      prisma.product.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: MAX_URLS,
      }),
    ]);

    return [
      ...staticRoutes,
      ...categories.map((c) => ({
        url: `${base}/category/${c.slug}`,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
      ...products.map((p) => ({
        url: `${base}/product/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch (err) {
    // A database hiccup should cost the sitemap its product entries for an
    // hour, not return a 500 that a crawler may treat as the site being down.
    console.error("Sitemap generation failed — serving static routes only.", err);
    return staticRoutes;
  }
}
