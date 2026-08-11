import "server-only";
import { prisma } from "./prisma";
import { getOrCreateSessionId } from "./session";
import type { CartItem } from "@/app/components-home/lib/CartContext";
import { Prisma } from "@/app/generated/prisma/client";

const cartInclude = {
  items: {
    include: {
      product: { include: { brand: true, category: true, images: { orderBy: { position: "asc" } } } },
    },
  },
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export async function getOrCreateCart(): Promise<CartWithItems> {
  const sessionId = await getOrCreateSessionId();
  const existing = await prisma.cart.findUnique({ where: { sessionId }, include: cartInclude });
  if (existing) return existing;
  return prisma.cart.create({ data: { sessionId }, include: cartInclude });
}

export interface SerializedCart {
  items: CartItem[];
  subtotal: number;
  couponCode: string | null;
  discountPercent: number;
  couponWarning: string | null;
}

/**
 * Turns DB rows into the shape `CartContext` already exposes to the rest of
 * the app, and re-validates the applied coupon against the current subtotal
 * on every read — same rule `CartContext` enforced client-side against
 * localStorage: a coupon that no longer meets its minimum order is dropped,
 * not silently kept.
 */
export async function serializeCart(cart: CartWithItems): Promise<SerializedCart> {
  const items: CartItem[] = cart.items.map((item) => ({
    id: item.product.slug,
    title: item.product.title,
    price: item.product.price,
    image: item.product.images[0]?.url ?? "",
    quantity: item.quantity,
    brand: item.product.brand.name,
    category: item.product.category.slug,
    totalStock: item.product.totalStock,
    shippingFee: item.product.shippingFee,
    gstPercent: item.product.gstPercent,
  }));

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  let couponCode = cart.couponCode;
  let discountPercent = 0;
  let couponWarning: string | null = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (coupon && coupon.active && subtotal >= coupon.minOrder) {
      discountPercent = coupon.percentOff;
    } else {
      const minOrder = coupon?.minOrder ?? 0;
      couponWarning = coupon
        ? `${couponCode} was removed — your order dropped below the ₹${minOrder.toLocaleString("en-IN")} minimum.`
        : `${couponCode} is no longer valid.`;
      couponCode = null;
      await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
    }
  }

  return { items, subtotal, couponCode, discountPercent, couponWarning };
}

export async function checkCouponAgainstDb(
  rawCode: string,
  subtotal: number,
): Promise<{ ok: true; code: string; percentOff: number } | { ok: false; message: string }> {
  const code = rawCode.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.active) return { ok: false, message: "That code isn't valid." };
  if (subtotal < coupon.minOrder) {
    return {
      ok: false,
      message: `Spend ₹${coupon.minOrder.toLocaleString("en-IN")} to use ${coupon.code}.`,
    };
  }
  return { ok: true, code: coupon.code, percentOff: coupon.percentOff };
}
