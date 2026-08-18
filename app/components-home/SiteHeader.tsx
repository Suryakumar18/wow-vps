"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Crown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Pencil,
  User,
} from "lucide-react";
import Container from "./ui/Container";
import BrandLogo from "./ui/BrandLogo";
import SearchBar from "./SearchBar";
import CartButton from "./CartButton";
import MainNav from "./MainNav";
import MobileMenu from "./MobileMenu";
import { WishlistLink } from "./WishlistButton";
import AnnouncementBar from "./AnnouncementBar";
import { cn } from "./lib/cn";
import { setCurrentUser, useCurrentUser } from "./lib/useCurrentUser";

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

              <AccountMenu />

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
 * "Sign In / Register" for guests; the customer's name with a dropdown
 * (My Orders / Edit Profile / Logout) once signed in. Auth state comes from
 * the shared client-side cache (`useCurrentUser`), so the prerendered pages
 * this header sits on stay static — no cookies are read during server
 * render.
 */
function AccountMenu() {
  const user = useCurrentUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setCurrentUser(null);
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  if (!user) {
    return (
      <Link
        href="/login"
        className="hidden min-h-11 min-w-11 items-center justify-center gap-u-2 text-ink transition-colors hover:text-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600 sm:flex xl:min-w-0"
      >
        <User size={18} strokeWidth={1.75} aria-hidden="true" />
        <span className="hidden max-w-[9rem] truncate text-nav-ui font-medium xl:inline">
          Sign In / Register
        </span>
      </Link>
    );
  }

  const menuItem =
    "flex w-full items-center gap-2.5 px-4 py-2.5 text-nav-ui font-medium text-ink transition-colors hover:bg-mist";

  return (
    <div ref={menuRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex min-h-11 min-w-11 items-center justify-center gap-u-2 text-ink transition-colors hover:text-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600 xl:min-w-0"
      >
        <User size={18} strokeWidth={1.75} aria-hidden="true" />
        <span className="hidden max-w-[9rem] truncate text-nav-ui font-medium xl:inline">
          {user.name.split(" ")[0]}
        </span>
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={cn("hidden transition-transform xl:block", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-[0_16px_40px_-16px_rgba(16,33,53,0.35)]"
        >
          <p className="border-b border-line px-4 py-2.5 text-nav-nano text-slate-500">
            Signed in as <span className="font-semibold text-ink">{user.name}</span>
          </p>
          <Link href="/orders" role="menuitem" onClick={() => setOpen(false)} className={menuItem}>
            <Package size={15} aria-hidden="true" className="text-slate-400" />
            My Orders
          </Link>
          <Link href="/account" role="menuitem" onClick={() => setOpen(false)} className={menuItem}>
            <Pencil size={15} aria-hidden="true" className="text-slate-400" />
            Edit Profile
          </Link>
          {/* Admins get a way into the back office from wherever they are on
              the storefront. Gated on the same `isAdmin` flag the admin routes
              check server-side, so this only hides the shortcut — it is not
              what protects /admin. */}
          {user.isAdmin && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(menuItem, "border-t border-line font-semibold text-gold-700 hover:bg-gold-50")}
            >
              <LayoutDashboard size={15} aria-hidden="true" className="text-gold-600" />
              Go to Admin Console
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className={cn(menuItem, "border-t border-line text-[#B91C1C] hover:bg-[#FEF2F2]")}
          >
            <LogOut size={15} aria-hidden="true" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
