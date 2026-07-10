import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await connectDB();
  const products = await Product.find({}).sort({ createdAt: -1 });
  return Response.json({ success: true, count: products.length, data: products });
}

export async function POST(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  try {
    const body = await req.json();
    const product = await Product.create(body);
    return Response.json({ success: true, message: "Product saved successfully to Database!", data: product }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { name?: string; errors?: Record<string, { message: string }> };
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors ?? {}).map((v) => v.message);
      return Response.json({ success: false, message: messages.join(", ") }, { status: 400 });
    }
    throw error;
  }
}
