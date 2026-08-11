import { NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.notification.count({ where: { isRead: false } }),
  ]);
  return NextResponse.json({ items, unread });
}

/** Marks everything read — the "mark all as read" action on the bell. */
export async function PATCH() {
  const denied = await requireAdmin();
  if (denied) return denied;

  await prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } });
  return NextResponse.json({ ok: true });
}
