import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { revalidateStorefront } from "@/app/server/revalidate";
import { Prisma } from "@/app/generated/prisma/client";

interface ProductBody {
  slug?: string;
  title?: string;
  price?: number;
  originalPrice?: number;
  totalStock?: number;
  shippingFee?: number;
  gstPercent?: number;
  description?: string;
  categoryId?: string;
  subcategoryId?: string | null;
  brandId?: string;
  isPublished?: boolean;
  aboutFeatures?: string[];
  idealFor?: string[];
  colors?: { name: string; hex: string; images: string[] }[];
  images?: string[];
  videos?: string[];
  specifications?: { label: string; value: string }[];
}

/** The columns a picker row shows — never the whole product. */
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

/**
 * Searchable product list for admin pickers.
 *
 * Exists so the Homepage screen can stop loading the entire catalogue. It used
 * to hand every published product to the browser and filter them in a `useMemo`
 * — fine at fourteen products, three thousand rows of JSON and six thousand DOM
 * nodes at the real size.
 *
 *   ?q=          free text over title, slug, brand and department
 *   ?category=   department id
 *   ?selected=   `isFeatured` | `isDeal` — only products carrying that flag
 *   ?limit=      capped at 100
 */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const sp = request.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const categoryId = sp.get("category") || undefined;
  const selected = sp.get("selected");
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 50));

  const where: Prisma.ProductWhereInput = { isPublished: true };
  if (categoryId) where.categoryId = categoryId;
  if (selected === "isFeatured") where.isFeatured = true;
  if (selected === "isDeal") where.isDeal = true;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { brand: { name: { contains: q, mode: "insensitive" } } },
      { category: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const rows = await prisma.product.findMany({
    where,
    // No `take` when listing what's already selected: those are the rows the
    // homepage will actually render, and silently truncating them would make
    // the picker disagree with the storefront.
    ...(selected ? {} : { take: limit }),
    orderBy: { title: "asc" },
    select: pickerSelect,
  });

  return NextResponse.json({
    products: rows.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      categoryName: p.category.name,
      brandName: p.brand.name,
      isFeatured: p.isFeatured,
      isDeal: p.isDeal,
    })),
  });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as ProductBody | null;
  if (!body?.slug || !body.title || !body.categoryId || !body.brandId) {
    return NextResponse.json(
      { error: "slug, title, categoryId and brandId are required" },
      { status: 400 },
    );
  }

  const existing = await prisma.product.findUnique({ where: { slug: body.slug } });
  if (existing) return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });

  const product = await prisma.product.create({
    data: {
      slug: body.slug,
      title: body.title,
      price: body.price ?? 0,
      originalPrice: body.originalPrice ?? body.price ?? 0,
      totalStock: body.totalStock ?? 0,
      shippingFee: body.shippingFee ?? 0,
      gstPercent: body.gstPercent ?? 0,
      description: body.description ?? "",
      categoryId: body.categoryId,
      subcategoryId: body.subcategoryId ?? null,
      brandId: body.brandId,
      isPublished: body.isPublished ?? true,
      aboutFeatures: body.aboutFeatures ?? [],
      idealFor: body.idealFor ?? [],
      colors: {
        create: (body.colors ?? []).map((c, position) => ({
          name: c.name,
          hex: c.hex,
          images: c.images,
          position,
        })),
      },
      images: { create: (body.images ?? []).map((url, position) => ({ url, position })) },
      videos: { create: (body.videos ?? []).map((url, position) => ({ url, position })) },
      specifications: {
        create: (body.specifications ?? []).map((spec, position) => ({
          label: spec.label,
          value: spec.value,
          position,
        })),
      },
    },
  });

  revalidateStorefront();
  return NextResponse.json(product, { status: 201 });
}
