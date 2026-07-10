"use client";
import React, { createContext, useContext } from "react";

// Admin panel is light-theme only.
type Theme = "light";

interface ThemeCtx {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeCtx>({ theme: "light", toggleTheme: () => {} });

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme: "light", toggleTheme: () => {} }}>
      <div data-admin-theme="light" className="admin-theme-root">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useAdminTheme = () => useContext(ThemeContext);
