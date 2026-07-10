import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const invoice = await Invoice.findById(id).lean();
  if (!invoice) return Response.json({ success: false, message: "Invoice not found" }, { status: 404 });
  return Response.json({ success: true, data: invoice });
}

// PATCH — update payment / status fields (e.g. mark paid, cancel)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;

  const { id } = await params;
  const body = await req.json();
  const invoice = await Invoice.findById(id);
  if (!invoice) return Response.json({ success: false, message: "Invoice not found" }, { status: 404 });

  if (body.amountPaid != null) {
    invoice.amountPaid = Number(body.amountPaid);
    invoice.balance = Math.round((invoice.grandTotal - invoice.amountPaid) * 100) / 100;
    invoice.paymentStatus = invoice.balance <= 0 ? "paid" : invoice.amountPaid > 0 ? "partial" : "unpaid";
  }
  if (body.paymentMethod) invoice.paymentMethod = body.paymentMethod;
  if (body.status) invoice.status = body.status;
  if (body.notes != null) invoice.notes = body.notes;

  await invoice.save();
  return Response.json({ success: true, message: "Invoice updated", data: invoice });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;

  const { id } = await params;
  const deleted = await Invoice.findByIdAndDelete(id);
  if (!deleted) return Response.json({ success: false, message: "Invoice not found" }, { status: 404 });
  return Response.json({ success: true, message: "Invoice deleted" });
}
