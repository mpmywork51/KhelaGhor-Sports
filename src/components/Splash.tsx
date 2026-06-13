import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tv } from 'lucide-react';

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for fade-out transition to complete
    }, 1800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="khelaghor_splash_screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50 overflow-hidden"
        >
          {/* Animated decorative glow backgrounds */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none animate-pulse" />
          <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-green-500/5 blur-[100px] pointer-events-none animate-bounce duration-[8000ms]" />

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 0.1 }}
            className="flex flex-col items-center"
          >
            {/* Logo Icon with glass ring */}
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.15)] mb-6 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent animate-pulse" />
              <Tv className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            </div>

            {/* Glowing Brand typography */}
            <h1 className="text-white text-4xl sm:text-5xl font-sans tracking-tight font-black text-center select-none flex flex-col gap-1.5 px-4">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(52,211,153,0.3)] font-sans">
                KhelaGhor
              </span>
              <span className="text-xl sm:text-2xl text-emerald-400/80 font-medium tracking-wide">
                খেলাঘর
              </span>
            </h1>

            {/* Tagline / Subtitle */}
            <p className="mt-8 text-slate-500 text-xs tracking-widest uppercase font-mono animate-pulse">
              লাইভ স্পোর্টস স্ট্রিমিং ও বিনোদন
            </p>
          </motion.div>

          {/* Loading line indicator */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              className="w-1/2 h-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
