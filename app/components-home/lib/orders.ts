"use client";

import type { CartItem } from "./CartContext";
import type { DeliveryMethodId, OrderTotals } from "./pricing";
import type { Address } from "./addresses";

export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  placedAt: string;
  items: CartItem[];
  address: Address;
  deliveryMethod: DeliveryMethodId;
  paymentMethodLabel: string;
  totals: OrderTotals;
  status: OrderStatus;
}

/**
 * Order history — backed by Postgres via `/api/orders`, scoped to this
 * browser's session cookie. Checkout writes the record; `/orders` and
 * `/orders/[id]` read the same data back, so nothing shown is fabricated
 * after the fact.
 */
export async function getOrders(): Promise<Order[]> {
  const res = await fetch("/api/orders");
  return res.ok ? res.json() : [];
}

export async function getOrder(id: string): Promise<Order | null> {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}`);
  if (res.ok) return res.json();

  // Fallback for guests: if this browser doesn't own the session that placed
  // the order but the shopper looked it up by phone recently, retry with that
  // phone as a query param so the server can still return it.
  const phone =
    typeof window !== "undefined" ? localStorage.getItem("orders-lookup-phone") : null;
  if (phone) {
    const retry = await fetch(
      `/api/orders/${encodeURIComponent(id)}?phone=${encodeURIComponent(phone)}`,
    );
    if (retry.ok) return retry.json();
  }
  return null;
}

export async function getLastOrder(): Promise<Order | null> {
  const res = await fetch("/api/orders/last");
  return res.ok ? res.json() : null;
}

/**
 * Look up orders by shipping-address phone. Used on /orders when the current
 * browser session hasn't placed anything — a returning customer on a fresh
 * device can still find their history.
 */
export async function lookupOrdersByPhone(phone: string): Promise<Order[]> {
  const res = await fetch("/api/orders/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) return [];
  const body = (await res.json()) as { orders: Order[] };
  return body.orders;
}

export async function createOrder(input: {
  items: CartItem[];
  address: Address;
  deliveryMethod: DeliveryMethodId;
  paymentMethodLabel: string;
  totals: OrderTotals;
}): Promise<Order> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to place order");
  return res.json();
}
