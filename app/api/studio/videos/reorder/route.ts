import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { StudioVideo } from "@/lib/models/StudioShowcase";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/studio/videos/reorder
 * Body: { orders: [{ id: string, order: number }, ...] }
 * Bulk-updates the `order` field for the given video IDs.
 */
export async function POST(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;

  const { orders } = await req.json();

  if (!Array.isArray(orders) || orders.length === 0) {
    return Response.json({ success: false, message: "orders array is required." }, { status: 400 });
  }

  await Promise.all(
    orders.map(({ id, order }: { id: string; order: number }) =>
      StudioVideo.findByIdAndUpdate(id, { order })
    )
  );

  return Response.json({ success: true, message: "Videos reordered." });
}
