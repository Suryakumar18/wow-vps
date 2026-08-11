import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { getOrCreateSessionId } from "@/app/server/session";
import { getCurrentUser } from "@/app/server/auth";

/**
 * Customer reviews for one product.
 *
 * Submitting is open to everyone (a store this size lives on review volume),
 * with two honesty levers: one review per account/browser-session per
 * product, and a "Verified Buyer" stamp when the reviewer's account or
 * session has an order containing this product. Product.rating/numReviews
 * are recomputed from real reviews on every submission, replacing the
 * seeded showcase numbers as genuine feedback arrives.
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [reviews, agg] = await Promise.all([
    prisma.productReview.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, rating: true, body: true, name: true, isVerified: true, createdAt: true },
    }),
    prisma.productReview.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  return NextResponse.json({
    reviews,
    summary: { average: agg._avg.rating ?? 0, count: agg._count },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const rating = Number(body?.rating);
  const text = typeof body?.body === "string" ? body.body.trim() : "";

  if (name.length < 2) return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Pick a star rating." }, { status: 400 });
  }
  if (text.length < 5) {
    return NextResponse.json({ error: "Tell us a little more about the product." }, { status: 400 });
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: "Keep the review under 2000 characters." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [sessionId, user] = await Promise.all([getOrCreateSessionId(), getCurrentUser()]);

  const existing = await prisma.productReview.findFirst({
    where: {
      productId: product.id,
      OR: user ? [{ userId: user.id }, { sessionId }] : [{ sessionId }],
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You've already reviewed this product — thank you!" },
      { status: 409 },
    );
  }

  const purchase = await prisma.order.findFirst({
    where: {
      ...(user ? { OR: [{ userId: user.id }, { sessionId }] } : { sessionId }),
      items: { some: { productId: product.id } },
    },
    select: { id: true },
  });

  const review = await prisma.productReview.create({
    data: {
      productId: product.id,
      rating,
      body: text,
      name,
      isVerified: Boolean(purchase),
      userId: user?.id ?? null,
      sessionId,
    },
    select: { id: true, rating: true, body: true, name: true, isVerified: true, createdAt: true },
  });

  // Real reviews replace the seeded rating the moment they exist.
  const agg = await prisma.productReview.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: product.id },
    data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, numReviews: agg._count },
  });

  return NextResponse.json({ ok: true, review }, { status: 201 });
}
