import { NextRequest, NextResponse } from "next/server";
import { getProductDb } from "@/app/server/catalog";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductDb(slug);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}
