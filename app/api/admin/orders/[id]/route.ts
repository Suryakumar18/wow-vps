import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/prisma";
import { requireAdmin } from "@/app/server/adminGuard";
import { ORDER_STATUSES, isOrderStatus } from "@/app/admin/orderStatus";
import { sendOrderStatusWhatsApp } from "@/app/server/whatsapp";

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

  const before = await prisma.order.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const order = await prisma.order.update({ where: { id }, data: { status } });

  // Tell the customer their order moved — shipped/delivered/cancelled are the
  // moments they care about. Never blocks or fails the status change.
  if (
    before.status !== order.status &&
    (status === "SHIPPED" || status === "DELIVERED" || status === "CANCELLED")
  ) {
    await sendOrderStatusWhatsApp({
      phone: order.addressPhone,
      orderNumber: order.orderNumber,
      status,
      name: order.addressName,
    });
  }

  return NextResponse.json(order);
}
