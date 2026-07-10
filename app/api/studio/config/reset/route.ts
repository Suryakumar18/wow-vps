import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { StudioShowcase, StudioVideo } from "@/lib/models/StudioShowcase";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/studio/config/reset
 * Deletes all studio config + videos and re-creates defaults.
 */
export async function POST(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;

  // Reset config to defaults
  await StudioShowcase.deleteMany({});
  const config = await StudioShowcase.getConfig(); // creates fresh defaults

  // Optionally reset videos too (all deleted — admin can re-add)
  await StudioVideo.deleteMany({});

  return Response.json({
    success: true,
    message: "Studio reset to defaults.",
    data: config,
  });
}
