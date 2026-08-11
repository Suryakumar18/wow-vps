"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/app/components-home/lib/cn";

export interface TabDef {
  key: string;
  label: string;
  /** Small count badge beside the label — e.g. how many slides a tab holds. */
  count?: number;
  content: React.ReactNode;
}

/**
 * Horizontal tab strip with an animated underline.
 *
 * The whole set is mounted but only the active panel is rendered, so a tab
 * holding a heavy editor doesn't cost anything until it's opened.
 */
export default function Tabs({ tabs, initialKey }: { tabs: TabDef[]; initialKey?: string }) {
  const [active, setActive] = useState(initialKey ?? tabs[0]?.key);
  const reduceMotion = useReducedMotion();
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div>
      {/* Pinned under the 4rem-tall header so the tabs stay reachable while a
          long editor scrolls. `px-gutter` cancels the list's `-mx-gutter`
          bleed so the strip can reach the screen edge without widening the
          page; the negative inset undoes `<main>`'s padding so the bar's
          background spans the full width when stuck. */}
      <div className="sticky top-16 z-20 -mx-gutter mb-6 border-b border-line bg-mist/95 px-gutter backdrop-blur-sm">
        {/* The wrapper already handles the edge bleed and re-padding — a second
            `-mx-gutter` here would double the negative margin and push the
            strip past the viewport. */}
        <ul
          role="tablist"
          className="flex snap-x gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((tab) => {
            const isActive = tab.key === active;
            return (
              <li key={tab.key} className="shrink-0 snap-start">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(tab.key)}
                  className={cn(
                    "relative inline-flex h-11 items-center gap-2 px-3.5 text-micro font-semibold transition-colors",
                    isActive ? "text-ink" : "text-slate-500 hover:text-ink",
                  )}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-nano font-bold tabular-nums",
                        isActive ? "bg-gold-500 text-navy-900" : "bg-mist text-slate-500",
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <motion.span
                      layoutId="admin-tab-underline"
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gold-500"
                      transition={
                        reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }
                      }
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Deliberately not `AnimatePresence mode="wait"`: that holds the new
          panel back until the old one's exit animation finishes, and if rAF is
          throttled — a backgrounded tab — the exit never completes and the
          panel appears stuck on the previous tab. Mounting immediately and
          fading in has the same feel with none of that risk. */}
      <motion.div
        key={current?.key}
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.18 }}
        role="tabpanel"
      >
        {current?.content}
      </motion.div>
    </div>
  );
}
