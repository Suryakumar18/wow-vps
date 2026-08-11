import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { ORDER_STATUSES, isOrderStatus } from "@/app/admin/orderStatus";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = typeof body?.status === "string" ? body.status.toUpperCase() : "";

  if (!isOrderStatus(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${ORDER_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  const order = await prisma.order.update({ where: { id }, data: { status } });
  return NextResponse.json(order);
}
