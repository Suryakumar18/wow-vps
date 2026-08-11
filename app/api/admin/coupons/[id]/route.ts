import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);

  const data: { active?: boolean; percentOff?: number; minOrder?: number } = {};
  if (typeof body?.active === "boolean") data.active = body.active;
  if (body?.percentOff != null) {
    const percentOff = Number(body.percentOff);
    if (!Number.isFinite(percentOff) || percentOff < 1 || percentOff > 100) {
      return NextResponse.json({ error: "percentOff must be between 1 and 100" }, { status: 400 });
    }
    data.percentOff = Math.round(percentOff);
  }
  if (body?.minOrder != null) {
    const minOrder = Number(body.minOrder);
    if (!Number.isFinite(minOrder) || minOrder < 0) {
      return NextResponse.json({ error: "minOrder must be 0 or more" }, { status: 400 });
    }
    data.minOrder = Math.round(minOrder);
  }

  const coupon = await prisma.coupon.update({ where: { id }, data });
  return NextResponse.json(coupon);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
