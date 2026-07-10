"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FolderOpen, Package, ClipboardList, Users,
  Zap, Settings, LogOut, ChevronRight,
  Sparkles, Rocket, Video, Car, Star, Gift,
  Grid3X3, LayoutGrid, MessageSquare, ShoppingBag, Mail,
  BookOpen, Quote, Receipt, ArrowRight,
} from "lucide-react";
import "./Layout.css";
import "../billing/billing.css";

/* ─── Menu config (grouped like Nexadash: MAIN / CONTENT / ACCOUNT) ──────────── */
const SECTION_CHILDREN = [
  { name: "Hero",          icon: Sparkles,      path: "/admin/hero"             },
  { name: "Hot Drops",     icon: Rocket,        path: "/admin/hot-drops"        },
  { name: "Studio",        icon: Video,         path: "/admin/StudioAdminPage"  },
  { name: "Ralleyz",       icon: Car,           path: "/admin/RalleyzSection"   },
  { name: "Characters",    icon: Star,          path: "/admin/characters"       },
  { name: "Top Picks",     icon: ShoppingBag,   path: "/admin/best-sellers"     },
  { name: "Shop By Age",   icon: Gift,          path: "/admin/shop-by-age"      },
  { name: "Categories",    icon: Grid3X3,       path: "/admin/shop-by-category" },
  { name: "Bento Grid",    icon: LayoutGrid,    path: "/admin/bento-grid"       },
  { name: "Reviews",       icon: MessageSquare, path: "/admin/reviews"          },
  { name: "Services",      icon: ShoppingBag,   path: "/admin/services"         },
  { name: "Contact",       icon: Mail,          path: "/admin/contact"          },
  { name: "Blog",          icon: BookOpen,      path: "/admin/blog-lifestyle"   },
  { name: "Testimonials",  icon: Quote,         path: "/admin/testimonials"     },
] as const;

const GROUPS = [
  {
    label: "Main",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard"     },
      { name: "Products",  icon: Package,         path: "/admin/product"       },
      { name: "Orders",    icon: ClipboardList,   path: "/admin/order-history" },
      { name: "Users",     icon: Users,           path: "/admin/users"         },
    ],
  },
  {
    label: "Content",
    items: [
      { name: "Page Sections",   icon: FolderOpen, children: SECTION_CHILDREN },
      { name: "Dynamic Content", icon: Zap,        path: "/admin/dynamic-content" },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Settings", icon: Settings, path: "/admin/settings" },
    ],
  },
] as const;

/* ─── Component ───────────────────────────────────────────────────────────────── */
export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [user, setUser] = useState<{ fullname?: string; email?: string } | null>(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (u?.email) setUser(u);
    } catch {}
  }, []);

  // Auto-open Page Sections group when on a section route
  useEffect(() => {
    if (SECTION_CHILDREN.some((c) => c.path === pathname)) setSectionsOpen(true);
  }, [pathname]);

  // Listen for mobile toggle event dispatched by Navbar
  useEffect(() => {
    const sidebarEl = document.querySelector(".sidebar") as HTMLElement | null;
    const toggle = () => sidebarEl?.classList.toggle("open");
    window.addEventListener("wow-sidebar-toggle", toggle);
    return () => window.removeEventListener("wow-sidebar-toggle", toggle);
  }, []);

  const isActive = (p: string) => pathname === p;
  const sectionActive = SECTION_CHILDREN.some((c) => c.path === pathname);

  const initials = user?.fullname
    ? user.fullname.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  const closeMobile = () => {
    (document.querySelector(".sidebar") as HTMLElement | null)?.classList.remove("open");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <aside className="sidebar">
      {/* Logo card */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">W</div>
        <div>
          <div className="sidebar-logo-name">WOW <span>Lifestyle</span></div>
          <div className="sidebar-logo-sub">Admin &amp; Store</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {/* Switch to Billing */}
        <Link href="/admin/billing/dashboard" className="sidebar-switch" onClick={closeMobile}>
          <span className="sidebar-switch-icon"><Receipt size={15} /></span>
          Switch to Billing
          <ArrowRight size={15} className="sidebar-switch-arrow" />
        </Link>

        {GROUPS.map((group) => (
          <React.Fragment key={group.label}>
            <div className="sidebar-section-label">{group.label}</div>

            {group.items.map((item) => {
              if ("children" in item) {
                return (
                  <div key={item.name}>
                    <button
                      className={`sidebar-item ${sectionActive && !sectionsOpen ? "sidebar-item-active" : ""}`}
                      onClick={() => setSectionsOpen((v) => !v)}
                    >
                      <item.icon size={17} className="sidebar-item-icon" />
                      <span className="sidebar-item-label">{item.name}</span>
                      <ChevronRight
                        size={13}
                        className={`sidebar-chevron ${sectionsOpen ? "sidebar-chevron-open" : ""}`}
                      />
                    </button>
                    {sectionsOpen && (
                      <div className="sidebar-children">
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            href={child.path}
                            className={`sidebar-child ${isActive(child.path) ? "sidebar-child-active" : ""}`}
                            onClick={closeMobile}
                          >
                            <child.icon size={13} />
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`sidebar-item ${isActive(item.path) ? "sidebar-item-active" : ""}`}
                  onClick={closeMobile}
                >
                  <item.icon size={17} className="sidebar-item-icon" />
                  <span className="sidebar-item-label">{item.name}</span>
                </Link>
              );
            })}
          </React.Fragment>
        ))}
      </nav>

      {/* Footer — user card with inline sign-out */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.fullname || "Admin"}</div>
            <div className="sidebar-user-email">{user?.email || "admin@wowlifestyle.online"}</div>
          </div>
          <button className="sidebar-logout-icon" onClick={handleLogout} title="Sign Out" aria-label="Sign Out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
