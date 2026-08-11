import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  const percentOff = Number(body?.percentOff);
  const minOrder = Number(body?.minOrder);

  if (!code) return NextResponse.json({ error: "code is required" }, { status: 400 });
  if (!Number.isFinite(percentOff) || percentOff < 1 || percentOff > 100) {
    return NextResponse.json({ error: "percentOff must be between 1 and 100" }, { status: 400 });
  }
  if (!Number.isFinite(minOrder) || minOrder < 0) {
    return NextResponse.json({ error: "minOrder must be 0 or more" }, { status: 400 });
  }

  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) return NextResponse.json({ error: "That code already exists." }, { status: 409 });

  const coupon = await prisma.coupon.create({
    data: { code, percentOff: Math.round(percentOff), minOrder: Math.round(minOrder) },
  });
  return NextResponse.json(coupon, { status: 201 });
}
