"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/app/components-home/lib/CartContext";
import Section from "../ui/Section";
import Badge from "../ui/Badge";
import { formatPrice } from "../lib/format";
import { popularPicks as defaultPicks, type Product } from "../data/home-content";

/** Ticks down to local midnight — the deal window resets each day. */
function useCountdown() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const total = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
      const pad = (n: number) => String(n).padStart(2, "0");
      setLabel(`${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Null on the server and first paint, so the markup can't hydrate-mismatch.
  return label;
}

/**
 * "Deals of the Day" — a mobile-only rail of the sharpest discounts, sitting
 * between the WOW Club banner and the department banners as in the approved
 * mobile design. Hidden from `lg`, where the approved desktop page has no
 * equivalent section and must not gain one.
 */
export default function DealsOfTheDay({ products }: { products?: Product[] }) {
  const { addToCart } = useCart();
  const countdown = useCountdown();

  // The server already picks and orders these; the local fallback only applies
  // when the component is rendered without them.
  const deals =
    products ??
    defaultPicks
      .filter((p) => p.mrp > p.price)
      .sort((a, b) => b.mrp - b.price - (a.mrp - a.price))
      .slice(0, 6);

  if (deals.length === 0) return null;

  return (
    <Section label="Deals of the day" className="order-5 lg:hidden">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-promo font-bold text-ink">Deals of the Day</h2>
        <p className="flex shrink-0 items-center gap-1.5 text-nano text-slate-500">
          Ends in
          <span
            suppressHydrationWarning
            className="rounded bg-[#E23B3B]/10 px-1.5 py-0.5 font-semibold tabular-nums text-[#B91C1C]"
          >
            {countdown ?? "--:--:--"}
          </span>
        </p>
      </div>

      <ul className="mt-heading -mx-gutter flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-gutter pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {deals.map((product) => {
          const discount =
            product.discount ?? Math.round((1 - product.price / product.mrp) * 100);

          return (
            <li key={product.id} className="w-[8.5rem] shrink-0 snap-start xs:w-[9.5rem]">
              <article className="relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white shadow-card">
                <Link
                  href={product.href}
                  className="relative block aspect-square overflow-hidden bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold-600"
                >
                  {discount > 0 && (
                    <Badge tone="discount" className="absolute left-1.5 top-1.5 z-10">
                      -{discount}%
                    </Badge>
                  )}
                  <Image
                    src={product.src}
                    alt={product.alt}
                    fill
                    loading="lazy"
                    sizes="152px"
                    className="object-cover"
                  />
                </Link>

                <div className="flex flex-1 flex-col p-2">
                  <h3 className="truncate text-nano font-semibold text-ink">
                    <Link href={product.href} className="transition-colors hover:text-gold-600">
                      {product.title}
                    </Link>
                  </h3>
                  <p className="mt-0.5 truncate text-nano text-slate-500">{product.subtitle}</p>

                  <div className="mt-auto flex items-end justify-between gap-1.5 pt-2">
                    <p className="min-w-0">
                      <span className="block text-micro font-bold text-ink">
                        {formatPrice(product.price)}
                      </span>
                      <span className="block text-nano text-slate-400 line-through">
                        {formatPrice(product.mrp)}
                      </span>
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        addToCart({
                          id: product.id,
                          title: product.title,
                          price: product.price,
                          image: product.src,
                          quantity: 1,
                          totalStock: product.stock,
                        })
                      }
                      aria-label={`Add ${product.title} to cart`}
                      className="grid h-control-sm w-control-sm shrink-0 place-items-center rounded-md bg-navy-800 text-white transition-colors hover:bg-navy-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-800"
                    >
                      <ShoppingCart size={13} strokeWidth={2.25} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
