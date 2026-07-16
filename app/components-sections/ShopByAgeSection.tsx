'use client';

import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Star, Baby, Zap, Trophy, Sparkles, Building2, Wand2, Gauge, Loader2 } from 'lucide-react';

// Define your backend API URL here
const API_URL = "/api";

// Map string names from DB to actual Icon components
const ICON_MAP: Record<string, React.ElementType> = {
  Star, Baby, Zap, Trophy, Sparkles, Building2, Wand2, Gauge
};

export interface AgeGroupItem {
  id: string | number;
  label: string;
  sub: string;
  img: string;
  gradient: string;
  icon: string;
}

interface ShopByAgeSectionProps {
  theme: 'dark' | 'light';
  isPreview?: boolean;
  previewData?: AgeGroupItem[];
}

const ShopByAge = memo(({ theme, isPreview = false, previewData = [] }: ShopByAgeSectionProps) => {
  const router = useRouter();
  const [items, setItems] = useState<AgeGroupItem[]>(previewData);
  const [isLoading, setIsLoading] = useState(!isPreview);

  // Sync preview data when in admin preview mode
  useEffect(() => {
    if (isPreview) setItems(previewData);
  }, [isPreview, previewData]);

  // Fetch from API once on mount (non-preview only)
  useEffect(() => {
    if (isPreview) return;
    const fetchItems = async () => {
      try {
        const response = await fetch(`${API_URL}/shopbyage`);
        const result = await response.json();
        const arr = result.data?.items ?? result.data;
        if (result.success && Array.isArray(arr) && arr.length > 0) {
          setItems(arr);
        }
      } catch (error) {
        console.error('Error fetching shop by age data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCardClick = () => {
    router.push('/category/collectors');
  };

  if (isLoading) {
    return (
      <div className={`w-full py-24 flex justify-center items-center border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/5 bg-black'}`}>
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className={`py-12 md:py-24 relative overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-black'} border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10 md:mb-16">
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 mb-3">
            <Star size={12} className="text-[#D4AF37]" fill="#D4AF37" />
            <span className="text-[#D4AF37] text-[10px] font-bold tracking-widest uppercase">Find Perfect Gift</span>
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`text-3xl md:text-5xl font-black uppercase tracking-tight ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
            Shop By <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#FCEEAC]">Age</span>
          </motion.h2>
        </div>

        {/* CHANGED: Switched to CSS Grid. mobile=2 cols, tablet=3 cols, desktop=4 or 5 cols */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 lg:gap-8 pb-8 justify-items-center">
          {items.map((age, i) => {
            const IconComponent = ICON_MAP[age.icon] || Star;
            
            return (
              <motion.div
                key={age.id}
                onClick={handleCardClick}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -10 }}
                /* CHANGED: Made width full of the grid cell but capped at max-w-[220px]. Adjusted rounded corners for mobile */
                className="relative w-full max-w-[220px] aspect-[4/5] rounded-3xl md:rounded-[2rem] overflow-hidden cursor-pointer group shadow-xl will-change-transform"
              >
                <div className={`absolute inset-0 bg-gradient-to-b ${age.gradient} opacity-90 transition-opacity duration-300`} />
                
                {/* CHANGED: Reduced padding slightly on mobile to maximize space */}
                <div className="absolute inset-0 flex flex-col p-3 md:p-4">
                  <div className="relative w-full aspect-square bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center overflow-hidden mb-2 md:mb-4 shadow-inner border border-white/10 group-hover:bg-white/30 transition-colors">
                    {age.img && (
                      <motion.img
                        src={age.img}
                        alt={age.label}
                        loading="lazy"
                        className="w-4/5 h-4/5 object-contain drop-shadow-md"
                        whileHover={{ scale: 1.15 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-end pb-1 md:pb-2">
                    <div className="text-white mb-1 md:mb-2 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                      {/* CHANGED: Icon scales down on mobile */}
                      <IconComponent className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    {/* CHANGED: Font sizes adjusted for mobile wrapping (text-[13px] on mobile) */}
                    <h3 className="text-white font-black text-[13px] sm:text-base md:text-xl uppercase leading-tight text-center drop-shadow-sm tracking-wide">{age.label}</h3>
                    {/* CHANGED: Subtext scales down to 8px on small screens to prevent overflow */}
                    <p className="text-white/80 text-[8px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest mt-0.5 md:mt-1 text-center">{age.sub}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

ShopByAge.displayName = 'ShopByAge';

export default function ShopByAgeSection({ theme = 'dark', isPreview, previewData }: ShopByAgeSectionProps) {
  return <ShopByAge theme={theme} isPreview={isPreview} previewData={previewData} />;
}