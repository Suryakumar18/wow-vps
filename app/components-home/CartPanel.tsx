"use client";

import Image from "next/image";
import { useEffect } from "react";
import { ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "./lib/CartContext";
import { formatPrice } from "./lib/format";
import Button from "./ui/Button";
import { cn } from "./lib/cn";

/**
 * Slide-over basket for the showcase build.
 *
 * Stops at the subtotal and hands off to the full /cart page (and from there,
 * /checkout) rather than totalling shipping/discounts here too — one place to
 * get that maths right, not two.
 */
export default function CartPanel() {
  const { cart, cartCount, isCartOpen, closeCart, removeFromCart } = useCart();

  useEffect(() => {
    if (!isCartOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isCartOpen, closeCart]);

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <div className={cn(!isCartOpen && "pointer-events-none")} aria-hidden={!isCartOpen}>
      <div
        onClick={closeCart}
        className={cn(
          "fixed inset-0 z-[70] bg-navy-950/50 transition-opacity duration-300",
          isCartOpen ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={cn(
          "fixed inset-y-0 right-0 z-[70] flex w-[88%] max-w-[24rem] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          isCartOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-row-sm shrink-0 items-center justify-between border-b border-line px-4">
          <h2 className="flex items-center gap-2 text-nav-ui font-bold text-ink">
            <ShoppingBag size={16} className="text-gold-600" aria-hidden="true" />
            Your Cart
            {cartCount > 0 && <span className="text-nav-nano text-slate-500">({cartCount})</span>}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="grid h-11 w-11 place-items-center rounded-md text-slate-500 transition-colors hover:bg-mist hover:text-ink"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <ShoppingBag size={30} className="mb-3 text-slate-300" aria-hidden="true" />
            <p className="text-ui font-bold text-ink">Your cart is empty</p>
            <p className="mt-1 text-micro text-slate-500">
              Add something from the showcase to see it here.
            </p>
            <Button onClick={closeCart} size="sm" className="mt-4">
              Keep browsing
            </Button>
          </div>
        ) : (
          <>
            <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto px-4">
              {cart.map((item) => (
                <li key={item.id} className="flex gap-3 py-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-mist">
                    {item.image && (
                      <Image src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-micro font-semibold text-ink">{item.title}</p>
                    <p className="mt-0.5 text-nano text-slate-500">Qty {item.quantity}</p>
                    <p className="mt-1 text-micro font-bold text-ink">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Remove ${item.title} from cart`}
                    className="grid h-9 w-9 shrink-0 place-items-center self-start rounded-md text-slate-400 transition-colors hover:bg-mist hover:text-[#E23B3B]"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="shrink-0 border-t border-line px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              <p className="flex items-baseline justify-between">
                <span className="text-micro text-slate-500">Subtotal</span>
                <span className="text-promo font-bold text-ink">{formatPrice(subtotal)}</span>
              </p>
              <Button href="/cart" onClick={closeCart} size="md" className="mt-3 w-full">
                View cart &amp; checkout
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
