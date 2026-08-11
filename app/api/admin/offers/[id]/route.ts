import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { revalidateStorefront } from "@/app/server/revalidate";

/**
 * Activate/deactivate or edit an offer. Prices across the storefront change
 * with the active flag, so every write here revalidates the prerendered
 * pages — otherwise the homepage would keep showing yesterday's prices for
 * up to an hour.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.isActive === true) {
    // Only one sale at a time — switching this one on switches the rest off.
    await prisma.$transaction([
      prisma.offer.updateMany({ where: { NOT: { id } }, data: { isActive: false } }),
      prisma.offer.update({ where: { id }, data: { isActive: true } }),
    ]);
  } else if (body.isActive === false) {
    await prisma.offer.update({ where: { id }, data: { isActive: false } });
  }

  const data: { title?: string; percent?: number; couponCode?: string | null } = {};
  if (typeof body.title === "string" && body.title.trim().length >= 3) data.title = body.title.trim();
  if (Number.isInteger(Number(body.percent)) && body.percent >= 1 && body.percent <= 90) {
    data.percent = Number(body.percent);
  }
  if (typeof body.couponCode === "string") {
    data.couponCode = body.couponCode.trim() ? body.couponCode.trim().toUpperCase() : null;
  }
  if (Object.keys(data).length > 0) await prisma.offer.update({ where: { id }, data });

  const fresh = await prisma.offer.findUnique({ where: { id } });
  revalidateStorefront();
  return NextResponse.json({ ok: true, offer: fresh });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  await prisma.offer.delete({ where: { id } }).catch(() => {});
  revalidateStorefront();
  return NextResponse.json({ ok: true });
}
