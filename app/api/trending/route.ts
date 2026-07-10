import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import TrendingVideo from "@/lib/models/TrendingVideo";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await connectDB();
  const videos = await TrendingVideo.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).limit(20);
  return Response.json({ success: true, count: videos.length, data: videos });
}

export async function POST(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;

  const { title, category, views, duration, src, order } = await req.json();
  if (!title || !src) return Response.json({ success: false, message: "Please provide title and video source" }, { status: 400 });

  const lastVideo = await TrendingVideo.findOne().sort({ order: -1 });
  const newOrder = order !== undefined ? order : (lastVideo ? lastVideo.order + 1 : 0);

  const video = await TrendingVideo.create({
    title, category: category || "Premium", views: views || "0", duration: duration || "0:00",
    src, order: newOrder, createdBy: result.user.id, updatedBy: result.user.id,
  });
  return Response.json({ success: true, message: "Video created successfully", data: video }, { status: 201 });
}
