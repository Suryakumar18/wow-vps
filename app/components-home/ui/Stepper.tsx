import { Check } from "lucide-react";
import { cn } from "../lib/cn";

export interface Step {
  key: string;
  label: string;
}

/**
 * Numbered progress stepper for multi-step flows (currently checkout's
 * Address → Delivery → Payment).
 *
 * A completed step is clickable — tapping its number jumps back to it. The
 * current and future steps are not: forward navigation only happens through
 * each step's own "Continue" action, so the flow can validate before advancing.
 */
export default function Stepper({
  steps,
  currentIndex,
  onStepClick,
}: {
  steps: Step[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
}) {
  return (
    <ol className="flex items-start">
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const clickable = done && Boolean(onStepClick);

        return (
          <li key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(i)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-micro font-bold transition-colors",
                  active && "bg-gold-500 text-navy-900",
                  done && "bg-navy-800 text-white",
                  !active && !done && "border border-line bg-white text-slate-400",
                  clickable && "cursor-pointer hover:bg-navy-700",
                  !clickable && "cursor-default",
                )}
              >
                {done ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : i + 1}
              </button>
              <span
                className={cn(
                  "text-nano font-semibold",
                  active ? "text-ink" : done ? "text-slate-600" : "text-slate-400",
                )}
              >
                {step.label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn("mx-2 h-0.5 flex-1 rounded-full", done ? "bg-navy-800" : "bg-line")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
