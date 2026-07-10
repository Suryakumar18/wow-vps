import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await connectDB();
  const result = requireAuth(req);
  if ("error" in result) return result.error;

  const { cartItems } = await req.json();
  if (!cartItems || !Array.isArray(cartItems)) {
    return Response.json({ success: false, message: "Invalid cart data" }, { status: 400 });
  }

  const mappedCart = cartItems.map((item: { id?: string; productId?: string; quantity?: number }) => ({
    productId: item.id || item.productId,
    quantity: item.quantity || 1,
  }));

  const updatedUser = await User.findByIdAndUpdate(result.user.id, { $set: { cart: mappedCart } }, { new: true });
  if (!updatedUser) return Response.json({ success: false, message: "User not found" }, { status: 404 });

  return Response.json({ success: true, message: "Cart synced to database successfully" });
}
