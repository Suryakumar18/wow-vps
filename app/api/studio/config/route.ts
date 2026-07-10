import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { StudioShowcase, StudioVideo } from "@/lib/models/StudioShowcase";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await connectDB();
  const config = await StudioShowcase.getConfig();
  return Response.json({ success: true, data: config });
}

export async function PUT(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  const body = await req.json();
  let config = await StudioShowcase.findOne();
  if (config) { Object.assign(config, body); await config.save(); }
  else config = await StudioShowcase.create(body);
  return Response.json({ success: true, data: config });
}

export async function POST(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  await StudioShowcase.deleteMany({});
  const config = await StudioShowcase.getConfig();
  return Response.json({ success: true, message: "Reset to defaults", data: config });
}
