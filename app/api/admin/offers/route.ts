import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const offers = await prisma.offer.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ offers });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const percent = Number(body?.percent);
  const couponCode =
    typeof body?.couponCode === "string" && body.couponCode.trim()
      ? body.couponCode.trim().toUpperCase()
      : null;
  const imageUrl =
    typeof body?.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : null;
  // Product cuids the offer covers; empty means the whole store.
  const productIds = Array.isArray(body?.productIds)
    ? body.productIds.filter((id: unknown): id is string => typeof id === "string").slice(0, 500)
    : [];

  if (title.length < 3) {
    return NextResponse.json({ error: "Give the offer a name (e.g. Aadi Offer)." }, { status: 400 });
  }
  if (!Number.isInteger(percent) || percent < 1 || percent > 90) {
    return NextResponse.json({ error: "Discount must be between 1 and 90 percent." }, { status: 400 });
  }

  const offer = await prisma.offer.create({
    data: { title, percent, couponCode, imageUrl, productIds },
  });
  return NextResponse.json({ ok: true, offer }, { status: 201 });
}
