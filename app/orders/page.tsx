"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, PackageSearch, Phone, Search } from "lucide-react";
import {
  getOrders,
  lookupOrdersByPhone,
  type Order,
  type OrderStatus,
} from "@/app/components-home/lib/orders";
import OrderStatusBadge from "@/app/components-home/OrderStatusBadge";
import Container from "@/app/components-home/ui/Container";
import Button from "@/app/components-home/ui/Button";
import TextField from "@/app/components-home/ui/TextField";
import { formatPrice } from "@/app/components-home/lib/format";
import { cn } from "@/app/components-home/lib/cn";

const TABS: { key: "all" | OrderStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const PHONE_LOOKUP_STORAGE = "orders-lookup-phone";

/**
 * My Orders — reads whatever Checkout has written for this browser session,
 * plus a phone-number lookup fallback for shoppers who checked out as guests
 * and are coming back from a fresh browser / new device.
 */
export default function OrdersPage() {
  const router = useRouter();
  const [sessionOrders, setSessionOrders] = useState<Order[] | null>(null);
  const [lookupOrders, setLookupOrders] = useState<Order[] | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");

  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupState, setLookupState] = useState<"idle" | "searching" | "done" | "error">("idle");
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOrders().then((data) => {
      if (!cancelled) setSessionOrders(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // If the shopper looked up by phone earlier in this browser, remember it and
  // auto-run the search on next visit — losing the list on every reload would
  // defeat the point of the lookup for a returning guest.
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(PHONE_LOOKUP_STORAGE) : null;
    if (!saved) return;
    setLookupPhone(saved);
    setLookupState("searching");
    lookupOrdersByPhone(saved).then((rows) => {
      setLookupOrders(rows);
      setLookupState("done");
    });
  }, []);

  const runLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = lookupPhone.trim();
    if (phone.replace(/\D+/g, "").length < 8) {
      setLookupError("Enter the phone number you used at checkout.");
      return;
    }
    setLookupError(null);
    setLookupState("searching");
    const rows = await lookupOrdersByPhone(phone);
    setLookupOrders(rows);
    setLookupState("done");
    try {
      localStorage.setItem(PHONE_LOOKUP_STORAGE, phone);
    } catch {
      /* localStorage unavailable */
    }
  };

  const clearLookup = () => {
    setLookupOrders(null);
    setLookupPhone("");
    setLookupState("idle");
    setLookupError(null);
    try {
      localStorage.removeItem(PHONE_LOOKUP_STORAGE);
    } catch {
      /* unavailable */
    }
  };

  // The two sources are dedupe-merged by order id — a shopper who looked up
  // by phone AND placed a new order from the current session shouldn't see
  // the new order listed twice.
  const merged = mergeById(sessionOrders ?? [], lookupOrders ?? []);
  const filtered = merged.filter((o) => tab === "all" || o.status === tab);
  const showLookupForm =
    sessionOrders !== null && sessionOrders.length === 0 && lookupOrders === null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-sm lg:hidden">
        <div className="flex h-14 items-center gap-1 px-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-ink transition-colors hover:bg-mist"
          >
            <ArrowLeft size={19} aria-hidden="true" />
          </button>
          <p className="min-w-0 flex-1 truncate px-1 text-center text-ui font-bold text-ink">My Orders</p>
          <span className="h-11 w-11 shrink-0" aria-hidden="true" />
        </div>
      </header>

      <Container className="pt-4 lg:pt-8">
        <h1 className="mb-4 hidden text-section font-bold text-ink lg:block">My Orders</h1>

        {/* Phone lookup — appears when the session has zero orders (a new
            browser for a returning customer). Also toggleable via
            "Look up another number" once results are shown. */}
        {showLookupForm && (
          <motion.form
            onSubmit={runLookup}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mb-5 rounded-xl border border-line bg-white p-5"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-50 text-gold-600">
                <Phone size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-ui font-bold text-ink">Look up your orders</h2>
                <p className="mt-0.5 text-nano text-slate-500">
                  Enter the phone number you used at checkout to see every order placed to it.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <TextField
                label="Phone number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="e.g. 98765 43210"
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                error={lookupError ?? undefined}
                className="flex-1"
              />
              <Button
                type="submit"
                size="md"
                className="sm:mt-6 sm:self-start"
                disabled={lookupState === "searching"}
              >
                <Search size={14} aria-hidden="true" />
                {lookupState === "searching" ? "Searching…" : "Find orders"}
              </Button>
            </div>
          </motion.form>
        )}

        {/* Small banner + "clear" affordance once a lookup returned results. */}
        {lookupOrders !== null && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-gold-50 px-4 py-2.5 text-micro">
            <Phone size={14} className="text-gold-600" aria-hidden="true" />
            <span className="text-slate-600">
              Showing orders for <span className="font-semibold text-ink">{lookupPhone}</span>
              {lookupOrders.length > 0 && ` — ${lookupOrders.length} found`}
            </span>
            <button
              type="button"
              onClick={clearLookup}
              className="ml-auto text-nano font-semibold text-gold-700 underline underline-offset-2 hover:text-gold-800"
            >
              Look up another number
            </button>
          </div>
        )}

        <div className="-mx-gutter flex snap-x gap-2 overflow-x-auto px-gutter pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-current={tab === t.key ? "page" : undefined}
              className={cn(
                "shrink-0 snap-start rounded-full border px-4 py-2 text-micro font-semibold transition-colors",
                tab === t.key
                  ? "border-gold-500 bg-gold-500 text-navy-900"
                  : "border-line bg-white text-slate-600 hover:border-gold-300",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {sessionOrders === null ? (
          <ul className="mt-4 flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <li key={i} className="h-24 animate-pulse rounded-lg border border-line bg-mist" />
            ))}
          </ul>
        ) : filtered.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-line bg-mist py-16 text-center">
            <PackageSearch size={32} className="mb-3 text-slate-300" aria-hidden="true" />
            <h2 className="text-ui font-bold text-ink">
              {lookupOrders !== null && lookupOrders.length === 0
                ? "No orders for that number"
                : "No orders here yet"}
            </h2>
            <p className="mt-1 max-w-xs text-micro text-slate-500">
              {lookupOrders !== null && lookupOrders.length === 0
                ? "Double-check the digits or try a different phone number."
                : merged.length === 0
                  ? "Orders you place will show up here."
                  : "No orders match this status."}
            </p>
            <Button href="/category/all" size="sm" className="mt-4">
              Start shopping
            </Button>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {filtered.map((order, index) => {
              const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
              const thumb = order.items[0];
              return (
                <motion.li
                  key={order.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04, ease: "easeOut" }}
                >
                  <Link
                    href={`/orders/${order.id}`}
                    className="flex items-center gap-3 rounded-lg border border-line bg-white p-3.5 transition-colors hover:border-gold-300"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-mist">
                      {thumb?.image && (
                        <Image src={thumb.image} alt={thumb.title} fill sizes="64px" className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-micro font-semibold text-ink">
                        {thumb?.title}
                        {itemCount > 1 && ` +${itemCount - 1} more`}
                      </p>
                      <p className="mt-0.5 text-nano text-slate-500">
                        {order.id} · {dateFormatter.format(new Date(order.placedAt))}
                      </p>
                      <p className="mt-1 text-micro font-bold tabular-nums text-ink">
                        {formatPrice(order.totals.total)}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        )}
      </Container>
    </>
  );
}

/** Session orders take precedence over lookup orders when both contain the
 *  same order id, since the former are known to belong to this browser. */
function mergeById(primary: Order[], secondary: Order[]): Order[] {
  const seen = new Set(primary.map((o) => o.id));
  const merged = [...primary];
  for (const order of secondary) {
    if (!seen.has(order.id)) {
      merged.push(order);
      seen.add(order.id);
    }
  }
  merged.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
  return merged;
}
