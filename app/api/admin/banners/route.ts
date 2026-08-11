import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { revalidateHomepage } from "@/app/server/revalidate";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const placement = request.nextUrl.searchParams.get("placement");
  return NextResponse.json(
    await prisma.banner.findMany({
      where: placement ? { placement: placement as "PROMO" | "LIFESTYLE" } : undefined,
      orderBy: [{ placement: "asc" }, { position: "asc" }],
    }),
  );
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  if (!body?.placement || !body?.titleLine1) {
    return NextResponse.json({ error: "A placement and headline are required." }, { status: 400 });
  }

  const count = await prisma.banner.count({ where: { placement: body.placement } });
  const banner = await prisma.banner.create({
    data: {
      placement: body.placement,
      tone: body.tone ?? "DARK",
      eyebrow: body.eyebrow ?? null,
      titleLine1: body.titleLine1,
      titleLine2: body.titleLine2 ?? "",
      description: body.description ?? "",
      ctaLabel: body.ctaLabel || "Explore",
      ctaHref: body.ctaHref || "/category/all",
      imageUrl: body.imageUrl ?? "",
      imageAlt: body.imageAlt ?? "",
      position: body.position ?? count,
      isActive: body.isActive ?? true,
    },
  });
  revalidateHomepage();
  return NextResponse.json(banner, { status: 201 });
}
