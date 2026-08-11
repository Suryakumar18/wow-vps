import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";

export interface AddressSuggestion {
  label: string;
  name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  /** Preformatted single line for display on the suggestion card. */
  line: string;
}

/**
 * Previous delivery addresses for a phone number, mined from past orders.
 *
 * Guest checkout asks for the mobile number first; if that number has ordered
 * before, its shipping address comes back here so the customer taps once
 * instead of re-typing everything. Same trust model as the order lookup on
 * /orders: knowing a phone number reveals where it had orders shipped.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const raw = typeof body?.phone === "string" ? body.phone : "";
  const digits = raw.replace(/\D+/g, "");
  if (digits.length < 10) {
    return NextResponse.json({ error: "Enter a valid mobile number." }, { status: 400 });
  }
  const trail = digits.slice(-10);

  const rows = await prisma.order.findMany({
    where: { addressPhone: { contains: trail } },
    orderBy: { placedAt: "desc" },
    take: 20,
    select: { addressLabel: true, addressName: true, addressLine: true, addressPhone: true },
  });

  // Newest first, one suggestion per distinct address line, max three. Lines
  // not in this app's own composed format ("line1, city - pincode, state")
  // can't prefill the structured form, so they're skipped.
  const seen = new Set<string>();
  const suggestions: AddressSuggestion[] = [];
  for (const row of rows) {
    if (seen.has(row.addressLine) || suggestions.length >= 3) continue;
    seen.add(row.addressLine);

    const match = row.addressLine.match(/^(.+),\s*([^,]+?)\s*-\s*(\d{6}),\s*([^,]+)$/);
    if (!match) continue;
    const [, line1, city, pincode, state] = match;

    suggestions.push({
      label: row.addressLabel || "Home",
      name: row.addressName ?? "",
      phone: row.addressPhone,
      line1: line1.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode,
      line: row.addressLine,
    });
  }

  return NextResponse.json({ suggestions });
}
