"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BadgePercent,
  Boxes,
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Upload,
  Settings,
  ShoppingBag,
  Store,
  Tags,
  Type,
  Users,
  X,
} from "lucide-react";
import { BrandMark } from "@/app/components-home/ui/BrandLogo";
import { cn } from "@/app/components-home/lib/cn";
import type { SessionUser } from "@/app/server/auth";
import { ToastProvider } from "./Toast";
import NotificationBell from "./NotificationBell";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/import", label: "Import", icon: Upload },
  { href: "/admin/categories", label: "Categories", icon: Boxes },
  { href: "/admin/brands", label: "Brands", icon: Tags },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: BadgePercent },
  { href: "/admin/homepage", label: "Homepage", icon: Home },
  { href: "/admin/content", label: "Content", icon: Type },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const isActive = (href: string, pathname: string) =>
  // Exact match for /admin so it isn't active on every sub-page.
  href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const reduceMotion = useReducedMotion();

  return (
    <ul className="flex flex-col gap-0.5 px-3">
      {LINKS.map((link) => {
        const active = isActive(link.href, pathname);
        const Icon = link.icon;
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-11 items-center gap-3 rounded-lg px-3 text-micro font-semibold transition-colors",
                active ? "text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
              )}
            >
              {active && (
                // One shared layoutId slides the highlight between items rather
                // than cross-fading two separate pills.
                <motion.span
                  layoutId="admin-nav-active"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-lg bg-gold-500/15 ring-1 ring-inset ring-gold-500/40"
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
              <Icon
                size={17}
                aria-hidden="true"
                className={cn("relative shrink-0", active && "text-gold-400")}
              />
              <span className="relative">{link.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function AdminShell({
  admin,
  children,
}: {
  admin: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  // Escape closes whichever overlay is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setDrawerOpen(false);
      setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A drawer left open behind a route change traps the page under a scrim.
  useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const title = LINKS.find((l) => isActive(l.href, pathname))?.label ?? "Admin";

  return (
    <ToastProvider>
    <div className="min-h-screen bg-mist lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* ── Sidebar (persistent from lg) ── */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-navy-800/40 bg-navy-950 lg:flex">
        <Link href="/admin" className="flex h-16 shrink-0 items-center gap-2.5 px-5">
          <BrandMark className="h-7 w-7" />
          <span className="text-ui font-bold text-white">WOW Admin</span>
        </Link>
        <nav aria-label="Admin sections" className="min-h-0 flex-1 overflow-y-auto py-2">
          <NavList pathname={pathname} />
        </nav>
        <Link
          href="/"
          className="m-3 flex h-10 items-center gap-2.5 rounded-lg px-3 text-micro font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Store size={16} aria-hidden="true" />
          View storefront
        </Link>
      </aside>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-navy-950/60 lg:hidden"
            />
            <motion.aside
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Admin sections"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 38 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[16rem] flex-col bg-navy-950 lg:hidden"
            >
              <div className="flex h-16 shrink-0 items-center justify-between px-4">
                <span className="flex items-center gap-2.5">
                  <BrandMark className="h-7 w-7" />
                  <span className="text-ui font-bold text-white">WOW Admin</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="grid h-11 w-11 place-items-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <nav className="min-h-0 flex-1 overflow-y-auto py-2">
                <NavList pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
              </nav>
              <Link
                href="/"
                className="m-3 flex h-10 items-center gap-2.5 rounded-lg px-3 text-micro font-semibold text-white/60 hover:bg-white/5 hover:text-white"
              >
                <Store size={16} aria-hidden="true" />
                View storefront
              </Link>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main column ── */}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-white/95 px-gutter backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="-ml-2 grid h-11 w-11 shrink-0 place-items-center rounded-md text-ink transition-colors hover:bg-mist lg:hidden"
          >
            <Menu size={19} aria-hidden="true" />
          </button>

          <h1 className="min-w-0 flex-1 truncate text-ui font-bold text-ink">{title}</h1>

          <NotificationBell />

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex h-10 items-center gap-2 rounded-full border border-line pl-1.5 pr-2.5 transition-colors hover:border-gold-300 hover:bg-mist"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy-900 text-nano font-bold text-gold-400">
                {admin.name.charAt(0).toUpperCase()}
              </span>
              <span className="hidden max-w-[9rem] truncate text-micro font-semibold text-ink sm:block">
                {admin.name}
              </span>
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={cn("shrink-0 text-slate-400 transition-transform", menuOpen && "rotate-180")}
              />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    aria-hidden="true"
                    onClick={() => setMenuOpen(false)}
                  />
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: reduceMotion ? 0 : 0.15 }}
                    className="absolute right-0 z-20 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-line bg-white shadow-card-hover"
                  >
                    <div className="border-b border-line px-4 py-3">
                      <p className="truncate text-micro font-semibold text-ink">{admin.name}</p>
                      <p className="truncate text-nano text-slate-500">{admin.email}</p>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={signOut}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-micro font-semibold text-ink transition-colors hover:bg-mist"
                    >
                      <LogOut size={15} aria-hidden="true" className="text-slate-400" />
                      Sign out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-gutter py-7">
          {/* Keyed on the route so each page fades in on navigation.
              Opacity only, deliberately: animating `y` leaves a transform on
              this wrapper, and a transformed ancestor becomes the containing
              block for `sticky`/`fixed` descendants — which silently
              mis-positions the tab bar and the product form's save bar. */}
          <motion.div
            key={pathname}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
    </ToastProvider>
  );
}
