"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import { useCart } from "@/app/components-home/lib/CartContext";
import { getAddresses } from "@/app/components-home/lib/addresses";
import { computeTotals } from "@/app/components-home/lib/pricing";
import Container from "@/app/components-home/ui/Container";
import Button from "@/app/components-home/ui/Button";
import BottomSheet from "@/app/components-home/ui/BottomSheet";
import { formatPrice } from "@/app/components-home/lib/format";
import { cn } from "@/app/components-home/lib/cn";

/**
 * Shopping cart.
 *
 * Mobile follows the approved screen: compact header, delivery address with a
 * Change action, line items with quantity steppers, coupon field, then the
 * order summary and a full-width Proceed to Checkout.
 *
 * From `md` the items and the summary split into two columns with the summary
 * sticky, so the total stays in view while a long basket scrolls.
 *
 * Totals are computed here rather than trusted from anywhere else — there is no
 * pricing service in this build, so this is the single source for the maths.
 */
export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    cartCount,
    hydrated,
    removeFromCart,
    setQuantity,
    couponCode,
    discountPercent,
    applyCoupon: applyCouponToCart,
    removeCoupon,
    couponWarning,
    dismissCouponWarning,
    selectedAddressId,
    setSelectedAddressId,
  } = useCart();

  // The address book can grow (checkout's "Add new address" writes to the same
  // store), so it's read fresh on mount and kept in sync via `addressesChange`
  // — the seeded addresses are instant, but anything added this session loads
  // from the server a moment later.
  const [addresses, setAddresses] = useState(() => getAddresses());
  useEffect(() => {
    const onChange = () => setAddresses(getAddresses());
    window.addEventListener("addressesChange", onChange);
    return () => window.removeEventListener("addressesChange", onChange);
  }, []);
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);

  // The *selected* address id lives in CartContext, shared with Checkout —
  // picking "Work" here must still be "Work" when Checkout opens.
  const addressId = selectedAddressId ?? addresses[0]?.id ?? "";
  const address = addresses.find((a) => a.id === addressId) ?? addresses[0];

  // Cart previews standard-delivery totals; Checkout is where the shopper
  // actually picks Standard vs Express and the total updates accordingly.
  // `subtotal` is taken from `totals` (not context.subtotal) so a click on the
  // qty stepper reflects immediately — context.subtotal is refreshed only
  // after the API round trip and would lag by a network hop.
  const totals = useMemo(
    () => computeTotals(cart, discountPercent, "standard"),
    [cart, discountPercent],
  );
  const { subtotal: liveSubtotal, discount, shipping, gst, total } = totals;

  const applyCoupon = async () => {
    const result = await applyCouponToCart(couponInput);
    setCouponError(result.ok ? null : result.message ?? "That code isn't valid.");
  };

  // `!hydrated` covers the instant before the cart is read back from
  // localStorage — without it, a shopper with a real saved cart briefly sees
  // "Your cart is empty" flash on a hard refresh or direct visit to /cart.
  if (!hydrated) return null;

  /* ---------------- empty ---------------- */
  if (cart.length === 0) {
    return (
      <>
        <MobileHeader title="Your Cart" onBack={() => router.back()} />
        <Container className="pt-6 lg:pt-8">
          <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-mist py-16 text-center">
            <ShoppingBag size={32} className="mb-3 text-slate-300" aria-hidden="true" />
            <h1 className="text-ui font-bold text-ink">Your cart is empty</h1>
            <p className="mt-1 max-w-xs text-micro text-slate-500">
              Add something from the homepage to see it here.
            </p>
            <Button href="/" size="sm" className="mt-4">
              Start shopping
            </Button>
          </div>
        </Container>
      </>
    );
  }

  /* ---------------- summary block (shared between breakpoints) ---------------- */
  const summary = (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-micro font-bold text-ink">Apply Coupon</h2>
        <div className="mt-2 flex items-stretch gap-2">
          <label className="sr-only" htmlFor="coupon">
            Coupon code
          </label>
          <input
            id="coupon"
            value={couponInput}
            onChange={(e) => {
              setCouponInput(e.target.value);
              setCouponError(null);
            }}
            placeholder="Enter coupon code"
            className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-white px-3.5 text-micro text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-gold-500"
          />
          <Button onClick={applyCoupon} variant="navy" size="md" className="shrink-0 rounded-lg">
            Apply
          </Button>
        </div>

        <div aria-live="polite" className="min-h-0">
          {couponError && <p className="mt-1.5 text-nano text-[#B91C1C]">{couponError}</p>}
          {couponCode && (
            <p className="mt-1.5 flex items-center gap-1.5 text-nano font-medium text-[#0F7B3F]">
              <Check size={12} strokeWidth={3} aria-hidden="true" />
              {couponCode} applied — {discountPercent}% off
              <button
                type="button"
                onClick={() => {
                  removeCoupon();
                  setCouponInput("");
                }}
                className="ml-1 font-semibold text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
              >
                Remove
              </button>
            </p>
          )}
        </div>
      </div>

      <dl className="flex flex-col gap-2 border-t border-line pt-4 text-micro">
        <div className="flex justify-between">
          <dt className="text-slate-500">Subtotal</dt>
          <dd className="font-medium tabular-nums text-ink">{formatPrice(liveSubtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Discount</dt>
          <dd
            className={cn(
              "font-medium tabular-nums",
              discount > 0 ? "text-[#0F7B3F]" : "text-ink",
            )}
          >
            {discount > 0 ? `−${formatPrice(discount)}` : formatPrice(0)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Shipping</dt>
          <dd className="font-medium tabular-nums text-ink">
            {shipping === 0 ? "Free" : formatPrice(shipping)}
          </dd>
        </div>
        {gst > 0 && (
          <div className="flex justify-between">
            <dt className="text-slate-500">GST</dt>
            <dd className="font-medium tabular-nums text-ink">{formatPrice(gst)}</dd>
          </div>
        )}

        <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3">
          <dt className="text-ui font-bold text-ink">
            Total{" "}
            <span className="text-nano font-medium text-slate-500">
              ({cartCount} {cartCount === 1 ? "item" : "items"})
            </span>
          </dt>
          <dd className="text-promo font-bold tabular-nums text-ink">{formatPrice(total)}</dd>
        </div>
      </dl>

      <Button
        onClick={() => router.push("/checkout")}
        size="md"
        className="w-full"
      >
        Proceed to Checkout
      </Button>
    </div>
  );

  return (
    <>
      <MobileHeader title={`Your Cart (${cartCount})`} onBack={() => router.back()} />

      <Container className="pt-4 md:pt-8">
        <h1 className="mb-4 hidden text-section font-bold text-ink md:block">
          Your Cart{" "}
          <span className="text-micro font-medium text-slate-500">({cartCount} items)</span>
        </h1>

        {couponWarning && (
          <div
            role="status"
            className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-gold-200 bg-gold-50 p-3 text-micro text-navy-800"
          >
            <p>{couponWarning}</p>
            <button
              type="button"
              onClick={dismissCouponWarning}
              aria-label="Dismiss"
              className="shrink-0 text-slate-400 hover:text-slate-600"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* `md:` rather than `lg:` — a tablet-portrait cart with one narrow
            column stranded in a wide viewport is exactly the "just stretched
            the mobile layout" outcome the design system forbids. */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_22rem] md:gap-10">
          <div className="min-w-0">
            {/* Deliver to */}
            <div className="flex items-start justify-between gap-3 rounded-lg border border-line bg-mist p-3.5">
              <div className="min-w-0">
                <h2 className="text-nano font-bold uppercase tracking-[0.14em] text-gold-600">
                  Deliver to
                </h2>
                <p className="mt-1 text-micro text-ink">
                  <span className="font-semibold">{address.label}</span> — {address.line}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddressSheetOpen(true)}
                className="shrink-0 text-micro font-semibold text-gold-600 transition-colors hover:text-gold-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
              >
                Change
              </button>
            </div>

            {/* Line items */}
            <ul className="mt-4 flex flex-col divide-y divide-line rounded-lg border border-line">
              {cart.map((item) => (
                <li key={item.id} className="flex gap-3 p-3.5">
                  <Link
                    href={`/product/${item.id}`}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-mist sm:h-24 sm:w-24"
                  >
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-micro font-semibold text-ink">{item.title}</h3>
                        {(item.brand || item.category) && (
                          <p className="mt-0.5 truncate text-nano text-slate-500">
                            {item.brand || item.category}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.title} from cart`}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-mist hover:text-[#E23B3B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                      <p className="text-ui font-bold tabular-nums text-ink">
                        {formatPrice(item.price * item.quantity)}
                      </p>

                      <div className="flex items-center gap-1 rounded-md border border-line">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease quantity of ${item.title}`}
                          className="grid h-9 w-9 place-items-center rounded-l-md text-slate-500 transition-colors hover:bg-mist disabled:opacity-35 disabled:hover:bg-transparent"
                        >
                          <Minus size={13} aria-hidden="true" />
                        </button>
                        <span
                          aria-live="polite"
                          className="min-w-7 text-center text-micro font-semibold tabular-nums text-ink"
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.totalStock}
                          aria-label={`Increase quantity of ${item.title}`}
                          className="grid h-9 w-9 place-items-center rounded-r-md text-slate-500 transition-colors hover:bg-mist disabled:opacity-35 disabled:hover:bg-transparent"
                        >
                          <Plus size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Summary — inline on mobile, sticky column from tablet up */}
          <div className="md:sticky md:top-[8.5rem] md:self-start md:rounded-xl md:border md:border-line md:p-5">
            {summary}
          </div>
        </div>
      </Container>

      <BottomSheet
        open={addressSheetOpen}
        onClose={() => setAddressSheetOpen(false)}
        title="Deliver to"
        description="Choose a saved address"
      >
        <ul role="radiogroup" aria-label="Choose a saved address" className="flex flex-col gap-2 pb-2">
          {addresses.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                role="radio"
                aria-checked={a.id === addressId}
                onClick={() => {
                  setSelectedAddressId(a.id);
                  setAddressSheetOpen(false);
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                  a.id === addressId
                    ? "border-gold-500 bg-gold-50"
                    : "border-line hover:border-gold-300",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                    a.id === addressId ? "border-gold-500 bg-gold-500" : "border-slate-300",
                  )}
                >
                  {a.id === addressId && (
                    <Check size={10} strokeWidth={3} className="text-navy-900" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-micro font-semibold text-ink">
                    {a.label}
                    {a.name && <span className="font-normal text-slate-500"> — {a.name}</span>}
                  </span>
                  <span className="mt-0.5 block text-nano text-slate-500">{a.line}</span>
                  <span className="mt-0.5 block text-nano text-slate-500">{a.phone}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </>
  );
}

/* ------------------------------------------------------------------ */

function MobileHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-sm lg:hidden">
      <div className="flex h-14 items-center gap-1 px-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-ink transition-colors hover:bg-mist"
        >
          <ArrowLeft size={19} aria-hidden="true" />
        </button>
        <p className="min-w-0 flex-1 truncate px-1 text-center text-ui font-bold text-ink">
          {title}
        </p>
        <span className="h-11 w-11 shrink-0" aria-hidden="true" />
      </div>
    </header>
  );
}
