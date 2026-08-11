"use client";

import { useRef } from "react";
import { cn } from "../lib/cn";

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Fires once when the last box is filled. */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: string;
}

/**
 * One logical input rendered as six boxes.
 *
 * The string `value` is the single source of truth; focus is always steered
 * to the first empty box, so typing appends, backspace pops, and pasting a
 * whole code fills everything — the three things people actually do with an
 * OTP field. Styled to match TextField (44px touch target, gold focus).
 */
export default function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  error,
}: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const active = Math.min(value.length, length - 1);

  const commit = (next: string) => {
    onChange(next);
    refs.current[Math.min(next.length, length - 1)]?.focus();
    if (next.length === length) onComplete?.(next);
  };

  const handleInput = (raw: string) => {
    const clean = raw.replace(/\D/g, "");
    if (!clean) return;
    commit((value + clean).slice(0, length));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      onChange(value.slice(0, -1));
      refs.current[Math.max(active - 1, 0)]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const clean = e.clipboardData.getData("text").replace(/\D/g, "");
    if (clean) commit(clean.slice(0, length));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between gap-2" onPaste={handlePaste}>
        {Array.from({ length }, (_, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${i + 1} of ${length}`}
            aria-invalid={error ? true : undefined}
            maxLength={length}
            disabled={disabled}
            value={value[i] ?? ""}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            // Typing always happens at the first empty box, wherever they tap.
            onFocus={() => refs.current[active]?.focus()}
            className={cn(
              "h-12 w-11 rounded-lg border bg-white text-center text-lead font-semibold text-ink outline-none transition-colors",
              "disabled:bg-mist disabled:text-slate-400",
              error
                ? "border-[#E23B3B] focus:border-[#E23B3B]"
                : "border-line focus:border-gold-500",
            )}
          />
        ))}
      </div>
      {error && <p className="text-nano text-[#B91C1C]">{error}</p>}
    </div>
  );
}
