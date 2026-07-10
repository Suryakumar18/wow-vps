import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import PushSubscription from "@/lib/models/PushSubscription";

export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const body = await req.json();
    const { subscription, userId } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return Response.json({ success: false, message: "Invalid subscription object." }, { status: 400 });
    }

    // Upsert — update userId if it changes, keep unique by endpoint
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        endpoint: subscription.endpoint,
        keys:     subscription.keys,
        userId:   userId || null,
      },
      { upsert: true, new: true }
    );

    return Response.json({ success: true, message: "Subscribed to push notifications." });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return Response.json({ success: false, message: "Failed to save subscription." }, { status: 500 });
  }
}
