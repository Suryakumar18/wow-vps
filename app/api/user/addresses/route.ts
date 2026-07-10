import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { requireAuth } from "@/lib/auth";

// GET — list saved addresses
export async function GET(req: NextRequest) {
  await connectDB();
  const result = requireAuth(req);
  if ("error" in result) return result.error;

  const user = await User.findById(result.user.id).select("+addresses");
  if (!user) return Response.json({ success: false, message: "User not found" }, { status: 404 });
  return Response.json({ success: true, data: user.addresses || [] });
}

// POST — add a new address
export async function POST(req: NextRequest) {
  await connectDB();
  const result = requireAuth(req);
  if ("error" in result) return result.error;

  const body = await req.json();
  const { firstName, address, city, state, pinCode, phone } = body;
  if (!firstName || !address || !city || !state || !pinCode || !phone) {
    return Response.json({ success: false, message: "Please fill all required fields" }, { status: 400 });
  }

  const user = await User.findById(result.user.id).select("+addresses");
  if (!user) return Response.json({ success: false, message: "User not found" }, { status: 404 });

  const makeDefault = body.isDefault || user.addresses.length === 0;
  if (makeDefault) user.addresses.forEach((a: any) => { a.isDefault = false; });
  user.addresses.push({ ...body, isDefault: makeDefault });
  await user.save();

  return Response.json({ success: true, message: "Address saved", data: user.addresses }, { status: 201 });
}

// PUT — update an existing address (expects addressId in body)
export async function PUT(req: NextRequest) {
  await connectDB();
  const result = requireAuth(req);
  if ("error" in result) return result.error;

  const body = await req.json();
  const { addressId, ...fields } = body;
  if (!addressId) return Response.json({ success: false, message: "addressId is required" }, { status: 400 });

  const user = await User.findById(result.user.id).select("+addresses");
  if (!user) return Response.json({ success: false, message: "User not found" }, { status: 404 });

  const addr = user.addresses.id(addressId);
  if (!addr) return Response.json({ success: false, message: "Address not found" }, { status: 404 });

  if (fields.isDefault) user.addresses.forEach((a: any) => { a.isDefault = false; });
  Object.assign(addr, fields);
  await user.save();

  return Response.json({ success: true, message: "Address updated", data: user.addresses });
}

// DELETE — remove an address (?addressId=...)
export async function DELETE(req: NextRequest) {
  await connectDB();
  const result = requireAuth(req);
  if ("error" in result) return result.error;

  const addressId = new URL(req.url).searchParams.get("addressId");
  if (!addressId) return Response.json({ success: false, message: "addressId is required" }, { status: 400 });

  const user = await User.findById(result.user.id).select("+addresses");
  if (!user) return Response.json({ success: false, message: "User not found" }, { status: 404 });

  const addr = user.addresses.id(addressId);
  if (!addr) return Response.json({ success: false, message: "Address not found" }, { status: 404 });

  const wasDefault = addr.isDefault;
  addr.deleteOne();
  if (wasDefault && user.addresses.length > 0) user.addresses[0].isDefault = true;
  await user.save();

  return Response.json({ success: true, message: "Address removed", data: user.addresses });
}
