import Section from "./ui/Section";
import SectionHeading from "./ui/SectionHeading";
import CategoryCard from "./CategoryCard";
import { categories as defaultCategories, type Category } from "./data/home-content";

/**
 * "Shop by category".
 *
 * Column counts follow the agreed ladder — 2 mobile, 3 large phone, 4 tablet,
 * 6 laptop, 8 desktop — and stay at 8 above that. The container's tiered
 * max-width absorbs the extra room on 1920/2560 screens, so the tiles gain a
 * little size without ever stretching out of proportion.
 */
export default function CategorySection({
  className,
  tiles = defaultCategories,
}: {
  className?: string;
  tiles?: Category[];
}) {
  const categories = tiles;
  return (
    <Section labelledBy="categories-heading" className={className}>
      <SectionHeading
        eyebrow="Shop by Category"
        title={<span id="categories-heading">Discover What Excites You</span>}
        subtitle="From high-speed RC cars to flying drones, building sets to collectible models – find your next obsession."
        action={{ label: "View All Categories", href: "/category/all" }}
      />

      {/* Four circular tiles per row on phones (approved mobile design), then the
          desktop ladder: 6 at `lg`, 8 from `xl`. */}
      <ul className="mt-heading grid grid-cols-4 gap-x-2 gap-y-4 sm:gap-x-3 lg:grid-cols-6 lg:gap-card xl:grid-cols-8">
        {categories.map((category) => (
          <li key={category.id}>
            <CategoryCard category={category} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
