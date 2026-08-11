import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Container from "./ui/Container";
import type { NavItem } from "./data/home-content";

/**
 * Dropdown panel for the four nav items that have children. Renders the link
 * columns plus an optional promo tile on the right.
 *
 * Positioning and open/close are owned by `MainNav` — this component is purely
 * presentational so it can be reused by any nav surface.
 */
export default function MegaMenu({ item, id }: { item: NavItem; id: string }) {
  if (!item.menu?.length) return null;

  return (
    <div
      id={id}
      className="absolute inset-x-0 top-full z-40 hidden border-b border-line bg-white shadow-[0_18px_36px_-20px_rgba(16,33,53,0.35)] lg:block"
    >
      <Container>
        <div className="flex gap-u-8 py-u-7">
          <div className="grid flex-1 grid-cols-3 gap-x-u-8 gap-y-u-6">
            {item.menu.map((group) => (
              <div key={group.title}>
                <h3 className="mb-u-3 text-nav-nano font-bold uppercase tracking-[0.14em] text-gold-600">
                  {group.title}
                </h3>
                <ul className="space-y-u-2">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-nav-micro text-slate-600 transition-colors hover:text-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {item.feature && (
            <Link
              href={item.feature.href}
              className="group relative w-mega shrink-0 overflow-hidden rounded-lg bg-navy-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
            >
              <Image
                src={item.feature.src}
                alt={item.feature.alt}
                fill
                sizes="252px"
                className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/55 to-transparent"
              />
              <div className="relative flex h-full min-h-[9.225rem] flex-col justify-end p-u-4">
                <p className="text-nav-lead font-bold leading-tight text-white">{item.feature.title}</p>
                <p className="mt-u-1 text-nav-nano text-white/70">{item.feature.subtitle}</p>
                <span className="mt-u-2.5 inline-flex items-center gap-u-1.5 text-nav-nano font-semibold text-gold-400">
                  Shop now
                  <ArrowRight size={11} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          )}
        </div>
      </Container>
    </div>
  );
}
