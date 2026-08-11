"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Blocks, Gamepad2, Rocket, Sparkles, Star } from "lucide-react";

const FLOATERS = [
  { Icon: Gamepad2, className: "left-[7%] top-[15%] text-gold-500/40", size: 26, duration: 7, delay: 0 },
  { Icon: Rocket, className: "right-[9%] top-[22%] text-navy-900/20", size: 30, duration: 8.5, delay: 1.2 },
  { Icon: Blocks, className: "left-[12%] bottom-[20%] text-navy-900/20", size: 28, duration: 9, delay: 0.6 },
  { Icon: Star, className: "right-[14%] bottom-[13%] text-gold-500/45", size: 22, duration: 6.5, delay: 2 },
  { Icon: Sparkles, className: "left-[46%] top-[7%] text-gold-500/35", size: 20, duration: 7.5, delay: 0.3 },
] as const;

/**
 * Playful background for the auth screens: two soft gradient glows plus a
 * few slowly drifting toy icons, so the whitespace around the form reads as
 * designed rather than unfinished. Pure decoration — hidden from assistive
 * tech, no pointer events, and it holds still for reduced-motion users.
 */
export default function AuthDecor() {
  const still = useReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl"
        animate={still ? undefined : { y: [0, -24, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-28 bottom-1/4 h-80 w-80 rounded-full bg-navy-900/10 blur-3xl"
        animate={still ? undefined : { y: [0, 20, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {FLOATERS.map(({ Icon, className, size, duration, delay }, i) => (
        <motion.span
          key={i}
          className={`absolute ${className}`}
          animate={still ? undefined : { y: [0, -14, 0], rotate: [0, 8, -6, 0] }}
          transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon size={size} strokeWidth={1.75} />
        </motion.span>
      ))}
    </div>
  );
}
