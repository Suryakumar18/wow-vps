import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createOrderDb, getOrderByPaymentIdDb } from "@/app/server/orders";
import type { CartItem } from "@/app/components-home/lib/CartContext";
import type { Address } from "@/app/components-home/lib/addresses";
import type { DeliveryMethodId, OrderTotals } from "@/app/components-home/lib/pricing";

interface VerifyBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order: {
    items: CartItem[];
    address: Address;
    deliveryMethod: DeliveryMethodId;
    paymentMethodLabel: string;
    totals: OrderTotals;
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as VerifyBody | null;
  if (
    !body?.razorpay_order_id ||
    !body?.razorpay_payment_id ||
    !body?.razorpay_signature ||
    !body?.order?.items?.length ||
    !body?.order?.address ||
    !body?.order?.deliveryMethod ||
    !body?.order?.totals
  ) {
    return NextResponse.json({ error: "Missing required verify fields" }, { status: 400 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Razorpay secret not configured" }, { status: 500 });
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
    .digest("hex");

  // timingSafeEqual guards against a signature-comparison timing side-channel;
  // an attacker could otherwise fake a payment by discovering the signature
  // one character at a time from response-time deltas.
  const expectedBuf = Buffer.from(expected, "hex");
  const gotBuf = Buffer.from(body.razorpay_signature, "hex");
  if (expectedBuf.length !== gotBuf.length || !crypto.timingSafeEqual(expectedBuf, gotBuf)) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  // Idempotency: the client retries verification if the first response was
  // lost after the charge succeeded. If that first attempt already wrote the
  // order, hand the same order back instead of creating a duplicate (and
  // re-sending its notifications).
  const existing = await getOrderByPaymentIdDb(body.razorpay_payment_id);
  if (existing) return NextResponse.json(existing);

  const order = await createOrderDb({
    ...body.order,
    razorpayOrderId: body.razorpay_order_id,
    razorpayPaymentId: body.razorpay_payment_id,
  });
  return NextResponse.json(order);
}
