import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import TrendingVideo from "@/lib/models/TrendingVideo";
import TrendingConfig from "@/lib/models/TrendingConfig";
import { requireAdmin } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const video = await TrendingVideo.findById(id);
  if (!video) return Response.json({ success: false, message: "Video not found" }, { status: 404 });
  return Response.json({ success: true, data: video });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  const { id } = await params;
  const body = await req.json();
  const video = await TrendingVideo.findById(id);
  if (!video) return Response.json({ success: false, message: "Video not found" }, { status: 404 });
  Object.assign(video, { ...body, updatedBy: result.user.id });
  await video.save();
  return Response.json({ success: true, message: "Video updated successfully", data: video });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  const { id } = await params;
  const video = await TrendingVideo.findById(id);
  if (!video) return Response.json({ success: false, message: "Video not found" }, { status: 404 });
  await video.deleteOne();
  return Response.json({ success: true, message: "Video deleted successfully" });
}
