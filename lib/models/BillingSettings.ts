import mongoose, { Document, Schema } from "mongoose";

export interface IBillingSettings extends Document {
  companyName: string;
  tagline: string;
  logo: string;          // base64 data URL or public path
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  gstin: string;
  defaultTaxPct: number; // default GST applied on new bills
  invoicePrefix: string;
  footerNote: string;
  termsNote: string;
  showTax: boolean;
  updatedAt: Date;
}

const settingsSchema = new Schema<IBillingSettings>(
  {
    companyName: { type: String, default: "WOW Lifestyle", trim: true },
    tagline: { type: String, default: "Premium Toys & Collectibles", trim: true },
    logo: { type: String, default: "" },
    addressLine1: { type: String, default: "", trim: true },
    addressLine2: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    state: { type: String, default: "Tamil Nadu", trim: true },
    pincode: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    website: { type: String, default: "wowlifestyle.online", trim: true },
    gstin: { type: String, default: "", trim: true },
    defaultTaxPct: { type: Number, default: 0, min: 0 },
    invoicePrefix: { type: String, default: "INV", trim: true },
    footerNote: { type: String, default: "Thank you for your business!", trim: true },
    termsNote: { type: String, default: "Goods once sold are not returnable.", trim: true },
    showTax: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const BillingSettings =
  mongoose.models.BillingSettings ||
  mongoose.model<IBillingSettings>("BillingSettings", settingsSchema);

/** Returns the single settings document, creating defaults on first access. */
export async function getSettings() {
  let doc = await BillingSettings.findOne();
  if (!doc) doc = await BillingSettings.create({});
  return doc;
}

export default BillingSettings;
