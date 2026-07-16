import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import ShopByCategoryConfig from "@/lib/models/ShopByCategoryConfig";
import { requireAdmin } from "@/lib/auth";
import { updateSingletonConfig } from "@/lib/updateSingletonConfig";

export async function GET() {
  await connectDB();
  const config = await ShopByCategoryConfig.getConfig();
  return Response.json({ success: true, data: config });
}

export async function PUT(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  const body = await req.json();
  const config = await updateSingletonConfig(ShopByCategoryConfig, body);
  return Response.json({ success: true, data: config });
}
