"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import Button from "@/app/components-home/ui/Button";

/**
 * Confirmation before a destructive action. Nothing in the admin deletes on a
 * single click.
 *
 * Focus moves to the cancel button on open — the safe choice should be the one
 * a stray Enter press hits — and returns to the trigger on close.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      returnFocusRef.current?.focus?.();
    };
  }, [open, pending, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => !pending && onCancel()}
            className="absolute inset-0 bg-navy-950/50"
          />

          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-description"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="relative w-full max-w-[24rem] rounded-xl border border-line bg-white p-5 shadow-card-hover"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#B91C1C]/10 text-[#B91C1C]">
                <AlertTriangle size={17} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 id="confirm-title" className="text-ui font-bold text-ink">
                  {title}
                </h2>
                <p id="confirm-description" className="mt-1 text-micro text-slate-500">
                  {description}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              {/* autoFocus, not a ref: the safe choice should be what a stray
                  Enter press hits, and Button doesn't forward refs. */}
              <Button autoFocus variant="outline" size="sm" onClick={onCancel} disabled={pending}>
                {cancelLabel}
              </Button>
              <Button variant="danger" size="sm" onClick={onConfirm} disabled={pending}>
                {pending ? "Deleting…" : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
