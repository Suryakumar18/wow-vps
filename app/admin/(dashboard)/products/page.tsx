import { Plus } from "lucide-react";
import { prisma } from "@/app/server/prisma";
import Button from "@/app/components-home/ui/Button";
import { formatPrice } from "@/app/components-home/lib/format";
import { Prisma } from "@/app/generated/prisma/client";
import AdminPageHeader from "../PageHeader";
import ProductFilters from "./ProductFilters";
import ProductsTable, { type ProductRow } from "./ProductsTable";
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from "../pagination-config";

const LOW_STOCK = 10;

/** Turns the URL's filter params into a Prisma `where` clause. */
function buildWhere(params: Record<string, string | undefined>): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  if (params.q) {
    // Brand and category are searchable too, so "drone" or "BrickWorks" finds
    // the right rows without the word appearing in a product title.
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { slug: { contains: params.q, mode: "insensitive" } },
      { brand: { name: { contains: params.q, mode: "insensitive" } } },
      { category: { name: { contains: params.q, mode: "insensitive" } } },
    ];
  }
  if (params.category) where.categoryId = params.category;
  if (params.brand) where.brandId = params.brand;

  switch (params.status) {
    case "published":
      where.isPublished = true;
      break;
    case "hidden":
      where.isPublished = false;
      break;
    case "featured":
      where.isFeatured = true;
      break;
    case "deal":
      where.isDeal = true;
      break;
    case "out":
      where.totalStock = { lte: 0 };
      break;
    case "low":
      where.totalStock = { gt: 0, lte: LOW_STOCK };
      break;
  }

  return where;
}

/** Whitelisted so a hand-edited `?sort=` can't reach an arbitrary column. */
const SORTS: Record<string, (dir: Prisma.SortOrder) => Prisma.ProductOrderByWithRelationInput> = {
  title: (dir) => ({ title: dir }),
  price: (dir) => ({ price: dir }),
  stock: (dir) => ({ totalStock: dir }),
  category: (dir) => ({ category: { name: dir } }),
  brand: (dir) => ({ brand: { name: dir } }),
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  ) as Record<string, string | undefined>;

  const where = buildWhere(params);
  const hasFilters = Boolean(params.q || params.category || params.brand || params.status);

  const dir: Prisma.SortOrder = params.dir === "desc" ? "desc" : "asc";
  const orderBy = params.sort && SORTS[params.sort] ? SORTS[params.sort](dir) : { createdAt: "desc" as const };

  const requestedSize = Number(params.pageSize);
  const pageSize = (PAGE_SIZES as readonly number[]).includes(requestedSize)
    ? requestedSize
    : DEFAULT_PAGE_SIZE;
  const page = Math.max(1, Number(params.page) || 1);

  const [products, matching, stats, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        brand: true,
        category: true,
        // First image only — the table thumbnail shows the primary shot.
        images: { orderBy: { position: "asc" }, take: 1 },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
    Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isPublished: true } }),
      prisma.product.count({ where: { totalStock: { gt: 0, lte: LOW_STOCK } } }),
      prisma.product.count({ where: { totalStock: { lte: 0 } } }),
      prisma.product.aggregate({ _sum: { price: true } }),
    ]),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const [total, published, lowStock, outOfStock, priceAgg] = stats;

  const rows: ProductRow[] = products.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    image: p.images[0]?.url ?? null,
    categoryName: p.category.name,
    brandName: p.brand.name,
    price: p.price,
    totalStock: p.totalStock,
    isPublished: p.isPublished,
    isFeatured: p.isFeatured,
    isDeal: p.isDeal,
  }));

  const cards = [
    { label: "Total products", value: String(total) },
    { label: "Published", value: String(published) },
    { label: "Low stock", value: String(lowStock) },
    { label: "Out of stock", value: String(outOfStock) },
    { label: "Catalogue value", value: formatPrice(priceAgg._sum.price ?? 0) },
  ];

  return (
    <div>
      <AdminPageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Inventory", href: "/admin/products" },
          { label: "Products" },
        ]}
        title="Products"
        description={
          hasFilters
            ? `${matching} of ${total} products match your filters`
            : `${total} product${total === 1 ? "" : "s"} in the catalogue`
        }
        actions={
          <Button href="/admin/products/new" size="sm">
            <Plus size={15} aria-hidden="true" />
            Add Product
          </Button>
        }
      />

      <ul className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <li key={card.label} className="rounded-xl border border-line bg-white p-4">
            <p className="text-nano font-bold uppercase tracking-[0.14em] text-slate-500">
              {card.label}
            </p>
            <p className="mt-1.5 text-promo font-bold tabular-nums text-ink">{card.value}</p>
          </li>
        ))}
      </ul>

      <ProductFilters categories={categories} brands={brands} />

      <ProductsTable
        rows={rows}
        page={page}
        pageSize={pageSize}
        total={matching}
        hasFilters={hasFilters}
      />
    </div>
  );
}
