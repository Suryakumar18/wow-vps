"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Receipt, FileText, BarChart3, Zap, Settings,
  ArrowLeft, ChevronRight, ChevronDown, Menu, LogOut, ExternalLink,
} from "lucide-react";
import "../layout/Layout.css";
import "./billing.css";

const NAV = [
  { name: "Dashboard",  icon: LayoutDashboard, path: "/admin/billing/dashboard" },
  { name: "Quick Bill", icon: Zap,             path: "/admin/billing/new"       },
  { name: "Invoices",   icon: FileText,        path: "/admin/billing/invoices"  },
  { name: "Reports",    icon: BarChart3,       path: "/admin/billing/reports"   },
  { name: "Settings",   icon: Settings,        path: "/admin/billing/settings"  },
];

export default function BillingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ fullname?: string; email?: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (u?.email) setUser(u);
    } catch {}
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  useEffect(() => { setMenuOpen(false); setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const toggle = () => setMobileOpen((v) => !v);
    window.addEventListener("wow-sidebar-toggle", toggle);
    return () => window.removeEventListener("wow-sidebar-toggle", toggle);
  }, []);

  const isActive = (p: string) => pathname === p || pathname.startsWith(p + "/");
  const initials = user?.fullname
    ? user.fullname.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";
  const closeMobile = () => setMobileOpen(false);
  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/login"); };

  const title = NAV.find((n) => isActive(n.path))?.name || "Billing";

  return (
    <div className="billing-root">
      <div className="layout-wrapper">
        {mobileOpen && <div className="sidebar-backdrop" onClick={closeMobile} />}
        {/* ── Billing sidebar ── */}
        <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
          <div className="sidebar-logo">
            <div className="sidebar-logo-mark billing">₹</div>
            <div>
              <div className="sidebar-logo-name">Billing <span>Suite</span></div>
              <div className="sidebar-logo-sub">Point of Sale</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <Link href="/admin/dashboard" className="sidebar-switch back" onClick={closeMobile}>
              <span className="sidebar-switch-icon"><ArrowLeft size={15} /></span>
              Back to Admin
            </Link>

            <div className="sidebar-section-label">Billing</div>
            {NAV.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={closeMobile}
                className={`sidebar-item ${isActive(item.path) ? "sidebar-item-active billing-item-active" : ""}`}
              >
                <item.icon size={17} className="sidebar-item-icon" />
                <span className="sidebar-item-label">{item.name}</span>
                {item.path === "/admin/billing/new" && <span className="kbd">F1</span>}
              </Link>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">{initials}</div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user?.fullname || "Admin"}</div>
                <div className="sidebar-user-email">{user?.email || "admin@wowlifestyle.online"}</div>
              </div>
              <button className="sidebar-logout-icon" onClick={handleLogout} title="Sign Out"><LogOut size={14} /></button>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="main-content">
          <main className="page-scroll-container">
            {/* Floating topbar */}
            <div className="topbar">
              <div className="topbar-left">
                <button className="topbar-menu-btn" onClick={() => window.dispatchEvent(new CustomEvent("wow-sidebar-toggle"))} aria-label="Menu">
                  <Menu size={18} />
                </button>
                <div>
                  <h2 className="navbar-title" style={{ fontSize: 15, fontWeight: 700 }}>{title}</h2>
                  <div className="navbar-breadcrumb" style={{ fontSize: 10.5, color: "var(--text3)", display: "flex", alignItems: "center", gap: 4 }}>
                    <span>Billing</span><ChevronRight size={10} />
                    <span className="navbar-breadcrumb-active" style={{ color: "var(--text2)", fontWeight: 600 }}>{title}</span>
                  </div>
                </div>
              </div>

              <div className="topbar-right">
                <Link href="/admin/billing/new" className="topbar-primary-btn" style={{ background: "#4f46e5", borderColor: "#4f46e5" }}>
                  <Zap size={13} /><span>New Bill</span>
                </Link>
                <div className="topbar-divider" />
                <div className="topbar-user" ref={menuRef}>
                  <button className="topbar-user-btn" onClick={() => setMenuOpen((v) => !v)}>
                    <span className="topbar-user-avatar">{initials}</span>
                    <span className="topbar-user-meta">
                      <span className="topbar-user-name">{user?.fullname || "Admin"}</span><br />
                      <span className="topbar-user-role">Cashier</span>
                    </span>
                    <ChevronDown size={13} className={`topbar-user-chev ${menuOpen ? "topbar-user-chev-open" : ""}`} />
                  </button>
                  {menuOpen && (
                    <div className="topbar-user-menu">
                      <Link href="/admin/dashboard" className="topbar-user-menu-item"><ArrowLeft size={14} />Admin Panel</Link>
                      <Link href="/" target="_blank" className="topbar-user-menu-item"><ExternalLink size={14} />View Store</Link>
                      <div className="topbar-user-menu-divider" />
                      <button className="topbar-user-menu-item danger" onClick={handleLogout}><LogOut size={14} />Sign Out</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="billing-page" style={{ margin: "0 16px" }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
