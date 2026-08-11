import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { revalidateHomepage } from "@/app/server/revalidate";

const FIELDS = [
  "tone",
  "eyebrow",
  "titleLine1",
  "titleLine2",
  "description",
  "ctaLabel",
  "ctaHref",
  "imageUrl",
  "imageAlt",
  "position",
  "isActive",
] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const data: Record<string, unknown> = {};
  for (const field of FIELDS) if (body[field] !== undefined) data[field] = body[field];

  revalidateHomepage();
  return NextResponse.json(await prisma.banner.update({ where: { id }, data }));
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  await prisma.banner.delete({ where: { id } });
  revalidateHomepage();
  return NextResponse.json({ ok: true });
}
