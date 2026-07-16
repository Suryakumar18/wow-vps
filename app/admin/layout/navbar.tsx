"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Menu, ChevronDown, ExternalLink, LogOut, LayoutDashboard } from "lucide-react";
import NotificationBell from "./NotificationBell";
import "./Layout.css";

/* Floating topbar card — rendered at the top of the page content, not a fixed navbar */
export default function Topbar() {
  const pathname            = usePathname();
  const router              = useRouter();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser]     = useState<{ fullname?: string; email?: string } | null>(null);
  const menuRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (u?.email) setUser(u);
    } catch {}
  }, []);

  // Close dropdown on outside click / route change
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const toggleSidebar = () =>
    window.dispatchEvent(new CustomEvent("wow-sidebar-toggle"));

  const initials = user?.fullname
    ? user.fullname.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="topbar">
      {/* Left — mobile menu + search */}
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={toggleSidebar} aria-label="Toggle menu">
          <Menu size={18} />
        </button>
        <div className="topbar-search">
          <Search size={14} className="topbar-search-icon" />
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Right — bell / user / view site */}
      <div className="topbar-right">
        <NotificationBell />

        <div className="topbar-divider" />

        {/* User chip */}
        <div className="topbar-user" ref={menuRef}>
          <button className="topbar-user-btn" onClick={() => setMenuOpen((v) => !v)}>
            <span className="topbar-user-avatar">{initials}</span>
            <span className="topbar-user-meta">
              <span className="topbar-user-name">{user?.fullname || "Admin"}</span>
              <br />
              <span className="topbar-user-role">Administrator</span>
            </span>
            <ChevronDown size={13} className={`topbar-user-chev ${menuOpen ? "topbar-user-chev-open" : ""}`} />
          </button>

          {menuOpen && (
            <div className="topbar-user-menu">
              <Link href="/admin/dashboard" className="topbar-user-menu-item" onClick={() => setMenuOpen(false)}>
                <LayoutDashboard size={14} />
                Dashboard
              </Link>
              <Link href="/" target="_blank" className="topbar-user-menu-item" onClick={() => setMenuOpen(false)}>
                <ExternalLink size={14} />
                View Store
              </Link>
              <div className="topbar-user-menu-divider" />
              <button className="topbar-user-menu-item danger" onClick={handleLogout}>
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Black action button, far right like Export in the reference */}
        <Link href="/" target="_blank" className="topbar-primary-btn">
          <ExternalLink size={13} />
          <span>View Site</span>
        </Link>
      </div>
    </div>
  );
}
