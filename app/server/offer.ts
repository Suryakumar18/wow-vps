import "server-only";
import { prisma } from "./prisma";

/**
 * The sitewide sale, if one is switched on in the admin panel.
 *
 * Price application happens in the serializers that hand products to the
 * storefront (catalog cards + detail, homepage rows, the cart), so every
 * surface — including checkout totals and the snapshots orders keep —
 * agrees on the same discounted number.
 */

export interface ActiveOffer {
  id: string;
  title: string;
  percent: number;
  couponCode: string | null;
  imageUrl: string | null;
  /** Product cuids the offer covers; empty = the whole store. */
  productIds: string[];
}

export async function getActiveOffer(): Promise<ActiveOffer | null> {
  const offer = await prisma.offer.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });
  if (!offer) return null;
  return {
    id: offer.id,
    title: offer.title,
    percent: offer.percent,
    couponCode: offer.couponCode,
    imageUrl: offer.imageUrl,
    productIds: offer.productIds,
  };
}

/**
 * The offer as it applies to ONE product: the offer itself when it's
 * sitewide or lists this product, `null` otherwise. Serializers call this
 * per row so a scoped sale discounts exactly the chosen products.
 */
export function offerFor(productId: string, offer: ActiveOffer | null): ActiveOffer | null {
  if (!offer) return null;
  if (offer.productIds.length === 0) return offer;
  return offer.productIds.includes(productId) ? offer : null;
}

/** Sale price under an offer — whole rupees, never below ₹1. */
export function offerPrice(price: number, offer: ActiveOffer | null): number {
  if (!offer || offer.percent <= 0) return price;
  return Math.max(1, Math.round((price * (100 - offer.percent)) / 100));
}

/**
 * The strike-through price shown next to a sale price: at least the
 * product's own pre-offer selling price, so an active offer always has a
 * visible saving even on products that had no MRP discount.
 */
export function offerOriginalPrice(
  price: number,
  originalPrice: number,
  offer: ActiveOffer | null,
): number {
  if (!offer || offer.percent <= 0) return originalPrice;
  return Math.max(originalPrice, price);
}
