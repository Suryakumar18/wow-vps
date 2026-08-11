import Section from "./ui/Section";
import LifestyleBanner from "./LifestyleBanner";
import { lifestyleBanners as defaultLifestyleBanners } from "./data/home-content";

type LifestyleBannerData = (typeof defaultLifestyleBanners)[number];

/**
 * Three equal audience banners: hobbyists, families and gifting.
 *
 * At `sm` two sit side by side and the third spans the full width rather than
 * leaving a half-width gap; from `lg` all three share the row.
 */
export default function LifestyleSection({
  className,
  banners = defaultLifestyleBanners,
}: {
  className?: string;
  banners?: readonly LifestyleBannerData[];
}) {
  const lifestyleBanners = banners;
  return (
    <Section label="Shop by occasion" className={className}>
      <div className="grid gap-card sm:grid-cols-2 lg:grid-cols-3">
        {lifestyleBanners.map((banner, i) => (
          <div key={banner.id} className={i === 2 ? "sm:col-span-2 lg:col-span-1" : undefined}>
            <LifestyleBanner
              banner={banner}
              sizes="(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 100vw"
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
