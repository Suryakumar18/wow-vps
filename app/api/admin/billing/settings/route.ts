import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import BillingSettings, { getSettings } from "@/lib/models/BillingSettings";
import { requireAdmin } from "@/lib/auth";

// GET — current billing settings (public to authed admin UI)
export async function GET() {
  await connectDB();
  const settings = await getSettings();
  return Response.json({ success: true, data: settings });
}

// PUT — update billing settings
export async function PUT(req: NextRequest) {
  await connectDB();
  const result = requireAdmin(req);
  if ("error" in result) return result.error;

  try {
    const body = await req.json();
    const allowed = [
      "companyName", "tagline", "logo", "addressLine1", "addressLine2",
      "city", "state", "pincode", "phone", "email", "website", "gstin",
      "defaultTaxPct", "invoicePrefix", "footerNote", "termsNote", "showTax",
    ];
    const update: Record<string, unknown> = {};
    for (const k of allowed) if (k in body) update[k] = body[k];

    const settings = await BillingSettings.findOneAndUpdate({}, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });
    return Response.json({ success: true, message: "Settings saved", data: settings });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return Response.json({ success: false, message: err.message || "Failed to save settings" }, { status: 500 });
  }
}
