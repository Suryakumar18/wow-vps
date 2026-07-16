import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { notifyOrderPlaced } from "@/lib/push";

export async function GET(_: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  await connectDB();
  try {
    const { orderId } = await params;
    const order = await Order.findOne({ orderId });

    if (!order) {
      return Response.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    // UPI orders stay PENDING until admin verifies — don't auto-mark as SUCCESS
    if (order.paymentMethod === "upi") {
      return Response.json({
        success: true,
        isUpi:   true,
        status:  "UPI_PENDING",
        message: "UPI payment received. Awaiting verification.",
        orderId,
      });
    }

    // COD orders are already SUCCESS from initiate route
    if (order.paymentMethod === "cod") {
      return Response.json({
        success: true,
        status:  "SUCCESS",
        message: "COD order confirmed.",
        orderId,
      });
    }

    // PhonePe / other online — mark SUCCESS and deduct stock
    if (order.paymentStatus !== "SUCCESS") {
      order.paymentStatus = "SUCCESS";
      await order.save();

      for (const item of order.items) {
        if (item.productId && item.productId !== "unknown") {
          const product = await Product.findById(item.productId);
          if (product) {
            const newStock = Math.max(0, (product.totalStock || 0) - item.quantity);
            await Product.updateOne(
              { _id: item.productId },
              { $set: { totalStock: newStock, availability: newStock === 0 ? "Out Of Stock" : product.availability } }
            );
          }
        }
      }

      // Order is now confirmed — notify admin (navbar bell + push) + customer. Runs once
      // because the guard above flips paymentStatus to SUCCESS on the first successful check.
      notifyOrderPlaced(order as any).catch(() => {});
    }

    return Response.json({ success: true, status: "SUCCESS", message: "Payment verified.", orderId });
  } catch (err) {
    console.error("Payment status error:", err);
    return Response.json({ success: false, message: "Failed to check payment status." }, { status: 500 });
  }
}
