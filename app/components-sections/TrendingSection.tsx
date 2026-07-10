'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Zap, Play, Pause, Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

// API Configuration
const API_URL = "/api";

interface Video {
  _id: string;
  title: string;
  category: string;
  views: string;
  duration: string;
  src: string;
  order: number;
  isActive: boolean;
}

interface TrendingConfig {
  sectionTitle: string;
  sectionSubtitle: string;
  badgeText: string;
  buttonText: string;
}

interface TrendingSectionProps {
  theme: 'dark' | 'light';
  limit?: number;
}

const VideoCard = memo(({ video, index, theme }: { video: Video; index: number; theme: 'dark' | 'light' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const isInView = useInView(containerRef, { margin: "0px 0px -100px 0px" });
  const isDark = theme === 'dark';

  // Handle video playback based on visibility
  useEffect(() => {
    if (videoRef.current && !hasError) {
      if (isInView && isPlaying) {
        videoRef.current.play().catch((error) => {
          console.error('Playback failed:', error);
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isInView, isPlaying, hasError]);

  // Toggle play/pause
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasError) {
      setIsPlaying(!isPlaying);
    }
  };

  // Toggle mute
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current && !hasError) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  // Update progress bar
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && isInView && videoRef.current && !hasError) {
      interval = setInterval(() => {
        if (videoRef.current) {
          const current = videoRef.current.currentTime;
          const duration = videoRef.current.duration || 1;
          setProgress((current / duration) * 100);
        }
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isInView, hasError]);

  // Handle video error
  const handleVideoError = () => {
    setHasError(true);
    setIsPlaying(false);
    console.error('Video failed to load:', video.src);
  };

  // Handle video loaded
  const handleVideoLoaded = () => {
    setIsLoaded(true);
  };

  if (hasError) {
    return (
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
        className={`group relative rounded-2xl overflow-hidden shadow-lg md:shadow-2xl border
          ${isDark ? 'bg-neutral-900 border-white/10' : 'bg-white border-gray-200'}
        `}
      >
        <div className="relative w-full aspect-[9/16] flex items-center justify-center">
          <div className="text-center p-4">
            <AlertCircle size={32} className="mx-auto mb-2 text-red-500" />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Video failed to load
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={togglePlay}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer shadow-lg md:shadow-2xl border transition-all duration-500 will-change-transform
        ${isDark ? 'bg-neutral-900 border-white/10' : 'bg-white border-gray-200'}
        ${isHovered ? (isDark ? 'border-[#D4AF37]/50 scale-[1.02]' : 'border-[#B8860B]/50 scale-[1.02]') : ''}
      `}
    >
      <div className="relative w-full aspect-[9/16] overflow-hidden">
        {/* Loading Spinner */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <Loader2 size={24} className="animate-spin text-[#D4AF37]" />
          </div>
        )}
        
        {/* Video Element */}
        <video 
          ref={videoRef} 
          muted={isMuted} 
          loop 
          playsInline 
          preload="metadata"
          crossOrigin="anonymous"
          src={video.src} 
          onLoadedData={handleVideoLoaded}
          onError={handleVideoError}
          className={`w-full h-full object-cover transition-opacity duration-300 group-hover:scale-105 transition-transform duration-700 will-change-transform
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
          `} 
        />
        
        {/* Gradient Overlays for Text Legibility */}
        <div className={`absolute inset-0 transition-opacity duration-500 
          ${isDark 
            ? 'bg-gradient-to-t from-black via-black/40 to-transparent opacity-80' 
            : 'bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-40'}
        `} />
      </div>

      <div className="absolute inset-0 p-4 md:p-5 flex flex-col justify-between z-20">
        <div className="flex justify-between items-start">
          <motion.div 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-2"
          >
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#FCEEAC] text-black text-[10px] md:text-xs font-black px-3 py-1 rounded-full w-fit shadow-lg uppercase tracking-wider">
              {video.category}
            </span>
          </motion.div>
          
          <button 
            className={`p-2 rounded-full backdrop-blur-md transition-all hover:scale-110
              ${isDark ? 'bg-black/50 text-white border-white/10' : 'bg-white/80 text-gray-900 border-gray-200 shadow-sm'}
              border
            `} 
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>

        <div className="space-y-2">
          <h3 className={`text-sm md:text-lg font-black leading-tight drop-shadow-md transition-colors
            ${isDark ? 'text-white' : 'text-white md:text-gray-900 group-hover:text-[#B8860B]'}
          `}>
            {video.title}
          </h3>
          
          <div className={`h-1 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
            <motion.div 
              animate={{ width: `${progress}%` }} 
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#FCEEAC]" 
            />
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {video.views} views
            </span>
            <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {video.duration}
            </span>
          </div>
        </div>

        {/* Play/Pause Overlay */}
        <motion.div 
          animate={{ 
            scale: isPlaying ? (isHovered ? 1 : 0) : 1, 
            opacity: isPlaying ? (isHovered ? 1 : 0) : 1 
          }} 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className={`p-4 backdrop-blur-md rounded-full border transition-transform
            ${isDark ? 'bg-black/40 border-white/20 text-white' : 'bg-white/60 border-gray-300 text-gray-900'}
          `}>
            {isPlaying ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

VideoCard.displayName = 'VideoCard';

export default function TrendingSection({ theme, limit = 8 }: TrendingSectionProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [config, setConfig] = useState<TrendingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDark = theme === 'dark';

  // Fetch trending data on component mount
  useEffect(() => {
    fetchTrendingData();
  }, []);

  const fetchTrendingData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch videos and config in parallel for better performance
      const [videosResponse, configResponse] = await Promise.all([
        axios.get(`${API_URL}/trending`),
        axios.get(`${API_URL}/trending/config`).catch(() => null) // Config is optional
      ]);

      if (videosResponse.data.success) {
        // Sort by order and limit the number of videos
        const sortedVideos = videosResponse.data.data
          .sort((a: Video, b: Video) => a.order - b.order)
          .slice(0, limit);
        setVideos(sortedVideos);
      }

      if (configResponse?.data.success) {
        setConfig(configResponse.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching trending data:', error);
      setError(error.response?.data?.message || 'Failed to load trending content');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <section className={`relative py-16 md:py-24 transition-colors duration-500 border-t
        ${isDark ? 'bg-black border-white/10' : 'bg-gray-50 border-gray-200'}
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <Loader2 size={40} className="animate-spin text-[#D4AF37] mx-auto mb-4" />
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading trending content...
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Error State
  if (error) {
    return (
      <section className={`relative py-16 md:py-24 transition-colors duration-500 border-t
        ${isDark ? 'bg-black border-white/10' : 'bg-gray-50 border-gray-200'}
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
            <p className={`text-lg mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {error}
            </p>
            <button
              onClick={fetchTrendingData}
              className="px-6 py-2 bg-[#D4AF37] text-black rounded-lg hover:bg-[#FCEEAC] transition font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Empty State
  if (videos.length === 0) {
    return (
      <section className={`relative py-16 md:py-24 transition-colors duration-500 border-t
        ${isDark ? 'bg-black border-white/10' : 'bg-gray-50 border-gray-200'}
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No trending videos available at the moment.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`relative py-16 md:py-24 transition-colors duration-500 border-t
      ${isDark ? 'bg-black border-white/10' : 'bg-gray-50 border-gray-200'}
    `}>
      {/* Decorative radial gradient */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] blur-[100px] pointer-events-none opacity-30
        ${isDark ? 'bg-[#D4AF37]/20' : 'bg-[#D4AF37]/10'}
      `} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-6">
          <div className="space-y-4">
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border transition-colors
              ${isDark ? 'bg-white/5 border-white/10 text-[#D4AF37]' : 'bg-[#D4AF37]/10 border-[#D4AF37]/20 text-[#B8860B]'}
            `}>
              <Zap size={14} fill="currentColor" />
              <span className="text-xs font-black tracking-[0.2em] uppercase">
                {config?.badgeText || 'Trending Now'}
              </span>
            </div>
            
            {/* Title */}
            <h2 className={`text-4xl md:text-6xl font-black tracking-tighter transition-colors
              ${isDark ? 'text-white' : 'text-gray-900'}
            `}>
              {config?.sectionTitle?.split(' ')[0] || 'Hot'}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#FCEEAC]">
                {config?.sectionTitle?.split(' ')[1] || 'Drops'}
              </span>
            </h2>
            
            {/* Subtitle */}
            <p className={`text-sm md:text-lg max-w-lg font-medium transition-colors
              ${isDark ? 'text-gray-400' : 'text-gray-600'}
            `}>
              {config?.sectionSubtitle || 'Discover the most coveted R/C and scale models dominating the community this week.'}
            </p>
          </div>

          {/* Explore Button */}
          <button className={`group flex items-center gap-3 font-black text-sm px-6 py-3 rounded-full border transition-all
            ${isDark 
              ? 'text-white border-white/10 hover:border-[#D4AF37]/50 hover:bg-white/5' 
              : 'text-gray-900 border-gray-300 hover:border-[#B8860B] hover:bg-gray-100'}
          `}>
            {config?.buttonText || 'EXPLORE ALL'} 
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {videos.map((video, index) => (
            <VideoCard key={video._id} video={video} index={index} theme={theme} />
          ))}
        </div>
      </div>
    </section>
  );
}