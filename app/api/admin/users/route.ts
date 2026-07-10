import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  return Response.json({ success: true, data: users });
}
