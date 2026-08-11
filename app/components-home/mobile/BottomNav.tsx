"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Home, LayoutGrid, LogOut, Package, Pencil, Percent, Heart, User } from "lucide-react";
import BottomSheet from "../ui/BottomSheet";
import Icon, { type IconName } from "../ui/Icon";
import Badge from "../ui/Badge";
import { useWishlistIds } from "../WishlistButton";
import { allCategories } from "../data/home-content";
import { cn } from "../lib/cn";
import { setCurrentUser, useCurrentUser } from "../lib/useCurrentUser";

type Tab = {
  key: string;
  label: string;
  icon: typeof Home;
  /** Absent for tabs that open a sheet instead of navigating. */
  href?: string;
  sheet?: true;
  /** Explicit active test — prefix matching alone lights the wrong tab when two routes share a path. */
  match?: (pathname: string) => boolean;
};

const TABS: Tab[] = [
  { key: "home", label: "Home", icon: Home, href: "/", match: (p) => p === "/" },
  // Category selection is a bottom sheet, not a page hop.
  { key: "categories", label: "Categories", icon: LayoutGrid, sheet: true },
  // TODO: point at a real discounts feed once the catalogue can filter on one.
  // Until then this is the full catalogue, and it owns the /category/all route.
  { key: "deals", label: "Deals", icon: Percent, href: "/category/all", match: (p) => p === "/category/all" },
  { key: "wishlist", label: "Wishlist", icon: Heart, href: "/wishlist", match: (p) => p.startsWith("/wishlist") },
  {
    key: "account",
    label: "Account",
    icon: User,
    href: "/login",
    match: (p) => p.startsWith("/login") || p.startsWith("/register") || p.startsWith("/orders"),
  },
];

/**
 * Persistent bottom navigation for phone and tablet, hidden from `lg` where the
 * desktop header nav takes over.
 *
 * Sizing is deliberately outside `UI_SCALE`: the 56px bar and 44px-plus targets
 * are touch ergonomics, not design scale, so they don't shrink with the rest of
 * the system. The bar clears the home indicator via `safe-area-inset-bottom`.
 *
 * The active indicator is a single element translated across equal-width tabs,
 * so it glides between them instead of popping per tab.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const wishlist = useWishlistIds();
  const user = useCurrentUser();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  // Signed-in customers get an account sheet (orders / profile / logout);
  // guests go straight to the login page.
  const [accountOpen, setAccountOpen] = useState(false);

  const activeIndex = categoriesOpen
    ? 1
    : accountOpen
      ? TABS.length - 1
      : TABS.findIndex((t) => t.match?.(pathname));

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setCurrentUser(null);
    setAccountOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm print:hidden lg:hidden"
      >
        <div className="relative flex h-14">
          {/* Floating active indicator — one element, translated across tabs. */}
          <span
            aria-hidden="true"
            className={cn(
              "absolute top-0 h-0.5 w-1/5 px-5 transition-transform duration-300 ease-out motion-reduce:transition-none",
              activeIndex < 0 && "opacity-0",
            )}
            style={{ transform: `translateX(${Math.max(activeIndex, 0) * 100}%)` }}
          >
            <span className="block h-full w-full rounded-full bg-gold-500" />
          </span>

          {TABS.map((tab, i) => {
            const active = i === activeIndex;
            const Glyph = tab.icon;
            const content = (
              <>
                <span className="relative">
                  <Glyph
                    size={20}
                    strokeWidth={active ? 2.25 : 1.75}
                    aria-hidden="true"
                    fill={active && tab.key === "wishlist" ? "currentColor" : "none"}
                  />
                  {tab.key === "wishlist" && wishlist.length > 0 && (
                    <Badge tone="count" className="absolute -right-2.5 -top-2">
                      {wishlist.length > 9 ? "9+" : wishlist.length}
                    </Badge>
                  )}
                </span>
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              </>
            );

            const classes = cn(
              "flex flex-1 flex-col items-center justify-center gap-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold-600",
              active ? "text-gold-600" : "text-slate-500 hover:text-ink",
            );

            if (tab.sheet || !tab.href) {
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setCategoriesOpen(true)}
                  aria-expanded={categoriesOpen}
                  aria-haspopup="dialog"
                  className={classes}
                >
                  {content}
                </button>
              );
            }
            if (tab.key === "account" && user) {
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setAccountOpen(true)}
                  aria-expanded={accountOpen}
                  aria-haspopup="dialog"
                  className={classes}
                >
                  {content}
                </button>
              );
            }
            return (
              <Link
                key={tab.key}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={classes}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>

      <BottomSheet
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        title="My Account"
        description={user ? `Signed in as ${user.name}` : undefined}
      >
        <ul className="pb-2">
          <li>
            <Link
              href="/orders"
              onClick={() => setAccountOpen(false)}
              className="flex min-h-[3rem] items-center gap-3 rounded-lg px-1 text-nav-micro text-ink transition-colors hover:bg-gold-50"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mist text-gold-600">
                <Package size={16} aria-hidden="true" />
              </span>
              Your Orders
            </Link>
          </li>
          <li>
            <Link
              href="/account"
              onClick={() => setAccountOpen(false)}
              className="flex min-h-[3rem] items-center gap-3 rounded-lg px-1 text-nav-micro text-ink transition-colors hover:bg-gold-50"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mist text-gold-600">
                <Pencil size={16} aria-hidden="true" />
              </span>
              Profile — name, email &amp; password
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={logout}
              className="flex min-h-[3rem] w-full items-center gap-3 rounded-lg px-1 text-nav-micro font-semibold text-[#B91C1C] transition-colors hover:bg-[#FEF2F2]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FEF2F2] text-[#B91C1C]">
                <LogOut size={16} aria-hidden="true" />
              </span>
              Logout
            </button>
          </li>
        </ul>
      </BottomSheet>

      <BottomSheet
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        title="Shop by category"
        description="Jump straight into a department"
      >
        <ul className="pb-2">
          {allCategories.map((cat) => (
            <li key={cat.href}>
              <Link
                href={cat.href}
                onClick={() => setCategoriesOpen(false)}
                className="flex min-h-[3rem] items-center gap-3 rounded-lg px-1 text-nav-micro text-ink transition-colors hover:bg-gold-50"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mist text-gold-600">
                  <Icon name={cat.icon as IconName} size={16} />
                </span>
                {cat.label}
              </Link>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </>
  );
}
