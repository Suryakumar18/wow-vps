import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { revalidateStorefront } from "@/app/server/revalidate";

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!slug || !name) return NextResponse.json({ error: "slug and name are required" }, { status: 400 });

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });

  const category = await prisma.category.create({ data: { slug, name } });
  revalidateStorefront();
  return NextResponse.json(category, { status: 201 });
}
