import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  title: string;
  brand: string;
  price: number;
  originalPrice: number;
  badge: string;
  type: string;
  category: string;
  availability: "In Stock" | "Out Of Stock";
  totalStock: number;
  images: string[];
  thumbnail: string;
  videos: string[];
  description: string;
  aboutFeatures: string[];
  aboutDescription: string;
  specifications: { label: string; value: string }[];
  idealFor: string[];
  deliveryTime: string;
  createdAt: Date;
  updatedAt: Date;
}

const specSchema = new Schema({ label: String, value: String }, { _id: false });

const productSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, required: true, min: 0 },
    badge: { type: String, trim: true, default: "" },
    type: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    availability: { type: String, enum: ["In Stock", "Out Of Stock"], default: "In Stock" },
    totalStock: { type: Number, required: true, default: 0, min: 0 },
    images: {
      type: [String],
      validate: { validator: (v: string[]) => Array.isArray(v) && v.length > 0, message: "At least one image is required" },
    },
    thumbnail: { type: String, trim: true, default: "" },
    videos: { type: [String], default: [] },
    description: { type: String, trim: true, default: "" },
    aboutFeatures: [{ type: String, trim: true }],
    aboutDescription: { type: String, trim: true, default: "" },
    specifications: [specSchema],
    idealFor: [{ type: String, trim: true }],
    deliveryTime: { type: String, trim: true, default: "3 to 8 days" },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);
