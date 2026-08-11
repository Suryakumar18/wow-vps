import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { getOrCreateCart, serializeCart, checkCouponAgainstDb } from "@/app/server/cart";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";
  if (!code.trim()) return NextResponse.json({ error: "code is required" }, { status: 400 });

  const cart = await getOrCreateCart();
  const subtotal = cart.items.reduce((total, item) => total + item.product.price * item.quantity, 0);

  const result = await checkCouponAgainstDb(code, subtotal);
  if (!result.ok) {
    // A failed new attempt must not clobber an already-applied, still-valid coupon.
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }

  await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: result.code } });
  const fresh = await getOrCreateCart();
  return NextResponse.json({ ok: true, cart: await serializeCart(fresh) });
}

export async function DELETE() {
  const cart = await getOrCreateCart();
  await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
  const fresh = await getOrCreateCart();
  return NextResponse.json(await serializeCart(fresh));
}
