import Image from "next/image";
import Button from "./ui/Button";
import { cn } from "./lib/cn";

export interface LifestyleBannerData {
  id: string;
  tone: "dark" | "cream";
  title: string;
  /** `\n` renders as a line break. */
  description: string;
  ctaLabel: string;
  ctaHref: string;
  src: string;
  alt: string;
}

/**
 * Short audience banner ("For Hobbyists" / "For Families" / "For Gifting").
 * Copy sits left over a photo that fades in from the right edge.
 */
export default function LifestyleBanner({
  banner,
  sizes,
}: {
  banner: LifestyleBannerData;
  sizes: string;
}) {
  const dark = banner.tone === "dark";

  return (
    <article
      className={cn(
        "relative isolate flex h-lifestyle overflow-hidden rounded-xl",
        dark ? "bg-navy-800" : "bg-cream-200",
      )}
    >
      <div className="absolute inset-y-0 right-0 w-[64%]">
        <Image src={banner.src} alt={banner.alt} fill loading="lazy" sizes={sizes} className="object-cover" />
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 bg-gradient-to-r",
            dark
              ? "from-navy-800 via-navy-800/75 to-transparent"
              : "from-cream-200 via-cream-200/75 to-transparent",
          )}
        />
      </div>

      <div className="relative z-10 flex max-w-[70%] flex-col justify-center px-4 py-4">
        <h3 className={cn("text-ui font-bold leading-tight", dark ? "text-white" : "text-ink")}>
          {banner.title}
        </h3>

        <p className={cn("mt-1.5 text-nano leading-[1.45]", dark ? "text-white/70" : "text-slate-600")}>
          {banner.description.split("\n").map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>

        <Button
          href={banner.ctaHref}
          variant={dark ? "white" : "gold"}
          size="xs"
          className="mt-3 self-start"
        >
          {banner.ctaLabel}
        </Button>
      </div>
    </article>
  );
}
