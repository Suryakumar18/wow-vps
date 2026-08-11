import "server-only";
import { prisma } from "./prisma";
import {
  announcement as staticAnnouncement,
  brand as staticBrand,
  navItems as staticNavItems,
  allCategories as staticAllCategories,
  categories as staticCategories,
  heroTrust as staticHeroTrust,
  trustFeatures as staticTrustFeatures,
  newsletter as staticNewsletter,
  footer as staticFooter,
  productOffers as staticProductOffers,
  productAssurances as staticProductAssurances,
  type Category,
  type NavItem,
} from "@/app/components-home/data/home-content";

/**
 * Storefront content, read from the CMS tables.
 *
 * Every reader falls back to the approved static copy when the CMS is empty or
 * the read fails — an unseeded or briefly unreachable database must never blank
 * out the header, footer or navigation.
 *
 * `ContentItem.extra` is group-specific:
 *   footer.socials  → the Tailwind class for the tile's brand colour
 *   nav.primary     → the mega-menu promo tile's href
 */

async function withFallback<T>(read: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await read();
  } catch (err) {
    console.error(`CMS read failed (${label}) — serving static content.`, err);
    return fallback;
  }
}

type Row = {
  id: string;
  label: string | null;
  sublabel: string | null;
  href: string | null;
  icon: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  extra: string | null;
};

const listOf = (group: string) =>
  prisma.contentItem.findMany({
    where: { group, isActive: true },
    orderBy: { position: "asc" },
  });

/* ── Settings ──────────────────────────────────────────────────────── */

export type Settings = Record<string, string>;

/** All settings as a flat map. Callers read with `pick()` so a missing key can't crash a page. */
export async function getSettings(): Promise<Settings> {
  return withFallback(
    async () => {
      const rows = await prisma.siteSetting.findMany();
      return Object.fromEntries(rows.map((r) => [r.key, r.value]));
    },
    {},
    "settings",
  );
}

export const pick = (settings: Settings, key: string, fallback: string) =>
  settings[key]?.trim() ? settings[key] : fallback;

/* ── Brand & announcement ──────────────────────────────────────────── */

export async function getBrand(settings: Settings) {
  return {
    name: pick(settings, "brand.name", staticBrand.name),
    location: pick(settings, "brand.location", staticBrand.location),
    tagline: pick(settings, "brand.tagline", staticBrand.tagline),
    searchPlaceholder: pick(settings, "brand.searchPlaceholder", staticBrand.searchPlaceholder),
  };
}

export async function getAnnouncement(settings: Settings) {
  return withFallback(
    async () => {
      const [left, center] = await Promise.all([
        listOf("announcement.left"),
        listOf("announcement.center"),
      ]);
      return {
        left: left.length
          ? left.map((r) => ({ icon: r.icon ?? "zap", label: r.label ?? "" }))
          : [...staticAnnouncement.left],
        center: center.length
          ? center.map((r) => ({ icon: r.icon ?? "truck", label: r.label ?? "" }))
          : [...staticAnnouncement.center],
        help: {
          label: pick(settings, "announcement.help.label", staticAnnouncement.help.label),
          phone: pick(settings, "announcement.help.phone", staticAnnouncement.help.phone),
          href: pick(settings, "announcement.help.href", staticAnnouncement.help.href),
        },
      };
    },
    {
      left: [...staticAnnouncement.left],
      center: [...staticAnnouncement.center],
      help: { ...staticAnnouncement.help },
    },
    "announcement",
  );
}

/* ── Navigation ────────────────────────────────────────────────────── */

export async function getNavItems(): Promise<NavItem[]> {
  return withFallback(
    async () => {
      // Derived from real departments rather than a hand-maintained list, so a
      // nav entry always points at a category that exists and its mega menu
      // always shows subcategories that actually filter products.
      const categories = await prisma.category.findMany({
        where: { showInNav: true },
        orderBy: { position: "asc" },
        include: {
          subcategories: {
            where: { isActive: true },
            orderBy: { position: "asc" },
          },
        },
      });
      if (categories.length === 0) return [...staticNavItems];

      return categories.map((category) => {
        const links = category.subcategories.map((sub) => ({
          label: sub.name,
          href: `/category/${category.slug}?sub=${sub.slug}`,
        }));

        return {
          label: category.shortTitle || category.name,
          href: `/category/${category.slug}`,
          // One column per department; the old three-column split existed only
          // to fill space with placeholder links.
          ...(links.length ? { menu: [{ title: `Shop ${category.shortTitle || category.name}`, links }] } : {}),
          ...(category.imageUrl
            ? {
                feature: {
                  title: category.titleLine1 || category.name,
                  subtitle: category.titleLine2 || "",
                  src: category.imageUrl,
                  alt: category.imageAlt || category.name,
                  href: `/category/${category.slug}`,
                },
              }
            : {}),
        };
      });
    },
    [...staticNavItems],
    "nav items",
  );
}

export async function getAllCategoryLinks() {
  return withFallback(
    async () => {
      const categories = await prisma.category.findMany({
        where: { showInNav: true },
        orderBy: { position: "asc" },
      });
      if (categories.length === 0) return [...staticAllCategories];
      return categories.map((c) => ({
        // Same label as the nav bar — one category must not appear under two
        // different names in the same header.
        label: c.shortTitle || c.name,
        href: `/category/${c.slug}`,
        // Icons still come from the static list where the slug matches, since
        // there's no icon column on Category.
        icon: staticAllCategories.find((s) => s.href === `/category/${c.slug}`)?.icon ?? "car",
      }));
    },
    [...staticAllCategories],
    "all-categories menu",
  );
}

/* ── Homepage tiles ────────────────────────────────────────────────── */

export async function getCategoryTiles(): Promise<Category[]> {
  return withFallback(
    async () => {
      const rows = await prisma.category.findMany({
        where: { showOnHome: true, titleLine1: { not: "" } },
        orderBy: { position: "asc" },
      });
      if (rows.length === 0) return [...staticCategories];
      return rows.map((c) => ({
        id: c.slug,
        shortTitle: c.shortTitle || c.name,
        titleLines: [c.titleLine1, c.titleLine2] as [string, string],
        href: `/category/${c.slug}`,
        src: c.imageUrl,
        alt: c.imageAlt,
      }));
    },
    [...staticCategories],
    "category tiles",
  );
}

/* ── Trust strips ──────────────────────────────────────────────────── */

export async function getHeroTrust() {
  return withFallback(
    async () => {
      const rows = await listOf("hero.trust");
      if (rows.length === 0) return [...staticHeroTrust];
      return rows.map((r) => ({ icon: r.icon ?? "shield", label: r.label ?? "" }));
    },
    [...staticHeroTrust],
    "hero trust",
  );
}

export async function getTrustFeatures() {
  return withFallback(
    async () => {
      const rows = await listOf("trust.features");
      if (rows.length === 0) return [...staticTrustFeatures];
      return rows.map((r) => ({
        icon: r.icon ?? "shield",
        title: r.label ?? "",
        subtitle: r.sublabel ?? "",
      }));
    },
    [...staticTrustFeatures],
    "trust features",
  );
}

/* ── Newsletter ────────────────────────────────────────────────────── */

export function getNewsletter(settings: Settings) {
  return {
    title: pick(settings, "newsletter.title", staticNewsletter.title),
    description: pick(settings, "newsletter.description", staticNewsletter.description),
    placeholder: pick(settings, "newsletter.placeholder", staticNewsletter.placeholder),
    ctaLabel: pick(settings, "newsletter.ctaLabel", staticNewsletter.ctaLabel),
    asideLines: [
      pick(settings, "newsletter.asideLine1", staticNewsletter.asideLines[0]),
      pick(settings, "newsletter.asideLine2", staticNewsletter.asideLines[1]),
    ] as [string, string],
  };
}

/* ── Footer ────────────────────────────────────────────────────────── */

export async function getFooter(settings: Settings) {
  return withFallback(
    async () => {
      const [columnHeads, socials, payments] = await Promise.all([
        prisma.contentItem.findMany({
          where: { group: { startsWith: "footer.column." }, isActive: true, parentId: null },
          orderBy: { position: "asc" },
          include: { children: { orderBy: { position: "asc" }, where: { isActive: true } } },
        }),
        listOf("footer.socials"),
        listOf("footer.payments"),
      ]);

      const columns = columnHeads.length
        ? columnHeads.map((c) => ({
            title: c.label ?? "",
            links: c.children.map((l) => ({ label: l.label ?? "", href: l.href ?? "/" })),
          }))
        : staticFooter.columns.map((c) => ({ title: c.title, links: [...c.links] }));

      return {
        about: pick(settings, "footer.about", staticFooter.about),
        columns,
        follow: {
          title: pick(settings, "footer.follow.title", staticFooter.follow.title),
          description: pick(settings, "footer.follow.description", staticFooter.follow.description),
          socials: socials.length
            ? socials.map((s) => ({
                name: s.label ?? "",
                href: s.href ?? "#",
                icon: s.icon ?? "facebook",
                className: s.extra ?? "",
              }))
            : staticFooter.follow.socials.map((s) => ({ ...s })),
        },
        payments: {
          title: pick(settings, "footer.payments.title", staticFooter.payments.title),
          methods: payments.length
            ? payments.map((p) => p.label ?? "")
            : [...staticFooter.payments.methods],
        },
        legal: pick(settings, "footer.legal", staticFooter.legal),
        meta: [
          pick(settings, "footer.meta1", staticFooter.meta[0]),
          pick(settings, "footer.meta2", staticFooter.meta[1]),
        ] as [string, string],
      };
    },
    {
      about: staticFooter.about,
      columns: staticFooter.columns.map((c) => ({ title: c.title, links: [...c.links] })),
      follow: {
        title: staticFooter.follow.title,
        description: staticFooter.follow.description,
        socials: staticFooter.follow.socials.map((s) => ({ ...s })),
      },
      payments: {
        title: staticFooter.payments.title,
        methods: [...staticFooter.payments.methods],
      },
      legal: staticFooter.legal,
      meta: [staticFooter.meta[0], staticFooter.meta[1]] as [string, string],
    },
    "footer",
  );
}

/* ── Product page ──────────────────────────────────────────────────── */

export async function getProductOffers() {
  return withFallback(
    async () => {
      const rows = await listOf("product.offers");
      if (rows.length === 0) return [...staticProductOffers];
      return rows.map((r) => ({ code: r.label ?? "", description: r.sublabel ?? "" }));
    },
    [...staticProductOffers],
    "product offers",
  );
}

export async function getProductAssurances() {
  return withFallback(
    async () => {
      const rows = await listOf("product.assurances");
      if (rows.length === 0) return [...staticProductAssurances];
      return rows.map((r) => ({ icon: r.icon ?? "shield", label: r.label ?? "" }));
    },
    [...staticProductAssurances],
    "product assurances",
  );
}

export type { Row as ContentRow };
