import { NextResponse } from "next/server";
import { getActiveOffer } from "@/app/server/offer";

/** The active sitewide offer, for the storefront's announcement popup. */
export async function GET() {
  return NextResponse.json({ offer: await getActiveOffer() });
}
