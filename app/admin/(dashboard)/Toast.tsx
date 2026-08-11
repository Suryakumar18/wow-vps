"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/app/components-home/lib/cn";

type Tone = "success" | "error" | "info";

interface Toast {
  id: number;
  tone: Tone;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TONES: Record<Tone, { icon: typeof CheckCircle2; className: string }> = {
  success: { icon: CheckCircle2, className: "text-[#0F7B3F]" },
  error: { icon: AlertCircle, className: "text-[#B91C1C]" },
  info: { icon: Info, className: "text-gold-600" },
};

const DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (tone: Tone, message: string) => {
      // `Date.now()` alone collides when two toasts fire in the same tick.
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, tone, message }]);
      setTimeout(() => dismiss(id), DISMISS_MS);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* `aria-live="polite"` so a screen reader announces each toast without
          interrupting whatever the user is doing. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const { icon: Icon, className } = TONES[toast.tone];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="pointer-events-auto flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5 shadow-card-hover"
              >
                <Icon size={16} aria-hidden="true" className={cn("mt-0.5 shrink-0", className)} />
                <p className="min-w-0 flex-1 text-micro text-ink">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-mist hover:text-ink"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Toast notifications for admin actions.
 *
 * Returns a no-op API outside a provider rather than throwing — a missing
 * provider should never crash a page over a status message.
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  return ctx ?? { success: () => {}, error: () => {}, info: () => {} };
}
