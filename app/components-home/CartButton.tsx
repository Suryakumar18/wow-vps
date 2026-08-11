"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/app/components-home/lib/CartContext";
import Badge from "./ui/Badge";
import { cn } from "./lib/cn";

/**
 * Header cart trigger. The count comes from the shared CartContext, so the badge
 * stays in sync with the drawer and the rest of the storefront.
 */
export default function CartButton({ className }: { className?: string }) {
  const { cartCount, openCart } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      className={cn(
        // Tap target is an accessibility floor (WCAG 2.5.8), so it stays at 44px
        // regardless of UI_SCALE — only the glyph inside it scales.
        "group flex min-h-11 min-w-11 items-center justify-center gap-u-2 text-ink transition-colors hover:text-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600 xl:min-w-0",
        className,
      )}
      aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
    >
      <span className="relative">
        <ShoppingCart size={18} strokeWidth={1.75} aria-hidden="true" />
        {cartCount > 0 && (
          <Badge tone="count" className="absolute -right-2 -top-2">
            {cartCount > 99 ? "99+" : cartCount}
          </Badge>
        )}
      </span>
      <span className="hidden text-nav-micro font-medium xl:inline">Cart</span>
    </button>
  );
}
