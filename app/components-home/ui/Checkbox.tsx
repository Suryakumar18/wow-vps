"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { cn } from "../lib/cn";

type Props = {
  label: React.ReactNode;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "type">;

/**
 * Checkbox with a gold-filled box when checked.
 *
 * The native input stays in the DOM (opacity 0, same box) so keyboard, form
 * submission and assistive tech all behave normally — the styled square is
 * purely a sibling that reacts to `peer-checked`.
 */
export default function Checkbox({ label, className, ...rest }: Props) {
  const id = useId();

  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <span className="relative grid h-[18px] w-[18px] shrink-0 place-items-center">
        <input
          id={id}
          type="checkbox"
          className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded border border-line bg-white transition-colors checked:border-gold-500 checked:bg-gold-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600"
          {...rest}
        />
        <Check
          size={12}
          strokeWidth={3}
          aria-hidden="true"
          className="pointer-events-none relative text-navy-900 opacity-0 transition-opacity peer-checked:opacity-100"
        />
      </span>

      <label htmlFor={id} className="cursor-pointer text-micro leading-[1.35] text-slate-600">
        {label}
      </label>
    </div>
  );
}
