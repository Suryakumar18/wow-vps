import { NextRequest, NextResponse } from "next/server";
import { getRelatedDb } from "@/app/server/catalog";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 8);
  const related = await getRelatedDb(slug, limit);
  return NextResponse.json(related);
}
