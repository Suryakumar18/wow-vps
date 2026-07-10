import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import { requireAdmin } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const product = await Product.findById(id);
  if (!product) return Response.json({ success: false, message: "Product not found" }, { status: 404 });
  return Response.json({ success: true, data: product });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  const { id } = await params;
  const body = await req.json();
  const product = await Product.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!product) return Response.json({ success: false, message: "Product not found" }, { status: 404 });
  return Response.json({ success: true, message: "Product updated successfully", data: product });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  const { id } = await params;
  const product = await Product.findByIdAndDelete(id);
  if (!product) return Response.json({ success: false, message: "Product not found" }, { status: 404 });
  return Response.json({ success: true, message: "Product deleted successfully", data: {} });
}
