import { Dancing_Script } from "next/font/google";
import CartPanel from "./CartPanel";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import BottomNav from "./mobile/BottomNav";
import {
  getSettings,
  getBrand,
  getAnnouncement,
  getNavItems,
  getAllCategoryLinks,
  getFooter,
} from "@/app/server/content";

// Used for the brand tagline and the hero's "Play / Build / Explore" flourish.
const script = Dancing_Script({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-script",
  display: "swap",
});

/**
 * Chrome shared by every storefront page: announcement bar, sticky header and
 * nav, footer, cart drawer and the mobile bottom navigation.
 *
 * Lives in one place so a page can never drift onto a different header — the
 * homepage and the category pages render identical chrome, and anything added
 * here reaches both. The approved design is light-only, so the shell pins its
 * own background and text colour rather than following the site-wide theme
 * toggle.
 */
export default async function StorefrontShell({
  children,
  hideHeaderBelowLg = false,
}: {
  children: React.ReactNode;
  /** Detail screens supply their own compact mobile header instead. */
  hideHeaderBelowLg?: boolean;
}) {
  // Chrome content is fetched once here and threaded down, so the header and
  // footer stay in step on every page rather than each fetching its own copy.
  const settings = await getSettings();
  const [brand, announcement, navItems, allCategories, footer] = await Promise.all([
    getBrand(settings),
    getAnnouncement(settings),
    getNavItems(),
    getAllCategoryLinks(),
    getFooter(settings),
  ]);

  return (
    <div className={`${script.variable} flex min-h-screen flex-col bg-white text-ink`}>
      <SiteHeader
        hiddenBelowLg={hideHeaderBelowLg}
        brand={brand}
        announcement={announcement}
        navItems={navItems}
        allCategories={allCategories}
      />
      {/* Bottom spacing comes from the footer's own `mt-section`, so the gap
          above the footer matches the gap between every other section. */}
      <main className="flex-1">{children}</main>
      <SiteFooter content={footer} />
      {/* Clears the fixed bottom nav (56px + home indicator) so the footer's
          last row is never trapped underneath it. */}
      <div aria-hidden="true" className="h-[calc(3.5rem+env(safe-area-inset-bottom))] lg:hidden" />
      <CartPanel />
      <BottomNav />
    </div>
  );
}
