import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { revalidateHomepage } from "@/app/server/revalidate";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const group = request.nextUrl.searchParams.get("group");
  return NextResponse.json(
    await prisma.contentItem.findMany({
      where: group ? { group } : undefined,
      orderBy: [{ group: "asc" }, { position: "asc" }],
    }),
  );
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  if (!body?.group) return NextResponse.json({ error: "A group is required." }, { status: 400 });

  const count = await prisma.contentItem.count({ where: { group: body.group } });
  const item = await prisma.contentItem.create({
    data: {
      group: body.group,
      position: body.position ?? count,
      label: body.label ?? null,
      sublabel: body.sublabel ?? null,
      href: body.href ?? null,
      icon: body.icon ?? null,
      imageUrl: body.imageUrl ?? null,
      imageAlt: body.imageAlt ?? null,
      extra: body.extra ?? null,
      parentId: body.parentId ?? null,
      isActive: body.isActive ?? true,
    },
  });
  revalidateHomepage();
  return NextResponse.json(item, { status: 201 });
}
