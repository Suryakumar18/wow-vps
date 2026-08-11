import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { revalidateCatalog } from "@/app/server/revalidate";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const brand = await prisma.brand.update({ where: { id }, data: { name } });
  revalidateCatalog();
  return NextResponse.json(brand);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const productCount = await prisma.product.count({ where: { brandId: id } });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `This brand still has ${productCount} product(s). Move or delete them first.` },
      { status: 409 },
    );
  }

  await prisma.brand.delete({ where: { id } });
  revalidateCatalog();
  return NextResponse.json({ ok: true });
}
