import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import TrendingConfig from "@/lib/models/TrendingConfig";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await connectDB();
  const config = await TrendingConfig.getConfig();
  return Response.json({ success: true, data: config });
}

export async function PUT(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  const body = await req.json();
  const config = await TrendingConfig.getConfig();
  Object.assign(config, body, { updatedBy: result.user.id });
  await config.save();
  return Response.json({ success: true, message: "Configuration updated successfully", data: config });
}

export async function POST(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  await TrendingConfig.deleteMany({});
  const config = await TrendingConfig.create({ updatedBy: result.user.id });
  return Response.json({ success: true, message: "Configuration reset to defaults", data: config });
}
