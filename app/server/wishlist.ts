import "server-only";
import { prisma } from "./prisma";
import { getOrCreateSessionId } from "./session";
import { getProductsBySlugsDb } from "./catalog";
import type { CatalogCard } from "@/app/components-home/data/catalog";

async function getOrCreateWishlist() {
  const sessionId = await getOrCreateSessionId();
  const existing = await prisma.wishlist.findUnique({
    where: { sessionId },
    include: { items: { include: { product: true } } },
  });
  if (existing) return existing;
  return prisma.wishlist.create({
    data: { sessionId },
    include: { items: { include: { product: true } } },
  });
}

export async function getWishlistIds(): Promise<string[]> {
  const wishlist = await getOrCreateWishlist();
  return wishlist.items.map((item) => item.product.slug);
}

export async function getWishlistProducts(): Promise<CatalogCard[]> {
  return getProductsBySlugsDb(await getWishlistIds());
}

export async function addToWishlist(productSlug: string): Promise<string[]> {
  const product = await prisma.product.findUnique({ where: { slug: productSlug } });
  if (product) {
    const wishlist = await getOrCreateWishlist();
    await prisma.wishlistItem.upsert({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId: product.id } },
      update: {},
      create: { wishlistId: wishlist.id, productId: product.id },
    });
  }
  return getWishlistIds();
}

export async function removeFromWishlist(productSlug: string): Promise<string[]> {
  const product = await prisma.product.findUnique({ where: { slug: productSlug } });
  const wishlist = await getOrCreateWishlist();
  if (product) {
    await prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id, productId: product.id },
    });
  }
  return getWishlistIds();
}
