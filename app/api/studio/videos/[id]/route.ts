import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { StudioVideo } from "@/lib/models/StudioShowcase";
import { requireAdmin } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  const { id } = await params;
  const body = await req.json();
  const video = await StudioVideo.findByIdAndUpdate(id, body, { new: true });
  if (!video) return Response.json({ success: false, message: "Video not found" }, { status: 404 });
  return Response.json({ success: true, data: video });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  const { id } = await params;
  await StudioVideo.findByIdAndDelete(id);
  return Response.json({ success: true, message: "Video deleted" });
}
