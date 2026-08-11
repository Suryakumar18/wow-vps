"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Trash2, X } from "lucide-react";
import Button from "@/app/components-home/ui/Button";

/**
 * Floating bar shown while rows are selected.
 *
 * Sits above the content rather than replacing the toolbar, so the selection
 * count and the filters that produced it stay visible at the same time.
 */
export default function BulkBar({
  count,
  onClear,
  onDelete,
  pending = false,
  children,
}: {
  count: number;
  onClear: () => void;
  onDelete?: () => void;
  pending?: boolean;
  /** Extra bulk actions beyond delete. */
  children?: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[min(38rem,calc(100vw-2rem))] items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-card-hover lg:left-[16rem] lg:mx-auto"
        >
          <span className="shrink-0 rounded-full bg-navy-900 px-2.5 py-1 text-nano font-bold tabular-nums text-white">
            {count}
          </span>
          <p className="min-w-0 flex-1 text-micro text-ink">
            {count === 1 ? "1 row selected" : `${count} rows selected`}
          </p>

          <div className="flex shrink-0 items-center gap-2">
            {children}
            {onDelete && (
              <Button variant="danger" size="xs" onClick={onDelete} disabled={pending}>
                <Trash2 size={13} aria-hidden="true" />
                Delete
              </Button>
            )}
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear selection"
              className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition-colors hover:bg-mist hover:text-ink"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
