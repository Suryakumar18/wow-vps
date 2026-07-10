import mongoose, { Document, Schema } from "mongoose";
import { nextSeq } from "./Counter";
import BillingSettings from "./BillingSettings";

export interface IInvoiceItem {
  productId?: mongoose.Types.ObjectId;
  name: string;
  sku?: string;
  price: number;        // unit price
  quantity: number;
  discountPct: number;  // per-line % discount
  taxPct: number;       // per-line % tax (GST)
  lineTotal: number;    // (price*qty) - discount + tax
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  customer: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    gstin?: string;
  };
  items: IInvoiceItem[];
  subTotal: number;       // Σ price*qty
  itemDiscount: number;   // Σ per-line discounts
  extraDiscount: number;  // bill-level discount amount
  taxableAmount: number;  // subTotal - discounts
  taxAmount: number;      // Σ tax
  roundOff: number;
  grandTotal: number;
  paymentMethod: "cash" | "card" | "upi" | "credit" | "split";
  amountPaid: number;
  balance: number;
  paymentStatus: "paid" | "partial" | "unpaid";
  status: "completed" | "held" | "cancelled";
  notes?: string;
  createdBy?: { id?: string; name?: string };
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IInvoiceItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    discountPct: { type: Number, default: 0, min: 0, max: 100 },
    taxPct: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, unique: true, index: true },
    customer: {
      name: { type: String, required: true, trim: true, default: "Walk-in Customer" },
      phone: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
      address: { type: String, trim: true, default: "" },
      gstin: { type: String, trim: true, default: "" },
    },
    items: { type: [itemSchema], default: [] },
    subTotal: { type: Number, default: 0 },
    itemDiscount: { type: Number, default: 0 },
    extraDiscount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ["cash", "card", "upi", "credit", "split"], default: "cash" },
    amountPaid: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ["paid", "partial", "unpaid"], default: "paid" },
    status: { type: String, enum: ["completed", "held", "cancelled"], default: "completed" },
    notes: { type: String, trim: true, default: "" },
    createdBy: {
      id: { type: String, default: "" },
      name: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

// Auto-assign a sequential invoice number: {PREFIX}-YYYYMM-#####
invoiceSchema.pre("save", async function (next) {
  if (this.invoiceNumber) return next();
  try {
    const seq = await nextSeq("invoice");
    let prefix = "INV";
    try {
      const s = await BillingSettings.findOne().select("invoicePrefix").lean() as { invoicePrefix?: string } | null;
      if (s?.invoicePrefix) prefix = s.invoicePrefix;
    } catch { /* fall back to INV */ }
    const d = new Date();
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
    this.invoiceNumber = `${prefix}-${ym}-${String(seq).padStart(5, "0")}`;
    next();
  } catch (err) {
    next(err as Error);
  }
});

export default mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", invoiceSchema);
