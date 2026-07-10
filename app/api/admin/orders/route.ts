import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  const orders = await Order.find().populate("userId", "fullname").sort({ createdAt: -1 });
  return Response.json({ success: true, data: orders });
}
