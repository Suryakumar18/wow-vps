import mongoose, { Schema, Document } from "mongoose";

export interface IPushSubscription extends Document {
  userId?: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth:   string;
  };
  createdAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId:   { type: String, default: null, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth:   { type: String, required: true },
    },
  },
  { timestamps: true }
);

export default mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);
