import React from "react";
import Sidebar from "@/app/admin/layout/sidebar";
import Topbar from "@/app/admin/layout/navbar";
import UnsavedChangesGuard from "@/app/admin/layout/UnsavedChangesGuard";
import { AdminThemeProvider } from "@/app/admin/layout/ThemeContext";
import "@/app/admin/layout/Layout.css";

/*
 * Real Next.js layout for every non-billing /admin/* page. Because this is
 * an actual layout.tsx (not a component each page wraps itself in), the
 * sidebar/topbar mount once and persist across navigations within this
 * route group — only the page content underneath swaps out.
 */
export default function AdminMainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <div className="layout-wrapper">
        <Sidebar />
        <div className="main-content">
          <main className="page-scroll-container">
            <Topbar />
            {children}
          </main>
        </div>
        <UnsavedChangesGuard />
      </div>
    </AdminThemeProvider>
  );
}
