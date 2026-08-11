"use client";

import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/cn";

type Props = {
  label: string;
  /** Hidden visually but always present for screen readers. */
  hideLabel?: boolean;
  error?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">;

/**
 * The form input for the whole storefront.
 *
 * `type="password"` grows a reveal toggle automatically — the eye is part of the
 * approved design on every password field, so it lives here rather than being
 * re-implemented per form. The 44px height is a touch-target floor and sits
 * outside `UI_SCALE` for the same reason the bottom nav does.
 *
 * Forwards its ref to the underlying `<input>` so a form can focus a specific
 * field programmatically — e.g. moving focus to the first invalid field after
 * a failed submit.
 */
const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, hideLabel = true, error, className, type = "text", ...rest },
  ref,
) {
  const id = useId();
  const errorId = `${id}-error`;
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && revealed ? "text" : type;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className={cn(
          "text-micro font-medium text-ink",
          hideLabel ? "sr-only" : "block",
        )}
      >
        {label}
      </label>

      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={inputType}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-11 w-full rounded-lg border bg-white px-3.5 text-micro text-ink outline-none transition-colors placeholder:text-slate-400",
            isPassword && "pr-11",
            error
              ? "border-[#E23B3B] focus:border-[#E23B3B]"
              : "border-line focus:border-gold-500",
          )}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? `Hide ${label}` : `Show ${label}`}
            className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-r-lg text-slate-400 transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold-600"
          >
            {revealed ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        )}
      </div>

      {error && (
        // #B91C1C rather than the border's #E23B3B: at nano size this text needs
        // 4.5:1 contrast on white, which #E23B3B falls short of (~4.0:1).
        <p id={errorId} className="text-nano text-[#B91C1C]">
          {error}
        </p>
      )}
    </div>
  );
});

export default TextField;
