"use client";

import { useRef, useState } from "react";
import { cn } from "../lib/cn";

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Fires once when the last digit lands. */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: string;
}

/**
 * One REAL input, six display boxes.
 *
 * The invisible input stretched over the boxes holds the whole code, so
 * typing, backspace, paste and WhatsApp/SMS code autofill all behave like a
 * plain text field — no per-box focus juggling, which mobile keyboards
 * (GBoard's composition events especially) never delivered reliably. The
 * boxes underneath only *display* the value, with a blinking caret on the
 * active cell.
 */
export default function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  error,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const active = Math.min(value.length, length - 1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/\D/g, "").slice(0, length);
    if (clean === value) return;
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  /** Keep the (invisible) caret at the end — the display assumes append/pop. */
  const snapCaretToEnd = () => {
    const el = inputRef.current;
    if (el) el.setSelectionRange(el.value.length, el.value.length);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={length}
          aria-label={`${length}-digit verification code`}
          aria-invalid={error ? true : undefined}
          value={value}
          disabled={disabled}
          onChange={handleChange}
          onFocus={() => {
            setFocused(true);
            snapCaretToEnd();
          }}
          onBlur={() => setFocused(false)}
          onSelect={snapCaretToEnd}
          // 16px font: below that, iOS zooms the page on focus — even though
          // the input itself is invisible.
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 [font-size:16px]"
        />

        <div className="flex justify-between gap-2" aria-hidden="true">
          {digits.map((digit, i) => (
            <div
              key={i}
              className={cn(
                "grid h-12 w-11 place-items-center rounded-lg border bg-white text-lead font-semibold text-ink transition-colors",
                error
                  ? "border-[#E23B3B]"
                  : focused && i === active && value.length < length
                    ? "border-gold-500"
                    : "border-line",
                disabled && "bg-mist text-slate-400",
              )}
            >
              {digit ||
                (focused && i === active && !disabled ? (
                  <span className="h-5 w-px animate-pulse bg-gold-500" />
                ) : (
                  ""
                ))}
            </div>
          ))}
        </div>
      </div>
      {error && <p className="text-nano text-[#B91C1C]">{error}</p>}
    </div>
  );
}
