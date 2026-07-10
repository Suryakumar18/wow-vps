import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/lib/models/Category";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await connectDB();
  const categories = await Category.find({}).sort({ createdAt: -1 });
  return Response.json({ success: true, data: categories });
}

export async function POST(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  const { name } = await req.json();
  const category = await Category.create({ name });
  return Response.json({ success: true, data: category }, { status: 201 });
}
