import { NextRequest, NextResponse } from "next/server";
import { lookupOrdersByPhoneDb } from "@/app/server/orders";

interface LookupBody {
  phone?: string;
}

/**
 * Guest order lookup by phone. Called from /orders when the current session
 * has no orders — a customer coming back from a fresh browser (or a new
 * device) can still find orders they placed to a specific phone number.
 *
 * The security trade-off (anyone with the phone number can list the orders)
 * is documented in `lookupOrdersByPhoneDb` and is on par with legacy
 * phone-in support flows. Do NOT expose this route in an admin context or
 * without rate limiting in production.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as LookupBody | null;
  const phone = body?.phone?.trim();
  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }
  const digits = phone.replace(/\D+/g, "");
  if (digits.length < 8) {
    return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
  }
  const orders = await lookupOrdersByPhoneDb(phone);
  return NextResponse.json({ orders });
}
