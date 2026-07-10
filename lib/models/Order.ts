import mongoose, { Document, Schema } from "mongoose";

export interface IOrder extends Document {
  orderId: string;
  userId?: mongoose.Types.ObjectId;
  contactEmail: string;
  items: { productId: string; title: string; price: number; quantity: number; image?: string }[];
  totalAmount: number;
  shippingAddress: {
    firstName?: string; lastName?: string; address?: string; apartment?: string;
    city?: string; state?: string; pinCode?: string; phone?: string; country?: string;
  };
  billingAddress: {
    firstName?: string; lastName?: string; address?: string; apartment?: string;
    city?: string; state?: string; pinCode?: string; phone?: string; country?: string;
  };
  paymentMethod: string;
  transactionId?: string;
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED";
  orderStatus: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  createdAt: Date;
}

const addressSchema = new Schema(
  { firstName: String, lastName: String, address: String, apartment: String, city: String, state: String, pinCode: String, phone: String, country: String },
  { _id: false }
);

const orderItemSchema = new Schema(
  { productId: { type: String, required: true }, title: { type: String, required: true }, price: { type: Number, required: true }, quantity: { type: Number, required: true }, image: String },
  { _id: false }
);

const orderSchema = new Schema<IOrder>({
  orderId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
  contactEmail: { type: String, required: false, default: "" },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  paymentMethod: { type: String, required: true },
  transactionId: { type: String, default: "" },
  paymentStatus: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING" },
  orderStatus: { type: String, enum: ["Processing", "Shipped", "Delivered", "Cancelled"], default: "Processing" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);
