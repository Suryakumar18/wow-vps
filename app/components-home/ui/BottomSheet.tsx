"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * The mobile drawer primitive — filters, sort, category selection, coupons,
 * address and country pickers, share and wishlist all use this rather than a
 * desktop-style centred modal.
 *
 * Behaviour it guarantees so callers don't re-implement it:
 *  - scrim + Escape close, body scroll locked while open
 *  - panel capped at 85vh with its own scroll, so long lists never push the
 *    close affordance off-screen
 *  - bottom padding respects the home-indicator safe area
 *  - focus moves into the panel on open, is trapped there while open (Tab/
 *    Shift+Tab wrap instead of escaping to the page behind the scrim), and
 *    returns to the trigger on close
 *  - honours prefers-reduced-motion (no slide, just show)
 */
export default function BottomSheet({
  open,
  onClose,
  title,
  description,
  footer,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Pinned below the scroll area — use for "Apply"/"Clear" style actions. */
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;

    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      // Trap Tab/Shift+Tab inside the panel — without this, tabbing past the
      // last control (or shift-tabbing before the first) lands on whatever the
      // page behind the scrim happens to render next, defeating aria-modal.
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeIndex = focusable.indexOf(document.activeElement as HTMLElement);

      if (e.shiftKey) {
        if (activeIndex <= 0) {
          e.preventDefault();
          last.focus();
        }
      } else if (activeIndex === -1 || activeIndex === focusable.length - 1) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
      restoreFocusTo.current?.focus?.();
    };
  }, [open, onClose]);

  return (
    <div className={cn("lg:hidden", !open && "pointer-events-none")} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[60] bg-navy-950/50 transition-opacity duration-300 motion-reduce:transition-none",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "fixed inset-x-0 bottom-0 z-[60] flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-[0_-12px_32px_-12px_rgba(16,33,53,0.35)] outline-none transition-transform duration-300 ease-out motion-reduce:transition-none",
          open ? "translate-y-0" : "translate-y-full",
          className,
        )}
      >
        {/* Grab handle: signals the sheet is dismissible. */}
        <div className="flex justify-center pt-2.5" aria-hidden="true">
          <span className="h-1 w-9 rounded-full bg-line" />
        </div>

        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-2">
          <div className="min-w-0">
            <h2 id={titleId} className="text-nav-ui font-bold text-ink">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-0.5 text-nav-nano text-slate-500">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="-mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-md text-slate-500 transition-colors hover:bg-mist hover:text-ink"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2">{children}</div>

        {footer && (
          <div className="border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            {footer}
          </div>
        )}
        {!footer && <div className="pb-[max(0.75rem,env(safe-area-inset-bottom))]" />}
      </div>
    </div>
  );
}
