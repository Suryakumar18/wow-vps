import "server-only";
import { prisma } from "./prisma";
import { getOrCreateSessionId } from "./session";
import { getCurrentUser } from "./auth";
import { notify } from "./notifications";
import { sendOrderPlacedWhatsApp } from "./whatsapp";
import { formatPrice } from "@/app/components-home/lib/format";
import type { CartItem } from "@/app/components-home/lib/CartContext";
import type { Address } from "@/app/components-home/lib/addresses";
import type { DeliveryMethodId, OrderTotals } from "@/app/components-home/lib/pricing";
import type { Order, OrderStatus } from "@/app/components-home/lib/orders";
import { Prisma } from "@/app/generated/prisma/client";

const orderInclude = { items: true } satisfies Prisma.OrderInclude;
type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function toOrder(row: OrderWithItems): Order {
  return {
    id: row.orderNumber,
    placedAt: row.placedAt.toISOString(),
    items: row.items.map((item) => ({
      id: item.id,
      title: item.titleSnapshot,
      price: item.priceSnapshot,
      image: item.imageSnapshot,
      quantity: item.quantity,
      totalStock: 0,
    })),
    address: {
      id: "snapshot",
      label: row.addressLabel,
      name: row.addressName ?? undefined,
      line: row.addressLine,
      phone: row.addressPhone,
    },
    deliveryMethod: row.deliveryMethod.toLowerCase() as DeliveryMethodId,
    paymentMethodLabel: row.paymentMethodLabel,
    totals: {
      subtotal: row.subtotal,
      discount: row.discount,
      shipping: row.shipping,
      gst: row.gst,
      total: row.total,
    },
    status: row.status.toLowerCase() as OrderStatus,
  };
}

/** Generates a WOW-prefixed order id, per the approved order-confirmation design. */
function generateOrderNumber(): string {
  const digits = Math.floor(100_000_000 + Math.random() * 900_000_000);
  return `WOW${digits}`;
}

/**
 * Signed-in customers see their account's orders (any device) plus anything
 * this browser session placed before they logged in; guests see the session's.
 */
export async function getOrdersDb(): Promise<Order[]> {
  const [sessionId, user] = await Promise.all([getOrCreateSessionId(), getCurrentUser()]);
  const rows = await prisma.order.findMany({
    where: user ? { OR: [{ userId: user.id }, { sessionId }] } : { sessionId },
    include: orderInclude,
    orderBy: { placedAt: "desc" },
  });
  return rows.map(toOrder);
}

export async function getOrderDb(orderNumber: string): Promise<Order | null> {
  const [sessionId, user] = await Promise.all([getOrCreateSessionId(), getCurrentUser()]);
  const row = await prisma.order.findFirst({
    where: {
      orderNumber,
      ...(user ? { OR: [{ userId: user.id }, { sessionId }] } : { sessionId }),
    },
    include: orderInclude,
  });
  return row ? toOrder(row) : null;
}

/**
 * Guest order lookup. Returns every order whose *shipping-address phone*
 * matches the digits given — sessionId is ignored.
 *
 * Security posture: anyone who knows a customer's phone number can list the
 * orders placed to that number. This mirrors "call support with your phone
 * number" flows; upgrading to OTP would need an SMS provider. Callers who
 * want stronger proof-of-identity must add one.
 */
export async function lookupOrdersByPhoneDb(phone: string): Promise<Order[]> {
  // Normalise: strip anything that isn't a digit before comparing, and match
  // by the trailing 10 digits so "+91 98…", "98…", "0098…" all resolve to
  // the same customer without a schema migration.
  const digits = phone.replace(/\D+/g, "");
  if (digits.length < 8) return [];
  const trail = digits.slice(-10);

  const rows = await prisma.order.findMany({
    where: { addressPhone: { contains: trail } },
    include: orderInclude,
    orderBy: { placedAt: "desc" },
    take: 50,
  });
  return rows.map(toOrder);
}

export async function getOrderByNumberForPhoneDb(
  orderNumber: string,
  phone: string,
): Promise<Order | null> {
  const digits = phone.replace(/\D+/g, "");
  if (digits.length < 8) return null;
  const trail = digits.slice(-10);
  const row = await prisma.order.findFirst({
    where: { orderNumber, addressPhone: { contains: trail } },
    include: orderInclude,
  });
  return row ? toOrder(row) : null;
}

export async function getLastOrderDb(): Promise<Order | null> {
  const [sessionId, user] = await Promise.all([getOrCreateSessionId(), getCurrentUser()]);
  const row = await prisma.order.findFirst({
    where: user ? { OR: [{ userId: user.id }, { sessionId }] } : { sessionId },
    include: orderInclude,
    orderBy: { placedAt: "desc" },
  });
  return row ? toOrder(row) : null;
}

/**
 * The order already written for a Razorpay payment, if any. Lets the verify
 * endpoint be idempotent: the client retries verification when a response is
 * lost in transit, and a retry must return the order the first attempt
 * created — never charge-once-order-twice.
 */
export async function getOrderByPaymentIdDb(razorpayPaymentId: string): Promise<Order | null> {
  const row = await prisma.order.findFirst({
    where: { razorpayPaymentId },
    include: orderInclude,
  });
  return row ? toOrder(row) : null;
}

export async function createOrderDb(input: {
  items: CartItem[];
  address: Address;
  deliveryMethod: DeliveryMethodId;
  paymentMethodLabel: string;
  totals: OrderTotals;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}): Promise<Order> {
  const [sessionId, user] = await Promise.all([getOrCreateSessionId(), getCurrentUser()]);

  // Resolve each cart item's slug back to a real Product row so the order
  // item can still link to it; the display fields below are snapshotted
  // independently and never depend on that product existing later.
  const slugs = input.items.map((item) => item.id);
  const products = await prisma.product.findMany({ where: { slug: { in: slugs } } });
  const productIdBySlug = new Map(products.map((p) => [p.slug, p.id]));

  const row = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      sessionId,
      // Tied to the account when the shopper is signed in, so "My Orders"
      // finds it from any of their devices, not just this browser.
      userId: user?.id ?? null,
      status: "PROCESSING",
      deliveryMethod: input.deliveryMethod.toUpperCase() as Prisma.OrderCreateInput["deliveryMethod"],
      paymentMethodLabel: input.paymentMethodLabel,
      subtotal: input.totals.subtotal,
      discount: input.totals.discount,
      shipping: input.totals.shipping,
      gst: input.totals.gst,
      total: input.totals.total,
      addressLabel: input.address.label,
      addressName: input.address.name ?? null,
      addressLine: input.address.line,
      addressPhone: input.address.phone,
      razorpayOrderId: input.razorpayOrderId ?? null,
      razorpayPaymentId: input.razorpayPaymentId ?? null,
      items: {
        create: input.items.map((item) => ({
          quantity: item.quantity,
          titleSnapshot: item.title,
          priceSnapshot: item.price,
          imageSnapshot: item.image,
          productId: productIdBySlug.get(item.id) ?? null,
        })),
      },
    },
    include: orderInclude,
  });

  // The order owns these items now — clear the server-side cart so already-
  // bought products can't resurrect in the next visit's basket. The client
  // also clears its own state, but that request is fire-and-forget and dies
  // with the tab; this is the authoritative cleanup. Never fails the order.
  try {
    const carts = await prisma.cart.findMany({
      where: user ? { OR: [{ userId: user.id }, { sessionId }] } : { sessionId },
      select: { id: true },
    });
    if (carts.length > 0) {
      const cartIds = carts.map((c) => c.id);
      await prisma.cartItem.deleteMany({ where: { cartId: { in: cartIds } } });
      await prisma.cart.updateMany({ where: { id: { in: cartIds } }, data: { couponCode: null } });
    }
  } catch (err) {
    console.error("Couldn't clear cart after order:", err);
  }

  // Units, not line items — an order of one product ×2 is two things to pack.
  const units = input.items.reduce((n, item) => n + item.quantity, 0);

  await notify({
    type: "order",
    title: `New order ${row.orderNumber}`,
    body: `${units} ${units === 1 ? "unit" : "units"} · ${formatPrice(input.totals.total)} · ${input.address.name ?? input.address.label}`,
    href: `/admin/orders/${row.id}`,
  });

  // WhatsApp pings: confirmation to the customer, alert to the admin number.
  // Awaited so serverless doesn't kill them mid-flight, but they never throw —
  // a failed message must not fail an order that's already been paid for.
  await sendOrderPlacedWhatsApp({
    orderId: row.id,
    orderNumber: row.orderNumber,
    units,
    totalLabel: formatPrice(input.totals.total),
    customerName: input.address.name ?? input.address.label,
    customerPhone: input.address.phone,
  });

  return toOrder(row);
}
