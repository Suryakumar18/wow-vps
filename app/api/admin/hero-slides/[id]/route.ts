import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { revalidateHomepage } from "@/app/server/revalidate";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const slide = await prisma.heroSlide.update({
    where: { id },
    data: {
      ...(body.eyebrow !== undefined && { eyebrow: body.eyebrow }),
      ...(body.titleLine1 !== undefined && { titleLine1: body.titleLine1 }),
      ...(body.titleLine2 !== undefined && { titleLine2: body.titleLine2 }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.ctaLabel !== undefined && { ctaLabel: body.ctaLabel }),
      ...(body.ctaHref !== undefined && { ctaHref: body.ctaHref }),
      ...(Array.isArray(body.scriptWords) && { scriptWords: body.scriptWords.slice(0, 3) }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
      ...(body.imageAlt !== undefined && { imageAlt: body.imageAlt }),
      ...(body.position !== undefined && { position: body.position }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });
  revalidateHomepage();
  return NextResponse.json(slide);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  await prisma.heroSlide.delete({ where: { id } });
  revalidateHomepage();
  return NextResponse.json({ ok: true });
}
