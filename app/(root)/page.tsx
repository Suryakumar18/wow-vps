'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion, Variants } from 'framer-motion';

// --- IMPORTS ---
import NavbarHome from '@/app/components-main/NavbarHome';
import Preloader from "../components-main/Preloader";
import HeroSection from "../components-sections/HeroSection";
import TrendingSection from "../components-sections/TrendingSection";
import StudioShowcaseSection from "../components-sections/StudioShowcaseSection";
import RalleyzSection from "../components-sections/RalleyzSection";
import CharacterSliderSection from "../components-sections/CharacterSliderSection";
import BestSellersSection from "../components-sections/BestSellersSection";
import ShopByAgeSection from "../components-sections/ShopByAgeSection";
import ShopByCategorySection from "../components-sections/ShopByCategorySection";
import BentoGridSection from "../components-sections/BentoGridSection";
import ReviewSection from "../components-sections/ReviewSection";

// --- ANIMATION VARIANTS ---
const menuVariants: Variants = {
  open: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 }
  },
  closed: {
    transition: { staggerChildren: 0.1, staggerDirection: -1 }
  }
};

const itemVariants: Variants = {
  open: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  },
  closed: { 
    opacity: 0, 
    y: 20, 
    scale: 0.5,
    transition: { duration: 0.2 }
  }
};

const tooltipVariants: Variants = {
  open: { opacity: 1, x: 0, transition: { duration: 0.2, delay: 0.2 } },
  closed: { opacity: 0, x: 10, transition: { duration: 0.1 } }
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMobile, setIsMobile] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false); 

  const mainRef = useRef<HTMLDivElement>(null);
  const shopByCategoryRef = useRef<HTMLDivElement>(null);

  const phoneNumber = "+919677710045"; 
  const whatsappNumber = "9677710045"; 

  // --- INITIALIZATION EFFECTS ---
  useEffect(() => {
    const optimizeScroll = () => {
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      document.documentElement.style.scrollBehavior = 'auto';
      setTimeout(() => {
        document.documentElement.style.scrollBehavior = 'smooth';
      }, 100);
    };

    optimizeScroll();

    const timer = setTimeout(() => {
      setIsLoading(false);
      document.documentElement.style.scrollBehavior = 'smooth';
    }, 2800);

    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleHashChange = () => {
      if (window.location.hash === '#shop-by-category' && shopByCategoryRef.current) {
        setTimeout(() => {
          shopByCategoryRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };

    setTimeout(handleHashChange, 500);
    window.addEventListener('hashchange', handleHashChange);

    const currentTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
    if (currentTheme) setTheme(currentTheme);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // --- THEME LISTENER ---
  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      const newTheme = event.detail as 'dark' | 'light';
      if (newTheme) {
        setTheme(newTheme);
      }
    };

    window.addEventListener('theme-change', handleThemeChange as EventListener);
    
    return () => {
      window.removeEventListener('theme-change', handleThemeChange as EventListener);
    };
  }, []);

  // --- MAIN REF HEIGHT FIX ---
  useEffect(() => {
    if (!isLoading && mainRef.current) {
      void mainRef.current.offsetHeight;
    }
  }, [isLoading]);

  // --- THEME TOGGLE FUNCTION ---
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    window.dispatchEvent(new CustomEvent('theme-change', { detail: newTheme }));
  };

  return (
    <>
      {/* NAVBAR ADDED FROM SECOND SNIPPET */}
      <NavbarHome theme={theme} toggleTheme={toggleTheme} />
      
      <main ref={mainRef} className="min-h-screen w-full transition-colors duration-300 scroll-smooth relative overflow-x-hidden">
        <AnimatePresence mode="wait">
          {isLoading && <Preloader onComplete={() => setIsLoading(false)} />}
        </AnimatePresence>

        {!isLoading && (
          // GRADIENT BACKGROUND ADDED FROM SECOND SNIPPET
          <div className={`w-full ${
            theme === 'light' 
              ? 'bg-gradient-to-b from-amber-50 via-white to-amber-50 text-gray-900' 
              : 'bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white'
          } transition-colors duration-300 relative`}>
            
            <HeroSection theme={theme} isMobile={isMobile} />
            <TrendingSection theme={theme} />
            <StudioShowcaseSection theme={theme} />
            <RalleyzSection />
            <CharacterSliderSection theme={theme} />
            <BestSellersSection theme={theme} />
            <ShopByAgeSection theme={theme} />
            
            <div id="shop-by-category" ref={shopByCategoryRef}>
              <ShopByCategorySection theme={theme} />
            </div>
            
            <BentoGridSection theme={theme} />
            <ReviewSection theme={theme} />

            {/* --- ENHANCED FLOATING CONTACT BUTTON MENU (FROM FIRST SNIPPET) --- */}
            <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
              <AnimatePresence>
                {isContactOpen && (
                  <motion.div
                    variants={menuVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                    className="flex flex-col items-end gap-4 mb-2"
                  >
                    {/* WhatsApp Button with Tooltip */}
                    <motion.div variants={itemVariants} className="flex items-center gap-3 relative group">
                      <motion.span 
                        variants={tooltipVariants}
                        className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md text-white text-sm font-medium border border-white/10 shadow-xl whitespace-nowrap"
                      >
                        WhatsApp Us
                      </motion.span>
                      <a
                        href={`https://wa.me/${whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-14 h-14 bg-gradient-to-tr from-green-500 to-emerald-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:scale-110 transition-all duration-300 border border-white/20"
                        aria-label="Contact on WhatsApp"
                      >
                        <svg className="w-7 h-7 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </a>
                    </motion.div>

                    {/* Phone Button with Tooltip */}
                    <motion.div variants={itemVariants} className="flex items-center gap-3 relative group">
                      <motion.span 
                        variants={tooltipVariants}
                        className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md text-white text-sm font-medium border border-white/10 shadow-xl whitespace-nowrap"
                      >
                        Call Us
                      </motion.span>
                      <a
                        href={`tel:${phoneNumber}`}
                        className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:scale-110 transition-all duration-300 border border-white/20"
                        aria-label="Call Us"
                      >
                        <svg className="w-6 h-6 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </a>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Toggle Button - Glowing Gold Design */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsContactOpen(!isContactOpen)}
                animate={{
                  boxShadow: isContactOpen 
                    ? "0px 0px 20px rgba(234, 179, 8, 0.2)" 
                    : ["0px 0px 0px rgba(234, 179, 8, 0.4)", "0px 0px 25px rgba(234, 179, 8, 0.6)", "0px 0px 0px rgba(234, 179, 8, 0.4)"]
                }}
                transition={{
                  boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="relative w-16 h-16 bg-gradient-to-tr from-yellow-500 to-amber-300 rounded-full flex items-center justify-center shadow-xl border-2 border-yellow-200/50 z-50 overflow-hidden"
                aria-label="Toggle contact menu"
              >
                {/* Inner glass effect */}
                <div className="absolute inset-0 bg-white/20 rounded-full backdrop-blur-sm pointer-events-none" />
                
                <motion.svg
                  animate={{ rotate: isContactOpen ? 135 : 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="w-8 h-8 text-black relative z-10 drop-shadow-sm"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </motion.svg>
              </motion.button>
            </div>
            {/* --- END FLOATING CONTACT BUTTON MENU --- */}

          </div>
        )}
      </main>
      
      {/* Note: The <FooterComponent /> was removed here to prevent the double-rendering issue. */}
    </>
  );
}