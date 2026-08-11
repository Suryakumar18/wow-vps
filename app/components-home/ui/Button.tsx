import Link from "next/link";
import { cn } from "../lib/cn";

export type ButtonVariant = "gold" | "navy" | "white" | "outline" | "ghost" | "danger";
export type ButtonSize = "xs" | "sm" | "md";

const VARIANTS: Record<ButtonVariant, string> = {
  gold: "bg-gold-500 text-navy-900 hover:bg-gold-600 focus-visible:outline-gold-600",
  navy: "bg-navy-800 text-white hover:bg-navy-700 focus-visible:outline-navy-800",
  white: "bg-white text-navy-900 hover:bg-cream-100 focus-visible:outline-white",
  outline:
    "border border-navy-800/20 bg-transparent text-navy-900 hover:border-navy-800/40 hover:bg-navy-800/[0.04] focus-visible:outline-navy-800",
  ghost: "bg-transparent text-navy-900 hover:bg-navy-800/[0.06] focus-visible:outline-navy-800",
  // Destructive actions only. #B91C1C is the design system's sanctioned red.
  danger: "bg-[#B91C1C] text-white hover:bg-[#A11818] focus-visible:outline-[#B91C1C]",
};

const SIZES: Record<ButtonSize, string> = {
  xs: "h-control-xs gap-1.5 rounded-md px-2.5 text-nano",
  sm: "h-control-sm gap-2 rounded-md px-3.5 text-micro",
  md: "h-control-md gap-2 rounded-md px-5 text-ui",
};

const BASE =
  "inline-flex shrink-0 items-center justify-center font-semibold leading-none transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsLink = CommonProps & { href: string } & Omit<
    React.ComponentPropsWithoutRef<typeof Link>,
    "href" | "className" | "children"
  >;
type ButtonAsButton = CommonProps & { href?: undefined } & Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "children"
  >;

/**
 * The single button primitive for the homepage. Renders a `<Link>` when `href`
 * is supplied and a `<button>` otherwise, so callers never hand-roll either.
 */
export default function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant = "gold", size = "sm", className, children, ...rest } = props;
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);

  if (rest && "href" in rest && rest.href) {
    const { href, ...linkProps } = rest as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...buttonProps } = rest as ButtonAsButton;
  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
