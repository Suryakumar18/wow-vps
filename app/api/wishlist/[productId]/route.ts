import { NextRequest, NextResponse } from "next/server";
import { removeFromWishlist } from "@/app/server/wishlist";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  return NextResponse.json(await removeFromWishlist(productId));
}
