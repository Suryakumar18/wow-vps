'use client';

import React, { useState, useEffect } from 'react';
import Navbar from "../components-main/NavbarHome";
import FooterComponent from "../components-sections/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let activeTheme: 'dark' | 'light' = 'dark';
    if (savedTheme) activeTheme = savedTheme;
    else if (!systemPrefersDark) activeTheme = 'light';

    setTheme(activeTheme);
    applyThemeToDocument(activeTheme);
    setMounted(true);
  }, []);

  const applyThemeToDocument = (newTheme: 'dark' | 'light') => {
    const root = document.documentElement;
    root.setAttribute('data-theme', newTheme);
    if (newTheme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyThemeToDocument(newTheme);
    localStorage.setItem('theme', newTheme);
    window.dispatchEvent(new CustomEvent('theme-change', { detail: newTheme }));
  };

  if (!mounted) return <div style={{ opacity: 0 }}>{children}</div>;

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-black text-white'}`}>
      <Navbar theme={theme} toggleTheme={handleThemeToggle} />
      <main className="flex-grow">{children}</main>
      <FooterComponent theme={theme} />
    </div>
  );
}