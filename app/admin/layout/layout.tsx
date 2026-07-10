import React from "react";
import Sidebar from "./sidebar";
import Topbar from "./navbar";
import UnsavedChangesGuard from "./UnsavedChangesGuard";
import { AdminThemeProvider } from "./ThemeContext";
import "./Layout.css";

export default function Layout({ children }: { children: React.ReactNode }) {
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
