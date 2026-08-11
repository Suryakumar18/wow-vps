import "server-only";
import { prisma } from "./prisma";
import { getActiveOffer, offerFor, offerPrice, offerOriginalPrice } from "./offer";
import {
  heroSlides as staticHeroSlides,
  promoBanners as staticPromoBanners,
  lifestyleBanners as staticLifestyleBanners,
  popularPicks as staticPopularPicks,
  type HeroSlide,
  type Product,
} from "@/app/components-home/data/home-content";

/**
 * Homepage content, read from the CMS tables.
 *
 * Every getter falls back to the approved static copy in two cases: the table
 * is empty, or the read itself failed. An unseeded CMS should never mean an
 * empty page, and a database hiccup should never take the storefront's front
 * door down — the homepage degrades to the approved content instead.
 */

/** Runs a CMS read, falling back to static content if it throws. */
async function withFallback<T>(read: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await read();
  } catch (err) {
    console.error(`Homepage CMS read failed (${label}) — serving static content.`, err);
    return fallback;
  }
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  return withFallback(readHeroSlides, [...staticHeroSlides], "hero slides");
}

async function readHeroSlides(): Promise<HeroSlide[]> {
  const rows = await prisma.heroSlide.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });
  if (rows.length === 0) return [...staticHeroSlides];

  return rows.map((row) => ({
    eyebrow: row.eyebrow,
    titleLines: [row.titleLine1, row.titleLine2] as [string, string],
    description: row.description,
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
    // The design places exactly three script words; pad or trim whatever the
    // CMS holds so a short list can't collapse the layout.
    script: [row.scriptWords[0] ?? "", row.scriptWords[1] ?? "", row.scriptWords[2] ?? ""] as [
      string,
      string,
      string,
    ],
    src: row.imageUrl,
    alt: row.imageAlt,
  }));
}

const TONE = { DARK: "dark", LIGHT: "light", CREAM: "cream" } as const;

export type PromoBanner = (typeof staticPromoBanners)[number];
export type LifestyleBanner = (typeof staticLifestyleBanners)[number];

export async function getPromoBanners(): Promise<PromoBanner[]> {
  return withFallback(readPromoBanners, [...staticPromoBanners], "promo banners");
}

async function readPromoBanners(): Promise<PromoBanner[]> {
  const rows = await prisma.banner.findMany({
    where: { placement: "PROMO", isActive: true },
    orderBy: { position: "asc" },
  });
  if (rows.length === 0) return [...staticPromoBanners];

  return rows.map((row) => ({
    id: row.id,
    shortTitle: row.eyebrow ?? row.titleLine1,
    tone: TONE[row.tone] as PromoBanner["tone"],
    eyebrow: row.eyebrow ?? "",
    titleLines: [row.titleLine1, row.titleLine2].filter(Boolean),
    description: row.description,
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
    src: row.imageUrl,
    alt: row.imageAlt,
  })) as PromoBanner[];
}

export async function getLifestyleBanners(): Promise<LifestyleBanner[]> {
  return withFallback(readLifestyleBanners, [...staticLifestyleBanners], "lifestyle banners");
}

async function readLifestyleBanners(): Promise<LifestyleBanner[]> {
  const rows = await prisma.banner.findMany({
    where: { placement: "LIFESTYLE", isActive: true },
    orderBy: { position: "asc" },
  });
  if (rows.length === 0) return [...staticLifestyleBanners];

  return rows.map((row) => ({
    id: row.id,
    tone: TONE[row.tone] as LifestyleBanner["tone"],
    title: row.titleLine1,
    description: row.description,
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
    src: row.imageUrl,
    alt: row.imageAlt,
  })) as LifestyleBanner[];
}

/** "Deals of the Day" — explicitly flagged products, else the biggest savings. */
export async function getDealProducts(limit = 6): Promise<Product[]> {
  return withFallback(() => readDealProducts(limit), [], "deal products");
}

async function readDealProducts(limit: number): Promise<Product[]> {
  const flagged = await prisma.product.findMany({
    where: { isDeal: true, isPublished: true },
    include: { brand: true, images: { orderBy: { position: "asc" }, take: 1 } },
    take: limit,
  });

  const rows = flagged.length
    ? flagged
    : await prisma.product.findMany({
        where: { isPublished: true },
        include: { brand: true, images: { orderBy: { position: "asc" }, take: 1 } },
      });

  const offer = await getActiveOffer();
  return rows
    .filter((r) => r.originalPrice > r.price || offerFor(r.id, offer) !== null)
    .sort((a, b) => b.originalPrice - b.price - (a.originalPrice - a.price))
    .slice(0, limit)
    .map((row) => {
      const applied = offerFor(row.id, offer);
      const price = offerPrice(row.price, applied);
      const mrp = offerOriginalPrice(row.price, row.originalPrice, applied);
      return {
        id: row.slug,
        title: row.title,
        subtitle: row.brand.name,
        price,
        mrp,
        discount: Math.round(((mrp - price) / mrp) * 100),
        rating: row.rating,
        reviews: row.numReviews,
        stock: row.totalStock,
        href: `/product/${row.slug}`,
        src: row.images[0]?.url ?? "",
        alt: row.title,
      };
    });
}

/** "Popular Picks" — products flagged featured in the admin panel. */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return withFallback(() => readFeaturedProducts(limit), [...staticPopularPicks], "featured products");
}

async function readFeaturedProducts(limit: number): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { isFeatured: true, isPublished: true },
    include: { brand: true, images: { orderBy: { position: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  if (rows.length === 0) return [...staticPopularPicks];

  const offer = await getActiveOffer();
  return rows.map((row) => {
    const applied = offerFor(row.id, offer);
    const price = offerPrice(row.price, applied);
    const mrp = offerOriginalPrice(row.price, row.originalPrice, applied);
    return {
      id: row.slug,
      title: row.title,
      subtitle: row.brand.name,
      price,
      mrp,
      discount: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : undefined,
      rating: row.rating,
      reviews: row.numReviews,
      stock: row.totalStock,
      href: `/product/${row.slug}`,
      src: row.images[0]?.url ?? "",
      alt: row.title,
    };
  });
}
