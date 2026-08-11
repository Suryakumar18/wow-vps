import HeroBanner from "@/app/components-home/HeroBanner";
import CategorySection from "@/app/components-home/CategorySection";
import PromoSection from "@/app/components-home/PromoSection";
import PopularPicks from "@/app/components-home/PopularPicks";
import TrustSection from "@/app/components-home/TrustSection";
import LifestyleSection from "@/app/components-home/LifestyleSection";
import Newsletter from "@/app/components-home/Newsletter";
import DealsOfTheDay from "@/app/components-home/mobile/DealsOfTheDay";
import {
  getHeroSlides,
  getPromoBanners,
  getLifestyleBanners,
  getFeaturedProducts,
  getDealProducts,
} from "@/app/server/homepage";
import {
  getSettings,
  getNewsletter,
  getCategoryTiles,
  getTrustFeatures,
} from "@/app/server/content";

/**
 * Nothing on this page reads cookies or search params, so Next prerenders it
 * and serves the same HTML to everyone — which is exactly what's wanted for the
 * store's front door, and the reason it's the fastest page here.
 *
 * The cost of that is staleness, so it also regenerates hourly, and every admin
 * write that changes homepage content calls `revalidateHomepage()` to rebuild
 * it immediately. Without both, a hero slide saved in the admin panel would sit
 * invisible until the next deploy.
 */
export const revalidate = 3600;

/**
 * Homepage.
 *
 * Both approved designs are served from one DOM: the sections are ordered for
 * mobile and re-ordered with `lg:order-*` for desktop, so neither layout is a
 * duplicate of the other and content stays in a single place.
 *
 *   Mobile  — hero, trust, categories, WOW Club, deals, banners, picks, lifestyle
 *   Desktop — hero, categories, banners, picks, trust, lifestyle, WOW Club
 *
 * "Deals of the Day" is mobile-only: the approved desktop page has no such
 * section and must not gain one.
 *
 * Content comes from the CMS tables; the layout itself is fixed. Each getter
 * falls back to the approved static copy when its table is empty.
 */
export default async function Home() {
  const settings = await getSettings();
  const [slides, promos, lifestyle, featured, deals, tiles, trust] = await Promise.all([
    getHeroSlides(),
    getPromoBanners(),
    getLifestyleBanners(),
    getFeaturedProducts(),
    getDealProducts(),
    getCategoryTiles(),
    getTrustFeatures(),
  ]);
  const newsletter = getNewsletter(settings);

  return (
    <div className="flex flex-col">
      <HeroBanner slides={slides} />
      <TrustSection className="order-2 lg:order-5" features={trust} />
      <CategorySection className="order-3 lg:order-2" tiles={tiles} />
      <Newsletter className="order-4 lg:order-7" content={newsletter} />
      <DealsOfTheDay products={deals} />
      <PromoSection className="order-6 lg:order-3" banners={promos} />
      <PopularPicks className="order-7 lg:order-4" products={featured} />
      <LifestyleSection className="order-8 lg:order-6" banners={lifestyle} />
    </div>
  );
}
