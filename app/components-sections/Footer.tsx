'use client';

import React, { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Twitter, Instagram, Facebook, Youtube, Send, Mail } from 'lucide-react';

// Optimized Footer Component
const Footer = memo(({ theme }: { theme: 'dark' | 'light' }) => {
  const [email, setEmail] = useState('');
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(theme);

  // Listen for theme changes from Navbar
  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      const newTheme = event.detail as 'dark' | 'light';
      if (newTheme && newTheme !== currentTheme) {
        setCurrentTheme(newTheme);
      }
    };

    window.addEventListener('themechange', handleThemeChange as EventListener);
    
    return () => {
      window.removeEventListener('themechange', handleThemeChange as EventListener);
    };
  }, [currentTheme]);

  // Also watch for prop changes (in case theme is passed from parent)
  useEffect(() => {
    if (theme !== currentTheme) {
      setCurrentTheme(theme);
    }
  }, [theme, currentTheme]);

  return (
    <footer className={`relative pt-24 md:pt-32 pb-8 md:pb-12 ${currentTheme === 'light' ? 'bg-white text-gray-900' : 'bg-[#050505] text-white'}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute inset-0 opacity-[0.03] ${currentTheme === 'light' ? 'bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)]' : 'bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]'} bg-[size:20px_20px] md:bg-[size:40px_40px]`} />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-12 md:pt-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-20">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 relative rounded-full overflow-hidden border border-[#D4AF37]/50 shadow-[0_0_10px_rgba(212,175,55,0.3)] md:shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                <img
                  src="http://200.97.164.140/uploads/brands/wow-logo.svg"
                  alt="WOW Lifestyle Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl md:text-2xl font-black tracking-tighter">WOW <span className="text-[#D4AF37]">LIFESTYLE</span></span>
            </div>
            <p className={`text-xs md:text-sm leading-relaxed mb-4 md:mb-6 ${currentTheme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              Engineers of the future. We build robust, scalable, and revolutionary toy solutions that propel play forward into the digital age.
            </p>
            <div className="flex gap-3 md:gap-4">
              {[Twitter, Instagram, Facebook, Youtube].map((Icon, i) => (
                <a key={i} href="#" className={`p-2.5 md:p-3 rounded-full transition-all ${currentTheme === 'light' ? 'bg-gray-100 hover:bg-[#D4AF37] hover:text-white' : 'bg-white/5 hover:bg-[#D4AF37] hover:text-black'}`}>
                  <Icon size={16} className="md:size-[18px]" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4 md:mb-6 text-[#D4AF37] uppercase tracking-wider text-xs">Company</h4>
            <ul className={`space-y-3 md:space-y-4 text-xs md:text-sm ${currentTheme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              {['About Us', 'Careers', 'Blog & News', 'Sustainability', 'Partners'].map(item => (
                <li key={item}><a href="#" className="hover:text-[#D4AF37] transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 md:mb-6 text-[#D4AF37] uppercase tracking-wider text-xs">Support</h4>
            <ul className={`space-y-3 md:space-y-4 text-xs md:text-sm ${currentTheme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              {['Help Center', 'Terms of Service', 'Legal', 'Privacy Policy', 'Status'].map(item => (
                <li key={item}><a href="#" className="hover:text-[#D4AF37] transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 md:mb-6 text-[#D4AF37] uppercase tracking-wider text-xs">Stay in the Lead</h4>
            <p className={`text-xs md:text-sm mb-3 md:mb-4 ${currentTheme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              Subscribe to our pit stop newsletter for the latest drops.
            </p>
            <div className={`flex items-center p-1 rounded-lg md:rounded-xl border ${currentTheme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'}`}>
              <div className="pl-2 md:pl-3 text-gray-400"><Mail size={16} className="md:size-[18px]" /></div>
              <input 
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-xs md:text-sm p-2 md:p-3 outline-none placeholder-gray-500"
              />
              <button 
                type="button"
                className="p-2 md:p-3 rounded-lg bg-[#D4AF37] text-black font-bold hover:bg-[#FCEEAC] transition-colors text-xs md:text-sm"
              >
                <Send size={16} className="md:size-[18px]" />
              </button>
            </div>
          </div>
        </div>
        <div className={`pt-6 md:pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 ${currentTheme === 'light' ? 'border-gray-200 text-gray-500' : 'border-white/10 text-gray-500'}`}>
          <p className="text-[10px] md:text-xs text-center md:text-left">© 2024 WOW Lifestyle. All rights reserved.</p>
          <div className="flex gap-4 md:gap-6 text-[10px] md:text-xs">
            <a href="#" className="hover:text-[#D4AF37]">Privacy Policy</a>
            <a href="#" className="hover:text-[#D4AF37]">Terms of Use</a>
            <a href="#" className="hover:text-[#D4AF37]">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

interface FooterProps {
  theme: 'dark' | 'light';
}

export default function FooterComponent({ theme }: FooterProps) {
  return <Footer theme={theme} />;
}