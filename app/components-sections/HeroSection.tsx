'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CarFront, ArrowRight, Trophy, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation'; // IMPORTED ROUTER
import axios from 'axios';

// API Configuration
const API_URL = "/api";

interface BrandLogo {
  name: string;
  src: string;
}

interface HeroContent {
  badgeText: string;
  title: string;
  titleGradient: string;
  description: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  carImages: string[];
  brands: BrandLogo[];
}

interface HeroSectionProps {
  theme: 'dark' | 'light';
  isMobile: boolean;
}

export default function HeroSection({ theme, isMobile }: HeroSectionProps) {
  const router = useRouter(); // INITIALIZED ROUTER

  const [currentIndex, setCurrentIndex] = useState(0);
  const [content, setContent] = useState<HeroContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // Fetch hero content from backend
  useEffect(() => {
    fetchHeroContent();
  }, []);

  // Carousel interval
  useEffect(() => { 
    if (!content?.carImages?.length) return;
    
    const interval = setInterval(() => { 
      setCurrentIndex((prev) => (prev + 1) % content.carImages.length); 
    }, 3500); 
    
    return () => clearInterval(interval); 
  }, [content?.carImages]);

  const fetchHeroContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/hero`);
      
      if (response.data.success) {
        setContent(response.data.data);
      } else {
        setError('Failed to load content');
      }
    } catch (error: any) {
      console.error('Error fetching hero content:', error);
      setError(error.response?.data?.message || 'Failed to connect to server');
      
      // Fallback to default content if API fails
      setContent({
        badgeText: 'OFFICIAL F1 COLLECTOR SERIES',
        title: 'Race Ready.',
        titleGradient: 'Miniature Speed.',
        description: 'Experience the thrill of the track with our ultra-realistic, precision-engineered diecast Formula 1 collection.',
        primaryButtonText: 'Shop Collection',
        secondaryButtonText: 'View Gallery',
        carImages: [],
        brands: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };

  // Helper functions for theme colors
  const getBgColor = () => theme === 'light' ? 'bg-white' : 'bg-black';
  const getTextColor = () => theme === 'light' ? 'text-gray-900' : 'text-white';
  const getSecondaryTextColor = () => theme === 'light' ? 'text-gray-600' : 'text-gray-300';
  const getBorderColor = () => theme === 'light' ? 'border-gray-200' : 'border-white/10';
  const getGridColor = () => theme === 'light' ? 'bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)]' : 'bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]';
  
  const textVariants = { 
    hidden: { opacity: 0, y: 30 }, 
    visible: (delay: number) => ({ 
      opacity: 1, 
      y: 0, 
      transition: { 
        delay, 
        duration: 0.6, 
        ease: "easeOut" as const
      } 
    }) 
  };
  
  const getCarVariant = (index: number) => { 
    if (!content?.carImages?.length) return 'hidden';
    
    const total = content.carImages.length; 
    if (index === currentIndex) return 'active'; 
    if (index === (currentIndex + 1) % total) return 'next'; 
    if (index === (currentIndex - 1 + total) % total) return 'prev'; 
    return 'hidden'; 
  };
  
  const carVariants = {
    next: { 
      x: isMobile ? 0 : 240, 
      y: isMobile ? -20 : -180, 
      scale: isMobile ? 0.7 : 0.55, 
      opacity: 0.5, 
      zIndex: 5, 
      filter: 'blur(2px) grayscale(100%)', 
      transition: { duration: 0.8, ease: "easeInOut" as const }
    },
    active: { 
      x: 0, 
      y: isMobile ? 10 : 0, 
      scale: isMobile ? 0.85 : 1.15, 
      opacity: 1, 
      zIndex: 20, 
      filter: 'blur(0px) grayscale(0%)', 
      transition: { type: "spring" as const, stiffness: 180, damping: 14 } 
    },
    prev: { 
      x: isMobile ? 0 : 240, 
      y: isMobile ? 20 : 180, 
      scale: isMobile ? 0.7 : 0.55, 
      opacity: 0.5, 
      zIndex: 4, 
      filter: 'blur(2px) grayscale(100%)', 
      transition: { duration: 0.8, ease: "easeInOut" as const }
    },
    hidden: { 
      x: isMobile ? 0 : 350, 
      y: 0, 
      scale: 0, 
      opacity: 0 
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <section className={`relative min-h-screen overflow-hidden flex flex-col justify-center pt-32 md:pt-24 lg:pt-32 pb-12 md:pb-20 ${getBgColor()} transition-colors duration-300`}>
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-[#D4AF37] mx-auto mb-4" />
            <p className={`${getSecondaryTextColor()}`}>Loading hero section...</p>
          </div>
        </div>
      </section>
    );
  }

  // Error state with retry
  if (error && !content) {
    return (
      <section className={`relative min-h-screen overflow-hidden flex flex-col justify-center pt-32 md:pt-24 lg:pt-32 pb-12 md:pb-20 ${getBgColor()} transition-colors duration-300`}>
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="text-red-500 mb-4">⚠️</div>
            <p className={`${getSecondaryTextColor()} mb-4`}>{error}</p>
            <button 
              onClick={fetchHeroContent}
              className="px-6 py-2 bg-[#D4AF37] text-black font-medium rounded-lg hover:bg-[#FCEEAC] transition"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Don't render if no content
  if (!content) return null;

  return (
    <section className={`relative min-h-screen overflow-hidden flex flex-col justify-center pt-32 md:pt-24 lg:pt-32 pb-8 md:pb-12 ${getBgColor()} transition-colors duration-300`}>
      <div className="absolute right-[-20%] md:right-[-10%] top-[20%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-gradient-to-br from-[#D4AF37]/20 to-transparent blur-[80px] md:blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className={`absolute inset-0 ${getGridColor()} bg-[size:16px_16px] md:bg-[size:24px_24px] -z-20`}></div>
      
      <div className="flex-grow flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            
            {/* Text Content */}
            <div className="flex flex-col justify-center text-center lg:text-left z-10 lg:order-1">
              <motion.div 
                custom={0} 
                initial="hidden" 
                animate="visible" 
                variants={textVariants} 
                className="flex justify-center lg:justify-start mb-4 md:mb-6"
              >
                <span className="px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-[#D4AF37]/50 bg-gradient-to-r from-[#D4AF37]/10 to-transparent text-[#D4AF37] text-xs md:text-sm font-bold tracking-wide flex items-center gap-2">
                  <Trophy size={14} className="md:size-[16px]" /> 
                  {content.badgeText}
                </span>
              </motion.div>
              
              <motion.h1 
                custom={0.2} 
                initial="hidden" 
                animate="visible" 
                variants={textVariants} 
                className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black ${getTextColor()} leading-tight mb-4 md:mb-6 transition-colors duration-300`}
              >
                {content.title} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FCEEAC] to-[#D4AF37] animate-gradient">
                  {content.titleGradient}
                </span>
              </motion.h1>
              
              <motion.p 
                custom={0.4} 
                initial="hidden" 
                animate="visible" 
                variants={textVariants} 
                className={`${getSecondaryTextColor()} text-sm md:text-lg max-w-lg mx-auto lg:mx-0 mb-6 md:mb-10 leading-relaxed transition-colors duration-300`}
              >
                {content.description}
              </motion.p>
              
              <motion.div 
                custom={0.6} 
                initial="hidden" 
                animate="visible" 
                variants={textVariants} 
                className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start"
              >
                <button 
                  onClick={() => router.push('/category/collectors')} 
                  className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-[#D4AF37] to-[#FCEEAC] text-black font-bold text-base md:text-lg rounded-lg md:rounded-xl hover:shadow-lg md:hover:shadow-xl hover:shadow-[#D4AF37]/25 transition-all duration-300 flex items-center justify-center gap-2 md:gap-3 group"
                >
                  {content.primaryButtonText} <ArrowRight size={18} className="md:size-[20px] group-hover:translate-x-1 transition-transform" />
                </button>
                <button className={`px-6 py-3 md:px-8 md:py-4 ${theme === 'light' ? 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'} border font-bold text-base md:text-lg rounded-lg md:rounded-xl transition-all duration-300 flex items-center justify-center gap-2 md:gap-3`}>
                  {content.secondaryButtonText} <CarFront size={18} className="md:size-[20px]" />
                </button>
              </motion.div>
            </div>

            {/* Car Images */}
            <div className="relative h-[250px] md:h-[400px] lg:h-[600px] w-full flex items-center justify-center perspective-[800px] md:perspective-[1200px] lg:order-2">
              <div className="absolute z-0 w-[200px] h-[200px] md:w-[300px] md:h-[300px] bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-2xl md:blur-3xl" />
              
              {content.carImages.length === 0 ? (
                <p className={`${getSecondaryTextColor()}`}>No car images available</p>
              ) : (
                content.carImages.map((imgSrc, index) => { 
                  const variant = getCarVariant(index); 
                  if (variant === 'hidden' || imageErrors.has(index)) return null; 
                  
                  return ( 
                    <motion.div 
                      key={index} 
                      variants={carVariants} 
                      initial="next" 
                      animate={variant} 
                      className="absolute w-full flex items-center justify-center origin-center will-change-transform" 
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      <motion.div 
                        className="relative" 
                        animate={variant === 'active' ? { 
                          y: [-8, 8, -8], 
                          transition: { 
                            duration: 5, 
                            repeat: Infinity, 
                            ease: "easeInOut" as const 
                          } 
                        } : {}}
                      >
                        <img 
                          src={imgSrc} 
                          alt={`Vehicle ${index + 1}`} 
                          loading="eager" 
                          className="w-full max-w-[240px] md:max-w-[320px] lg:max-w-[500px] h-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] md:drop-shadow-[0_35px_60px_rgba(0,0,0,0.9)]"
                          onError={() => handleImageError(index)}
                        />
                      </motion.div>
                    </motion.div> 
                  ); 
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Brand Logos */}
      {content.brands.length > 0 && (
        <div className={`relative w-full border-t ${getBorderColor()} ${theme === 'light' ? 'bg-white/60' : 'bg-black/60'} backdrop-blur-lg mt-6 md:mt-8 py-2 md:py-3 transition-colors duration-300`}>
          <div className={`absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r ${theme === 'light' ? 'from-white' : 'from-black'} to-transparent z-10 pointer-events-none transition-colors duration-300`} />
          <div className={`absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l ${theme === 'light' ? 'from-white' : 'from-black'} to-transparent z-10 pointer-events-none transition-colors duration-300`} />
          
          <div className="flex overflow-hidden items-center h-full">
            <motion.div 
              className="flex items-center gap-12 md:gap-20 px-4 min-w-max flex-nowrap" 
              animate={{ x: "-50%" }} 
              transition={{ duration: 40, ease: "linear", repeat: Infinity }}
            >
              {[...content.brands, ...content.brands].map((brand, i) => ( 
                <div key={`${brand.name}-${i}`} className="group relative flex-shrink-0 cursor-pointer flex items-center justify-center">
                  <img 
                    src={brand.src} 
                    alt={brand.name} 
                    loading="lazy" 
                    className={`h-8 md:h-10 lg:h-12 w-auto object-contain transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 md:group-hover:scale-125 ${theme === 'light' ? 'grayscale opacity-50' : 'grayscale opacity-40'}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div> 
              ))}
            </motion.div>
          </div>
        </div>
      )}
    </section>
  );
}