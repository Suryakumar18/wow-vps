import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only recognises Tailwind's stock font-size scale. Our fluid
 * ramp (`text-micro`, `text-hero`, …) looked like *colour* utilities to it, so
 * any `cn("… text-micro", "text-ink")` silently dropped the size and the
 * element fell back to the browser default of 16px — which is exactly what the
 * nav links, promo headings and badges were doing.
 *
 * Registering the ramp puts those classes in the font-size group, so a size and
 * a colour can coexist and only same-group classes override each other.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["hero", "section", "promo", "lead", "ui", "micro", "nano"] },
        { text: ["nav-lead", "nav-ui", "nav-micro", "nav-nano"] },
      ],
    },
  },
});

/** Merge conditional class names, letting later Tailwind utilities win. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
