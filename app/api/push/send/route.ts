import { NextRequest } from "next/server";
import webpush from "web-push";
import { connectDB } from "@/lib/db";
import PushSubscription from "@/lib/models/PushSubscription";

webpush.setVapidDetails(
  `mailto:${process.env.ADMIN_EMAIL || "admin@wowlifestyle.online"}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY  || "",
  process.env.VAPID_PRIVATE_KEY             || ""
);

/** Called internally (server-to-server). Body: { userId, payload } */
export async function POST(req: NextRequest) {
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
