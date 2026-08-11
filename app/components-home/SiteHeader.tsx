"use client";

import Link from "next/link";
import { useState } from "react";
import { Crown, Menu, Package, User } from "lucide-react";
import Container from "./ui/Container";
import BrandLogo from "./ui/BrandLogo";
import SearchBar from "./SearchBar";
import CartButton from "./CartButton";
import MainNav from "./MainNav";
import MobileMenu from "./MobileMenu";
import { WishlistLink } from "./WishlistButton";
import AnnouncementBar from "./AnnouncementBar";
import { cn } from "./lib/cn";
import { useCurrentUser } from "./lib/useCurrentUser";

/**
 * Site chrome: announcement bar, utility header and primary nav.
 *
 * The announcement bar and the header are siblings rather than nested, so the
 * bar can scroll away while the header below it sticks — a sticky element can
 * only travel within its own parent's box, so wrapping both would pin the
 * promo strip to the top forever.
 *
 * What stays pinned is deliberately different per device:
 *  - From `lg`: utility row + department nav (~124px).
 *  - Below `lg`: utility row + search (~104px). The departments move into the
 *    drawer instead of eating a quarter of a small screen with a nav strip
 *    that duplicates the menu.
 */
import type { NavItem } from "./data/home-content";

interface Brand {
  name: string;
  location: string;
  tagline: string;
  searchPlaceholder: string;
}
interface AnnouncementContent {
  left: { icon: string; label: string }[];
  center: { icon: string; label: string }[];
  help: { label: string; phone: string; href: string };
}
interface AllCategoryLink {
  label: string;
  href: string;
  icon: string;
}

export default function SiteHeader({
  hiddenBelowLg = false,
  brand,
  announcement,
  navItems,
  allCategories,
}: {
  hiddenBelowLg?: boolean;
  brand: Brand;
  announcement: AnnouncementContent;
  navItems: NavItem[];
  allCategories: AllCategoryLink[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <AnnouncementBar
        content={announcement}
        className={hiddenBelowLg ? "hidden lg:block" : undefined}
      />

      <header
        className={cn(
          "sticky top-0 z-50 bg-white shadow-[0_1px_0_rgba(16,33,53,0.06)]",
          hiddenBelowLg && "hidden lg:block",
        )}
      >
        <Container>
          <div className="flex h-row items-center gap-u-3 sm:h-row-sm lg:h-row-lg lg:gap-[clamp(1.35rem,2.7vw,2.25rem)]">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
              aria-expanded={menuOpen}
              className="-ml-u-1 grid h-nav-control-md w-nav-control-md shrink-0 place-items-center rounded-md text-ink transition-colors hover:bg-mist lg:hidden"
            >
              <Menu size={19} aria-hidden="true" />
            </button>

            <BrandLogo />

            <div className="hidden max-w-search flex-1 lg:block">
              <SearchBar placeholder={brand.searchPlaceholder} />
            </div>

            <div className="ml-auto flex items-center gap-u-3 sm:gap-u-4 xl:gap-[clamp(1.125rem,1.62vw,1.575rem)]">
              <WishlistLink />
              <CartButton />

              {/* Otherwise My Orders has no persistent entry point at all —
                  reachable only via the one-time checkout-success screen or a
                  typed URL. */}
              <Link
                href="/orders"
                className="hidden min-h-11 min-w-11 items-center justify-center gap-u-2 text-ink transition-colors hover:text-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-600 sm:flex xl:min-w-0"
              >
                <Package size={18} strokeWidth={1.75} aria-hidden="true" />
                <span className="hidden text-nav-ui font-medium xl:inline">My Orders</span>
              </Link>

              <AccountLink />

              <Link
                href="/"
                className="hidden h-nav-control-sm items-center gap-u-2 rounded-md bg-gold-500 px-u-3.5 text-nav-ui font-semibold text-navy-900 transition-colors hover:bg-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600 md:inline-flex"
              >
                <Crown size={14} aria-hidden="true" />
                WOW Club
              </Link>
            </div>
          </div>

          {/* Search keeps its own row below `lg` so it stays reachable while pinned. */}
          <div className="pb-u-2.5 lg:hidden">
            <SearchBar placeholder={brand.searchPlaceholder} />
          </div>
        </Container>

        <MainNav items={navItems} allCategories={allCategories} />
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} items={navItems} />
    </>
  );
}

/**
 * "Sign In / Register" for guests; the customer's first name once signed in,
 * linking to their orders. Auth state comes from the shared client-side
 * cache (`useCurrentUser`), so the prerendered pages this header sits on
 * stay static — no cookies are read during server render.
 */
function AccountLink() {
  const user = useCurrentUser();

  return (
    <Link
      href={user ? "/orders" : "/login"}
      className="hidden min-h-11 min-w-11 items-center justify-center gap-u-2 text-ink transition-colors hover:text-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600 sm:flex xl:min-w-0"
    >
      <User size={18} strokeWidth={1.75} aria-hidden="true" />
      <span className="hidden max-w-[9rem] truncate text-nav-ui font-medium xl:inline">
        {user ? user.name.split(" ")[0] : "Sign In / Register"}
      </span>
    </Link>
  );
}
