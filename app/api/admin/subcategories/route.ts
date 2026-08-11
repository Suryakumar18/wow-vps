import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { revalidateCatalog } from "@/app/server/revalidate";

const slugify = (v: string) =>
  v.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const categoryId = request.nextUrl.searchParams.get("categoryId");
  return NextResponse.json(
    await prisma.subcategory.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: [{ categoryId: "asc" }, { position: "asc" }],
      include: { _count: { select: { products: true } } },
    }),
  );
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const categoryId = typeof body?.categoryId === "string" ? body.categoryId : "";
  if (!name || !categoryId) {
    return NextResponse.json({ error: "A name and category are required." }, { status: 400 });
  }

  const slug = body.slug ? slugify(String(body.slug)) : slugify(name);
  const clash = await prisma.subcategory.findUnique({
    where: { categoryId_slug: { categoryId, slug } },
  });
  if (clash) {
    return NextResponse.json(
      { error: `“${name}” already exists in this category.` },
      { status: 409 },
    );
  }

  const count = await prisma.subcategory.count({ where: { categoryId } });
  const subcategory = await prisma.subcategory.create({
    data: { name, slug, categoryId, position: count },
  });
  revalidateCatalog();
  return NextResponse.json(subcategory, { status: 201 });
}
