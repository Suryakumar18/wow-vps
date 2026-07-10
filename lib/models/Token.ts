import mongoose, { Document, Schema } from "mongoose";

export interface IToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  createdAt: Date;
  lastUsedAt: Date;
  isActive: boolean;
  userAgent?: string;
  ipAddress?: string;
}

const tokenSchema = new Schema<IToken>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  token: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: "7d" },
  lastUsedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  userAgent: String,
  ipAddress: String,
});

tokenSchema.index({ userId: 1, isActive: 1 });

export default mongoose.models.Token || mongoose.model<IToken>("Token", tokenSchema);
