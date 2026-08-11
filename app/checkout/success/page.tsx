"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, MapPin, PackageSearch, Receipt, Truck } from "lucide-react";
import { getLastOrder, getOrder, type Order } from "@/app/components-home/lib/orders";
import Container from "@/app/components-home/ui/Container";
import Button from "@/app/components-home/ui/Button";
import { formatPrice } from "@/app/components-home/lib/format";

/**
 * Order confirmation — the celebratory screen after a successful Razorpay
 * payment. Checkout passes the freshly paid order's id in the URL
 * (`?order=WOW…`), so this screen shows that exact order; the session-scoped
 * "last order" is only the fallback (direct visits, refreshes on an old URL).
 * Lays out a real receipt: items, shipping address, delivery method, totals
 * with GST when applicable.
 *
 * Animations are staggered top-to-bottom so the eye lands on the checkmark
 * first, then reads the order id, then the receipt — reinforcing "this
 * actually happened" rather than a page that just rendered.
 */
export default function CheckoutSuccessPage() {
  // useSearchParams needs a Suspense boundary to keep this route statically
  // prerenderable.
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  const orderId = useSearchParams().get("order");
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<Order | null> => {
      // By id first — getOrder falls back to the phone-lookup query param on
      // its own — then the session's last order, so a paid customer sees
      // their confirmation even if one of the lookups has nothing.
      if (orderId) {
        const byId = await getOrder(orderId);
        if (byId) return byId;
      }
      return getLastOrder();
    };

    (async () => {
      // The order row is committed before checkout redirects here, so the
      // first attempt should hit; the retries cover a slow connection or a
      // just-set session cookie. Never leave a paid customer at the empty
      // state over one failed fetch.
      for (let attempt = 0; attempt < 3; attempt++) {
        const data = await load().catch(() => null);
        if (cancelled) return;
        if (data) {
          setOrder(data);
          return;
        }
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 700));
      }
      if (!cancelled) setOrder(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // undefined = not checked yet (avoids a flash of the empty state on mount).
  if (order === undefined) return null;

  if (!order) {
    return (
      <Container className="py-16 text-center">
        <PackageSearch size={32} className="mx-auto mb-3 text-slate-300" aria-hidden="true" />
        <h1 className="text-ui font-bold text-ink">No recent order to show</h1>
        <p className="mt-1 text-micro text-slate-500">
          Your order may still be processing — check My Orders in a moment.
        </p>
        <div className="mx-auto mt-4 flex max-w-xs flex-col gap-2.5">
          <Button href="/orders" size="sm" className="w-full">
            View My Orders
          </Button>
          <Button href="/" variant="outline" size="sm" className="w-full">
            Continue Shopping
          </Button>
        </div>
      </Container>
    );
  }

  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  const placedAt = new Date(order.placedAt).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col items-center pb-16">
      {/* Hero band — dark, so the gold checkmark reads as a spotlight moment. */}
      <div className="relative flex w-full flex-col items-center overflow-hidden bg-navy-900 px-gutter pb-16 pt-12">
        {/* Soft radial glow behind the check — pure eye-candy, hidden from AT. */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="pointer-events-none absolute left-1/2 top-4 h-56 w-56 -translate-x-1/2 rounded-full bg-gold-500 blur-3xl"
        />

        <motion.span
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
          className="relative grid h-24 w-24 place-items-center rounded-full bg-gold-500 shadow-[0_16px_48px_-8px_rgba(201,165,90,0.65)]"
        >
          <motion.span
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
          >
            <Check size={44} className="text-navy-900" strokeWidth={3} aria-hidden="true" />
          </motion.span>
        </motion.span>

        {/* Two decorative rings pulsing outward from the badge. */}
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.9 }}
            transition={{ duration: 1.6, delay: 0.15 + i * 0.4, ease: "easeOut" }}
            className="absolute top-12 h-24 w-24 rounded-full border-2 border-gold-500"
          />
        ))}

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
          className="mt-6 text-center text-section font-bold text-white"
        >
          Order placed successfully!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45, ease: "easeOut" }}
          className="mt-1.5 text-center text-micro text-white/70"
        >
          Thank you for shopping with WOW Lifestyle.
        </motion.p>
      </div>

      <Container className="-mt-10 max-w-[32rem]">
        {/* Order-id card floats over the hero seam so the receipt below it
            reads as a separate section without an awkward gap. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55, ease: "easeOut" }}
          className="rounded-xl border border-line bg-white p-5 text-center shadow-[0_20px_50px_-24px_rgba(16,33,53,0.35)]"
        >
          <p className="text-nano font-bold uppercase tracking-[0.14em] text-slate-500">Order ID</p>
          <p className="mt-1 text-promo font-bold tabular-nums text-ink">{order.id}</p>
          <p className="mt-2 text-micro text-slate-500">
            {itemCount} {itemCount === 1 ? "item" : "items"} · {formatPrice(order.totals.total)} ·{" "}
            {order.paymentMethodLabel}
          </p>
          <p className="mt-2 text-nano text-slate-400">Placed on {placedAt}</p>
        </motion.div>

        {/* Receipt — items list, address, totals. */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7, ease: "easeOut" }}
          className="mt-5 overflow-hidden rounded-xl border border-line bg-white"
          aria-labelledby="receipt-heading"
        >
          <header className="flex items-center gap-2 border-b border-line px-5 py-3.5">
            <Receipt size={16} className="text-gold-600" aria-hidden="true" />
            <h2 id="receipt-heading" className="text-ui font-bold text-ink">
              Receipt
            </h2>
          </header>

          <ul className="flex flex-col divide-y divide-line">
            {order.items.map((item, index) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.28, delay: 0.85 + index * 0.06, ease: "easeOut" }}
                className="flex items-center gap-3 px-5 py-3"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-mist">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-micro font-semibold text-ink">{item.title}</p>
                  <p className="text-nano text-slate-500">Qty {item.quantity}</p>
                </div>
                <p className="shrink-0 text-micro font-bold tabular-nums text-ink">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </motion.li>
            ))}
          </ul>

          <dl className="flex flex-col gap-2 border-t border-line px-5 py-4 text-micro">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-medium tabular-nums text-ink">
                {formatPrice(order.totals.subtotal)}
              </dd>
            </div>
            {order.totals.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Discount</dt>
                <dd className="font-medium tabular-nums text-[#0F7B3F]">
                  −{formatPrice(order.totals.discount)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-500">Shipping</dt>
              <dd className="font-medium tabular-nums text-ink">
                {order.totals.shipping === 0 ? "Free" : formatPrice(order.totals.shipping)}
              </dd>
            </div>
            {order.totals.gst > 0 && (
              <div className="flex justify-between">
                <dt className="text-slate-500">GST</dt>
                <dd className="font-medium tabular-nums text-ink">
                  {formatPrice(order.totals.gst)}
                </dd>
              </div>
            )}
            <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3">
              <dt className="text-ui font-bold text-ink">Total Paid</dt>
              <dd className="text-promo font-bold tabular-nums text-ink">
                {formatPrice(order.totals.total)}
              </dd>
            </div>
          </dl>

          <div className="grid gap-3 border-t border-line px-5 py-4 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mist text-gold-600">
                <MapPin size={14} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-nano font-bold uppercase tracking-[0.14em] text-slate-500">
                  Deliver to
                </p>
                <p className="mt-0.5 text-micro font-semibold text-ink">
                  {order.address.name ?? order.address.label}
                </p>
                <p className="mt-0.5 text-nano text-slate-500">{order.address.line}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mist text-gold-600">
                <Truck size={14} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-nano font-bold uppercase tracking-[0.14em] text-slate-500">
                  Delivery
                </p>
                <p className="mt-0.5 text-micro font-semibold capitalize text-ink">
                  {order.deliveryMethod}
                </p>
                <p className="mt-0.5 text-nano text-slate-500">
                  {order.deliveryMethod === "express" ? "1–2 business days" : "5–7 business days"}
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 1.05, ease: "easeOut" }}
          className="mt-5 flex flex-col gap-2.5"
        >
          <Button href={`/orders/${order.id}`} size="md" className="w-full">
            Track Order
          </Button>
          <Button href="/" variant="outline" size="md" className="w-full">
            Continue Shopping
          </Button>
        </motion.div>
      </Container>
    </div>
  );
}
