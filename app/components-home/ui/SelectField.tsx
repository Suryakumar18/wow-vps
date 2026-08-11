"use client";

import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";

type Props = {
  label: string;
  /** Hidden visually but always present for screen readers. */
  hideLabel?: boolean;
  error?: string;
  className?: string;
  /** Shown as the disabled first option while nothing is chosen. */
  placeholder?: string;
  options: string[];
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className" | "children">;

/**
 * TextField's dropdown sibling — same 44px control, border and focus
 * treatment, so a form mixing inputs and selects reads as one family.
 */
const SelectField = forwardRef<HTMLSelectElement, Props>(function SelectField(
  { label, hideLabel = true, error, className, placeholder, options, value, ...rest },
  ref,
) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className={cn("text-micro font-medium text-ink", hideLabel ? "sr-only" : "block")}>
        {label}
      </label>

      <div className="relative">
        <select
          ref={ref}
          id={id}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-11 w-full appearance-none rounded-lg border bg-white px-3.5 pr-10 text-micro outline-none transition-colors",
            value ? "text-ink" : "text-slate-400",
            error ? "border-[#E23B3B] focus:border-[#E23B3B]" : "border-line focus:border-gold-500",
            "disabled:bg-mist disabled:text-slate-400",
          )}
          {...rest}
        >
          {placeholder !== undefined && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option} value={option} className="text-ink">
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>

      {error && (
        <p id={errorId} className="text-nano text-[#B91C1C]">
          {error}
        </p>
      )}
    </div>
  );
});

export default SelectField;
