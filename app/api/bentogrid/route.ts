import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import BentoGridConfig from "@/lib/models/BentoGridConfig";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await connectDB();
  const config = await BentoGridConfig.getConfig();
  return Response.json({ success: true, data: config });
}

export async function PUT(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  const body = await req.json();
  let config = await BentoGridConfig.findOne();
  if (config) { Object.assign(config, body); await config.save(); }
  else config = await BentoGridConfig.create(body);
  return Response.json({ success: true, data: config });
}
