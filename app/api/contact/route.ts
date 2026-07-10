import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import ContactConfig from "@/lib/models/ContactConfig";
import ContactMessage from "@/lib/models/ContactMessage";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await connectDB();
  const config = await ContactConfig.getConfig();
  return Response.json({ success: true, data: config });
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  // If it's a contact message submission
  if (body.name && body.email && body.message) {
    const msg = await ContactMessage.create({ name: body.name, email: body.email, message: body.message });
    return Response.json({ success: true, message: "Message sent successfully", data: msg }, { status: 201 });
  }
  return Response.json({ success: false, message: "Invalid request" }, { status: 400 });
}

export async function PUT(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;
  const body = await req.json();
  let config = await ContactConfig.findOne();
  if (config) { Object.assign(config, body); await config.save(); }
  else config = await ContactConfig.create(body);
  return Response.json({ success: true, data: config });
}
