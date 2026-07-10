'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PreloaderProps { onComplete: () => void; }

export default function Preloader({ onComplete }: PreloaderProps) {
  const [status, setStatus] = useState<'idle' | 'driving'>('idle');

  useEffect(() => {
    const timer = setTimeout(() => setStatus('driving'), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden"
      animate={{ opacity: status === 'driving' ? [1, 1, 0] : 1 }}
      transition={{ duration: 1.5, times: [0, 0.7, 1], ease: "easeInOut" }}
      onAnimationComplete={() => { if (status === 'driving') onComplete(); }}
    >
      <AnimatePresence>
        {status === 'idle' && (
          <motion.div className="relative z-20 w-full flex justify-center px-4" exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)", transition: { duration: 0.3 } }}>
            <motion.img
              src="http://200.97.164.140/uploads/brands/wow-logo.svg" alt="WOW Lifestyle Thuriur"
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(15px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="w-[50vw] max-w-[200px] sm:max-w-none sm:w-[280px] md:w-[350px] object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="absolute top-1/2 left-1/2 z-50 pointer-events-none"
        initial={{ x: "-250vw", y: "-50%" }}
        animate={status === 'driving' ? { x: "-50%", y: "-50%" } : { x: "-250vw", y: "-50%" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        {/* No source image exists for the race-car asset — replace once a real one is available. */}
        <div className="absolute top-1/2 right-0 w-[50%] h-[200px] bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent blur-3xl transform -translate-y-1/2 -skew-x-12" />
      </motion.div>
    </motion.div>
  );
}
