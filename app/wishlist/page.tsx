"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import type { CatalogCard } from "@/app/components-home/data/catalog";
import Container from "@/app/components-home/ui/Container";
import Button from "@/app/components-home/ui/Button";
import ProductCard from "@/app/components-home/ProductCard";
import type { Product } from "@/app/components-home/data/home-content";

/** Maps a catalogue row onto the shape the shared `ProductCard` expects. */
const toCard = (row: CatalogCard): Product => ({
  id: row.id,
  title: row.title,
  subtitle: row.brand,
  price: row.price,
  mrp: row.originalPrice,
  rating: row.rating,
  reviews: row.numReviews,
  stock: row.totalStock,
  href: `/product/${row.id}`,
  src: row.images[0] ?? "",
  alt: row.title,
});

/**
 * Saved items.
 *
 * The card's own heart is the remove control — toggling it fires
 * `wishlistChange`, which prunes `ids` and drops the tile from the grid without
 * a refetch. That keeps one wishlist affordance across the whole storefront
 * rather than a bespoke trash button that only exists here.
 */
export default function WishlistPage() {
  const [items, setItems] = useState<CatalogCard[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/wishlist/products")
        .then((res) => (res.ok ? (res.json() as Promise<CatalogCard[]>) : []))
        .then((data) => {
          if (!cancelled) setItems(data);
        });
    };
    load();
    window.addEventListener("wishlistChange", load);
    return () => {
      cancelled = true;
      window.removeEventListener("wishlistChange", load);
    };
  }, []);

  const isLoading = items === null;
  const rows = items ?? [];

  return (
    <Container className="pt-6 lg:pt-8">
      <div className="flex items-center gap-2.5">
        <Heart size={20} className="shrink-0 text-gold-500" fill="currentColor" aria-hidden="true" />
        <h1 className="text-promo font-bold text-ink lg:text-section">My Wishlist</h1>
        {!isLoading && rows.length > 0 && (
          <span className="text-micro text-slate-500">
            ({rows.length} {rows.length === 1 ? "item" : "items"})
          </span>
        )}
      </div>

      {isLoading ? (
        <ul className="mt-heading grid grid-cols-2 gap-card sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i}>
              <CardSkeleton />
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <div className="mt-heading flex flex-col items-center justify-center rounded-xl border border-line bg-mist py-16 text-center">
          <Heart size={32} className="mb-3 text-slate-300" aria-hidden="true" />
          <h2 className="text-ui font-bold text-ink">Your wishlist is empty</h2>
          <p className="mt-1 max-w-xs text-micro text-slate-500">
            Tap the heart on any product to save it here.
          </p>
          <Button href="/category/all" size="sm" className="mt-4">
            Start shopping
          </Button>
        </div>
      ) : (
        <ul className="mt-heading grid grid-cols-2 gap-card sm:grid-cols-3 xl:grid-cols-4">
          {rows.map((row) => (
            <li key={row.id}>
              <ProductCard
                product={toCard(row)}
                sizes="(min-width: 1280px) 22vw, (min-width: 640px) 30vw, 48vw"
              />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
      <div className="aspect-[4/3] animate-pulse bg-mist" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-3/4 animate-pulse rounded bg-mist" />
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-mist" />
        <div className="h-8 w-full animate-pulse rounded-md bg-mist" />
      </div>
    </div>
  );
}
