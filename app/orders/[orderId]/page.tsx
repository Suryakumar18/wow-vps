"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  Package,
  PackageCheck,
  Printer,
  Truck,
  XCircle,
} from "lucide-react";
import { getOrder, type Order, type OrderStatus } from "@/app/components-home/lib/orders";
import OrderStatusBadge from "@/app/components-home/OrderStatusBadge";
import Container from "@/app/components-home/ui/Container";
import Button from "@/app/components-home/ui/Button";
import { formatPrice } from "@/app/components-home/lib/format";
import { cn } from "@/app/components-home/lib/cn";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const TIMELINE: {
  label: string;
  hint: string;
  icon: typeof Check;
}[] = [
  { label: "Order Placed", hint: "We received your order.", icon: ClipboardCheck },
  { label: "Confirmed", hint: "Payment cleared.", icon: Check },
  { label: "Packed", hint: "Your parcel is being packed.", icon: Package },
  { label: "Shipped", hint: "On its way to you.", icon: Truck },
  { label: "Delivered", hint: "Enjoy!", icon: PackageCheck },
];

/** How many of the 5 timeline rows are "done" for a given order status. */
const doneCountFor = (status: OrderStatus) => {
  if (status === "delivered") return 5;
  if (status === "shipped") return 4;
  if (status === "processing") return 2; // placed + confirmed, since there's no fulfilment backend
  return 0;
};

export default function OrderDetailsPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getOrder(params?.orderId ?? "").then((data) => {
      if (!cancelled) setOrder(data);
    });
    return () => {
      cancelled = true;
    };
  }, [params?.orderId]);

  if (order === undefined) return null;

  if (!order) {
    return (
      <>
        <MobileHeader title="Order Details" onBack={() => router.back()} />
        <Container className="py-16 text-center">
          <h1 className="text-ui font-bold text-ink">Order not found</h1>
          <p className="mt-1 text-micro text-slate-500">
            It may belong to a different browser session.
          </p>
          <Button href="/orders" size="sm" className="mt-4">
            Back to My Orders
          </Button>
        </Container>
      </>
    );
  }

  const doneCount = doneCountFor(order.status);
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <>
      <MobileHeader title="Order Details" onBack={() => router.back()} />

      <Container className="pt-4 print:pt-0 md:pt-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-promo font-bold text-ink md:text-section">{order.id}</h1>
            <p className="mt-1 text-micro text-slate-500">
              Placed on {dateFormatter.format(new Date(order.placedAt))}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Timeline — dots joined by a vertical rail. Completed segment of
            the rail is a solid green fill that animates from top to bottom
            on mount; pending segment is a dashed slate line so the eye can
            tell "done" from "not yet" without reading a single letter. */}
        <div className="mt-6 rounded-xl border border-line p-4 print:border-none print:p-0 sm:p-5">
          {order.status === "cancelled" ? (
            <p className="flex items-center gap-2 text-micro font-medium text-[#B91C1C]">
              <XCircle size={16} aria-hidden="true" />
              This order was cancelled.
            </p>
          ) : (
            <ol className="relative flex flex-col">
              {/* Full-height dashed rail behind everything. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-3 left-[15px] top-3 w-px border-l border-dashed border-line"
              />
              {/* Green rail on top of the dashed one, sized to the completed
                  fraction. `origin-top` + scaleY makes it "grow" downward on
                  mount rather than snap into place. */}
              {doneCount > 1 && (
                <motion.span
                  aria-hidden="true"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                  style={{
                    height: `calc(((100% - 1.5rem) * ${Math.min(doneCount - 1, TIMELINE.length - 1)}) / ${TIMELINE.length - 1})`,
                  }}
                  className="pointer-events-none absolute left-[15px] top-3 w-0.5 origin-top -translate-x-[1px] rounded bg-[#0F7B3F]"
                />
              )}

              {TIMELINE.map((row, i) => {
                const done = i < doneCount;
                const current = i === doneCount - 1;
                const Icon = row.icon;
                return (
                  <motion.li
                    key={row.label}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.28, delay: 0.15 + i * 0.08, ease: "easeOut" }}
                    className="relative flex items-start gap-3 py-2.5"
                  >
                    <motion.span
                      initial={done ? { scale: 0.6 } : false}
                      animate={done ? { scale: 1 } : {}}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 18,
                        delay: 0.25 + i * 0.08,
                      }}
                      className={cn(
                        "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors",
                        done
                          ? "bg-[#0F7B3F] text-white shadow-[0_0_0_4px_rgba(15,123,63,0.12)]"
                          : "border border-line bg-white text-slate-400",
                      )}
                    >
                      <Icon size={14} strokeWidth={done ? 2.75 : 2} aria-hidden="true" />
                    </motion.span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p
                        className={cn(
                          "text-micro font-semibold",
                          done ? "text-ink" : "text-slate-400",
                        )}
                      >
                        {row.label}
                        {current && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#0F7B3F]/10 px-2 py-0.5 text-nano font-bold uppercase tracking-[0.1em] text-[#0F7B3F]">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0F7B3F]" />
                            Current
                          </span>
                        )}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-nano",
                          done ? "text-slate-500" : "text-slate-400",
                        )}
                      >
                        {row.hint}
                      </p>
                    </div>
                    {current && (
                      <span className="shrink-0 pt-1 text-nano text-slate-500">
                        {dateFormatter.format(new Date(order.placedAt))}
                      </span>
                    )}
                  </motion.li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <h2 className="text-ui font-bold text-ink">Items ({itemCount})</h2>
            <ul className="mt-3 flex flex-col divide-y divide-line rounded-lg border border-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 p-3.5">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-mist">
                    {item.image && (
                      <Image src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-micro font-semibold text-ink">{item.title}</p>
                    <p className="mt-0.5 text-nano text-slate-500">Qty {item.quantity}</p>
                  </div>
                  <p className="shrink-0 text-micro font-bold tabular-nums text-ink">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-line p-3.5">
                <h3 className="text-nano font-bold uppercase tracking-[0.14em] text-gold-600">
                  Delivery Address
                </h3>
                <p className="mt-1.5 text-micro font-semibold text-ink">
                  {order.address.label}
                  {order.address.name && (
                    <span className="font-normal text-slate-500"> — {order.address.name}</span>
                  )}
                </p>
                <p className="mt-0.5 text-micro text-slate-600">{order.address.line}</p>
                <p className="mt-0.5 text-nano text-slate-500">{order.address.phone}</p>
              </div>
              <div className="rounded-lg border border-line p-3.5">
                <h3 className="text-nano font-bold uppercase tracking-[0.14em] text-gold-600">Payment</h3>
                <p className="mt-1.5 text-micro font-semibold text-ink">{order.paymentMethodLabel}</p>
                <p className="mt-0.5 text-nano text-slate-500 capitalize">
                  {order.deliveryMethod} delivery
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-line p-5 print:border-none">
            <h2 className="text-ui font-bold text-ink">Total Paid</h2>
            <dl className="mt-3 flex flex-col gap-2 text-micro">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="font-medium tabular-nums text-ink">{formatPrice(order.totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Discount</dt>
                <dd className="font-medium tabular-nums text-ink">
                  {order.totals.discount > 0 ? `−${formatPrice(order.totals.discount)}` : formatPrice(0)}
                </dd>
              </div>
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
                <dt className="text-ui font-bold text-ink">Total</dt>
                <dd className="text-promo font-bold tabular-nums text-ink">
                  {formatPrice(order.totals.total)}
                </dd>
              </div>
            </dl>

            <Button
              onClick={() => window.print()}
              variant="outline"
              size="md"
              className="mt-5 w-full print:hidden"
            >
              <Printer size={15} aria-hidden="true" />
              Print Invoice
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}

function MobileHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-sm print:hidden lg:hidden">
      <div className="flex h-14 items-center gap-1 px-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-ink transition-colors hover:bg-mist"
        >
          <ArrowLeft size={19} aria-hidden="true" />
        </button>
        <p className="min-w-0 flex-1 truncate px-1 text-center text-ui font-bold text-ink">{title}</p>
        <span className="h-11 w-11 shrink-0" aria-hidden="true" />
      </div>
    </header>
  );
}
