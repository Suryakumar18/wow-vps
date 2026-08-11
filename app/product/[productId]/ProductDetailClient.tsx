"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Play,
  Share2,
  ShoppingCart,
} from "lucide-react";

import { useCart } from "@/app/components-home/lib/CartContext";
import { getWishlist, toggleWishlistItem } from "@/app/components-home/lib/wishlist";
import Container from "@/app/components-home/ui/Container";
import Button from "@/app/components-home/ui/Button";
import Badge from "@/app/components-home/ui/Badge";
import Rating from "@/app/components-home/ui/Rating";
import Icon, { type IconName } from "@/app/components-home/ui/Icon";
import BottomSheet from "@/app/components-home/ui/BottomSheet";
import ProductCard from "@/app/components-home/ProductCard";
import RichText from "@/app/components-home/RichText";
import { formatPrice } from "@/app/components-home/lib/format";
import {
  productAssurances,
  productOffers,
  type Product,
} from "@/app/components-home/data/home-content";
import { cn } from "@/app/components-home/lib/cn";
import type { CatalogCard, CatalogProduct } from "@/app/components-home/data/catalog";

/** Best-effort colour-name → CSS colour. Any string CSS accepts natively
 *  ("red", "#c9a55a", "rgb(…)") is passed through; unknown names fall back to
 *  a neutral swatch so we never render a broken chip. */
const COLOR_ALIASES: Record<string, string> = {
  navy: "#0d1b2a",
  gold: "#c9a55a",
  cream: "#f5efe6",
  charcoal: "#333333",
  offwhite: "#f6f4ef",
  silver: "#c0c0c0",
  rose: "#ff6b8a",
};

function colorToCss(name: string): string {
  const key = name.trim().toLowerCase().replace(/\s+/g, "");
  if (COLOR_ALIASES[key]) return COLOR_ALIASES[key];
  const raw = name.trim().toLowerCase();
  return raw || "#d1d5db";
}

/** Maps a catalogue row onto the shape the shared `ProductCard` expects. */
const toCard = (row: CatalogCard): Product => ({
  id: row.id,
  title: row.title,
  subtitle: row.brand || row.categoryId || "",
  price: row.price,
  mrp: row.originalPrice ?? row.price,
  rating: row.rating,
  reviews: row.numReviews,
  stock: row.totalStock ?? 0,
  href: `/product/${row.id}`,
  src: row.images[0] ?? "",
  alt: row.title,
});

/**
 * Product detail.
 *
 * One layout, two shapes:
 *  - Below `lg`: the approved mobile screen — compact back/share/wishlist
 *    header, swipeable gallery with dots and an n/total counter, then the
 *    information stack, with price + Add to Cart + Buy Now pinned above the
 *    bottom navigation.
 *  - From `lg`: gallery and information sit side by side, the gallery sticks
 *    while the copy scrolls, and the buy actions move inline.
 */
interface Props {
  /** Resolved on the server — the page is fully rendered before it ships. */
  product: CatalogProduct;
  related: CatalogCard[];
}

export default function ProductDetailClient({ product, related }: Props) {
  const productId = product.id;
  const router = useRouter();
  const { addToCart } = useCart();

  const [slide, setSlide] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  // -1 = default gallery; otherwise index into product.colors that has non-
  // empty images. A colour without any photos still selects, it just leaves
  // the default gallery in place.
  const [selectedColor, setSelectedColor] = useState(-1);

  const trackRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const sync = () => setWishlisted(getWishlist().includes(productId));
    sync();
    window.addEventListener("wishlistChange", sync);
    return () => window.removeEventListener("wishlistChange", sync);
  }, [productId]);

  // The gallery is a native snap scroller, so swipe works without a JS gesture
  // layer; this only keeps the dots and the counter in step with it.
  const syncSlide = useCallback(() => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    setSlide(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  const goToSlide = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setSlide(i);
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title: product?.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied("link");
        setTimeout(() => setCopied(null), 2000);
      }
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const id = product.id;
  const colors = product.colors ?? [];

  // Switching colour resets to the first slide — the current index may point
  // past the end of the swapped-in gallery, which would render blank.
  useEffect(() => {
    setSlide(0);
  }, [selectedColor]);

  // Swap the gallery to the selected colour's images, when it has some.
  // A colour with no photos falls back to the product-level gallery so the
  // shopper still sees SOMETHING and never lands on an empty slider.
  const activeColorImages =
    selectedColor >= 0 && colors[selectedColor]?.images.length
      ? colors[selectedColor].images
      : null;
  const images = activeColorImages ?? product.images;
  const videos = product.videos ?? [];
  const hasSaving = (product.originalPrice ?? 0) > product.price;
  const discount = hasSaving
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;
  const outOfStock = (product.totalStock ?? 0) <= 0;
  const specs = product.specifications ?? [];
  const highlights = product.aboutFeatures ?? [];

  const cartItem = {
    id,
    title: product.title,
    price: product.price,
    image: images[0] ?? "",
    quantity: 1,
    brand: product.brand,
    category: product.categoryId,
    totalStock: product.totalStock ?? 0,
  };

  // Buy Now adds the item then skips the basket entirely, straight to checkout.
  const buyNow = () => {
    if (outOfStock) return;
    addToCart(cartItem);
    router.push("/checkout");
  };

  return (
    <>
      {/* Compact mobile header — stands in for the site header below `lg`. */}
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
          <h1 className="min-w-0 flex-1 truncate px-1 text-center text-ui font-bold text-ink">
            {product.title}
          </h1>
          <button
            type="button"
            onClick={share}
            aria-label="Share this product"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-ink transition-colors hover:bg-mist"
          >
            <Share2 size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => toggleWishlistItem(id)}
            aria-pressed={wishlisted}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-md transition-colors hover:bg-mist",
              wishlisted ? "text-gold-600" : "text-ink",
            )}
          >
            <Heart size={18} fill={wishlisted ? "currentColor" : "none"} aria-hidden="true" />
          </button>
        </div>
      </header>

      <Container className="pt-4 lg:pt-8">
        <div className="grid gap-6 md:grid-cols-2 md:gap-7 lg:gap-10 xl:gap-14">
          {/* ── Gallery ── */}
          <div className="md:sticky md:top-[5rem] md:self-start lg:top-[8.5rem]">
            <div className="relative isolate overflow-hidden rounded-xl bg-mist">
              <ul
                ref={trackRef}
                onScroll={syncSlide}
                className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {(images.length ? images : [""]).map((src, i) => (
                  <li key={`slide-${i}`} className="w-full shrink-0 snap-center">
                    <div className="relative aspect-[4/3] w-full">
                      {src && (
                        <Image
                          src={src}
                          alt={`${product.title} — view ${i + 1}`}
                          fill
                          priority={i === 0}
                          sizes="(min-width: 1024px) 50vw, 100vw"
                          className="object-cover"
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {videos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setVideoOpen(true)}
                  className="absolute bottom-3 left-3 z-10 inline-flex h-9 items-center gap-2 rounded-full bg-navy-950/80 py-1 pl-1.5 pr-3.5 text-nano font-semibold text-white backdrop-blur-sm transition-colors hover:bg-navy-950"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-gold-500 text-navy-900">
                    <Play size={10} fill="currentColor" aria-hidden="true" />
                  </span>
                  Watch Video
                </button>
              )}

              {images.length > 1 && (
                <>
                  <div className="absolute inset-x-0 bottom-3.5 z-10 flex justify-center gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={`dot-${i}`}
                        type="button"
                        onClick={() => goToSlide(i)}
                        aria-label={`Show image ${i + 1} of ${images.length}`}
                        aria-current={i === slide}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          i === slide ? "w-5 bg-gold-500" : "w-1.5 bg-white/70",
                        )}
                      />
                    ))}
                  </div>

                  <span className="absolute bottom-3 right-3 z-10 rounded-full bg-navy-950/80 px-2.5 py-1 text-nano font-semibold text-white backdrop-blur-sm">
                    {slide + 1}/{images.length}
                  </span>

                  {/* Pointer affordance — touch users swipe the snap track. */}
                  <div className="pointer-events-none absolute inset-0 z-10 hidden items-center justify-between px-2 lg:flex">
                    <button
                      type="button"
                      onClick={() => goToSlide(Math.max(0, slide - 1))}
                      disabled={slide === 0}
                      aria-label="Previous image"
                      className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-card transition-opacity disabled:opacity-0"
                    >
                      <ChevronLeft size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => goToSlide(Math.min(images.length - 1, slide + 1))}
                      disabled={slide === images.length - 1}
                      aria-label="Next image"
                      className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-card transition-opacity disabled:opacity-0"
                    >
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {images.length > 1 && (
              <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {images.map((src, i) => (
                  <li key={`thumb-${i}`}>
                    <button
                      type="button"
                      onClick={() => goToSlide(i)}
                      aria-label={`View image ${i + 1}`}
                      aria-current={i === slide}
                      className={cn(
                        "relative block h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-mist transition-colors sm:h-[4.5rem] sm:w-24",
                        i === slide ? "border-gold-500" : "border-line hover:border-gold-300",
                      )}
                    >
                      <Image src={src} alt="" fill sizes="96px" className="object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── Information ── */}
          <div className="min-w-0">
            <h2 className="text-promo font-bold text-ink lg:text-section">{product.title}</h2>
            {(product.brand || product.categoryId) && (
              <p className="mt-1 text-micro text-slate-500">{product.brand || product.categoryId}</p>
            )}

            {product.rating != null && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Rating value={product.rating} size={14} />
                <span className="text-micro text-slate-500">
                  {product.rating}
                  {product.numReviews != null && ` (${product.numReviews} Reviews)`}
                </span>
              </div>
            )}

            <p className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="text-promo font-bold text-ink">{formatPrice(product.price)}</span>
              {hasSaving && (
                <>
                  <span className="text-micro text-slate-400 line-through">
                    {formatPrice(product.originalPrice!)}
                  </span>
                  <Badge tone="discount">-{discount}%</Badge>
                </>
              )}
            </p>

            {specs.length > 0 && (
              <ul className="mt-5 grid grid-cols-4 gap-2 border-y border-line py-4">
                {specs.slice(0, 4).map((s, i) => (
                  <li key={`f-${i}`} className="flex flex-col items-center gap-1.5 text-center">
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-gold-200 bg-white text-gold-600">
                      <Icon name="verified" size={15} strokeWidth={1.9} />
                    </span>
                    <span className="text-nano font-semibold leading-tight text-ink">{s.value}</span>
                    <span className="text-nano leading-tight text-slate-500">{s.label}</span>
                  </li>
                ))}
              </ul>
            )}

            {colors.length > 0 && (
              <div className="mt-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-micro font-bold text-ink">
                    Colour
                    {selectedColor >= 0 && (
                      <span className="ml-1.5 font-normal text-slate-500">
                        — {colors[selectedColor]?.name}
                      </span>
                    )}
                  </h3>
                  {selectedColor >= 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedColor(-1)}
                      className="text-nano font-semibold text-gold-700 underline underline-offset-2 hover:text-gold-800"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <ul
                  role="radiogroup"
                  aria-label="Available colours"
                  className="mt-2 flex flex-wrap gap-2"
                >
                  {colors.map((c, i) => {
                    const active = i === selectedColor;
                    return (
                      <li key={`${c.name}-${i}`}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setSelectedColor(active ? -1 : i)}
                          title={c.name + (c.images.length ? "" : " (uses default photos)")}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-nano font-medium transition-colors",
                            active
                              ? "border-gold-500 bg-gold-50 text-ink"
                              : "border-line bg-white text-slate-700 hover:border-gold-300",
                          )}
                        >
                          <span
                            aria-hidden="true"
                            style={{ backgroundColor: c.hex || colorToCss(c.name) }}
                            className={cn(
                              "h-3.5 w-3.5 rounded-full border border-line/60",
                              active && "ring-2 ring-gold-500 ring-offset-1",
                            )}
                          />
                          {c.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {product.idealFor && product.idealFor.length > 0 && (
              <div className="mt-5">
                <h3 className="text-micro font-bold text-ink">Ideal For</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {product.idealFor.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-line bg-mist px-3 py-1 text-nano text-slate-600"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {highlights.length > 0 && (
              <div className="mt-5">
                <h3 className="text-ui font-bold text-ink">Highlights</h3>
                <ul className="mt-2.5 space-y-2">
                  {highlights.map((h, i) => (
                    <li key={`h-${i}`} className="flex items-start gap-2.5 text-micro text-slate-600">
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-gold-500 text-white">
                        <Check size={10} strokeWidth={3} aria-hidden="true" />
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {productOffers.length > 0 && (
              <div className="mt-5 space-y-2">
                {productOffers.map((offer) => (
                  <div
                    key={offer.code}
                    className="flex items-center gap-3 rounded-lg border border-gold-200 bg-gold-50 p-3"
                  >
                    <span className="shrink-0 text-ui font-bold text-navy-800">{offer.code}</span>
                    <span aria-hidden="true" className="h-8 w-px shrink-0 bg-gold-200" />
                    <p className="min-w-0 flex-1 text-nano text-slate-600">{offer.description}</p>
                    <Button
                      onClick={() => copyCode(offer.code)}
                      variant="outline"
                      size="xs"
                      className="shrink-0 border-gold-500 text-gold-700"
                    >
                      {copied === offer.code ? "Copied" : "Copy"}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {product.description && (
              <div className="mt-5">
                <h3 className="text-ui font-bold text-ink">About this product</h3>
                <p className="mt-2 text-micro leading-relaxed text-slate-600">
                  {product.description}
                </p>
              </div>
            )}

            {specs.length > 0 && (
              <div className="mt-5">
                <h3 className="text-ui font-bold text-ink">Specifications</h3>
                <dl className="mt-2.5 overflow-hidden rounded-lg border border-line">
                  {specs.map((s, i) => (
                    <div
                      key={`s-${i}`}
                      className={cn("flex gap-3 px-3 py-2.5 text-micro", i % 2 === 1 && "bg-mist")}
                    >
                      <dt className="w-1/2 shrink-0 text-slate-500">{s.label}</dt>
                      <dd className="min-w-0 flex-1 font-medium text-ink">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Desktop keeps the actions inline; mobile gets the pinned bar. */}
            <div className="mt-6 hidden gap-2 md:flex">
              <Button
                onClick={() => !outOfStock && addToCart(cartItem)}
                disabled={outOfStock}
                size="md"
                className="flex-1"
              >
                <ShoppingCart size={15} aria-hidden="true" />
                {outOfStock ? "Unavailable" : "Add to Cart"}
              </Button>
              <Button onClick={buyNow} disabled={outOfStock} variant="navy" size="md" className="flex-1">
                Buy Now
              </Button>
            </div>

            <ul className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4">
              {productAssurances.map((a) => (
                <li key={a.label} className="flex flex-col items-center gap-1.5 text-center">
                  <Icon name={a.icon as IconName} size={16} className="text-gold-600" />
                  <span className="text-nano leading-tight text-slate-500">{a.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Full-width tabs below the buy area — the long-form write-up gets
            the whole screen instead of the narrow info column. */}
        <DetailTabs product={product} />

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="pt-section">
            <h2 id="related-heading" className="text-promo font-bold text-ink lg:text-section">
              You May Also Like
            </h2>
            <ul className="mt-heading -mx-gutter flex snap-x gap-card overflow-x-auto px-gutter pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
              {related.slice(0, 8).map((raw) => {
                const card = toCard(raw);
                if (!card.id || !card.src) return null;
                return (
                  <li key={card.id} className="w-[10rem] shrink-0 snap-start sm:w-auto">
                    <ProductCard
                      product={card}
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 160px"
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </Container>

      {/* ── Pinned buy bar, sitting directly above the bottom navigation ── */}
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-white/95 px-3 py-2.5 shadow-[0_-8px_24px_-16px_rgba(16,33,53,0.4)] backdrop-blur-sm md:hidden">
        <div className="flex items-center gap-3">
          <p className="shrink-0">
            <span className="block text-ui font-bold leading-tight text-ink">
              {formatPrice(product.price)}
            </span>
            {hasSaving && (
              <span className="block text-nano leading-tight text-slate-400 line-through">
                {formatPrice(product.originalPrice!)}
              </span>
            )}
          </p>
          <div className="flex min-w-0 flex-1 gap-2">
            <Button
              onClick={() => !outOfStock && addToCart(cartItem)}
              disabled={outOfStock}
              size="sm"
              className="min-w-0 flex-1 px-2"
            >
              <ShoppingCart size={14} aria-hidden="true" className="shrink-0" />
              <span className="truncate">{outOfStock ? "Unavailable" : "Add to Cart"}</span>
            </Button>
            <Button
              onClick={buyNow}
              disabled={outOfStock}
              variant="navy"
              size="sm"
              className="min-w-0 flex-1 px-2"
            >
              <span className="truncate">Buy Now</span>
            </Button>
          </div>
        </div>
      </div>
      {/* Reserves the height the pinned bar occupies. */}
      <div aria-hidden="true" className="h-[4.5rem] md:hidden" />

      <BottomSheet open={videoOpen} onClose={() => setVideoOpen(false)} title="Product video">
        {videos[0] && (
          <video src={videos[0]} controls playsInline className="w-full rounded-lg bg-navy-950" />
        )}
      </BottomSheet>
    </>
  );
}

/**
 * Full-width "Detailed Description" / "Reviews" tabs under the buy area —
 * the long-form write-up authored in the admin's rich editor gets the whole
 * screen width, the way hobby stores present their spec sheets.
 */
function DetailTabs({ product }: { product: CatalogProduct }) {
  const [tab, setTab] = useState<"description" | "reviews">("description");

  const tabs = [
    { key: "description" as const, label: "Detailed Description" },
    {
      key: "reviews" as const,
      label: `Reviews${product.numReviews > 0 ? ` (${product.numReviews})` : ""}`,
    },
  ];

  return (
    <section aria-label="Product information" className="mt-10 lg:mt-14">
      <div role="tablist" className="flex gap-1 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px rounded-t-lg border px-4 py-2.5 text-micro font-semibold transition-colors md:px-6",
              tab === t.key
                ? "border-line border-b-white bg-white text-ink"
                : "border-transparent text-slate-500 hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-b-xl border border-t-0 border-line bg-white p-5 md:p-8">
        {tab === "description" ? (
          product.richDescription?.trim() ? (
            <RichText text={product.richDescription} />
          ) : product.description ? (
            <p className="text-micro leading-relaxed text-slate-600">{product.description}</p>
          ) : (
            <p className="text-micro text-slate-500">
              A detailed write-up for this product is on its way.
            </p>
          )
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Rating value={product.rating} size={18} />
            <p className="text-micro font-semibold text-ink">
              {product.rating.toFixed(1)} out of 5
              {product.numReviews > 0 &&
                ` · ${product.numReviews} ${product.numReviews === 1 ? "rating" : "ratings"}`}
            </p>
            <p className="max-w-sm text-nano text-slate-500">
              Written reviews are coming soon. Bought this product? Tell us about it on WhatsApp
              and we&apos;ll feature your review here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
