import { NextResponse } from "next/server";
import { getActiveOffer } from "@/app/server/offer";

/** The active offer, shaped for the storefront's announcement popup. */
export async function GET() {
  const offer = await getActiveOffer();
  return NextResponse.json({
    offer: offer
      ? {
          id: offer.id,
          title: offer.title,
          percent: offer.percent,
          couponCode: offer.couponCode,
          imageUrl: offer.imageUrl,
          // The popup only needs to know whether the sale is storewide.
          scope: offer.productIds.length > 0 ? "selected" : "all",
        }
      : null,
  });
}
