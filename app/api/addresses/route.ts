import { NextRequest, NextResponse } from "next/server";
import { getAddressesDb, addAddressDb } from "@/app/server/addresses";
import type { NewAddressInput } from "@/app/components-home/lib/addresses";

export async function GET() {
  return NextResponse.json(await getAddressesDb());
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Partial<NewAddressInput> | null;
  if (!body?.fullName || !body.phone || !body.line1 || !body.city || !body.state || !body.pincode) {
    return NextResponse.json({ error: "Missing required address fields" }, { status: 400 });
  }
  const input: NewAddressInput = {
    label: body.label ?? "Address",
    fullName: body.fullName,
    phone: body.phone,
    line1: body.line1,
    city: body.city,
    state: body.state,
    pincode: body.pincode,
  };
  return NextResponse.json(await addAddressDb(input));
}
