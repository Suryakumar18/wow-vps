import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { revalidateCatalog } from "@/app/server/revalidate";

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const existing = await prisma.brand.findUnique({ where: { name } });
  if (existing) return NextResponse.json({ error: "That brand already exists." }, { status: 409 });

  const brand = await prisma.brand.create({ data: { name } });
  revalidateCatalog();
  return NextResponse.json(brand, { status: 201 });
}
