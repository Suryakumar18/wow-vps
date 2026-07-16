import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/lib/models/Notification";
import { requireAdmin } from "@/lib/auth";

/** GET → recent admin notifications + unread count (newest first). */
export async function GET(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;

  const [items, unreadCount] = await Promise.all([
    Notification.find({ audience: "admin" }).sort({ createdAt: -1 }).limit(30).lean(),
    Notification.countDocuments({ audience: "admin", read: false }),
  ]);

  return Response.json({ success: true, data: items, unreadCount });
}

/**
 * PATCH → mark notifications read.
 * Body: { ids: string[] } to mark specific ones, or { all: true } to mark all read.
 */
export async function PATCH(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;

  const body = await req.json().catch(() => ({}));
  const { ids, all } = body as { ids?: string[]; all?: boolean };

  const filter = all
    ? { audience: "admin", read: false }
    : { audience: "admin", _id: { $in: Array.isArray(ids) ? ids : [] } };

  await Notification.updateMany(filter, { $set: { read: true } });
  const unreadCount = await Notification.countDocuments({ audience: "admin", read: false });

  return Response.json({ success: true, unreadCount });
}
