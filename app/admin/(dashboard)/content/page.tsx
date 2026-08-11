import { prisma } from "@/app/server/prisma";
import AdminPageHeader from "../PageHeader";
import Tabs from "../Tabs";
import SettingsEditor from "./SettingsEditor";
import ContentGroupEditor from "./ContentGroupEditor";
import NavOverview from "./NavOverview";

/** Human-readable names for the content groups. */
const GROUP_LABELS: Record<string, string> = {
  "announcement.left": "Announcement bar — left",
  "announcement.center": "Announcement bar — centre",
  "hero.trust": "Hero — trust badges",
  "trust.features": "Trust strip",
  "footer.socials": "Footer — social links",
  "footer.payments": "Footer — payment badges",
  "product.offers": "Product page — offers",
  "product.assurances": "Product page — assurances",
  "authAside.points": "Sign-in page — bullet points",
};

/**
 * Which settings and content groups belong on which tab.
 *
 * Grouped by where a change shows up on the storefront rather than by how it
 * happens to be stored, so finding "the footer copy" doesn't require knowing
 * whether it lives in a setting or a content list.
 */
const TABS: { key: string; label: string; settingGroups: string[]; contentGroups: string[] }[] = [
  { key: "brand", label: "Brand", settingGroups: ["Brand"], contentGroups: [] },
  {
    key: "header",
    label: "Header",
    settingGroups: ["Announcement"],
    contentGroups: ["announcement.left", "announcement.center"],
  },
  {
    key: "home",
    label: "Home sections",
    settingGroups: ["Newsletter"],
    contentGroups: ["hero.trust", "trust.features"],
  },
  {
    key: "footer",
    label: "Footer",
    settingGroups: ["Footer"],
    contentGroups: ["footer.socials", "footer.payments"],
  },
  {
    key: "product",
    label: "Product page",
    settingGroups: [],
    contentGroups: ["product.offers", "product.assurances"],
  },
  {
    key: "auth",
    label: "Sign-in page",
    settingGroups: ["Auth page"],
    contentGroups: ["authAside.points"],
  },
];

export default async function AdminContentPage() {
  const [settings, items, categories] = await Promise.all([
    prisma.siteSetting.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] }),
    prisma.contentItem.findMany({ orderBy: [{ group: "asc" }, { position: "asc" }] }),
    prisma.category.findMany({
      orderBy: { position: "asc" },
      include: {
        subcategories: { orderBy: { position: "asc" }, include: { _count: { select: { products: true } } } },
        _count: { select: { products: true } },
      },
    }),
  ]);

  const toRows = (group: string) =>
    items
      .filter((i) => i.group === group)
      .map((i) => ({
        id: i.id,
        label: i.label ?? "",
        sublabel: i.sublabel ?? "",
        href: i.href ?? "",
        icon: i.icon ?? "",
        imageUrl: i.imageUrl ?? "",
        isActive: i.isActive,
      }));

  const toSettings = (groups: string[]) =>
    settings
      .filter((s) => groups.includes(s.group))
      .map((s) => ({ key: s.key, value: s.value, group: s.group, multiline: s.multiline }));

  return (
    <div>
      <AdminPageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Storefront", href: "/admin/homepage" },
          { label: "Content" },
        ]}
        title="Content"
        description="Every word, link, icon and image on the storefront. The layout stays fixed."
      />

      <Tabs
        tabs={[
          {
            key: "navigation",
            label: "Navigation",
            count: categories.length,
            content: (
              <NavOverview
                categories={categories.map((c) => ({
                  id: c.id,
                  name: c.name,
                  menuLabel: c.shortTitle || c.name,
                  slug: c.slug,
                  showInNav: c.showInNav,
                  productCount: c._count.products,
                  subcategories: c.subcategories.map((s) => ({
                    name: s.name,
                    slug: s.slug,
                    productCount: s._count.products,
                  })),
                }))}
              />
            ),
          },
          ...TABS.map((tab) => {
            const tabSettings = toSettings(tab.settingGroups);
            const groups = tab.contentGroups.filter((g) => items.some((i) => i.group === g));

            return {
              key: tab.key,
              label: tab.label,
              count: tabSettings.length + groups.reduce((n, g) => n + toRows(g).length, 0),
              content: (
                <div className="flex flex-col gap-6">
                  {tabSettings.length > 0 && <SettingsEditor initial={tabSettings} />}
                  {groups.map((group) => (
                    <ContentGroupEditor
                      key={group}
                      group={group}
                      title={GROUP_LABELS[group] ?? group}
                      initial={toRows(group)}
                    />
                  ))}
                </div>
              ),
            };
          }),
        ]}
      />
    </div>
  );
}
