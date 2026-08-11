import { EXPRESS_SURCHARGE } from "../data/home-content";

export type DeliveryMethodId = "standard" | "express";

export interface OrderTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  gst: number;
  total: number;
}

/** Only the fields computeTotals needs — keeps this file untied to CartItem so
 *  server code can call it without importing a "use client" module. */
export interface PricedItem {
  price: number;
  quantity: number;
  shippingFee?: number;
  gstPercent?: number;
}

/**
 * The single place order maths happens.
 *
 * Every consumer (Cart preview, Checkout, Order snapshot) calls this so a
 * change to shipping / GST rules never ships as two different answers. Rules:
 *
 * - Shipping is per line, not per unit: buying two of the same product ships
 *   once. Missing/zero `shippingFee` counts as free shipping for that item.
 * - GST is per line: `round(price * qty * percent / 100)`, summed. A product
 *   with `gstPercent = 0` (or missing) adds no tax.
 * - Discount % applies to the pre-tax, pre-shipping subtotal — matches how the
 *   coupon system was already computing it before per-product tax existed.
 * - Express delivery adds a flat surcharge on top of the summed product
 *   shipping so the delivery-method picker still has real weight.
 */
export function computeTotals(
  items: PricedItem[],
  discountPercent: number,
  deliveryMethod: DeliveryMethodId = "standard",
): OrderTotals {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = discountPercent > 0 ? Math.round((subtotal * discountPercent) / 100) : 0;

  const gst = items.reduce((sum, item) => {
    const pct = item.gstPercent ?? 0;
    if (pct <= 0) return sum;
    return sum + Math.round((item.price * item.quantity * pct) / 100);
  }, 0);

  const productShipping = items.reduce((sum, item) => sum + (item.shippingFee ?? 0), 0);
  const surcharge = deliveryMethod === "express" ? EXPRESS_SURCHARGE : 0;
  const shipping = subtotal <= 0 ? 0 : productShipping + surcharge;

  return {
    subtotal,
    discount,
    shipping,
    gst,
    total: subtotal - discount + shipping + gst,
  };
}
