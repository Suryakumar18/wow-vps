import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { revalidateStorefront } from "@/app/server/revalidate";

interface ProductPatch {
  title?: string;
  price?: number;
  originalPrice?: number;
  totalStock?: number;
  shippingFee?: number;
  gstPercent?: number;
  description?: string;
  richDescription?: string;
  categoryId?: string;
  subcategoryId?: string | null;
  brandId?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  isDeal?: boolean;
  aboutFeatures?: string[];
  idealFor?: string[];
  colors?: { name: string; hex: string; images: string[] }[];
  images?: string[];
  videos?: string[];
  specifications?: { label: string; value: string }[];
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as ProductPatch | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.product.update({
    where: { id },
    data: {
      title: body.title ?? undefined,
      price: body.price ?? undefined,
      originalPrice: body.originalPrice ?? undefined,
      totalStock: body.totalStock ?? undefined,
      shippingFee: body.shippingFee ?? undefined,
      gstPercent: body.gstPercent ?? undefined,
      description: body.description ?? undefined,
      richDescription: body.richDescription ?? undefined,
      categoryId: body.categoryId ?? undefined,
      subcategoryId: body.subcategoryId === undefined ? undefined : body.subcategoryId,
      brandId: body.brandId ?? undefined,
      isPublished: body.isPublished ?? undefined,
      isFeatured: body.isFeatured ?? undefined,
      isDeal: body.isDeal ?? undefined,
      aboutFeatures: body.aboutFeatures ?? undefined,
      idealFor: body.idealFor ?? undefined,
    },
  });

  // Images, videos and specs are positional lists, so they're replaced
  // wholesale rather than diffed — a reorder would otherwise need per-row
  // updates. The files themselves stay on the VPS; only the rows are rewritten.
  if (body.images) {
    await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.productImage.createMany({
      data: body.images.map((url, position) => ({ productId: id, url, position })),
    });
  }
  if (body.videos) {
    await prisma.productVideo.deleteMany({ where: { productId: id } });
    await prisma.productVideo.createMany({
      data: body.videos.map((url, position) => ({ productId: id, url, position })),
    });
  }
  if (body.specifications) {
    await prisma.productSpecification.deleteMany({ where: { productId: id } });
    await prisma.productSpecification.createMany({
      data: body.specifications.map((spec, position) => ({
        productId: id,
        label: spec.label,
        value: spec.value,
        position,
      })),
    });
  }
  if (body.colors) {
    // Replace-all: same pattern as images/specifications. Rows link only to
    // this product, so wholesale delete + recreate is safe and much simpler
    // than diffing colour rows by name (a rename would look like delete+add).
    await prisma.productColor.deleteMany({ where: { productId: id } });
    await prisma.productColor.createMany({
      data: body.colors.map((color, position) => ({
        productId: id,
        name: color.name,
        hex: color.hex,
        images: color.images,
        position,
      })),
    });
  }

  const fresh = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: "asc" } },
      videos: { orderBy: { position: "asc" } },
      specifications: { orderBy: { position: "asc" } },
      colors: { orderBy: { position: "asc" } },
    },
  });
  revalidateStorefront();
  return NextResponse.json(fresh);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  // A product referenced by a past order can't be deleted without rewriting
  // order history, so it's unpublished instead — the storefront stops showing
  // it while the order record stays intact.
  const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
  if (orderItemCount > 0) {
    await prisma.product.update({ where: { id }, data: { isPublished: false } });
    revalidateStorefront();
    return NextResponse.json({
      ok: true,
      unpublishedInstead: true,
      message: "This product appears in past orders, so it was unpublished rather than deleted.",
    });
  }

  await prisma.cartItem.deleteMany({ where: { productId: id } });
  await prisma.wishlistItem.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  revalidateStorefront();
  return NextResponse.json({ ok: true });
}
