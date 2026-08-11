import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumberForPhoneDb, getOrderDb } from "@/app/server/orders";

export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  // Session-scoped lookup first — the browser that placed the order owns it
  // by default and needs no extra proof.
  const own = await getOrderDb(orderId);
  if (own) return NextResponse.json(own);

  // Fallback: caller passed a phone number (from the guest lookup on /orders)
  // and the order's shipping-address phone matches. Same posture as the
  // /api/orders/lookup route.
  const phone = request.nextUrl.searchParams.get("phone");
  if (phone) {
    const byPhone = await getOrderByNumberForPhoneDb(orderId, phone);
    if (byPhone) return NextResponse.json(byPhone);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
