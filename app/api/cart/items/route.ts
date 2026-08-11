import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { getOrCreateCart, serializeCart } from "@/app/server/cart";

/** Adds one unit of a product to the cart, clamped to available stock — mirrors the old `addToCart`. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const productSlug = typeof body?.productId === "string" ? body.productId : null;
  if (!productSlug) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { slug: productSlug } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (product.totalStock <= 0) {
    return NextResponse.json({ error: "Out of stock" }, { status: 409 });
  }

  const cart = await getOrCreateCart();
  const existing = cart.items.find((item) => item.productId === product.id);

  if (existing) {
    if (existing.quantity < product.totalStock) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + 1 },
      });
    }
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId: product.id, quantity: 1 },
    });
  }

  const fresh = await getOrCreateCart();
  return NextResponse.json(await serializeCart(fresh));
}
