import { NextRequest, NextResponse } from "next/server";
import { getWishlistIds, addToWishlist } from "@/app/server/wishlist";

export async function GET() {
  return NextResponse.json(await getWishlistIds());
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : null;
  if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });
  return NextResponse.json(await addToWishlist(productId));
}
