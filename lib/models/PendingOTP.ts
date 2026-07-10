import mongoose, { Document, Schema } from "mongoose";

export interface IPendingOTP extends Document {
  email: string;
  otp: string;
  fullname: string;
  mobilenumber: string;
  password: string;
  createdAt: Date;
}

const schema = new Schema<IPendingOTP>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  otp: { type: String, required: true },
  fullname: { type: String, required: true },
  mobilenumber: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // auto-delete after 10 min
});

export default mongoose.models.PendingOTP ||
  mongoose.model<IPendingOTP>("PendingOTP", schema);
