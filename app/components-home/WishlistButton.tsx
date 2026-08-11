"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { getWishlist, isWishlisted, toggleWishlistItem } from "@/app/components-home/lib/wishlist";
import { cn } from "./lib/cn";
import Badge from "./ui/Badge";

/** Subscribes to the shared localStorage wishlist and its `wishlistChange` event. */
export function useWishlistIds() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(getWishlist());
    const onChange = (e: Event) => setIds((e as CustomEvent<string[]>).detail ?? getWishlist());
    window.addEventListener("wishlistChange", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("wishlistChange", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return ids;
}

/** Header action: heart icon above the "Wishlist" label. */
export function WishlistLink({ className }: { className?: string }) {
  const ids = useWishlistIds();

  return (
    <Link
      href="/wishlist"
      className={cn(
        // Tap target is an accessibility floor (WCAG 2.5.8), so it stays at 44px
        // regardless of UI_SCALE — only the glyph inside it scales.
        "group relative flex min-h-11 min-w-11 items-center justify-center gap-u-2 text-ink transition-colors hover:text-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600 xl:min-w-0",
        className,
      )}
    >
      <span className="relative">
        <Heart size={18} strokeWidth={1.75} aria-hidden="true" />
        {ids.length > 0 && (
          <Badge tone="count" className="absolute -right-2 -top-2">
            {ids.length > 9 ? "9+" : ids.length}
          </Badge>
        )}
      </span>
      <span className="hidden text-nav-micro font-medium xl:inline">Wishlist</span>
      <span className="sr-only xl:hidden">Wishlist</span>
    </Link>
  );
}

/**
 * Square heart toggle used on product cards. Fills gold once the item is saved.
 */
export function WishlistToggle({
  productId,
  productTitle,
  className,
}: {
  productId: string;
  productTitle: string;
  className?: string;
}) {
  const [saved, setSaved] = useState(false);

  // Read after mount only — localStorage is unavailable during SSR.
  useEffect(() => {
    setSaved(isWishlisted(productId));
    const onChange = () => setSaved(isWishlisted(productId));
    window.addEventListener("wishlistChange", onChange);
    return () => window.removeEventListener("wishlistChange", onChange);
  }, [productId]);

  // `toggleWishlistItem` dispatches `wishlistChange` synchronously, and the
  // listener above is what flips `saved`. Setting it here too would apply the
  // change twice in one batch and land back on the old value.
  const onClick = useCallback(() => toggleWishlistItem(productId), [productId]);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productTitle} from wishlist` : `Add ${productTitle} to wishlist`}
      className={cn(
        "grid h-control-xs w-control-xs shrink-0 place-items-center rounded-md border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600 sm:h-control-sm sm:w-control-sm",
        saved
          ? "border-gold-500 bg-gold-50 text-gold-600"
          : "border-line bg-white text-slate-500 hover:border-gold-400 hover:text-gold-600",
        className,
      )}
    >
      <Heart size={14} strokeWidth={2} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  );
}
