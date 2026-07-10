import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import Product from "@/lib/models/Product";
import { getSettings } from "@/lib/models/BillingSettings";
import { nextSeq } from "@/lib/models/Counter";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/billing/invoices?search=&status=&method=&from=&to=&limit=
export async function GET(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;

  const sp = new URL(req.url).searchParams;
  const search = sp.get("search")?.trim();
  const status = sp.get("status");
  const method = sp.get("method");
  const from = sp.get("from");
  const to = sp.get("to");
  const limit = Math.min(parseInt(sp.get("limit") || "200", 10), 1000);

  const query: Record<string, unknown> = {};
  if (status && status !== "all") query.status = status;
  if (method && method !== "all") query.paymentMethod = method;
  if (from || to) {
    const range: Record<string, Date> = {};
    if (from) range.$gte = new Date(from);
    if (to) { const t = new Date(to); t.setHours(23, 59, 59, 999); range.$lte = t; }
    query.createdAt = range;
  }
  if (search) {
    query.$or = [
      { invoiceNumber: { $regex: search, $options: "i" } },
      { "customer.name": { $regex: search, $options: "i" } },
      { "customer.phone": { $regex: search, $options: "i" } },
    ];
  }

  const invoices = await Invoice.find(query).sort({ createdAt: -1 }).limit(limit).lean();
  return Response.json({ success: true, count: invoices.length, data: invoices });
}

// POST /api/admin/billing/invoices  — create a bill (recomputes totals server-side)
export async function POST(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;

  try {
    const body = await req.json();
    const rawItems: any[] = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) {
      return Response.json({ success: false, message: "Add at least one item to the bill." }, { status: 400 });
    }

    // Recompute each line + totals from trusted math
    let subTotal = 0, itemDiscount = 0, taxAmount = 0;
    const items = rawItems.map((it) => {
      const price = Number(it.price) || 0;
      const quantity = Math.max(1, Number(it.quantity) || 1);
      const discountPct = Math.min(100, Math.max(0, Number(it.discountPct) || 0));
      const taxPct = Math.max(0, Number(it.taxPct) || 0);
      const gross = price * quantity;
      const disc = (gross * discountPct) / 100;
      const taxable = gross - disc;
      const tax = (taxable * taxPct) / 100;
      subTotal += gross;
      itemDiscount += disc;
      taxAmount += tax;
      return {
        productId: it.productId || undefined,
        name: String(it.name || "Item"),
        sku: it.sku || "",
        price, quantity, discountPct, taxPct,
        lineTotal: Math.round((taxable + tax) * 100) / 100,
      };
    });

    const extraDiscount = Math.max(0, Number(body.extraDiscount) || 0);
    const taxableAmount = Math.round((subTotal - itemDiscount - extraDiscount) * 100) / 100;
    const preRound = taxableAmount + taxAmount;
    const grandTotal = Math.round(preRound);
    const roundOff = Math.round((grandTotal - preRound) * 100) / 100;

    const amountPaid = body.amountPaid != null ? Number(body.amountPaid) : grandTotal;
    const balance = Math.round((grandTotal - amountPaid) * 100) / 100;
    const paymentStatus = balance <= 0 ? "paid" : amountPaid > 0 ? "partial" : "unpaid";

    // Generate the invoice number here (reads current settings prefix every request)
    const seq = await nextSeq("invoice");
    const settings = await getSettings();
    const d = new Date();
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
    const invoiceNumber = `${settings.invoicePrefix || "INV"}-${ym}-${String(seq).padStart(5, "0")}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      customer: {
        name: body.customer?.name?.trim() || "Walk-in Customer",
        phone: body.customer?.phone || "",
        email: body.customer?.email || "",
        address: body.customer?.address || "",
        gstin: body.customer?.gstin || "",
      },
      items,
      subTotal: Math.round(subTotal * 100) / 100,
      itemDiscount: Math.round(itemDiscount * 100) / 100,
      extraDiscount,
      taxableAmount,
      taxAmount: Math.round(taxAmount * 100) / 100,
      roundOff,
      grandTotal,
      paymentMethod: body.paymentMethod || "cash",
      amountPaid,
      balance,
      paymentStatus,
      status: body.status || "completed",
      notes: body.notes || "",
      createdBy: { id: result.user.id, name: body.createdByName || "" },
    });

    // Decrement stock for linked products (best-effort, non-blocking on failure)
    if (invoice.status === "completed") {
      await Promise.all(
        items
          .filter((i) => i.productId)
          .map((i) =>
            Product.updateOne(
              { _id: i.productId },
              { $inc: { totalStock: -i.quantity } }
            ).catch(() => null)
          )
      );
    }

    return Response.json({ success: true, message: "Invoice created", data: invoice }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return Response.json({ success: false, message: err.message || "Failed to create invoice" }, { status: 500 });
  }
}
