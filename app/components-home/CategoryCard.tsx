import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Category } from "./data/home-content";

/**
 * Category tile with two layouts from one piece of markup:
 *
 *  - Mobile/tablet: circular thumbnail with a single-line label underneath,
 *    four to a row, as in the approved mobile design.
 *  - From `lg`: the approved desktop card — bordered, 4:3 image, two-line label
 *    and a gold arrow pinned to the bottom.
 *
 * The image box keeps a fixed ratio in both modes, so tiles stay in proportion
 * whether there are four per row or eight.
 */
export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={category.href}
      className="group flex h-full flex-col items-center text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600 lg:items-stretch lg:rounded-lg lg:border lg:border-line lg:bg-white lg:p-2 lg:text-left lg:shadow-card lg:transition-all lg:duration-200 lg:hover:-translate-y-0.5 lg:hover:border-gold-300 lg:hover:shadow-card-hover"
    >
      <div className="relative aspect-square w-14 overflow-hidden rounded-full bg-mist ring-1 ring-line transition-transform duration-200 group-hover:scale-105 xs:w-16 sm:w-[4.5rem] lg:aspect-[4/3] lg:w-full lg:rounded-md lg:ring-0 lg:group-hover:scale-100">
        <Image
          src={category.src}
          alt={category.alt}
          fill
          loading="lazy"
          sizes="(min-width: 1280px) 13vw, (min-width: 1024px) 17vw, 20vw"
          className="object-cover lg:transition-transform lg:duration-500 lg:group-hover:scale-[1.06]"
        />
      </div>

      <h3 className="mt-2 text-nano font-semibold leading-tight text-ink lg:mt-2.5 lg:px-0.5 lg:text-micro lg:leading-[1.3]">
        <span className="lg:hidden">{category.shortTitle}</span>
        <span className="hidden lg:inline">
          {category.titleLines[0]}
          <br />
          {category.titleLines[1]}
        </span>
      </h3>

      <span
        aria-hidden="true"
        className="mt-auto hidden px-0.5 pt-2 text-gold-500 transition-transform duration-200 group-hover:translate-x-1 lg:block"
      >
        <ArrowRight size={12} strokeWidth={2.5} />
      </span>
    </Link>
  );
}
