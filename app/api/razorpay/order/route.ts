import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

// Instantiated per request rather than at module load so a missing key at
// build time doesn't crash the whole app — checkout is the only path that
// needs it, and it can fail loudly there instead.
function getClient() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).");
  }
  return new Razorpay({ key_id, key_secret });
}

interface CreateOrderBody {
  amount: number;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as CreateOrderBody | null;
  if (!body || typeof body.amount !== "number" || body.amount <= 0) {
    return NextResponse.json({ error: "amount (in INR) is required" }, { status: 400 });
  }

  try {
    const client = getClient();
    const order = await client.orders.create({
      amount: Math.round(body.amount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });
    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Razorpay order creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
