import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { requireAdmin } from "@/lib/auth";
import { sendOrderConfirmation } from "@/lib/email";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;

  const { id } = await params;

  const order = await Order.findById(id);
  if (!order) return Response.json({ success: false, message: "Order not found" }, { status: 404 });

  if (order.paymentStatus === "SUCCESS") {
    return Response.json({ success: false, message: "Payment already verified." }, { status: 400 });
  }

  // Mark payment as verified
  order.paymentStatus = "SUCCESS";
  await order.save();

  // Deduct stock
  for (const item of order.items) {
    if (item.productId && item.productId !== "unknown") {
      try {
        const product = await Product.findById(item.productId);
        if (product) {
          const newStock = Math.max(0, (product.totalStock || 0) - item.quantity);
          await Product.updateOne(
            { _id: item.productId },
            { $set: { totalStock: newStock, availability: newStock === 0 ? "Out Of Stock" : product.availability } }
          );
        }
      } catch {}
    }
  }

  // Send confirmation email to customer
  if (order.contactEmail) {
    sendOrderConfirmation(order as any).catch(() => {});
  }

  return Response.json({ success: true, message: "UPI payment verified successfully." });
}
