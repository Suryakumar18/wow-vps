import { NextRequest, NextResponse } from "next/server";
import { getOrdersDb, createOrderDb } from "@/app/server/orders";
import type { CartItem } from "@/app/components-home/lib/CartContext";
import type { Address } from "@/app/components-home/lib/addresses";
import type { DeliveryMethodId, OrderTotals } from "@/app/components-home/lib/pricing";

export async function GET() {
  return NextResponse.json(await getOrdersDb());
}

interface CreateOrderBody {
  items: CartItem[];
  address: Address;
  deliveryMethod: DeliveryMethodId;
  paymentMethodLabel: string;
  totals: OrderTotals;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as CreateOrderBody | null;
  if (!body?.items?.length || !body.address || !body.deliveryMethod || !body.totals) {
    return NextResponse.json({ error: "Missing required order fields" }, { status: 400 });
  }
  const order = await createOrderDb(body);
  return NextResponse.json(order);
}
