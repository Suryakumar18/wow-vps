import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import { requireAdmin } from "@/lib/auth";
import { sendOrderStatusUpdate } from "@/lib/email";

const VALID_STATUSES = ["Processing", "Shipped", "Delivered", "Cancelled"];

/* Status → push notification copy */
const STATUS_PUSH: Record<string, { title: string; body: string; icon?: string }> = {
  Processing: {
    title: "🛒 Order Confirmed!",
    body:  "Your WOW Lifestyle order is being processed and will be shipped soon.",
  },
  Shipped: {
    title: "🚚 Your order is on the way!",
    body:  "Great news! Your WOW Lifestyle order has been shipped. Track it in My Orders.",
  },
  Delivered: {
    title: "✅ Order Delivered!",
    body:  "Your WOW Lifestyle order has been delivered. We hope you love it!",
  },
  Cancelled: {
    title: "❌ Order Cancelled",
    body:  "Your WOW Lifestyle order has been cancelled. Contact us if you have questions.",
  },
};

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;

  const { id }     = await params;
  const { status } = await req.json();

  if (!VALID_STATUSES.includes(status)) {
    return Response.json(
      { success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const order = await Order.findByIdAndUpdate(id, { orderStatus: status }, { new: true });
  if (!order) return Response.json({ success: false, message: "Order not found" }, { status: 404 });

  // ── Email notification (non-blocking) ────────────────────────────────────────
  if (order.contactEmail) {
    sendOrderStatusUpdate({
      orderId:         order.orderId,
      contactEmail:    order.contactEmail,
      totalAmount:     order.totalAmount,
      orderStatus:     status,
      shippingAddress: order.shippingAddress as any,
    }).catch(() => {});
  }

  // ── Push notification (non-blocking) ─────────────────────────────────────────
  const push = STATUS_PUSH[status];
  if (push && order.userId) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    fetch(`${baseUrl}/api/push/send`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: String(order.userId),
        payload: {
          title:  push.title,
          body:   push.body,
          icon:   "http://200.97.164.140/uploads/brands/wow-logo.svg",
          badge:  "http://200.97.164.140/uploads/brands/wow-logo.svg",
          tag:    `order-${order.orderId}`,
          url:    "/orders",
        },
      }),
    }).catch(() => {});
  }

  return Response.json({ success: true, message: `Order marked as ${status}`, data: order });
}
