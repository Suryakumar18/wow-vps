import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { StudioVideo } from "@/lib/models/StudioShowcase";
import { requireAdmin } from "@/lib/auth";

/** GET /api/studio/videos — admin: returns ALL videos (including inactive) */
export async function GET() {
  await connectDB();
  const videos = await StudioVideo.find().sort({ order: 1 });
  return Response.json({ success: true, data: videos });
}

/** POST /api/studio/videos — admin: create a new video */
export async function POST(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;

  const body = await req.json();

  // Auto-assign videoId if not provided
  if (!body.videoId) {
    const last = await StudioVideo.findOne().sort({ videoId: -1 });
    body.videoId = (last?.videoId ?? 0) + 1;
  }

  // Auto-assign order if not provided
  if (body.order === undefined) {
    const count = await StudioVideo.countDocuments();
    body.order = count;
  }

  const video = await StudioVideo.create(body);
  return Response.json({ success: true, data: video }, { status: 201 });
}
