import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { getOrCreateCart, serializeCart } from "@/app/server/cart";

/** Sets an item's quantity, clamped to 1…stock — mirrors the old `setQuantity`. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId: slug } = await params;
  const body = await request.json().catch(() => null);
  const quantity = Number(body?.quantity);
  if (!Number.isFinite(quantity)) {
    return NextResponse.json({ error: "quantity must be a number" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const cart = await getOrCreateCart();
  const existing = cart.items.find((item) => item.productId === product.id);
  if (existing) {
    const clamped = Math.max(1, Math.min(Math.round(quantity), product.totalStock));
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: clamped } });
  }

  const fresh = await getOrCreateCart();
  return NextResponse.json(await serializeCart(fresh));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId: slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  const cart = await getOrCreateCart();

  if (product) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId: product.id } });
  }

  const fresh = await getOrCreateCart();
  return NextResponse.json(await serializeCart(fresh));
}
