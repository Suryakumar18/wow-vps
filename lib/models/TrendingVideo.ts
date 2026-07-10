import mongoose, { Document, Schema } from "mongoose";

export interface ITrendingVideo extends Document {
  title: string;
  category: string;
  views: string;
  duration: string;
  src: string;
  order: number;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const schema = new Schema<ITrendingVideo>(
  {
    title: { type: String, required: true },
    category: { type: String, default: "Premium" },
    views: { type: String, default: "0" },
    duration: { type: String, default: "0:00" },
    src: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.TrendingVideo || mongoose.model<ITrendingVideo>("TrendingVideo", schema);
