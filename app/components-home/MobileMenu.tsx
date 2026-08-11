"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Crown, LogOut, Package, Pencil, PhoneCall, User, X } from "lucide-react";
import { BrandMark } from "./ui/BrandLogo";
import { announcement, brand, navItems as defaultNavItems, type NavItem } from "./data/home-content";
import { cn } from "./lib/cn";
import { setCurrentUser, useCurrentUser } from "./lib/useCurrentUser";

/**
 * Off-canvas navigation for tablet and phone. Mirrors the desktop department
 * list, with the mega-menu groups collapsed into accordions.
 */
export default function MobileMenu({
  open,
  onClose,
  items = defaultNavItems,
}: {
  open: boolean;
  onClose: () => void;
  items?: NavItem[];
}) {
  const navItems = items;
  const [expanded, setExpanded] = useState<string | null>(null);
  const user = useCurrentUser();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setCurrentUser(null);
    onClose();
    router.push("/");
    router.refresh();
  };

  // Lock body scroll and wire Escape while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div className={cn("lg:hidden", !open && "pointer-events-none")} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-50 bg-navy-950/50 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-drawer flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-row-sm shrink-0 items-center justify-between border-b border-line px-u-4">
          <span className="flex items-center gap-u-2.5">
            <BrandMark className="h-7 w-7" />
            <span className="flex flex-col leading-none">
              <span className="text-nav-ui font-bold text-ink">{brand.name}</span>
              <span className="mt-[2.835px] text-[8.51px] font-medium tracking-[0.22em] text-slate-500">
                {brand.location}
              </span>
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="grid h-nav-control-sm w-nav-control-sm place-items-center rounded-md text-slate-500 transition-colors hover:bg-mist hover:text-ink"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-u-2 py-u-3">
          <ul className="space-y-u-0.5">
            {navItems.map((item) => {
              const isOpen = expanded === item.label;
              return (
                <li key={item.label}>
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="flex-1 rounded-md px-u-3 py-u-2.5 text-nav-ui font-medium text-ink transition-colors hover:bg-mist"
                    >
                      {item.label}
                    </Link>
                    {item.menu?.length ? (
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : item.label)}
                        aria-expanded={isOpen}
                        aria-label={`${isOpen ? "Collapse" : "Expand"} ${item.label}`}
                        className="grid h-nav-control-sm w-nav-control-sm place-items-center rounded-md text-slate-400 transition-colors hover:bg-mist hover:text-ink"
                      >
                        <ChevronDown
                          size={14}
                          aria-hidden="true"
                          className={cn("transition-transform duration-200", isOpen && "rotate-180")}
                        />
                      </button>
                    ) : null}
                  </div>

                  {item.menu?.length && isOpen ? (
                    <div className="mb-u-2 ml-u-3 border-l border-line pl-u-3">
                      {item.menu.map((group) => (
                        <div key={group.title} className="py-u-1.5">
                          <p className="px-u-1 py-u-1 text-nav-nano font-bold uppercase tracking-[0.14em] text-gold-600">
                            {group.title}
                          </p>
                          <ul>
                            {group.links.map((link) => (
                              <li key={link.label}>
                                <Link
                                  href={link.href}
                                  onClick={onClose}
                                  className="block rounded-md px-u-1 py-u-1.5 text-nav-micro text-slate-600 transition-colors hover:text-gold-600"
                                >
                                  {link.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 space-y-u-2 border-t border-line p-u-4">
          {/* Otherwise My Orders has no persistent entry point at all on
              mobile — reachable only via the one-time checkout-success screen
              or a typed URL. */}
          <Link
            href="/orders"
            onClick={onClose}
            className="flex h-nav-control-md items-center justify-center gap-u-2 rounded-md border border-line text-nav-ui font-semibold text-ink transition-colors hover:bg-mist"
          >
            <Package size={14} aria-hidden="true" />
            My Orders
          </Link>
          {user ? (
            <>
              <Link
                href="/account"
                onClick={onClose}
                className="flex h-nav-control-md items-center justify-center gap-u-2 rounded-md border border-line text-nav-ui font-semibold text-ink transition-colors hover:bg-mist"
              >
                <Pencil size={14} aria-hidden="true" />
                <span className="max-w-[12rem] truncate">Edit Profile — {user.name}</span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex h-nav-control-md w-full items-center justify-center gap-u-2 rounded-md border border-[#FECACA] text-nav-ui font-semibold text-[#B91C1C] transition-colors hover:bg-[#FEF2F2]"
              >
                <LogOut size={14} aria-hidden="true" />
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="flex h-nav-control-md items-center justify-center gap-u-2 rounded-md border border-line text-nav-ui font-semibold text-ink transition-colors hover:bg-mist"
            >
              <User size={14} aria-hidden="true" />
              Sign In / Register
            </Link>
          )}
          <Link
            href="/"
            onClick={onClose}
            className="flex h-nav-control-md items-center justify-center gap-u-2 rounded-md bg-gold-500 text-nav-ui font-semibold text-navy-900 transition-colors hover:bg-gold-600"
          >
            <Crown size={14} aria-hidden="true" />
            WOW Club
          </Link>
          <a
            href={announcement.help.href}
            className="flex items-center justify-center gap-u-2 pt-u-1 text-nav-micro font-medium text-slate-500 transition-colors hover:text-gold-600"
          >
            <PhoneCall size={12} aria-hidden="true" />
            {announcement.help.phone}
          </a>
        </div>
      </div>
    </div>
  );
}
