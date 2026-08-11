import { NextResponse } from "next/server";
import { getWishlistProducts } from "@/app/server/wishlist";

export async function GET() {
  return NextResponse.json(await getWishlistProducts());
}
