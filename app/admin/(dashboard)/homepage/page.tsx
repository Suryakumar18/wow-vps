import { prisma } from "@/app/server/prisma";
import AdminPageHeader from "../PageHeader";
import Tabs from "../Tabs";
import HeroSlidesEditor from "./HeroSlidesEditor";
import ProductPicker from "./ProductPicker";
import CategoryTilesEditor from "./CategoryTilesEditor";
import BannerEditor from "./BannerEditor";

export default async function AdminHomepagePage() {
  /**
   * The picker rows.
   *
   * Three bounded queries rather than one unbounded one. This page used to load
   * every published product with its category and brand so the pickers could
   * filter them in the browser — 1.7 seconds and several megabytes once the
   * catalogue reached three thousand products, for two lists a shopper never
   * sees. The pickers now search through `/api/admin/products`, so the page only
   * needs what's already selected (which must be complete, or the picker would
   * disagree with the homepage) plus a first page to browse.
   */
  const pickerSelect = {
    id: true,
    title: true,
    slug: true,
    price: true,
    isFeatured: true,
    isDeal: true,
    category: { select: { name: true } },
    brand: { select: { name: true } },
  } as const;

  const [slides, featured, deals, browsable, tiles, banners] = await Promise.all([
    prisma.heroSlide.findMany({ orderBy: { position: "asc" } }),
    prisma.product.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: { title: "asc" },
      select: pickerSelect,
    }),
    prisma.product.findMany({
      where: { isPublished: true, isDeal: true },
      orderBy: { title: "asc" },
      select: pickerSelect,
    }),
    prisma.product.findMany({
      where: { isPublished: true },
      orderBy: { title: "asc" },
      take: 50,
      select: pickerSelect,
    }),
    prisma.category.findMany({ orderBy: { position: "asc" } }),
    prisma.banner.findMany({ orderBy: [{ placement: "asc" }, { position: "asc" }] }),
  ]);

  const toPickerRow = (p: (typeof browsable)[number]) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    price: p.price,
    categoryName: p.category.name,
    brandName: p.brand.name,
    isFeatured: p.isFeatured,
    isDeal: p.isDeal,
  });

  const browsableRows = browsable.map(toPickerRow);
  const featuredRows = featured.map(toPickerRow);
  const dealRows = deals.map(toPickerRow);
  const pickerCategories = tiles.map((t) => ({ id: t.id, name: t.name }));

  const toBanner = (b: (typeof banners)[number]) => ({
    id: b.id,
    tone: b.tone as "DARK" | "LIGHT" | "CREAM",
    eyebrow: b.eyebrow ?? "",
    titleLine1: b.titleLine1,
    titleLine2: b.titleLine2,
    description: b.description,
    ctaLabel: b.ctaLabel,
    ctaHref: b.ctaHref,
    imageUrl: b.imageUrl,
    imageAlt: b.imageAlt,
    isActive: b.isActive,
  });

  const promos = banners.filter((b) => b.placement === "PROMO").map(toBanner);
  const lifestyle = banners.filter((b) => b.placement === "LIFESTYLE").map(toBanner);

  return (
    <div>
      <AdminPageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Storefront", href: "/admin/homepage" },
          { label: "Homepage" },
        ]}
        title="Homepage"
        description="Content only — the approved layout and design stay fixed."
      />

      <Tabs
        tabs={[
          {
            key: "carousel",
            label: "Carousel",
            count: slides.length,
            content: (
              <HeroSlidesEditor
                initial={slides.map((s) => ({
                  id: s.id,
                  eyebrow: s.eyebrow,
                  titleLine1: s.titleLine1,
                  titleLine2: s.titleLine2,
                  description: s.description,
                  ctaLabel: s.ctaLabel,
                  ctaHref: s.ctaHref,
                  scriptWords: s.scriptWords.join(", "),
                  imageUrl: s.imageUrl,
                  imageAlt: s.imageAlt,
                  isActive: s.isActive,
                }))}
              />
            ),
          },
          {
            key: "picks",
            label: "Popular Picks",
            count: featuredRows.length,
            content: (
              <ProductPicker
                initialProducts={browsableRows}
                selectedProducts={featuredRows}
                categories={pickerCategories}
                field="isFeatured"
                emptyNote="Nothing featured yet — the homepage is showing the built-in default set."
              />
            ),
          },
          {
            key: "categories",
            label: "Shop by Category",
            count: tiles.filter((t) => t.showOnHome).length,
            content: (
              <CategoryTilesEditor
                initial={tiles.map((t) => ({
                  id: t.id,
                  slug: t.slug,
                  name: t.name,
                  shortTitle: t.shortTitle,
                  titleLine1: t.titleLine1,
                  titleLine2: t.titleLine2,
                  imageUrl: t.imageUrl,
                  imageAlt: t.imageAlt,
                  showOnHome: t.showOnHome,
                }))}
              />
            ),
          },
          {
            key: "promo",
            label: "Promo Cards",
            count: promos.length,
            content: (
              <BannerEditor
                placement="PROMO"
                initial={promos}
                hint="The two-card band under the category tiles."
              />
            ),
          },
          {
            key: "deals",
            label: "Deals of the Day",
            count: dealRows.length,
            content: (
              <ProductPicker
                initialProducts={browsableRows}
                selectedProducts={dealRows}
                categories={pickerCategories}
                field="isDeal"
                emptyNote="Nothing selected — the row falls back to your biggest discounts automatically."
              />
            ),
          },
          {
            key: "lifestyle",
            label: "Lifestyle Cards",
            count: lifestyle.length,
            content: (
              <BannerEditor
                placement="LIFESTYLE"
                initial={lifestyle}
                showEyebrow={false}
                showSecondLine={false}
                hint="The card row near the foot of the page."
              />
            ),
          },
        ]}
      />
    </div>
  );
}
