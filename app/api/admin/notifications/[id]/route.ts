import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  return NextResponse.json(
    await prisma.notification.update({ where: { id }, data: { isRead: true } }),
  );
}
