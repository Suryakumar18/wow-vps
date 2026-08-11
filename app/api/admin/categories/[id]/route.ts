import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { revalidateStorefront } from "@/app/server/revalidate";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const data: Record<string, unknown> = {};

  // `name` is only validated when the caller is actually changing it — the
  // homepage tile editor patches presentation fields and sends no name.
  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    data.name = name;
  }

  for (const field of ["shortTitle", "titleLine1", "titleLine2", "imageUrl", "imageAlt"] as const) {
    if (body[field] !== undefined) data[field] = String(body[field]);
  }
  if (body.position !== undefined) data.position = Number(body.position) || 0;
  if (body.showOnHome !== undefined) data.showOnHome = Boolean(body.showOnHome);
  if (body.showInNav !== undefined) data.showInNav = Boolean(body.showInNav);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const category = await prisma.category.update({ where: { id }, data });
  revalidateStorefront();
  return NextResponse.json(category);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `This category still has ${productCount} product(s). Move or delete them first.` },
      { status: 409 },
    );
  }

  await prisma.category.delete({ where: { id } });
  revalidateStorefront();
  return NextResponse.json({ ok: true });
}
