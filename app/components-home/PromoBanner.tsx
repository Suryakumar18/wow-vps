import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Button from "./ui/Button";
import { cn } from "./lib/cn";

export interface PromoBannerData {
  id: string;
  tone: "dark" | "light";
  eyebrow: string;
  titleLines: string[];
  /** `\n` renders as a line break. */
  description: string;
  ctaLabel: string;
  ctaHref: string;
  src: string;
  alt: string;
}

/**
 * Half-width promotional banner. `dark` is navy with white type and a gold
 * button; `light` is the pale blue field with navy type and a white button.
 *
 * Height scales with the viewport instead of stepping between fixed values, so
 * the banner keeps its proportions from a 360px phone to an ultrawide monitor.
 */
export default function PromoBanner({ banner, sizes }: { banner: PromoBannerData; sizes: string }) {
  const dark = banner.tone === "dark";

  return (
    <article
      className={cn(
        "relative isolate flex h-promo overflow-hidden rounded-xl",
        dark ? "bg-navy-800" : "bg-sky",
      )}
    >
      <div className="absolute inset-y-0 right-0 w-full sm:w-[62%]">
        <Image src={banner.src} alt={banner.alt} fill loading="lazy" sizes={sizes} className="object-cover" />
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 bg-gradient-to-r",
            dark
              ? "from-navy-800 via-navy-800/85 to-navy-800/35 sm:via-navy-800/70 sm:to-transparent"
              : "from-sky via-sky/85 to-sky/35 sm:via-sky/70 sm:to-transparent",
          )}
        />
      </div>

      <div className="relative z-10 flex max-w-[76%] flex-col justify-center px-panel py-5 sm:max-w-[58%]">
        <p
          className={cn(
            "text-nano font-bold uppercase tracking-[0.18em]",
            dark ? "text-gold-400" : "text-navy-700",
          )}
        >
          {banner.eyebrow}
        </p>

        <h3 className={cn("mt-2.5 text-promo font-bold", dark ? "text-white" : "text-ink")}>
          {banner.titleLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h3>

        <p className={cn("mt-2 text-micro", dark ? "text-white/70" : "text-slate-600")}>
          {banner.description.split("\n").map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>

        <Button
          href={banner.ctaHref}
          variant={dark ? "gold" : "white"}
          size="sm"
          className="mt-4 self-start"
        >
          {banner.ctaLabel}
          {/* Gold button: arrow inherits the navy label. White button: gold arrow. */}
          <ArrowRight size={13} aria-hidden="true" className={dark ? undefined : "text-gold-600"} />
        </Button>
      </div>
    </article>
  );
}
