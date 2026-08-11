"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu } from "lucide-react";
import Container from "./ui/Container";
import Icon, { type IconName } from "./ui/Icon";
import MegaMenu from "./MegaMenu";
import { allCategories as defaultAllCategories, navItems as defaultNavItems, type NavItem } from "./data/home-content";
import { cn } from "./lib/cn";

/** Hovering off a trigger shouldn't slam the panel shut while the cursor travels. */
const CLOSE_DELAY = 120;

/**
 * Primary navigation strip: the gold "All Categories" trigger followed by the
 * top-level department links, four of which open a mega menu.
 *
 * Hidden below `lg` — the same departments live in the drawer, and a second nav
 * strip would cost a small screen ~40px of permanently pinned height.
 */
export default function MainNav({
  items = defaultNavItems,
  allCategories: categoryLinks,
}: {
  items?: NavItem[];
  allCategories?: { label: string; href: string; icon: string }[];
}) {
  const navItems = items;
  const allCategories = categoryLinks ?? defaultAllCategories;
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const clearClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const scheduleClose = () => {
    clearClose();
    closeTimer.current = setTimeout(() => setOpenIndex(null), CLOSE_DELAY);
  };

  useEffect(() => () => clearClose(), []);

  // Escape closes whatever is open; a click outside closes the category flyout.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenIndex(null);
      setCategoriesOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
        setOpenIndex(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <nav ref={navRef} aria-label="Primary" className="relative hidden border-b border-line bg-white lg:block">
      <Container>
        <div className="flex h-nav items-center gap-u-4 lg:gap-u-5">
          {/* All Categories */}
          <div
            className="relative shrink-0"
            onMouseEnter={() => setCategoriesOpen(true)}
            onMouseLeave={() => setCategoriesOpen(false)}
          >
            <button
              type="button"
              aria-expanded={categoriesOpen}
              aria-haspopup="true"
              onClick={() => setCategoriesOpen((o) => !o)}
              className="inline-flex h-nav-control-xs items-center gap-u-2 rounded-md bg-gold-500 px-u-2.5 text-nav-micro font-semibold text-navy-900 transition-colors hover:bg-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
            >
              <Menu size={13} strokeWidth={2.5} aria-hidden="true" />
              <span className="whitespace-nowrap">All Categories</span>
              <ChevronDown
                size={12}
                strokeWidth={2.5}
                aria-hidden="true"
                className={cn("transition-transform duration-200", categoriesOpen && "rotate-180")}
              />
            </button>

            {categoriesOpen && (
              <ul className="absolute left-0 top-full z-50 mt-u-1 w-menu overflow-hidden rounded-lg border border-line bg-white py-u-1.5 shadow-[0_18px_36px_-20px_rgba(16,33,53,0.4)]">
                {allCategories.map((cat) => (
                  <li key={cat.href}>
                    <Link
                      href={cat.href}
                      className="flex items-center gap-u-2.5 px-u-3.5 py-u-2 text-nav-micro text-slate-600 transition-colors hover:bg-gold-50 hover:text-gold-700 focus-visible:bg-gold-50 focus-visible:outline-none"
                    >
                      <Icon name={cat.icon as IconName} size={14} className="text-gold-500" />
                      {cat.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Department links */}
          {/* Stays a scroller at every width: between `lg` and ~1150px the nine
              departments still overflow, and letting them escape would scroll
              the whole page sideways. The mega menu is a sibling of this list,
              so clipping here never affects the dropdown. */}
          <ul className="-mx-u-1 flex min-w-0 flex-1 items-center gap-u-4 overflow-x-auto px-u-1 [scrollbar-width:none] lg:gap-u-5 xl:gap-u-7 [&::-webkit-scrollbar]:hidden">
            {navItems.map((item, i) => {
              const hasMenu = Boolean(item.menu?.length);
              const panelId = `mega-menu-${i}`;
              return (
                <li
                  key={item.label}
                  className="shrink-0"
                  onMouseEnter={() => {
                    clearClose();
                    setOpenIndex(hasMenu ? i : null);
                  }}
                  onMouseLeave={scheduleClose}
                >
                  <Link
                    href={item.href}
                    aria-expanded={hasMenu ? openIndex === i : undefined}
                    aria-controls={hasMenu ? panelId : undefined}
                    onFocus={() => setOpenIndex(hasMenu ? i : null)}
                    className={cn(
                      "flex items-center gap-u-1 whitespace-nowrap py-u-2 text-nav-micro font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600",
                      openIndex === i ? "text-gold-600" : "text-ink hover:text-gold-600",
                    )}
                  >
                    {item.label}
                    {hasMenu && (
                      <ChevronDown
                        size={12}
                        strokeWidth={2.5}
                        aria-hidden="true"
                        className={cn("transition-transform duration-200", openIndex === i && "rotate-180")}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>

      {openIndex !== null && navItems[openIndex]?.menu && (
        <div onMouseEnter={clearClose} onMouseLeave={scheduleClose}>
          <MegaMenu item={navItems[openIndex]} id={`mega-menu-${openIndex}`} />
        </div>
      )}
    </nav>
  );
}
