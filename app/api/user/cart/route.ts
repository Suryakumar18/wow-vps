import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await connectDB();
  const result = requireAuth(req);
  if ("error" in result) return result.error;

  const user = await User.findById(result.user.id).select("+cart").populate("cart.productId");
  if (!user) return Response.json({ success: false, message: "User not found" }, { status: 404 });

  const formattedCart = (user.cart as any[])
    .filter((item: any) => item.productId !== null)
    .map((item: { productId: Record<string, unknown>; quantity: number }) => {
      const product = item.productId as Record<string, unknown>;
      return {
        id: product._id,
        title: product.title,
        price: product.price,
        brand: product.brand,
        category: product.category,
        image: Array.isArray(product.images) && (product.images as string[]).length > 0 ? (product.images as string[])[0] : "",
        quantity: item.quantity,
        totalStock: product.totalStock,
      };
    });

  return Response.json({ success: true, cart: formattedCart });
}
