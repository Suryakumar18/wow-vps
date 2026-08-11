"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap } from "lucide-react";
import { useCart } from "@/app/components-home/lib/CartContext";
import Badge from "./ui/Badge";
import Rating from "./ui/Rating";
import { WishlistToggle } from "./WishlistButton";
import type { Product } from "./data/home-content";
import { formatPrice } from "./lib/format";

/**
 * Product tile used by "Popular Picks" and reusable anywhere a grid of products
 * is needed. Add to Cart writes through the shared CartContext.
 *
 * Padding, control heights and the cart glyph all step down at the smallest
 * size so two cards still fit a 320px screen without the action row wrapping.
 * The 4:3 image box is constant at every breakpoint.
 */
export default function ProductCard({ product, sizes }: { product: Product; sizes: string }) {
  const { addToCart } = useCart();
  const router = useRouter();

  // Catalog rows sometimes carry an MRP at or below the selling price; showing a
  // struck-through number that is *lower* reads as a price rise, so both the
  // badge and the strike-through are gated on a genuine saving.
  const hasSaving = product.mrp > product.price;
  const discount = product.discount ?? (hasSaving ? Math.round((1 - product.price / product.mrp) * 100) : 0);
  const outOfStock = product.stock <= 0;

  // Consolidated so Add-to-Cart and Buy Now can't drift out of sync on which
  // fields they hand to CartContext.
  const asCartItem = () => ({
    id: product.id,
    title: product.title,
    price: product.price,
    image: product.src,
    quantity: 1,
    totalStock: product.stock,
  });

  const buyNow = () => {
    if (outOfStock) return;
    addToCart(asCartItem());
    router.push("/checkout");
  };

  // `relative` on the article is load-bearing: without a positioning context here,
  // absolutely positioned content inside the card anchors to the page rather than
  // the card, escapes the carousel's clip, and gives the whole page a horizontal
  // scrollbar at widths where the carousel overflows.
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white shadow-card transition-all duration-200 hover:border-gold-300 hover:shadow-card-hover">
      <Link
        href={product.href}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-[4/3] overflow-hidden bg-mist"
      >
        {discount > 0 && (
          <Badge tone="discount" className="absolute left-2 top-2 z-10">
            -{discount}%
          </Badge>
        )}
        {outOfStock && (
          <span className="absolute inset-x-0 bottom-0 z-10 bg-navy-950/75 py-1 text-center text-nano font-semibold uppercase tracking-wide text-white">
            Out of stock
          </span>
        )}
        <Image
          src={product.src}
          alt={product.alt}
          fill
          loading="lazy"
          sizes={sizes}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
      </Link>

      {/* Mobile parks the wishlist over the image, as in the approved mobile
          design; from `lg` it returns to the action row beside Add to Cart. */}
      <WishlistToggle
        productId={product.id}
        productTitle={product.title}
        className="absolute right-2 top-2 z-10 border-transparent bg-white/90 shadow-card backdrop-blur-sm lg:hidden"
      />

      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <h3 className="text-micro font-semibold leading-snug text-ink">
          <Link
            href={product.href}
            className="transition-colors hover:text-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
          >
            {product.title}
          </Link>
        </h3>
        <p className="mt-0.5 text-nano text-slate-500">{product.subtitle}</p>

        {/* Desktop keeps the rating above the price; mobile moves it into the
            action row so price and rating don't compete for the same line. */}
        {product.rating != null && (
          <Rating
            value={product.rating}
            reviews={product.reviews}
            className="mt-1.5 hidden lg:flex"
          />
        )}

        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-ui font-bold text-ink">{formatPrice(product.price)}</span>
          {hasSaving && (
            <span className="text-nano text-slate-400 line-through">{formatPrice(product.mrp)}</span>
          )}
        </p>

        {product.rating != null && (
          <Rating value={product.rating} reviews={product.reviews} className="mt-2 lg:hidden" />
        )}

        {/* Two-button action row — Buy Now is the primary path (gold, matches
            product detail's Buy Now), Add to Cart the secondary. Sits at the
            bottom of the card via `mt-auto`. */}
        <div className="mt-auto flex items-stretch gap-1.5 pt-2.5 sm:gap-2">
          <button
            type="button"
            disabled={outOfStock}
            onClick={buyNow}
            aria-label={
              outOfStock ? `${product.title} is unavailable` : `Buy ${product.title} now`
            }
            className="inline-flex h-control-sm min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md bg-gold-500 px-2 text-nano font-semibold text-navy-900 transition-colors hover:bg-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            <Zap size={13} strokeWidth={2.5} aria-hidden="true" className="shrink-0" />
            <span className="truncate">Buy Now</span>
          </button>

          <button
            type="button"
            disabled={outOfStock}
            onClick={() => addToCart(asCartItem())}
            aria-label={
              outOfStock ? `${product.title} is unavailable` : `Add ${product.title} to cart`
            }
            title={outOfStock ? "Unavailable" : "Add to Cart"}
            className="inline-flex h-control-sm w-control-sm shrink-0 items-center justify-center rounded-md border border-navy-800 bg-white text-navy-800 transition-colors hover:bg-navy-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-white disabled:hover:text-slate-300"
          >
            <ShoppingCart size={13} strokeWidth={2.25} aria-hidden="true" />
          </button>

          <WishlistToggle
            productId={product.id}
            productTitle={product.title}
            className="hidden lg:grid"
          />
        </div>
      </div>
    </article>
  );
}
