import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { revalidateCatalog } from "@/app/server/revalidate";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "A name is required." }, { status: 400 });
    data.name = name;
  }
  if (body.position !== undefined) data.position = Number(body.position) || 0;
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  revalidateCatalog();
  return NextResponse.json(await prisma.subcategory.update({ where: { id }, data }));
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  // Products aren't deleted with it — they fall back to their department,
  // which is why `subcategoryId` is nullable with onDelete: SetNull.
  const productCount = await prisma.product.count({ where: { subcategoryId: id } });
  await prisma.subcategory.delete({ where: { id } });

  revalidateCatalog();
  return NextResponse.json({ ok: true, releasedProducts: productCount });
}
