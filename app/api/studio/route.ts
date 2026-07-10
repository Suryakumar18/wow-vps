import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { StudioVideo } from "@/lib/models/StudioShowcase";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await connectDB();
  const videos = await StudioVideo.find({ isActive: true }).sort({ order: 1 });
  return Response.json({ success: true, data: videos });
}

export async function POST(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  const body = await req.json();
  const lastVideo = await StudioVideo.findOne().sort({ videoId: -1 });
  body.videoId = body.videoId || ((lastVideo?.videoId ?? 0) + 1);
  const video = await StudioVideo.create(body);
  return Response.json({ success: true, data: video }, { status: 201 });
}
