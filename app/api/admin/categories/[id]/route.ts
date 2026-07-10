import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/lib/models/Category";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  const { id } = await params;
  await Category.findByIdAndDelete(id);
  return Response.json({ success: true, message: "Category deleted" });
}
