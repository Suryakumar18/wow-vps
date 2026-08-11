import Section from "./ui/Section";
import PromoBanner from "./PromoBanner";
import { promoBanners as defaultPromoBanners } from "./data/home-content";

type PromoBannerData = (typeof defaultPromoBanners)[number];

/**
 * The two department banners under the category grid.
 *
 * They sit side by side from `md` (768) rather than `lg`, because at 768 each
 * half is still wide enough for the copy column plus the photo. The RC Cars
 * panel keeps the approved 1.2 : 1 advantage on desktop.
 */
export default function PromoSection({
  className,
  banners = defaultPromoBanners,
}: {
  className?: string;
  banners?: readonly PromoBannerData[];
}) {
  const [rcCars, drones] = banners;

  return (
    <Section label="Featured departments" className={className}>
      <div className="grid gap-card md:grid-cols-2 lg:grid-cols-[1.2fr_1fr]">
        <PromoBanner banner={rcCars} sizes="(min-width: 768px) 55vw, 100vw" />
        <PromoBanner banner={drones} sizes="(min-width: 768px) 45vw, 100vw" />
      </div>
    </Section>
  );
}
