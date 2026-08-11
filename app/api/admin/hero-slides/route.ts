import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { revalidateHomepage } from "@/app/server/revalidate";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(await prisma.heroSlide.findMany({ orderBy: { position: "asc" } }));
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  if (!body?.titleLine1 || !body?.imageUrl) {
    return NextResponse.json({ error: "A headline and an image are required." }, { status: 400 });
  }

  const count = await prisma.heroSlide.count();
  const slide = await prisma.heroSlide.create({
    data: {
      eyebrow: body.eyebrow ?? "",
      titleLine1: body.titleLine1,
      titleLine2: body.titleLine2 ?? "",
      description: body.description ?? "",
      ctaLabel: body.ctaLabel || "Shop Now",
      ctaHref: body.ctaHref || "/category/all",
      scriptWords: Array.isArray(body.scriptWords) ? body.scriptWords.slice(0, 3) : [],
      imageUrl: body.imageUrl,
      imageAlt: body.imageAlt ?? "",
      position: body.position ?? count,
      isActive: body.isActive ?? true,
    },
  });
  revalidateHomepage();
  return NextResponse.json(slide, { status: 201 });
}
