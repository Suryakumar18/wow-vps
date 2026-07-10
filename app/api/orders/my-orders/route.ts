import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const email = searchParams.get("email");

  if (!userId && !email) {
    return Response.json({ success: false, message: "User ID or Email is required" }, { status: 400 });
  }

  const queryConditions: object[] = [];
  if (userId && userId !== "undefined" && userId !== "null") queryConditions.push({ userId });
  if (email && email !== "undefined" && email !== "null") queryConditions.push({ contactEmail: email });

  if (queryConditions.length === 0) {
    return Response.json({ success: false, message: "Valid user credentials required." }, { status: 400 });
  }

  const orders = await Order.find({ $or: queryConditions }).sort({ createdAt: -1 });
  return Response.json({ success: true, data: orders });
}
