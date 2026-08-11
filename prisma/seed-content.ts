import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  announcement,
  brand,
  navItems,
  allCategories,
  categories,
  heroSlides,
  heroTrust,
  promoBanners,
  lifestyleBanners,
  trustFeatures,
  newsletter,
  footer,
  productOffers,
  productAssurances,
  authAside,
} from "../app/components-home/data/home-content";

/**
 * Pushes every string, link, icon and image URL currently hard-coded in
 * `home-content.ts` into the CMS tables.
 *
 * Idempotent: settings and content groups are replaced wholesale on each run,
 * so re-running restores the approved defaults rather than duplicating rows.
 * Products/categories keep their own seed in `seed.ts`.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type Item = {
  label?: string;
  sublabel?: string;
  href?: string;
  icon?: string;
  imageUrl?: string;
  imageAlt?: string;
  extra?: string;
};

async function replaceGroup(group: string, items: Item[]) {
  await prisma.contentItem.deleteMany({ where: { group } });
  for (const [position, item] of items.entries()) {
    await prisma.contentItem.create({ data: { group, position, ...item } });
  }
}

async function setSettings(group: string, entries: Record<string, string>, multiline: string[] = []) {
  for (const [key, value] of Object.entries(entries)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value, group, multiline: multiline.includes(key) },
      create: { key, value, group, multiline: multiline.includes(key) },
    });
  }
}

async function main() {
  /* ── Scalar copy ─────────────────────────────────────────────────── */
  await setSettings("Brand", {
    "brand.name": brand.name,
    "brand.location": brand.location,
    "brand.tagline": brand.tagline,
    "brand.searchPlaceholder": brand.searchPlaceholder,
  });

  await setSettings("Announcement", {
    "announcement.help.label": announcement.help.label,
    "announcement.help.phone": announcement.help.phone,
    "announcement.help.href": announcement.help.href,
  });

  await setSettings(
    "Newsletter",
    {
      "newsletter.title": newsletter.title,
      "newsletter.description": newsletter.description,
      "newsletter.placeholder": newsletter.placeholder,
      "newsletter.ctaLabel": newsletter.ctaLabel,
      "newsletter.asideLine1": newsletter.asideLines[0],
      "newsletter.asideLine2": newsletter.asideLines[1],
    },
    ["newsletter.description"],
  );

  await setSettings(
    "Footer",
    {
      "footer.about": footer.about,
      "footer.legal": footer.legal,
      "footer.meta1": footer.meta[0],
      "footer.meta2": footer.meta[1],
      "footer.follow.title": footer.follow.title,
      "footer.follow.description": footer.follow.description,
      "footer.payments.title": footer.payments.title,
    },
    ["footer.about"],
  );

  await setSettings("Auth page", {
    "authAside.headline1": authAside.headline[0],
    "authAside.headline2": authAside.headline[1],
    "authAside.headline3": authAside.headline[2],
    "authAside.headline4": authAside.headline[3],
    "authAside.imageUrl": authAside.src,
    "authAside.imageAlt": authAside.alt,
  });
  await replaceGroup(
    "authAside.points",
    authAside.points.map((p) => ({ label: p.label, icon: p.icon })),
  );

  /* ── Repeating lists ─────────────────────────────────────────────── */
  await replaceGroup(
    "announcement.left",
    announcement.left.map((i) => ({ label: i.label, icon: i.icon })),
  );
  await replaceGroup(
    "announcement.center",
    announcement.center.map((i) => ({ label: i.label, icon: i.icon })),
  );
  await replaceGroup(
    "nav.allCategories",
    allCategories.map((c) => ({ label: c.label, href: c.href, icon: c.icon })),
  );
  await replaceGroup(
    "hero.trust",
    heroTrust.map((t) => ({ label: t.label, icon: t.icon })),
  );
  await replaceGroup(
    "trust.features",
    trustFeatures.map((t) => ({ label: t.title, sublabel: t.subtitle, icon: t.icon })),
  );
  await replaceGroup(
    "footer.socials",
    footer.follow.socials.map((s) => ({
      label: s.name,
      href: s.href,
      icon: s.icon,
      extra: s.className,
    })),
  );
  await replaceGroup(
    "footer.payments",
    footer.payments.methods.map((m) => ({ label: m })),
  );
  await replaceGroup(
    "product.offers",
    productOffers.map((o) => ({ label: o.code, sublabel: o.description })),
  );
  await replaceGroup(
    "product.assurances",
    productAssurances.map((a) => ({ label: a.label, icon: a.icon })),
  );

  /* Footer link columns — one group per column, order preserved. */
  await prisma.contentItem.deleteMany({ where: { group: { startsWith: "footer.column" } } });
  for (const [colIndex, column] of footer.columns.entries()) {
    const group = `footer.column.${colIndex}`;
    const parent = await prisma.contentItem.create({
      data: { group, position: colIndex, label: column.title },
    });
    for (const [position, link] of column.links.entries()) {
      await prisma.contentItem.create({
        data: { group: `${group}.links`, position, label: link.label, href: link.href, parentId: parent.id },
      });
    }
  }

  /* Primary nav + mega menu — three levels via parentId. */
  await prisma.contentItem.deleteMany({ where: { group: { startsWith: "nav.primary" } } });
  for (const [position, item] of navItems.entries()) {
    const navRow = await prisma.contentItem.create({
      data: {
        group: "nav.primary",
        position,
        label: item.label,
        href: item.href,
        imageUrl: item.feature?.src,
        imageAlt: item.feature?.alt,
        // The mega-menu promo tile's copy travels with its nav item.
        sublabel: item.feature ? `${item.feature.title}|${item.feature.subtitle}` : null,
        extra: item.feature?.href,
      },
    });

    for (const [colPos, column] of (item.menu ?? []).entries()) {
      const colRow = await prisma.contentItem.create({
        data: {
          group: "nav.primary.column",
          position: colPos,
          label: column.title,
          parentId: navRow.id,
        },
      });
      for (const [linkPos, link] of column.links.entries()) {
        await prisma.contentItem.create({
          data: {
            group: "nav.primary.link",
            position: linkPos,
            label: link.label,
            href: link.href,
            parentId: colRow.id,
          },
        });
      }
    }
  }

  /* ── Homepage tiles on the existing Category rows ─────────────────── */
  for (const [position, tile] of categories.entries()) {
    await prisma.category.updateMany({
      where: { slug: tile.id },
      data: {
        shortTitle: tile.shortTitle,
        titleLine1: tile.titleLines[0],
        titleLine2: tile.titleLines[1],
        imageUrl: tile.src,
        imageAlt: tile.alt,
        position,
        showOnHome: true,
      },
    });
  }

  /* ── Hero slides + banners ────────────────────────────────────────── */
  await prisma.heroSlide.deleteMany({});
  for (const [position, slide] of heroSlides.entries()) {
    await prisma.heroSlide.create({
      data: {
        eyebrow: slide.eyebrow,
        titleLine1: slide.titleLines[0],
        titleLine2: slide.titleLines[1],
        description: slide.description,
        ctaLabel: slide.ctaLabel,
        ctaHref: slide.ctaHref,
        scriptWords: [...slide.script],
        imageUrl: slide.src,
        imageAlt: slide.alt,
        position,
      },
    });
  }

  const TONE = { dark: "DARK", light: "LIGHT", cream: "CREAM" } as const;

  await prisma.banner.deleteMany({});
  for (const [position, b] of promoBanners.entries()) {
    await prisma.banner.create({
      data: {
        placement: "PROMO",
        tone: TONE[b.tone],
        eyebrow: b.eyebrow,
        titleLine1: b.titleLines[0],
        titleLine2: b.titleLines[1] ?? "",
        description: b.description,
        ctaLabel: b.ctaLabel,
        ctaHref: b.ctaHref,
        imageUrl: b.src,
        imageAlt: b.alt,
        position,
      },
    });
  }
  for (const [position, b] of lifestyleBanners.entries()) {
    await prisma.banner.create({
      data: {
        placement: "LIFESTYLE",
        tone: TONE[b.tone],
        titleLine1: b.title,
        description: b.description,
        ctaLabel: b.ctaLabel,
        ctaHref: b.ctaHref,
        imageUrl: b.src,
        imageAlt: b.alt,
        position,
      },
    });
  }

  const [settings, items, slides, banners] = await Promise.all([
    prisma.siteSetting.count(),
    prisma.contentItem.count(),
    prisma.heroSlide.count(),
    prisma.banner.count(),
  ]);
  console.log(
    `Content seeded — ${settings} settings, ${items} content items, ${slides} hero slides, ${banners} banners.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
