'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, Heart, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Define your backend API URL here
const API_URL = "/api";

export interface BestSellerItem {
  id: string | number;
  name: string;
  img: string;
  color: string;
}

interface BestSellersSectionProps {
  theme?: 'dark' | 'light';
  isPreview?: boolean;
  previewData?: BestSellerItem[];
}

const BestSellers = memo(({ theme = 'dark', isPreview = false, previewData = [] }: BestSellersSectionProps) => {
  const router = useRouter(); 
  
  const [items, setItems] = useState<BestSellerItem[]>(previewData);
  const [isLoading, setIsLoading] = useState(!isPreview);
  const [activeCard, setActiveCard] = useState(0);
  
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { margin: "0px 0px -200px 0px" });
  
  const CYCLE_DURATION = 4000; // 4 seconds per image

  // Sync preview data when in admin preview mode
  useEffect(() => {
    if (isPreview) setItems(previewData);
  }, [isPreview, previewData]);

  // Fetch from API once on mount (non-preview only)
  useEffect(() => {
    if (isPreview) return;
    const fetchItems = async () => {
      try {
        const response = await fetch(`${API_URL}/bestsellers`);
        const result = await response.json();
        const arr = result.data?.items ?? result.data;
        if (result.success && Array.isArray(arr) && arr.length > 0) {
          setItems(arr);
        } else {
          setItems([
            { id: 1, name: "Jasco Bear Muffler", img: "http://200.97.164.140/uploads/categories/chars-masha.avif", color: "#831843" },
            { id: 2, name: "Hamleys Activity Ball", img: "http://200.97.164.140/uploads/categories/chars-pokemon.avif", color: "#713f12" },
            { id: 3, name: "Marvel Avengers Set", img: "http://200.97.164.140/uploads/categories/chars-avengers.avif", color: "#7f1d1d" },
          ]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reliable Auto-play Interval
  useEffect(() => {
    // Only run if the section is in view and we have enough items
    if (!isInView || items.length <= 1) return;

    const timer = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % items.length);
    }, CYCLE_DURATION);

    // Cleanup interval on unmount or when activeCard changes
    // (This ensures clicking a card resets the 4-second timer)
    return () => clearInterval(timer);
  }, [activeCard, isInView, items.length]);

  // Handle Card Clicks: Expand if inactive, route if active
  const handleCardClick = (index: number) => {
    if (activeCard !== index) {
      setActiveCard(index);
    } else {
      // If the card is already active, navigate to the category
      router.push('/category/collectors');
    }
  };

  if (isLoading) {
    return (
      <div className={`w-full py-24 flex justify-center items-center border-t ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/5 bg-[#0a0a0a]'}`}>
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <section ref={containerRef} className={`py-12 md:py-24 relative ${theme === 'light' ? 'bg-gray-50' : 'bg-[#0a0a0a]'} border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/5'} overflow-hidden`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header section */}
        <div className="flex justify-between items-end mb-8 md:mb-12">
          <div>
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex items-center gap-2 mb-3">
              <Zap size={14} className="md:size-[16px] text-[#D4AF37]" />
              <span className="text-[#D4AF37] font-bold tracking-[0.2em] text-xs uppercase">Top Picks</span>
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`text-3xl md:text-5xl font-black uppercase tracking-tight ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Best <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#FCEEAC]">Sellers</span>
            </motion.h2>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="flex flex-row gap-3 md:gap-4 h-[400px] md:h-[500px] w-full">
          {items.map((item, index) => {
            const isActive = index === activeCard;
            
            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(index)}
                className={`group relative rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  isActive 
                    ? 'flex-[3] md:flex-[4] shadow-2xl scale-100' 
                    : 'flex-[1] grayscale opacity-80 hover:grayscale-0 hover:opacity-100'
                }`}
                style={{ backgroundColor: item.color || '#111827' }}
              >
                {/* Background Image */}
                {item.img && (
                  <img
                    src={item.img}
                    alt={item.name}
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[1000ms] ease-out ${isActive ? 'scale-105' : 'scale-100'}`}
                  />
                )}
                
                {/* Gradient Overlay for Active Card Text Legibility */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-700 ${isActive ? 'opacity-100' : 'opacity-0'}`} 
                />

                {/* Card Content Overlay */}
                <div className="absolute inset-0 p-5 md:p-8 flex flex-col justify-between z-10 pointer-events-none">
                  
                  {/* Top Bar: Title & Heart */}
                  <div className="flex justify-between items-start w-full">
                    {/* Brand/First Word (Always visible, stays horizontal) */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                      <h3 className="text-white font-black uppercase tracking-wider text-xs md:text-sm whitespace-nowrap drop-shadow-md">
                        {item.name.split(" ")[0]}
                      </h3>
                    </div>

                    {/* Heart Icon (Fades in on active) */}
                    <div 
                      className={`p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/20 transition-all duration-500 text-white pointer-events-auto hover:bg-white hover:text-black ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add wishlist logic here if needed
                      }}
                    >
                      <Heart size={20} className={isActive ? 'fill-current' : ''} />
                    </div>
                  </div>
                  
                  {/* Bottom Bar: Full Product Name (Fades in on active) */}
                  <div className={`transition-all duration-700 transform ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <h4 className="text-white text-2xl md:text-4xl font-extrabold leading-tight tracking-tight drop-shadow-lg">
                      {item.name}
                    </h4>
                  </div>
                  
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

BestSellers.displayName = 'BestSellers';

export default function BestSellersSection({ theme = 'dark', isPreview, previewData }: BestSellersSectionProps) {
  return <BestSellers theme={theme} isPreview={isPreview} previewData={previewData} />;
}