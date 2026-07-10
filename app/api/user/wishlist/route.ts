import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import "@/lib/models/Product";
import { requireAuth } from "@/lib/auth";

// GET — list wishlist product ids (?populate=1 to include product docs)
export async function GET(req: NextRequest) {
  await connectDB();
  const result = requireAuth(req);
  if ("error" in result) return result.error;

  const populate = new URL(req.url).searchParams.get("populate");
  const query = User.findById(result.user.id).select("+wishlist");
  if (populate) query.populate("wishlist");
  const user = await query;
  if (!user) return Response.json({ success: false, message: "User not found" }, { status: 404 });

  return Response.json({ success: true, data: user.wishlist || [] });
}

// POST — toggle / add / remove a product ({ productId, action: 'add' | 'remove' | 'toggle' })
export async function POST(req: NextRequest) {
  await connectDB();
  const result = requireAuth(req);
  if ("error" in result) return result.error;

  const { productId, action = "toggle" } = await req.json();
  if (!productId) return Response.json({ success: false, message: "productId is required" }, { status: 400 });

  const user = await User.findById(result.user.id).select("+wishlist");
  if (!user) return Response.json({ success: false, message: "User not found" }, { status: 404 });

  const exists = user.wishlist.some((id: any) => String(id) === String(productId));
  if (action === "remove" || (action === "toggle" && exists)) {
    user.wishlist = user.wishlist.filter((id: any) => String(id) !== String(productId));
  } else if (!exists) {
    user.wishlist.push(productId);
  }
  await user.save();

  return Response.json({ success: true, data: user.wishlist });
}
