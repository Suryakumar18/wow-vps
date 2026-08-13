import { NextRequest, NextResponse } from "next/server";
import { getAddressesDb, addAddressDb, updateAddressDb } from "@/app/server/addresses";
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

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | (Partial<NewAddressInput> & { id?: string })
    | null;

  if (!body?.id) {
    return NextResponse.json({ error: "Missing address id" }, { status: 400 });
  }
  if (!body.fullName || !body.phone || !body.line1 || !body.city || !body.state || !body.pincode) {
    return NextResponse.json({ error: "Missing required address fields" }, { status: 400 });
  }

  const { addresses, updated } = await updateAddressDb(body.id, {
    label: body.label ?? "Address",
    fullName: body.fullName,
    phone: body.phone,
    line1: body.line1,
    city: body.city,
    state: body.state,
    pincode: body.pincode,
  });

  // No row matched: either the id is unknown or it belongs to somebody else.
  // Same answer for both, so this can't be used to probe for valid ids.
  if (!updated) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }
  return NextResponse.json(addresses);
}
