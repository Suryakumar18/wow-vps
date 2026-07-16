import webpush from "web-push";
import { connectDB } from "@/lib/db";
import PushSubscription from "@/lib/models/PushSubscription";
import Notification from "@/lib/models/Notification";
import User from "@/lib/models/User";

/*
 * Server-side web-push helpers. Call these directly from route handlers instead of
 * doing a self-`fetch` to /api/push/send (which needs a correct absolute base URL and
 * an extra network hop). Configuring web-push with empty VAPID keys throws, so we only
 * configure when both keys are present and degrade to a no-op otherwise.
 */

const VAPID_PUBLIC_KEY  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
export const vapidConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (vapidConfigured) {
  webpush.setVapidDetails(
    `mailto:${process.env.ADMIN_EMAIL || "admin@wowlifestyle.online"}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

const LOGO = "http://200.97.164.140/uploads/brands/wow-logo.svg";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
}

interface SubDoc {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Low-level: send to a set of subscription docs and prune stale ones. */
async function sendToSubs(subs: SubDoc[], payload: PushPayload): Promise<number> {
  if (!vapidConfigured || subs.length === 0) return 0;
  const body = JSON.stringify({ icon: LOGO, badge: LOGO, ...payload });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
        body
      )
    )
  );

  const stale: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const code = (r.reason as { statusCode?: number })?.statusCode;
      if (code === 410 || code === 404) stale.push(subs[i].endpoint);
    }
  });
  if (stale.length) await PushSubscription.deleteMany({ endpoint: { $in: stale } });

  return subs.length - stale.length;
}

/** Push to every subscription belonging to the given user ids. */
export async function sendPushToUserIds(userIds: (string | undefined | null)[], payload: PushPayload): Promise<number> {
  if (!vapidConfigured) return 0;
  await connectDB();
  const ids = userIds.map((id) => (id ? String(id) : "")).filter(Boolean);
  if (ids.length === 0) return 0;
  const subs = await PushSubscription.find({ userId: { $in: ids } }).lean<SubDoc[]>();
  return sendToSubs(subs, payload);
}

/** Push to every admin user's subscriptions. */
export async function sendPushToAdmins(payload: PushPayload): Promise<number> {
  if (!vapidConfigured) return 0;
  await connectDB();
  const admins = await User.find({ role: "admin" }).select("_id").lean<{ _id: unknown }[]>();
  const ids = admins.map((a) => String(a._id));
  return sendPushToUserIds(ids, payload);
}

interface OrderLike {
  orderId: string;
  totalAmount: number;
  paymentMethod?: string;
  userId?: unknown;
}

/**
 * Fired when an order is placed: stores a durable admin notification (for the navbar
 * bell), pushes to all admins, and pushes an order-confirmation to the customer.
 * All side effects are best-effort — never let a notification failure break checkout.
 */
export async function notifyOrderPlaced(order: OrderLike): Promise<void> {
  try {
    await connectDB();
    const amount = `₹${Number(order.totalAmount || 0).toLocaleString("en-IN")}`;
    const method = (order.paymentMethod || "").toUpperCase();
    const title = "🛒 New Order Received";
    const message = `Order ${order.orderId} • ${amount}${method ? ` • ${method}` : ""}`;

    // Durable record for the admin navbar.
    await Notification.create({
      audience: "admin",
      type: "order",
      title,
      message,
      orderId: order.orderId,
      url: "/admin/order-history",
    });

    // Live push to admins.
    sendPushToAdmins({
      title,
      body: message,
      tag: `admin-order-${order.orderId}`,
      url: "/admin/order-history",
    }).catch(() => {});

    // Order-confirmation push to the customer (if they're a logged-in, subscribed user).
    if (order.userId) {
      sendPushToUserIds([String(order.userId)], {
        title: "✅ Order Placed!",
        body: `Thank you! Your WOW Lifestyle order ${order.orderId} has been placed successfully.`,
        tag: `order-${order.orderId}`,
        url: "/orders",
      }).catch(() => {});
    }
  } catch (err) {
    console.error("notifyOrderPlaced failed:", err);
  }
}
