import { NextRequest } from "next/server";
import webpush from "web-push";
import { connectDB } from "@/lib/db";
import PushSubscription from "@/lib/models/PushSubscription";

// Configuring web-push with empty keys throws synchronously, which would
// crash `next build` (it evaluates every route module to collect page data).
// Only configure it if both VAPID keys are actually present; otherwise the
// route degrades gracefully at request time instead of taking the build down.
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const vapidConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (vapidConfigured) {
  webpush.setVapidDetails(
    `mailto:${process.env.ADMIN_EMAIL || "admin@wowlifestyle.online"}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
} else {
  console.warn("Push notifications disabled: NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set.");
}

/** Called internally (server-to-server). Body: { userId, payload } */
export async function POST(req: NextRequest) {
  if (!vapidConfigured) {
    return Response.json({ success: false, message: "Push notifications are not configured on this server." }, { status: 503 });
  }
  await connectDB();
  try {
    const { userId, payload } = await req.json();

    const filter = userId ? { userId } : {};
    const subs = await PushSubscription.find(filter);

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
          JSON.stringify(payload)
        )
      )
    );

    // Remove stale subscriptions (410 Gone)
    const stale: string[] = [];
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        const err = r.reason as any;
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          stale.push(subs[i].endpoint);
        }
      }
    });
    if (stale.length) {
      await PushSubscription.deleteMany({ endpoint: { $in: stale } });
    }

    return Response.json({ success: true, sent: subs.length - stale.length });
  } catch (err) {
    console.error("Push send error:", err);
    return Response.json({ success: false, message: "Push send failed." }, { status: 500 });
  }
}
