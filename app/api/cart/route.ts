import { NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { getOrCreateCart, serializeCart } from "@/app/server/cart";

export async function GET() {
  const cart = await getOrCreateCart();
  return NextResponse.json(await serializeCart(cart));
}

export async function DELETE() {
  const cart = await getOrCreateCart();
  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponCode: null, items: { deleteMany: {} } },
  });
  return NextResponse.json({ items: [], subtotal: 0, couponCode: null, discountPercent: 0, couponWarning: null });
}
